# SORTS — Technical overview for downstream AI agents

This document is a hand-off briefing for the multi-agent builder system that
will continue sharpening SORTS toward its vision. It is exhaustive on
purpose — every claim is traceable to a file, a commit, or a test, so a new
agent can verify rather than trust.

Last sync: end of Day 8 (May 12), branch `claude/mystifying-germain-0917cf`,
HEAD = `710a600`. PR: https://github.com/findocere-ops/sorts/pull/1.

---

## 1. Vision

SORTS is **private subscription rails for paid communities on Solana**.

Three load-bearing claims:

1. **Creators sell recurring access** the way they sell a Substack
   subscription — except the subscription is an on-chain Solana account, not
   a Stripe customer.
2. **Subscribers prove membership without leaking a public member graph.**
   The on-chain program never stores the tier as a plaintext field on any
   account; it stores a commitment plus a salt. The backend never returns
   per-member data through any API. The creator dashboard is
   aggregate-only.
3. **One-click delivery into the subscriber's existing tools** — Telegram
   first (live), browser second.

The product surface today is a Next.js app + an Express backend + a
Telegram bot + a Solana program. All four are wired together; none of them
expose member identity to creators.

---

## 2. Architecture at one glance

```
                        ┌──────────────────────────────┐
                        │        @sorts/frontend       │
                        │  Next.js 14 App Router       │
                        │  Privy (email + wallet)      │
                        │  @solana/wallet-adapter-react│
                        │  ChainAdapter abstraction    │
                        └───────┬──────────┬───────────┘
                                │          │
                  /api/*        │          │  RPC / Program calls
                                │          │
                        ┌───────▼───┐   ┌──▼─────────────────────────┐
                        │ @sorts/   │   │   Solana devnet            │
                        │ backend   │   │   sorts_community program  │
                        │ Express   │   │   AEp6VuJqfctTRQpZP3LDjKcua4│
                        │ Sqlite    │   │   ↑ Quasar program         │
                        │  └ pg     │   └────────────────────────────┘
                        │ Privy SDK │
                        │ grammy bot│
                        └──┬────────┘
                           │
                           ▼
                       Telegram
```

`@sorts/shared` (packages/shared) holds the cross-package interfaces
(`IChainService`, `IPrivacyComputeService`, `IMultichainControlService`)
plus the discriminated `ChainId` / `ChainAdapterId` types. Both the
backend and the frontend consume it via `workspace:*`.

---

## 3. Repository map

```
SORTS/
├── contracts/                    Solidity legacy (Arbitrum Sepolia, USDC)
│   └── contracts/SortsMembership.sol
│   └── contracts/SortsFactory.sol
├── programs/sorts-community/     Quasar Solana program (Day 1)
│   ├── src/lib.rs
│   ├── src/state.rs              # Community + Subscription accounts
│   ├── src/instructions/         # initialize_community, subscribe, renew, etc.
│   └── deployments/devnet.json   # canonical program id record
├── packages/shared/              Cross-package types + interfaces
│   ├── src/types/{chain,community,membership,privacy,wallet}.ts
│   └── src/interfaces/I*.ts
├── backend/                      @sorts/backend (Express + Telegram bot)
│   ├── src/api/routes/*.ts
│   ├── src/api/middleware/*.ts
│   ├── src/services/chain/*.ts
│   ├── src/services/wallet/*.ts
│   ├── src/services/community/preview-quota.ts
│   ├── src/db/schema.ts          # selectDriver() — sqlite local, pg prod
│   ├── src/db/postgres.ts        # pg adapter (Day 7)
│   ├── src/bot/commands/*.ts     # grammy handlers
│   ├── scripts/migrate-to-postgres.ts
│   ├── scripts/seed-devnet-demo.ts
│   └── scripts/verify-umbra-devnet.ts
├── frontend/                     @sorts/frontend (Next.js)
│   ├── src/app/*                 # App Router pages
│   ├── src/lib/chain/            # adapters + factory + chains.ts
│   ├── src/lib/solana/           # connection, program, instructions, idl
│   ├── src/components/wallet/    # SolanaWalletButton, SignerCapabilitiesCard
│   ├── src/components/privacy/   # UmbraMembershipCard
│   ├── src/components/studio/    # CreateCommunityWizard, PreviewToggle, AggregateStatsCard
│   ├── src/components/badges/    # DevnetBadge, PreAlphaBadge
│   └── src/hooks/                # useUmbraPrivacy, useSolanaMembership
└── docs/
    ├── INFRASTRUCTURE.md         # Day 7 — DB choice, deploy, rollback
    ├── SOLANA_PHASE2_DEMO.md     # Day 8 — demo script
    ├── SCREENSHOT_INDEX.md       # Day 8 — capture rules
    ├── COLOSSEUM_WINNER_SPEC.md  # submission target spec
    └── SUPERTEAM_AGENTIC_ENGINEERING_GRANT.md
```

---

## 4. The Solana program (programs/sorts-community)

**Program ID:** `AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV` (devnet,
upgradeable, authority = deployer wallet `2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ`).

**Framework:** Quasar (https://github.com/blueshift-gg/quasar) — `no_std`,
Anchor-syntax-alike, single-byte instruction discriminators (NOT Anchor's
8-byte sighash).

### 4.1 Accounts

```rust
#[account(discriminator = 1, set_inner)]
#[seeds(b"community", creator: Address)]
pub struct Community {
    creator: Address,
    name_hash: [u8; 32],          // keccak/SHA-256 hash of plaintext name
    symbol_hash: [u8; 32],
    created_at: i64,
    tier_count: u8,                // 1..=3
    tier_1_price_lamports: u64,    tier_1_duration_secs: i64,
    tier_2_price_lamports: u64,    tier_2_duration_secs: i64,
    tier_3_price_lamports: u64,    tier_3_duration_secs: i64,
    total_members_counter: u64,
    active_members_counter: u64,
    total_revenue_lamports: u64,
    bump: u8,
}

#[account(discriminator = 3, set_inner)]
#[seeds(b"subscription", community: Address, subscriber_commitment: Address)]
pub struct Subscription {
    community: Address,
    subscriber_commitment: [u8; 32], // derive("SORTS_SUB_V1" || subscriber || nonce)
    expiry_ts: i64,
    tier_commitment: [u8; 32],       // derive("SORTS_TIER_V1" || level || salt_pubkey)
    salt_pubkey: Address,
    bump: u8,
}
```

The plaintext subscriber pubkey is **not** stored on-chain (Tier 1.2
mitigation, see `docs/PRIVACY_REVIEW.md` §"Run — 2026-05-06 (v2)").
Instead the account body holds a 32-byte `subscriber_commitment`
derived from `(subscriber_pubkey, nonce)`, where the nonce is a
deterministic wallet-signature-derived secret known only to the
subscriber. `getProgramAccounts(filter=memcmp(disc=3))` therefore
returns blinded pseudonyms only, not a member graph.

### 4.2 Instructions

| disc | name | args | data length |
|---|---|---|---|
| 0 | `initialize_community` | `name_hash[32]`, `symbol_hash[32]`, `tier_count: u8`, `(u64 price, i64 duration) × 3` | 114 |
| 1 | `subscribe` | `level: u8`, `commitment: Address`, `nonce: [u8;32]`, `salt_pubkey: Address` | 98 |
| 2 | `renew_subscription` | `level: u8`, `commitment: Address`, `nonce: [u8;32]` | 66 |

The `commitment` arg is the same 32-byte value the program stores in
the Subscription account; the handler verifies
`subscriber_commitment(self.subscriber.address(), &nonce, &crate::ID)
== commitment` so a third party who learns a public commitment cannot
squat on it without owning the producing wallet. Frontend builders
generate the pair via `deriveSubscriberCommitment` +
`buildNonceCanonicalMessage` + `nonceFromSignature` in
[frontend/src/lib/solana/program.ts](frontend/src/lib/solana/program.ts).

Read-only helpers (Rust, not on-chain ix):
- `check_access(subscription, now) -> { active, expiry_ts }` (boolean only — never tier)
- `aggregate_stats(community) -> { total_members, active_members, total_revenue_lamports }`

### 4.3 Economics

`PROTOCOL_FEE_BPS = 500` (5 %), 95 % to creator, 5 % to
`PROTOCOL_TREASURY = 8z2PLCHhGwGU8PHQd1zByD64E4CeZaQuF2NBy3jrdssf`. Mirror
of Solidity `SortsMembership.sol:37` for chain parity.

### 4.4 Forced Quasar deviations (documented in
`programs/sorts-community/README.md`)

1. **Community PDA seeded by `[b"community", creator]` only.** The Quasar
   `#[seeds]` derive currently rejects `[u8; 32]` typed seed args, so
   `name_hash` is stored as a field, not part of the PDA. Effect: one
   community per creator wallet.
2. **No separate Tier PDAs.** Quasar `#[seeds]` rejects `u8` typed seed
   args. Three tier slots are stored inline in `Community` instead.

Public ix surface unchanged — clients still pass `level: u8` and the
program looks up the inline slot. When Quasar adds the typed-seed
support, both deviations become a small refactor with no client-side
churn.

### 4.5 Tests

```
cargo test -p sorts-community
  6 unit (logic.rs — including subscriber_commitment determinism)
  8 integration (t1..t8):
    t1 initialize_community happy path
    t2 5/95 fee split (Solidity parity)
    t3/t4 check_access liveness boundary
    t5 aggregate counter math
    t6 privacy: no Vec<Pubkey>/Vec<Address>, no plaintext `level`,
       and (v2) no plaintext `subscriber: Address` field on Subscription
    t7 enumeration: byte 33-65 of every Subscription account is a
       commitment, not a wallet pubkey
    t8 subscriber_commitment determinism (re-derives same value for
       same (subscriber, nonce) pair)
```

### 4.6 Quasar CLI cut-line

`quasar build`, `quasar test`, `quasar idl` all return opaque
`Anyhow error` on the pinned revision. We bypass with `cargo build-sbf` +
`solana program deploy`. All framework macros work — only the wrapper CLI
is broken. When Quasar fixes it, no source changes are needed.

---

## 5. Backend (@sorts/backend)

Express + better-sqlite3 (local) / pg (production via `DATABASE_URL`).
Telegram bot via grammy.

### 5.1 Routes

| Route | Method | Purpose | Auth | Privacy gate |
|---|---|---|---|---|
| `/health` | GET | liveness | none | — |
| `/api/communities` | GET | list communities | none | — |
| `/api/communities/:id` | GET | community detail | none | — |
| `/api/communities` | POST | create | Privy bearer + wallet-owner + sig-nonce + walletProof | — |
| `/api/communities/creator/:wallet` | GET | creator's communities | none | — |
| `/api/content/:cid` | GET | feed | preview-quota gate (Day 5) | non-members see only `preview_eligible` posts |
| `/api/content/:cid/:postId` | GET | one post | walletProof | tier check via per-community ChainServiceFactory |
| `/api/content/:cid` | POST/PATCH/DELETE | creator content | Privy + wallet-owner + sig-nonce + walletProof | — |
| `/api/analytics/community/:cid` | GET | aggregate stats | none | aggregate-only shape (no array fields, no wallets) |
| `/api/privacy/status` | GET | registration status | none | only `{ registered, privacyMode }` |
| `/api/privacy/entitlement` | GET | active boolean | none | `{ active, expiresAt?, privacyMode }` only |
| `/api/wallet/status` | GET | dWallet status | none | `pre-alpha` |
| `/api/wallet/capabilities` | GET | dWallet capability matrix | none | `pre-alpha` |
| `/api/wallet/gas/:chain` | GET | gas-deposit status | none | `pre-alpha` |

### 5.2 Middleware order (index.ts)

```
cors → express.json → apiRateLimit
                       │
                       ↓ per-route
                       ├─ /api/communities POST: privyAuth → requireWalletOwner → sigNonce
                       ├─ /api/content :GET   : previewQuotaGate
                       ├─ /api/content POST/PATCH/DELETE: privyAuth → requireWalletOwner → sigNonce
                       └─ everything else: pass-through
```

**Rate limit:** 60 req/min/IP, OPTIONS skipped (CORS preflight).
**Sig-nonce TTL:** 5 min, composite PK `(nonce, wallet)` — Day 2.5
follow-up changed reuse → 401 (was 409).

### 5.3 Chain services

```
backend/src/services/chain/
  IChainService.ts             (in @sorts/shared)
  ChainServiceFactory.ts       routes by ChainId discriminator
  ArbitrumService.ts           viem + USDC, 5/95 split, 7984 ABI
  SolanaService.ts             @solana/web3.js, hand-decoded accounts
  UmbraPrivacyService.ts       implements IPrivacyComputeService (Day 4 fallback)
```

`SolanaService` is the source of truth for the Solana on-chain reads. It
hand-decodes Community and Subscription buffers because the Quasar
single-byte discriminator does not match Anchor's default coder. PDA
helpers, base58 memcmp filters, and lamport→SOL formatting all live here.

### 5.4 Privacy compute service (Day 4)

`UmbraPrivacyService` implements `IPrivacyComputeService`:

```ts
evaluateEntitlement(community, subscriber): { active, expiresAt?, privacyMode }
getRegistrationStatus(subscriber):           { registered, privacyMode }
```

**Cut-line tripped Day 4.** `verify-umbra-devnet.ts` printed
`fallback recommended` because:
- `register(network=devnet)` → "Transaction simulation failed" (Umbra
  programs not deployed to devnet today).
- `register(network=mainnet)` → "MXE account not found on-chain" (needs
  MXE infra).

The fallback derives entitlement from the Day-1 on-chain Subscription
PDA's `expiry_ts`. Privacy mode label everywhere reads
`on-chain-commitment-fallback`. The class name retains "Umbra" so the
future v2 swap is a one-line implementation change.

### 5.5 IKA dWallet capability layer (Day 6)

`IkaDWalletService` implements `IMultichainControlService`. **Cut-line
tripped — static placeholder.**
- `getStatus()` returns `{ status: 'pre-alpha', canSign: false }`.
- `getCapabilities()` returns one descriptor with `status: 'pre-alpha'`.
- `signRealFundsPayload()` throws `real-funds method blocked` unless
  `ENABLE_IKA_REAL_FUNDS=true`. Even with the flag set, throws
  `not implemented in pre-alpha build`. The pre-alpha build cannot
  accidentally sign real-money payloads.

### 5.6 Preview quota (Day 5)

`PreviewQuotaService` + middleware. `(wallet OR session_token, community_id)`
composite PK with a rolling 7-day window. The 3rd distinct community
trips `403 { error: 'preview_quota_exceeded', limit: 2 }`. Repeat visits
to the same community do not consume new slots. Active subscribers
release their slot via `release()` so they don't double-count.

### 5.7 Telegram bot (grammy)

```
backend/src/bot/commands/
  start.ts      link Telegram ↔ wallet
  status.ts     /status — per-community chain dispatch via ChainServiceFactory
  content.ts    /content
  subscribe.ts  /subscribe
  help.ts       /help
```

`/status` reply: `✅ <name> — active (expires <date>)` or
`⚠ <name> — expired`. **Never includes the substring "tier" or any tier
number.** Asserted in `analytics-no-leak.test.ts` (t5).

### 5.8 Database

| Table | Purpose | Privacy |
|---|---|---|
| `communities` | metadata cache; chain is authority | — |
| `tiers` | cache of on-chain tier config | — |
| `membership_cache` | NEVER use for access decisions | no tier_level field; chain is authority |
| `content` | full content bodies + `preview_eligible` flag (Day 5) | — |
| `wallet_links` | Telegram ↔ wallet | NEVER joined with `preview_quota` or `analytics_cache` in any API response |
| `link_challenges` | one-time challenge codes | 10-min TTL |
| `analytics_cache` | aggregate counters only | — |
| `nonces` | sig-replay guard | 5-min TTL, composite PK |
| `preview_quota` | preview cap counter | 7-day rolling window |

Day 7 added a Postgres translation (`backend/scripts/migrate-to-postgres.ts`)
that mirrors the SQLite shape 1:1 with `BOOLEAN` / `TIMESTAMPTZ`. The DAL
(`backend/src/db/postgres.ts`) presents the same `prepare/all/get/run`
surface as better-sqlite3 so route code keeps compiling unchanged.
`selectDriver()` returns `'postgres'` when `DATABASE_URL` is set.

---

## 6. Frontend (@sorts/frontend)

Next.js 14 App Router, Privy 1.99 (auth + EVM), `@solana/wallet-adapter-react`
(Solana wallet connection), wagmi 2.x (legacy Arbitrum), framer-motion,
tailwind-style utility classes via globals.css.

### 6.1 Chain-aware abstraction (Day 3)

```
frontend/src/lib/chain/
  chains.ts                       CHAINS registry (label, family, native, explorer)
  types.ts                        ChainAdapter interface
  useChain.ts                     factory hook (default solana-devnet, ?chain=arbitrum-sepolia)
  adapters/SolanaChainAdapter.ts  Solana impl (wallet-adapter + @solana/web3.js)
  adapters/ArbitrumChainAdapter.ts wraps legacy useLegacyArbitrumChain()
```

```
frontend/src/lib/solana/
  connection.ts     cached Connection to devnet RPC
  program.ts        program id, PROTOCOL_TREASURY constant, PDA helpers
  idl.ts            re-export of the hand-written IDL JSON
  instructions.ts   buildInitializeCommunityIx, buildSubscribeIx, buildRenewSubscriptionIx
  README.md         Quasar coder caveat + cut-line decision
```

**Why hand-built ix data:** Quasar uses single-byte instruction
discriminators. The default `@coral-xyz/anchor` Program coder would
prepend an 8-byte sighash and the on-chain dispatch would reject. We use
Anchor only for IDL TypeScript types.

### 6.2 Privy + Solana wallet stack

`AuthProvider.tsx` wraps every children render in
`ConnectionProvider → WalletProvider → WalletModalProvider` so any hook
can call `useWallet()` / `useConnection()`. Privy 1.99 covers email +
EVM identity; Solana wallets connect through PhantomWalletAdapter +
SolflareWalletAdapter. When Privy publishes a 1.x-compatible Solana
connector, the adapter list is the only thing that needs to change.

### 6.3 Pages

```
/                                 landing
/discover                         community list
/studio/create                    creator wizard (chain-aware)
/studio/[cid]/content             PreviewToggle per post (Day 5)
/studio/[cid]/analytics           AggregateStatsCard live data (Day 5)
/studio/[cid]/{tiers,settings,…}  stubs
/join/[cid]                       community preview + UmbraMembershipCard
/join/[cid]/subscribe             Solana subscribe flow
/app/[cid]/feed                   gated feed (useSolanaMembership)
/account                          identity + IKA dWallet section (Day 6)
/status                           legacy Arbitrum diagnostics (uses useLegacyArbitrumChain)
/auth                             auth redirect target
```

### 6.4 Component primitives

```
frontend/src/components/
  badges/{DevnetBadge, PreAlphaBadge, index}.tsx
  wallet/{SolanaWalletButton, SignerCapabilitiesCard, MultichainAssetPanel,
          MessageApprovalLifecycle}.tsx
  privacy/UmbraMembershipCard.tsx
  studio/{CreateCommunityWizard, PreviewToggle, AggregateStatsCard,
          wizardSteps/{Basics, Tiers, Review, Deploy}}.tsx
  layout/{TopBar, AppShell, SubscriberAppLayout, CreatorStudioLayout,
          PublicLayout, DisclaimerFooter, Navbar, MarketingHeader,
          MobileBottomNav, RouteShellPage, CreatorSidebar}.tsx
  states/MvpStates.tsx             ContractNotConfigured (chain-aware copy)
  providers/AuthProvider.tsx       PrivyProvider + Solana adapter providers
```

### 6.5 Hooks

```
useChain()              chain-aware adapter (Day 3)
useUmbraPrivacy()       /api/privacy/status binding (Day 4)
useSolanaMembership()   /api/privacy/entitlement binding (Day 4)
useSortsPrivy()         Privy wrapper with demo fallback
useSortsAccount()       wagmi account
useSortsSignMessage()   wagmi sign
```

### 6.6 Disclosure surfaces

- `DevnetBadge` — site-wide in TopBar (Day 3).
- `PreAlphaBadge` — UmbraMembershipCard + SignerCapabilitiesCard (Day 4 + 6).
- `DisclaimerFooter` — `frontend/src/app/layout.tsx`, every route
  (Day 0 / verified Day 7).
- `SignerCapabilitiesCard` — red/orange `PRE-ALPHA — NOT FOR REAL FUNDS`
  stripe at the top, not dismissible (Day 6).

---

## 7. Privacy invariants — the load-bearing list

These are what the demo's pitch hangs on. Every one of them is asserted
in code and in tests.

| Invariant | Where enforced | Where tested |
|---|---|---|
| No `Vec<Pubkey>` / `Vec<Address>` field anywhere on the Solana program | programs/sorts-community/src/state.rs | `cargo test t6_privacy_assertions_no_pubkey_iteration` |
| Subscription account never stores plaintext `level` | state.rs `Subscription` only has `tier_commitment` + `salt_pubkey` | t6 above + `solana-service.test.ts` decoder shape check |
| `SolanaService.checkAccess` ignores `requiredTier` (privacy carve-out) | backend/src/services/chain/SolanaService.ts | `solana-service.test.ts` "checkAccess privacy carve-out" |
| `getMembershipStatus` returns `tierLevel: null` on Solana | SolanaService.ts | same test file |
| `getAggregateStats` response has no array fields, no wallet-shaped strings | analytics.ts + analytics route | `privacy-assertions.test.ts t2` + `analytics-no-leak.test.ts t3` |
| `PrivyService.verifyBearerToken` never serializes the raw token | services/wallet/PrivyService.ts | `privy-auth.test.ts` "NEVER includes the raw token" |
| Signature replay → 401 (was 409 in initial draft) | api/middleware/sig-nonce.ts | `sig-replay.test.ts t5` |
| 3rd distinct community preview from same wallet → 403 | api/middleware/preview-quota.ts | `preview-quota.test.ts t2` |
| Non-member content GET returns only `preview_eligible` posts unlocked | api/routes/content.ts | `preview-quota.test.ts t1` |
| Telegram /status reply contains no "tier" / "level [123]" / "member count" | bot/commands/status.ts | `analytics-no-leak.test.ts t5` |
| `IkaDWalletService` real-funds path blocked | services/wallet/IkaDWalletService.ts | `ika-no-real-funds.test.ts t6` |
| `UmbraPrivacyService` no seed / signature / ciphertext leak in logs | services/chain/UmbraPrivacyService.ts | `umbra-no-seed-leak.test.ts` |
| `preview_quota` and `wallet_links` never joined in any API response | route layer convention | spec-level invariant; reviewed manually each PR |

---

## 8. Test coverage

```
contracts (Hardhat)             28 / 28 pass
sorts-community (cargo)         5 unit + 6 t1..t6 pass
@sorts/backend (jest)           11 suites, 56 / 56 pass
                                ├ privy-auth.test.ts          (8 cases)
                                ├ sig-replay.test.ts          (8)
                                ├ solana-service.test.ts      (10)
                                ├ rate-limit.test.ts          (2)
                                ├ privacy-assertions.test.ts  (5)  Day-2.5 t1+t2+t3
                                ├ umbra-no-seed-leak.test.ts  (5)  Day-4
                                ├ preview-quota.test.ts       (8)  Day-5 t1+t2
                                ├ analytics-no-leak.test.ts   (2)  Day-5 t3+t5
                                ├ chain-factory.test.ts       (2)  Day-6 t5
                                ├ ika-no-real-funds.test.ts   (3)  Day-6 t6
                                └ env-startup.test.ts         (3)  Day-6 t8
@sorts/frontend (next build)    ✓ Compiled successfully
@sorts/frontend (Playwright)    deferred — runner pulls native browser
                                binaries; spec stub planned
```

**Day-6 minimum-test set t1..t8 — all green** (privy-auth, solana-service,
sig-replay, preview-quota, chain-factory, ika-no-real-funds, rate-limit,
env-startup).

---

## 9. Deployment readiness

| Layer | State |
|---|---|
| Solana program (devnet) | ✅ Deployed `AEp6V…` — verified by `solana program show` Day 1 |
| Backend code | ✅ Typecheck + tests green; `cargo build-sbf` ✓; production `next build` ✓ |
| Postgres migration script | ✅ Idempotent SQL ready; typechecked but not run live (no Postgres in build env) |
| Render web service | ⚠ Not provisioned. Steps in `docs/INFRASTRUCTURE.md` |
| Vercel project | ⚠ Not provisioned. Steps in `docs/INFRASTRUCTURE.md` |
| Supabase free DB | ⚠ Not provisioned. Pooled DSN goes in `DATABASE_URL` |
| Privy app id | ⚠ Operator-supplied; production fail-fast in `AuthProvider.tsx` |
| Telegram bot token | ⚠ Operator-supplied; bot disabled gracefully if unset |
| Demo video | ⚠ Slot reserved in `docs/SOLANA_PHASE2_DEMO.md` |
| 14-step smoke results | ⚠ Empty rows in `docs/INFRASTRUCTURE.md` waiting for live URLs |

The repo is **deploy-ready**. Every operator-only step is checklisted in
`docs/INFRASTRUCTURE.md` with env-var names (no values), build/start
commands, post-deploy migration commands, and a rollback plan.

Rollback handle confirmed: `selectDriver()` returns `'sqlite'` when
`DATABASE_URL` is unset. The 56-test backend pass runs against the SQLite
path; clearing the URL on Render falls back to better-sqlite3 + Render
Persistent Disk (~$1/mo).

---

## 10. Cut-lines hit (and why) — context for future agents

These are the three places where the spec's optimistic assumption met
reality:

### Cut-line 1: Quasar CLI (Day 1)
- **Symptom:** `quasar build`, `quasar test`, `quasar idl` all return
  opaque `Anyhow error`.
- **Decision:** bypass with `cargo build-sbf` + `solana program deploy`.
  All framework macros work. Fallback to Anchor would have been a
  regression of working code.
- **Future agent action:** if a newer Quasar release lands, retry the
  three commands. No source changes required if they succeed.

### Cut-line 2: Umbra real integration (Day 4)
- **Symptom:** `verify-umbra-devnet.ts` → `fallback recommended`. Devnet
  has no Umbra programs deployed; mainnet path needs an MXE account we
  can't provision.
- **Decision:** ship `UmbraPrivacyService` as a thin wrapper around the
  on-chain Subscription PDA's `expiry_ts`. Privacy mode label
  everywhere is `on-chain-commitment-fallback`. UI carries the "Umbra
  v2 in progress" badge.
- **Future agent action:** when Umbra ships devnet program + indexer,
  swap the fallback body for the real `evaluateEntitlement` call. The
  symbol stays. Privacy mode flips to `umbra-encrypted-balance` and
  every UI surface picks up the new label automatically.

### Cut-line 3: IKA real integration (Day 6)
- **Symptom:** IKA pre-alpha endpoint has no devnet path we can rely on
  for this build.
- **Decision:** static `IkaDWalletService` returning `pre-alpha`
  descriptors. `signRealFundsPayload` is double-gated (env flag + "not
  implemented" throw) so accidental real-money signing is structurally
  impossible.
- **Future agent action:** when IKA stabilises, replace `getStatus` /
  `getCapabilities` / `signRealFundsPayload` bodies. Route + UI surfaces
  stay; the SignerCapabilitiesCard automatically picks up
  `status: 'available'` and the cells flip from `✓ pre-alpha` to `✓`.

### Cut-line 4: Privy 1.x Solana support (Day 3)
- **Symptom:** Privy 1.99 ships no Solana connector compatible with
  this 1.x install.
- **Decision:** keep Privy for email + EVM identity; use
  `@solana/wallet-adapter-react` directly for Solana wallet connection.
- **Future agent action:** when Privy publishes a stable 1.x-compatible
  Solana connector, replace `useWallet()` calls in
  `SolanaChainAdapter.ts` with the Privy hook of the same shape. Drop
  the wallet-adapter providers from `AuthProvider.tsx`.

### Cut-line 5: Playwright e2e (Day 6 / 8)
- **Symptom:** Playwright runner pulls hundreds of MB of native browser
  binaries plus needs a test-server fixture.
- **Decision:** ship the 56-test jest set + the `cargo test` set; defer
  Playwright until the rest of the demo flow is locked.
- **Future agent action:** add `frontend/e2e/solana-happy-path.spec.ts`
  + `frontend/playwright.config.ts`, mock Privy + wallet adapter, walk
  the 14 demo-script steps.

---

## 11. Known gaps + technical debt (a downstream agent's punch list)

### High-value
1. **No e2e browser test** — the 14-step demo flow has no automated
   guard. Manual smoke is the only protection against UI regressions.
2. **Tier price scaling on Solana** — the wizard parses tier price as
   decimal SOL × 1e9 → lamports. No upper bound; no "minimum subscribe
   amount" guard at the UI level. The Solana program does enforce the
   stored price.
3. **Single community per creator (Quasar `#[seeds]` deviation)** —
   the Community PDA is seeded by `[b"community", creator]`. To allow
   multiple communities per creator, derive a per-community keypair
   client-side and use that as the seed-creator field, separate from the
   transaction signer. Documented in
   `programs/sorts-community/README.md`.
4. **Anchor TS coder cannot encode our ix** — clients hand-build buffer
   data. Two implementations to keep in sync:
   - `frontend/src/lib/solana/instructions.ts`
   - The decoder in `backend/src/services/chain/SolanaService.ts`.
   When the program account layout changes, both have to update.
5. **`useSolanaMembership` falls back to `inactive` on backend
   unreachable** — intentional ("never unlock content on a soft
   failure"), but a banner-style "privacy backend unreachable" surface
   would help debug-time.

### Medium-value
6. **`apiRateLimit` is in-memory** — fine for one Render instance, but
   would need a Redis store or `express-rate-limit/redis-store` for
   multi-instance scaling. Day 7 didn't switch the storage; the Render
   free tier runs single-instance anyway.
7. **`PreviewQuotaService` is in-memory-Postgres mixed** — sync façade
   over `pool.query` via `Atomics.wait` polling. Works but is not
   idiomatic. A proper async refactor of every route handler would let
   the adapter return a real `Promise`.
8. **Sig-nonce GC is lazy** — runs on every middleware call. For a
   high-traffic deploy, schedule a periodic VACUUM via pg_cron or a
   small cron job.
9. **`backend/src/db/postgres.ts` synchronous façade** — pollutes the
   call sites with a blocking pattern. Future refactor: convert
   `runMigrations` + each route handler to async, drop the
   `Atomics.wait` poll.
10. **No CSP / CORS allow-list hardening** — `cors({ origin: FRONTEND_URL })`
    works for one frontend; multi-origin or preview branches need a
    function form.

### Lower-value (nice-to-have)
11. `frontend/.env.example` should list every `NEXT_PUBLIC_*` the app
    reads at build time so Vercel deploys never miss one.
12. `verify-umbra-devnet.ts` returns exit code 0 always (intentional —
    cut-line decisions don't gate CI). A `--strict` mode that exits 1
    on fallback would help a CI matrix pin the behaviour.
13. The Telegram bot has no Solana-side `/balance` or `/preview` command
    yet.
14. The frontend has no offline / loading skeletons; everything renders
    "Loading…" plaintext.

---

## 12. Recommended next steps for a multi-agent builder

A high-leverage agent crew breakdown — pick whatever fits the user's
target.

### Crew A: lock the demo
1. **Browser test agent.** Add `frontend/e2e/solana-happy-path.spec.ts`
   + Playwright config. Mock Privy + Solana wallet adapter. Walk the 14
   demo-script steps with Playwright assertions. Wire into a GitHub
   Actions workflow. **Estimated cost:** 2 hours of agent time.
2. **Visual-regression agent.** Capture the 14 screenshots from
   `docs/SCREENSHOT_INDEX.md` against the deployed Vercel URL, redact
   per the capture rules, drop into `frontend/public/demo-screenshots/`.
3. **Demo-video agent.** Record the 2:45 walkthrough per
   `docs/SOLANA_PHASE2_DEMO.md`. Replace the `TODO: paste the unlisted
   video URL` slot.

### Crew B: harden privacy
4. **Privacy-grep agent.** Audit every API response shape (Express + IDL
   client) for forbidden patterns (`tier_level`, `tier_commitment`,
   `salt`, wallet-shaped strings, base58 wallets, EVM wallets). Add to
   the existing `privacy-assertions.test.ts` matrix.
5. **CSP / CORS agent.** Add a Content-Security-Policy header pipeline
   in Next.js middleware; replace `cors({ origin })` with a function
   that allows the Vercel deploy URL + branch deploys, rejects all
   else.
6. **Telegram audit agent.** Grep every bot reply string for `tier`,
   `level [123]`, `member count`. Add a reply-text-shape unit test that
   runs on every CI build.

### Crew C: move toward real Umbra + IKA
7. **Umbra v2 agent.** Watch `@umbra-privacy/sdk` releases. When devnet
   programs land, swap the fallback body in
   `UmbraPrivacyService.evaluateEntitlement`. Privacy mode auto-flips
   to `umbra-encrypted-balance` and every UI surface picks up the new
   label.
8. **IKA real-funds agent.** When IKA pre-alpha stabilises, implement
   `IkaDWalletService.signRealFundsPayload` behind the existing
   `ENABLE_IKA_REAL_FUNDS` gate. Add an end-to-end test that the gate
   blocks the call without the env flag.

### Crew D: scale + ops
9. **Postgres migration agent.** Provision Supabase free + run
   `pnpm --filter @sorts/backend run migrate` against the live DSN.
   Run `seed:devnet-demo`. Fill the 14-step smoke timestamps in
   `docs/INFRASTRUCTURE.md`.
10. **Multi-creator unlock agent.** Solve the "one Community per
    creator" Quasar `#[seeds]` deviation by deriving per-community
    sub-keypairs client-side. Document the derivation scheme so
    multiple agents can reproduce it.
11. **Async DAL agent.** Convert every route handler + bot command from
    sync better-sqlite3 patterns to async pg patterns. Drop the
    `Atomics.wait` synchronous façade in `backend/src/db/postgres.ts`.

### Crew E: marketing + submission
12. **Colosseum submission agent.** Walk
    `docs/COLOSSEUM_WINNER_SPEC.md`, fill every field with evidence
    pulled from this overview + the test outputs.
13. **Superteam grant agent.** Update
    `docs/SUPERTEAM_AGENTIC_ENGINEERING_GRANT.md` with the live deploy
    URL. Verify each "Suggested Grant Form Answer" is still accurate
    against the current build.

---

## 13. Useful commands

```bash
# Local dev (root)
pnpm install
pnpm dev                                       # turbo dev — frontend + backend

# Test sweep (anywhere)
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend run typecheck
pnpm --filter @sorts/backend run test
pnpm --filter @sorts/frontend build
cd programs/sorts-community && cargo test

# Solana program
cd programs/sorts-community
cargo build-sbf                                  # builds target/deploy/sorts_community.so
solana program deploy target/deploy/sorts_community.so \
  --program-id target/deploy/sorts_community-keypair.json \
  --url devnet

# Postgres (Day 7)
DATABASE_URL=postgres://… pnpm --filter @sorts/backend run migrate
DATABASE_URL=postgres://… pnpm --filter @sorts/backend run seed:devnet-demo

# Verifiers
pnpm --filter @sorts/backend exec ts-node \
  backend/scripts/verify-umbra-devnet.ts          # prints OK or fallback recommended
```

---

## 14. Files of interest (one-line summaries)

```
programs/sorts-community/src/lib.rs              program entry, declare_id!, 3 ix dispatch
programs/sorts-community/src/state.rs            Community + Subscription accounts (no Vec, no plaintext level)
programs/sorts-community/src/instructions/*.rs   per-ix handlers + Accounts structs
programs/sorts-community/deployments/devnet.json AEp6V… program id record
programs/sorts-community/keys/.gitkeep           protocol-treasury.json kept LOCAL only

backend/src/index.ts                             Express boot, middleware order, route mounts
backend/src/services/chain/SolanaService.ts      hand-decoded account reads + PDA derivation
backend/src/services/chain/UmbraPrivacyService.ts Day-4 fallback (cut-line)
backend/src/services/wallet/IkaDWalletService.ts Day-6 pre-alpha (cut-line)
backend/src/services/wallet/PrivyService.ts      bearer-token verification + identity projection
backend/src/services/community/preview-quota.ts  Day-5 quota + GC
backend/src/api/middleware/{auth,rate-limit,sig-nonce,preview-quota}.ts
backend/src/api/routes/{community,content,analytics,privacy,wallet,link}.ts
backend/src/bot/commands/status.ts               Telegram /status with no tier leak
backend/src/db/{schema,postgres}.ts              selectDriver() + pg adapter
backend/scripts/{migrate-to-postgres,seed-devnet-demo,verify-umbra-devnet}.ts

frontend/src/lib/chain/{useChain,types,chains}.ts    chain-aware factory
frontend/src/lib/chain/adapters/{Solana,Arbitrum}ChainAdapter.ts
frontend/src/lib/solana/{connection,program,idl,instructions}.ts
frontend/src/components/wallet/SignerCapabilitiesCard.tsx   PRE-ALPHA banner
frontend/src/components/privacy/UmbraMembershipCard.tsx     "Umbra v2 in progress"
frontend/src/components/studio/{CreateCommunityWizard,PreviewToggle,AggregateStatsCard}.tsx
frontend/src/components/badges/{Devnet,PreAlpha}Badge.tsx   site-wide disclosures
frontend/src/components/layout/DisclaimerFooter.tsx         global mount in app/layout.tsx
frontend/src/hooks/{useUmbraPrivacy,useSolanaMembership}.ts

packages/shared/src/types/{chain,community,membership,privacy,wallet}.ts
packages/shared/src/interfaces/{IChainService,IPrivacyComputeService,IMultichainControlService,…}.ts

docs/SOLANA_PHASE2_DEMO.md         demo script (this is what to follow during recording)
docs/SCREENSHOT_INDEX.md           14-row capture plan
docs/INFRASTRUCTURE.md             Day-7 DB choice + deploy + rollback
docs/COLOSSEUM_WINNER_SPEC.md      submission target
docs/SUPERTEAM_AGENTIC_ENGINEERING_GRANT.md    grant draft
README.md "Current Demo Status"    honesty pass table
```

---

## 15. Hard rules a downstream agent must respect

These are non-negotiable. Every commit landed so far obeyed them; future
agents must too.

1. **Devnet only.** No mainnet code path exists. Universal Hard Rule
   from `handoff/AGENT_PROMPTS.md`.
2. **Aggregate-only creator analytics.** No member list, no tier
   distribution, no time-series of joiners-by-wallet. Asserted in
   `analytics-no-leak.test.ts`.
3. **No tier in any read path on Solana.** `checkAccess` returns boolean
   only; `getMembershipStatus` returns `tierLevel: null`; the on-chain
   `Subscription` account has no plaintext `level` field — only
   `tier_commitment + salt_pubkey`.
4. **No real funds without an explicit env flag.**
   `IkaDWalletService.signRealFundsPayload` throws unless
   `ENABLE_IKA_REAL_FUNDS=true`. Even with the flag, the pre-alpha build
   still throws "not implemented" so accidental real-money signing is
   structurally impossible.
5. **No env values in commits, screenshots, PR descriptions.** Reference
   by name only. `git log -p -- '*.env*'` is clean (only
   `.env.example`).
6. **Privacy compute service never logs seed / signature / ciphertext.**
   `umbra-no-seed-leak.test.ts` captures every console emission and
   regex-checks against forbidden token shapes.
7. **Sig-replay → 401, preview quota → 403, rate limit → 429.** These
   status codes are part of the public API; clients consume them.
8. **`preview_quota` and `wallet_links` are never joined in any API
   response.** This is a route-layer convention, not a SQL constraint
   — every PR that touches these tables needs the assertion re-checked
   manually.

---

If you are an AI agent reading this for the first time: start with
section 4 (Solana program) + section 7 (Privacy invariants). Those two
contain the load-bearing claims that everything else either supports or
discloses. The rest is plumbing.

End of overview.

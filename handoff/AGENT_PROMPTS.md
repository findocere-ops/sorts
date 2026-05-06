# SORTS — Agent Prompt Pack (Day 1–8 Solana Devnet MVP)

**Audit anchor:** `/Users/rejoelm/.claude/plans/okay-please-analyze-the-virtual-clarke.md`
**Repo root:** `/Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3`
**Ship target:** 2026-05-12 · **Today:** 2026-05-04 (Day 0 complete)

Each prompt below is self-contained. Paste verbatim into a fresh AI-coding agent (Codex High, Claude Sonnet 4.6, etc.). Order matters — Day N depends on Day N-1.

---

## Universal Hard Rules (apply to every prompt)

```text
- Do NOT edit .env, .env.local, .env.example beyond what the prompt explicitly authorizes.
- Do NOT print private keys, RPC URLs with API keys, Privy app secrets, Telegram bot tokens, Umbra master seeds, IKA signing keys, or any value from process.env that looks like a secret.
- Do NOT deploy to mainnet. Devnet only.
- Do NOT add public member-list or enumerable member-registry endpoints, accounts, columns, or UI surfaces.
- Do NOT claim production FHE, production MPC, mainnet privacy guarantees, or full Nox parity in code, copy, or comments.
- Do NOT break the Arbitrum legacy adapter. Phase 1 must stay buildable.
- Do NOT call Solana, Umbra, or IKA SDKs directly from generic feature modules or page components — all chain-specific calls go through services/hooks/interfaces.
- Do NOT install dependencies that pull native build steps (node-gyp) without checking that prebuilt binaries exist for darwin-arm64 + linux-x64.
- Privacy invariants: aggregate-only creator analytics, single-user/single-address access checks only, tier levels never returned in API responses, Telegram wallet links only for delivery purposes.
- Use feature flags (`ENABLE_*`) for any experimental path. Default conservative.
- After each step run the verification block. If it fails, fix or hit the day's cut-line gate.
```

---

## Day 1 (May 5) — Quasar Solana Program Bootstrap

```text
You are the SORTS Solana program engineer. Bootstrap the Quasar program for the SORTS private subscription rails MVP.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3
Framework: Quasar (Blueshift) — https://github.com/blueshift-gg/quasar
Apply the Universal Hard Rules from handoff/AGENT_PROMPTS.md.

GOAL
Scaffold a working Quasar program that supports the SORTS demo flow:
  1. Creator initializes a community.
  2. Subscriber subscribes for a chosen tier.
  3. Anyone can check_access for a (community, subscriber) pair (returns boolean + expiry).
  4. Anyone can read aggregate stats (total_members, active_members, total_revenue).

ACCOUNT MODEL (PDAs only — no iterable Vec<Pubkey> anywhere)
- `Community` PDA, seed = ["community", creator: Pubkey, name_hash: [u8;32]]
   fields: creator, name_hash, symbol_hash, created_at, tier_count, total_members_counter, total_revenue_lamports, active_members_counter, bump
- `Tier` PDA, seed = ["tier", community: Pubkey, level: u8]
   fields: community, level, price_lamports, duration_secs, bump
- `Subscription` PDA, seed = ["subscription", community: Pubkey, subscriber: Pubkey]
   fields: community, subscriber, expiry_ts, tier_commitment: [u8;32], salt_pubkey: Pubkey, bump
   tier_commitment = keccak256_or_blake3(tier_level || salt_pubkey.to_bytes()) — tier itself never stored in plaintext.

INSTRUCTIONS
1. `initialize_community(name: String, symbol: String, tiers: Vec<TierInput>)`
   - Validates name <= 50 chars, symbol <= 8 chars, 1 <= tiers.len() <= 3.
   - Initializes Community PDA + Tier PDAs.
   - Emits CommunityCreated event with community pubkey, creator (NOT name in plaintext if institutional mode flagged).
2. `subscribe(level: u8, salt_pubkey: Pubkey)`
   - Caller pays Tier.price_lamports in SOL (devnet) to community treasury PDA.
   - Splits 5% to a hardcoded protocol_treasury constant + 95% to creator.
   - Creates Subscription PDA, sets expiry_ts = clock.unix_timestamp + Tier.duration_secs.
   - Increments Community.total_members_counter and active_members_counter.
   - Emits SubscriberJoined { community, expiry_ts } — NEVER subscriber pubkey in event.
3. `renew_subscription(level: u8)`
   - Subscription PDA must exist for caller.
   - Pays Tier.price, extends expiry_ts. If currently expired, sets to now + duration; else adds duration to existing expiry.
   - Same 5/95 split.
   - Increments active_members_counter only if was previously expired.
4. `check_access(subscriber: Pubkey)` (read-only via account fetch + helper)
   - Helper TS function in `programs/sorts-community/tests/sorts-community.ts` and IDL accessor.
   - Returns { active: bool, expiry_ts: i64 } — NO tier, NO commitment, NO salt.
5. `get_aggregate_stats()` (read-only)
   - Returns Community { total_members_counter, active_members_counter, total_revenue_lamports }.

PROTOCOL TREASURY
Hardcoded constant `PROTOCOL_TREASURY: Pubkey` = a real keypair you generate locally and SAVE to `programs/sorts-community/keys/protocol-treasury.json` (gitignored). Document address in `programs/sorts-community/README.md`.
PROTOCOL_FEE_BPS = 500 (5%), matching the Arbitrum legacy adapter contract value at contracts/contracts/SortsMembership.sol.

FILES TO CREATE
- programs/sorts-community/Cargo.toml
- programs/sorts-community/Quasar.toml
- programs/sorts-community/src/lib.rs
- programs/sorts-community/src/state.rs
- programs/sorts-community/src/instructions/mod.rs
- programs/sorts-community/src/instructions/initialize_community.rs
- programs/sorts-community/src/instructions/subscribe.rs
- programs/sorts-community/src/instructions/renew_subscription.rs
- programs/sorts-community/src/instructions/check_access.rs
- programs/sorts-community/src/instructions/aggregate_stats.rs
- programs/sorts-community/src/error.rs
- programs/sorts-community/src/events.rs
- programs/sorts-community/tests/sorts-community.ts (Mocha + Quasar bench)
- programs/sorts-community/README.md
- .gitignore additions: programs/sorts-community/target/, programs/sorts-community/keys/

INSTALLATION (document in README, do NOT run unless prebuilt binaries exist)
```bash
cargo install --git https://github.com/blueshift-gg/quasar quasar-cli
quasar build
quasar deploy --cluster devnet --keypair ~/.config/solana/id.json
```

TESTS (minimum 5)
- t1: initialize_community happy path with 3 tiers.
- t2: subscribe pays exactly 95% to creator + 5% to protocol_treasury (assert lamport deltas).
- t3: check_access returns { active: true, expiry_ts > now } after subscribe.
- t4: check_access returns { active: false } after expiry_ts passes (use clock manipulation).
- t5: aggregate_stats counter increments and active decrements when an expired sub is queried.
- t6 (privacy assertion): grep the entire program output and accounts for any pubkey-iteration helper. Test fails if `Community` struct grows a Vec<Pubkey> field or any new account stores a list of subscribers.

RECORD DEPLOYMENT
After successful devnet deploy, write programs/sorts-community/deployments/devnet.json:
```json
{
  "cluster": "devnet",
  "program_id": "<base58>",
  "deploy_tx": "<signature>",
  "deployed_at": "<ISO timestamp>",
  "protocol_treasury": "<base58>",
  "deployer": "<base58>"
}
```

VERIFICATION
```bash
cd programs/sorts-community
quasar build
quasar test
solana program show <program_id> --url devnet  # documented in README
```

CUT-LINE GATE (end of Day 1)
If `quasar build` or `quasar test` fail twice with framework-level errors (missing macros, IDL gen issues, install failures): pivot to Anchor. Same account model, same instruction signatures, replace Quasar.toml with Anchor.toml, re-bootstrap with `anchor init sorts-community` inside programs/. SolanaService client TS code planned for Day 2 stays Anchor-IDL-compatible either way.

OUTPUT
Final response must include:
- Files changed (full list).
- Build + test results (paste tail of output, no secrets).
- Deployed program id (devnet).
- Counter assertions from test t6 confirming privacy invariants hold.
- Any cut-line decision made and why.
```

---

## Day 2 (May 6) — Backend Solana Adapter + Privy Auth + Hardening

```text
You are the SORTS backend engineer. Add the Solana chain adapter, Privy server-side auth, rate limiting, and signature replay protection.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3
Apply the Universal Hard Rules from handoff/AGENT_PROMPTS.md.

PRECONDITIONS (must be true before starting)
- Day 1 complete: programs/sorts-community/deployments/devnet.json exists with program_id.
- Day 1 IDL generated at programs/sorts-community/target/idl/sorts_community.json (Quasar) or .anchor/target/idl/* if pivoted.

GOAL
1. Implement SolanaService that satisfies packages/shared/src/interfaces/IChainService.ts against the deployed Day 1 program.
2. Route ChainServiceFactory by community.chain_id discriminator (existing communities map to "arbitrum-sepolia"; new Solana communities map to "solana-devnet").
3. Add PrivyService that verifies bearer tokens via @privy-io/server-auth.
4. Add auth middleware on POST/PATCH/DELETE backend routes.
5. Add rate-limit middleware (60 req/min/IP).
6. Add signature-replay nonce store (SQLite for now; Postgres after Day 7).

DEPENDENCIES TO INSTALL (`pnpm --filter @sorts/backend add`)
- @solana/web3.js
- @coral-xyz/anchor (works with both Quasar and Anchor IDLs)
- @privy-io/server-auth
- express-rate-limit

FILES TO CREATE
- backend/src/services/chain/SolanaService.ts
- backend/src/services/chain/idl/sorts_community.json (copy from programs/sorts-community/target/idl/...)
- backend/src/services/chain/idl/types.ts (Anchor type generation OR hand-typed interface)
- backend/src/services/wallet/PrivyService.ts
- backend/src/api/middleware/auth.ts
- backend/src/api/middleware/rate-limit.ts
- backend/src/api/middleware/sig-nonce.ts
- backend/src/__tests__/solana-service.test.ts
- backend/src/__tests__/privy-auth.test.ts
- backend/src/__tests__/sig-replay.test.ts

FILES TO MODIFY
- backend/src/services/chain/ChainServiceFactory.ts — add `solana-devnet` branch
- packages/shared/src/interfaces/IChainService.ts — extend with `chain: 'arbitrum-sepolia' | 'solana-devnet'` discriminator on relevant methods
- packages/shared/src/types/chain.ts — add SolanaChainId type, COMMUNITY_CHAIN_DEVNET = 'solana-devnet'
- backend/src/db/schema.ts — add `nonces` table (nonce TEXT PK, wallet TEXT, expires_at INTEGER), 5-min TTL
- backend/src/index.ts — mount auth + rate-limit + sig-nonce middleware
- backend/src/api/routes/community.ts — gate POST behind auth middleware, accept Solana community ids
- backend/src/api/routes/content.ts — gate POST/PATCH/DELETE behind auth, attach nonce check on signature-bearing GETs

PRIVY SERVICE CONTRACT
```ts
export interface PrivyVerifiedIdentity {
  privyUserId: string;
  linkedWallets: { chain: 'evm' | 'solana'; address: string }[];
  email?: string;
}

export class PrivyService {
  constructor(appId: string, appSecret: string);
  async verifyBearerToken(token: string): Promise<PrivyVerifiedIdentity | null>;
}
```
Auth middleware reads `Authorization: Bearer <token>`, calls verifyBearerToken, attaches `req.identity`. Returns 401 on null. NEVER returns the raw token in errors.

SOLANA SERVICE CONTRACT
Implement IChainService methods. Key pieces:
- `createCommunity(...)`: returns instruction set or unsigned tx; backend never holds creator key.
- `subscribe(communityPubkey, subscriberPubkey, level)`: returns unsigned tx for client to sign.
- `checkAccess(communityPubkey, subscriberPubkey)`: read-only RPC fetch of Subscription PDA, returns { active: boolean, expiresAt?: ISOString } — NO tier, NO commitment.
- `getAggregateStats(communityPubkey)`: read-only RPC fetch of Community PDA, returns { totalMembers, activeMembers, totalRevenue } (lamports → SOL string).
- `getMembershipStatus(communityPubkey, subscriberPubkey)`: thin wrapper over checkAccess for the Telegram bot.

RATE LIMIT
express-rate-limit, 60 req/min per IP, applied globally. Skip for /health. 429 response with Retry-After header.

SIG-NONCE STORE
- Issue nonce on GET /api/auth/nonce?wallet=... — random 32-byte hex, 5-min TTL, stored in `nonces` table.
- Signature payload format: `SORTS auth\n<nonce>\n<wallet>`.
- On routes that take a wallet+signature, middleware verifies nonce exists, signature matches, then DELETES the row (single-use).
- 401 if nonce missing/expired/already-used.

PRIVACY ASSERTIONS (in tests)
- t1: SolanaService.checkAccess response JSON has NO fields named `tier`, `tier_level`, `commitment`, `salt`, `salt_pubkey`. Use `JSON.stringify` regex assertion.
- t2: SolanaService.getAggregateStats response has NO array fields, NO field named `members`, `subscribers`, `wallets`.
- t3: ChainServiceFactory throws clearly on unsupported chain ids (no silent fallback).
- t4: PrivyService.verifyBearerToken returns null on garbage token, throws on missing app id config.
- t5: Sig-replay: same nonce + signature submitted twice → second is 401.
- t6: Rate-limit: 61st request from same IP within 60s → 429.

UPDATE BACKEND/ENV.EXAMPLE (already has the slots from Day 0; verify no new keys needed)

VERIFICATION
```bash
pnpm --filter @sorts/backend build
pnpm --filter @sorts/backend test
# Manual smoke against deployed devnet program:
SOLANA_DEVNET_RPC_URL=https://api.devnet.solana.com \
  SOLANA_PROGRAM_ID=<from Day 1> \
  ts-node backend/scripts/smoke-solana-service.ts
```

OUTPUT
- Files changed.
- Build + test results.
- Confirmation that Arbitrum path still builds (run pnpm --filter contracts compile).
- Privacy assertion test outputs.
- List of new env vars used (no values).
```

---

## Day 3 (May 7) — Frontend Solana Wallet + Chain-Aware Creator Flow

```text
You are the SORTS frontend engineer. Make the frontend chain-aware (Solana primary, Arbitrum legacy hidden), wire Privy Solana connector, and ship the real /studio/create Solana flow.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3
Apply the Universal Hard Rules from handoff/AGENT_PROMPTS.md.

PRECONDITIONS
- Day 2 complete: SolanaService deployed in backend, Privy auth middleware live.
- programs/sorts-community/deployments/devnet.json has program_id.

GOAL
1. Add @solana/wallet-adapter-react + Privy Solana connector to the auth provider.
2. Refactor frontend/src/lib/chain/useChain.ts to be chain-aware:
   - Default chain: solana-devnet.
   - Reads target chain from community metadata or `?chain=arbitrum-sepolia` query (legacy escape hatch).
   - Returns a ChainAdapter shape with the same surface as today, but routes calls to either the Solana program client or the existing Arbitrum viem client.
3. Implement /studio/create wizard against the Quasar/Anchor program: build tx → Privy-sign → submit → confirm → POST metadata to backend (with bearer token).
4. Add devnet badge in the topbar and pre-alpha badge component placement on every chain-touching screen.
5. Hide all Arbitrum-leaning copy from /studio/create empty states (replace "Arbitrum Sepolia factory" with "Solana program"). Arbitrum stays accessible only via `?chain=arbitrum-sepolia` query.

DEPENDENCIES TO INSTALL (`pnpm --filter @sorts/frontend add`)
- @solana/wallet-adapter-react
- @solana/wallet-adapter-base
- @solana/wallet-adapter-react-ui
- @solana/web3.js
- @coral-xyz/anchor
- bs58

FILES TO CREATE
- frontend/src/lib/solana/connection.ts (cluster + Connection singleton)
- frontend/src/lib/solana/program.ts (Anchor Program client, IDL imported from backend/src/services/chain/idl/sorts_community.json or copy)
- frontend/src/lib/solana/idl.ts (IDL re-export with TypeScript types)
- frontend/src/lib/solana/instructions.ts (build initializeCommunity / subscribe / renew tx-builder helpers)
- frontend/src/lib/chain/chains.ts (CHAINS = { 'solana-devnet': {...}, 'arbitrum-sepolia': {...} } registry)
- frontend/src/lib/chain/adapters/SolanaChainAdapter.ts
- frontend/src/lib/chain/adapters/ArbitrumChainAdapter.ts (extracted from existing useChain.ts)
- frontend/src/lib/chain/types.ts (ChainAdapter interface)
- frontend/src/components/wallet/SolanaWalletButton.tsx
- frontend/src/components/badges/DevnetBadge.tsx
- frontend/src/components/badges/PreAlphaBadge.tsx
- frontend/src/components/badges/index.ts (re-exports)

FILES TO MODIFY
- frontend/src/components/providers/AuthProvider.tsx — add Solana wallet adapter provider, set Privy supportedChains/defaultChain to Solana
- frontend/src/lib/chain/useChain.ts — refactor to chain-aware factory; existing exported function names stay so call sites don't break
- frontend/src/lib/wagmi.ts — keep config but mark `// legacy adapter only` and gate behind feature flag check at call site
- frontend/src/app/studio/create/page.tsx — switch empty-state copy and call SolanaChainAdapter
- frontend/src/components/layout/Topbar.tsx (or equivalent) — render DevnetBadge always
- frontend/src/components/states/ContractNotConfigured.tsx — make copy chain-aware

CHAIN ADAPTER INTERFACE
```ts
export interface ChainAdapter {
  chain: 'solana-devnet' | 'arbitrum-sepolia';
  readinessState: 'wallet-not-connected' | 'wrong-network' | 'program-not-configured' | 'ready';
  address: string | undefined;

  createCommunity(input: CreateCommunityInput): Promise<CreateCommunityResult>;
  subscribe(input: SubscribeInput): Promise<TransactionResult>;
  renew(input: RenewInput): Promise<TransactionResult>;
  getAggregateStats(communityRef: string): Promise<AggregateStats>;
  // ...
}
```
Existing call sites that import `useChain()` should keep working. Internally `useChain()` picks an adapter based on community.chain_id (lookup) or default = solana-devnet.

PRIVY CONFIG UPDATE
```ts
<PrivyProvider
  appId={appId}
  config={{
    loginMethods: ['email', 'wallet'],
    embeddedWallets: { createOnLogin: 'users-without-wallets' },
    defaultChain: solanaDevnet,        // new — use a Solana chain object compatible with Privy
    supportedChains: [solanaDevnet, arbitrumSepolia],
    appearance: { theme: 'dark', accentColor: PRIVY_ACCENT_COLOR },
  }}
>
```
If Privy's Solana support requires a specific connector, follow https://docs.privy.io/wallets/configuration/networks/solana — install the recommended Solana connector package as well.

CTA + COPY CHANGES
- frontend/src/app/page.tsx hero subhead: keep "Solana" wording; ensure no Arbitrum mention regressed.
- /studio/create empty state title: "Solana program is not configured" (when SOLANA_PROGRAM_ID env missing).
- Topbar: render `<DevnetBadge />` site-wide. Render `<PreAlphaBadge />` on pages that load Umbra or IKA UI (placeholder for Day 4/6).

VERIFICATION
```bash
pnpm --filter @sorts/frontend build
# Manual:
# 1. Start preview server, open http://localhost:3000
# 2. Click "Create a community" → /studio/create
# 3. Sign in via Privy (real app id required) → connect a Solana wallet
# 4. Fill wizard → submit → see signature confirmation → see Solana Explorer link
# 5. Reload /studio after confirmation → community appears in your list
```

CUT-LINE GATE
If Privy Solana connector not stable: fall back to direct @solana/wallet-adapter-react connect button; Privy stays for email/auth identity only. Document the choice in frontend/src/lib/solana/README.md.

OUTPUT
- Files changed.
- Build result.
- Screenshot/snapshot evidence of /studio/create rendering on Solana with correct empty-state copy.
- Confirmation that Arbitrum path still builds and is reachable via `?chain=arbitrum-sepolia`.
```

---

## Day 4 (May 8) — Umbra Privacy Service + Subscriber Join Flow

```text
You are the SORTS privacy & subscriber-flow engineer. Verify the Umbra SDK on Solana devnet, wire it behind a service boundary, and ship the real /join/[cid] subscriber flow.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3
Apply the Universal Hard Rules from handoff/AGENT_PROMPTS.md.

PRECONDITIONS
- Day 3 complete: chain-aware useChain, Solana wallet wired, /studio/create real on devnet.
- backend SolanaService.checkAccess + getAggregateStats live.

GOAL
1. Verify @umbra-privacy/sdk (or current canonical Umbra package name) installs and that `register()` + `getEncryptedBalance()` work against Solana devnet from a small reproducer script.
2. Implement UmbraPrivacyService behind packages/shared/src/interfaces/IPrivacyComputeService.ts. NEVER log master seed, NEVER persist seed to DB.
3. Build the subscriber join flow: /join/[cid] (preview) → /join/[cid]/subscribe (subscribe) → /app/[cid]/feed (gated).
4. Wire backend /api/content/:communityId GET to call SolanaService.checkAccess for Solana communities.

CUT-LINE GATE (must decide by end of Day 4)
If Umbra SDK install fails OR registration call doesn't return success against devnet within 4 hours of focused effort: SWITCH to fallback PrivateMembershipFallback service that uses the on-chain `tier_commitment` already stored in the Day 1 Subscription PDA. Label every UI surface clearly as "devnet experimental — encrypted membership state coming via Umbra in v2". Do NOT ship a fake Umbra integration.

DEPENDENCIES TO TRY (verify install before adopting)
- @umbra-privacy/sdk (Priority.md spec) OR the current canonical name from https://github.com/umbra-privacy
- If fallback chosen: no new deps; reuse @coral-xyz/anchor.

FILES TO CREATE
- backend/src/services/chain/UmbraPrivacyService.ts (or PrivateMembershipFallback.ts if cut-line hit)
- backend/scripts/verify-umbra-devnet.ts (reproducer that runs once, prints success/failure, NEVER prints seed)
- backend/src/__tests__/umbra-no-seed-leak.test.ts
- frontend/src/components/privacy/UmbraMembershipCard.tsx
- frontend/src/hooks/useUmbraPrivacy.ts
- frontend/src/hooks/useSolanaMembership.ts (combines chain access check + privacy state for UI)
- packages/shared/src/interfaces/IPrivacyComputeService.ts
- packages/shared/src/types/privacy.ts
- packages/shared/src/types/membership.ts

FILES TO MODIFY
- frontend/src/app/join/[cid]/page.tsx — fetch community, show preview content if creator-marked, render UmbraMembershipCard, link to /join/[cid]/subscribe
- frontend/src/app/join/[cid]/subscribe/page.tsx — call useChain().subscribe via SolanaChainAdapter, on confirm redirect to /app/[cid]/feed
- frontend/src/app/app/[cid]/feed/page.tsx — call useSolanaMembership, render gated content if active, locked-state otherwise
- backend/src/api/routes/content.ts — for Solana communities, call SolanaService.checkAccess instead of ArbitrumService

PRIVACY COMPUTE INTERFACE
```ts
export interface PrivateEntitlementResult {
  active: boolean;          // boolean only — never tier number
  expiresAt?: string;       // ISO
  privacyMode: 'umbra-encrypted-balance' | 'on-chain-commitment-fallback' | 'none';
}

export interface IPrivacyComputeService {
  evaluateEntitlement(community: string, subscriber: string): Promise<PrivateEntitlementResult>;
  getRegistrationStatus(subscriber: string): Promise<{ registered: boolean; privacyMode: string }>;
}
```

UMBRA SERVICE RULES
- Registration: derive seed from a Privy-issued signature once per session. Hold it in process memory only. Wipe on logout.
- Idempotent register(): if Umbra reports already-registered, skip without error.
- Encrypted balance query wrapper: returns boolean entitlement, NEVER raw ciphertext or tier amount.
- All log statements about Umbra must redact seed/ciphertext/secrets.

UI RULES
- UmbraMembershipCard shows: privacy mode, registration status, entitlement boolean, devnet/experimental badge, "no real funds" line.
- Never render a tier number or balance on the subscriber side.
- Never render a member count for "this user is one of X members" — the count is community-aggregate only.

PREVIEW BEHAVIOR (still enforced; full Day-5 quota lands tomorrow)
- /join/[cid] page renders any post with content.preview_eligible = true regardless of membership.
- All other posts show locked-state.
- For Day 4, no per-wallet quota yet; Day 5 adds it.

VERIFICATION
```bash
pnpm --filter @sorts/backend build
pnpm --filter @sorts/backend test
pnpm --filter @sorts/frontend build
ts-node backend/scripts/verify-umbra-devnet.ts  # prints OK or "fallback recommended"
# Manual:
# 1. From /join/[cid] preview page (community created Day 3), see UmbraMembershipCard
# 2. Click subscribe → Solana tx → confirm → redirect to /app/[cid]/feed
# 3. Feed renders unlocked content; locked posts hidden body
```

OUTPUT
- Cut-line decision (Umbra real or fallback). Justify.
- Files changed.
- Build/test results.
- Confirmation no seed/secret strings appear in any console output or log file.
- Privacy mode label visible on UmbraMembershipCard screenshot/snapshot.
```

---

## Day 5 (May 9) — Preview Quota + Creator Analytics + Telegram Bot

```text
You are the SORTS product engineer. Implement the 2-community preview quota, creator preview-content marker, real creator analytics dashboard, and upgrade the Telegram bot to call SolanaService.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3
Apply the Universal Hard Rules from handoff/AGENT_PROMPTS.md.

PRECONDITIONS
- Day 4 complete: subscriber join flow live, content gating works against Solana.

GOAL
1. Backend preview-quota service: tracks (wallet OR session_token) → preview_count, hard cap 2 distinct communities. Middleware on /api/content/:communityId GET when caller has no active membership.
2. content.preview_eligible boolean column + creator UI to mark posts.
3. Creator studio analytics dashboard reads SolanaService.getAggregateStats live; aggregate-only response shape.
4. Telegram bot /status command upgraded to call SolanaService.getMembershipStatus.

FILES TO CREATE
- backend/src/services/community/preview-quota.ts
- backend/src/api/middleware/preview-quota.ts
- backend/src/__tests__/preview-quota.test.ts
- backend/src/__tests__/analytics-no-leak.test.ts
- frontend/src/components/studio/PreviewToggle.tsx (per-post creator switch)
- frontend/src/components/studio/AggregateStatsCard.tsx

FILES TO MODIFY
- backend/src/db/schema.ts — add `preview_quota` table (id PK, wallet TEXT NULL, session_token TEXT NULL, community_id TEXT, created_at INTEGER); add `content.preview_eligible BOOLEAN DEFAULT 0`
- backend/src/api/routes/content.ts — apply preview-quota middleware on GET when no active membership; respect preview_eligible
- backend/src/api/routes/analytics.ts — confirm getAggregateStats path routes through SolanaService for Solana communities
- backend/src/bot/handlers/status.ts — call SolanaService.getMembershipStatus
- frontend/src/app/studio/[cid]/content/page.tsx — render PreviewToggle on each post, persist via PATCH /api/content/:communityId/:postId
- frontend/src/app/studio/[cid]/analytics/page.tsx — render AggregateStatsCard with live data

QUOTA RULES
- "Active membership" = SolanaService.checkAccess(community, wallet) returns active=true, OR wallet has any active subscription to ANY community owned by the same creator.
- Preview attempts identified by (wallet OR session_token cookie). Same wallet+session counted once per community. 3rd distinct community → 403 with `{ error: 'preview_quota_exceeded', limit: 2 }`.
- Quota window: rolling 7 days (DELETE rows older than 7 days on every quota check; no separate cron needed).
- Privacy: preview_quota table NEVER joined with membership_cache or wallet_links in any API response.

ANALYTICS DASHBOARD CONTRACT
- AggregateStatsCard renders: total members, active members, total revenue (SOL/USDC). NEVER renders any individual wallet, ratio of unique whales, time-series of joins by wallet, or anything that could de-anonymize members.
- Time-series allowed only at community-level aggregates (members-over-time as a count, not as a list of joiners).

TELEGRAM BOT UPGRADE
- /status command uses linked wallet (from wallet_links table) to call SolanaService.getMembershipStatus(community, wallet).
- Bot replies with active/expired status + expiry date — NEVER tier level, NEVER community member count.

PRIVACY ASSERTIONS (in tests)
- t1: GET /api/content/:cid as non-member returns only posts with preview_eligible=true.
- t2: 3rd distinct community preview from same wallet → 403.
- t3: GET /api/analytics/community/:cid response has zero array fields containing wallet-shaped strings (regex check).
- t4: Studio analytics page has zero rendered text matching `0x[a-fA-F0-9]{40}` or base58 wallet patterns (Playwright assertion).
- t5: Telegram /status reply does not include the word "tier" or any tier number.

VERIFICATION
```bash
pnpm --filter @sorts/backend build
pnpm --filter @sorts/backend test
pnpm --filter @sorts/frontend build
# Manual quota check:
# - From a fresh wallet, browse 2 communities → previews allowed.
# - 3rd community → 403, UI shows "Preview quota reached" with subscribe CTA.
# - Subscribe to one → quota slot freed for that community on subsequent visits.
```

OUTPUT
- Files changed.
- Build/test results.
- Privacy test outputs.
- Screenshot of analytics dashboard with aggregate-only data.
- Telegram /status example reply (use a fixture, NOT real bot token in output).
```

---

## Day 6 (May 10) — IKA Pre-Alpha Capability Layer + Test Pass

```text
You are the SORTS multichain wallet & QA engineer. Add the IKA dWallet capability/status layer (pre-alpha, no real funds), then ship the test sweep.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3
Apply the Universal Hard Rules from handoff/AGENT_PROMPTS.md.

PRECONDITIONS
- Days 1–5 complete and green.

GOAL
1. Verify the current IKA dWallet API/SDK against the documented pre-alpha endpoint.
2. Add IkaDWalletService implementing IMultichainControlService.
3. Add MessageApproval lifecycle types and GasDeposit status type.
4. Add backend /api/wallet routes for dWallet status + capability matrix.
5. Add SignerCapabilitiesCard UI with **prominent pre-alpha + no-real-funds** banner.
6. Run the full backend + frontend test pass and add the 8 minimum backend test cases.

CUT-LINE GATE
If IKA pre-alpha endpoint flakes or SDK install fails: render a static "IKA dWallet — coming soon, pre-alpha" SignerCapabilitiesCard with the same disclaimer banner and a placeholder capability matrix. Do NOT block the demo.

FILES TO CREATE
- backend/src/services/wallet/IkaDWalletService.ts
- backend/src/services/wallet/CrossChainSigningService.ts
- backend/src/services/wallet/GasDepositService.ts
- backend/src/api/routes/wallet.ts
- backend/src/__tests__/ika-no-real-funds.test.ts
- backend/src/__tests__/chain-factory.test.ts
- backend/src/__tests__/env-startup.test.ts
- backend/src/__tests__/rate-limit.test.ts
- frontend/src/components/wallet/SignerCapabilitiesCard.tsx
- frontend/src/components/wallet/MultichainAssetPanel.tsx
- frontend/src/components/wallet/MessageApprovalLifecycle.tsx
- frontend/e2e/solana-happy-path.spec.ts (Playwright)
- frontend/playwright.config.ts (if missing)

FILES TO MODIFY
- packages/shared/src/interfaces/IMultichainControlService.ts (new file actually — create)
- packages/shared/src/types/wallet.ts — add MessageApprovalState ('prepared'|'awaiting-approval'|'pending-signature'|'signed'|'broadcasted'|'failed')
- backend/src/index.ts — mount /api/wallet
- frontend/src/app/account/page.tsx — render SignerCapabilitiesCard

IKA SERVICE CONTRACT
```ts
export interface DWalletDescriptor {
  id: string;
  ownership: 'user-controlled' | 'program-controlled';
  supportedChains: ('solana-devnet' | 'arbitrum-sepolia')[];
  status: 'available' | 'pre-alpha' | 'unavailable';
}

export interface IkaDWalletService {
  getStatus(): Promise<{ status: 'pre-alpha'; canSign: boolean }>;
  getCapabilities(): Promise<DWalletDescriptor[]>;
  // No real-funds methods exposed; gated behind ENABLE_IKA_REAL_FUNDS feature flag in service body.
}
```
Service constructor refuses to instantiate real-funds path unless `env.ENABLE_IKA_REAL_FUNDS === true`. Throws clear error otherwise.

UI RULES
- SignerCapabilitiesCard top stripe: red/orange banner "PRE-ALPHA — NOT FOR REAL FUNDS". Always visible. Not dismissible.
- Capability matrix table: rows = chains, columns = capabilities (sign, broadcast, prepare). Cells either "✓ pre-alpha" or "—".
- MessageApprovalLifecycle: stepper component showing the 6 states. Read-only on Day 6 (interactive flows are post-MVP).

MINIMUM 8 BACKEND TESTS (ensure these all exist and pass)
- t1 privy-auth.test.ts: missing/invalid bearer → 401.
- t2 solana-service.test.ts: checkAccess response no leak.
- t3 sig-replay.test.ts: 2nd nonce use → 401.
- t4 preview-quota.test.ts: 3rd community → 403.
- t5 chain-factory.test.ts: unsupported chain → throws.
- t6 ika-no-real-funds.test.ts: real-funds method called without flag → throws.
- t7 rate-limit.test.ts: 61st req in 60s → 429.
- t8 env-startup.test.ts: missing PORT or invalid FRONTEND_URL → loadEnv throws.

PLAYWRIGHT HAPPY-PATH (frontend/e2e/solana-happy-path.spec.ts)
- Mock backend with MSW or run real backend via test-server fixture.
- Steps: visit /, click Create CTA, mock Privy as authenticated, mock Solana wallet adapter as connected, fill create wizard, mock tx confirm, assert /studio/[cid] shows the new community.
- Time budget: <90s per spec.

VERIFICATION
```bash
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/backend test
pnpm --filter @sorts/frontend build
pnpm --filter @sorts/frontend exec playwright test
```

OUTPUT
- Cut-line decision (IKA real or static placeholder).
- Files changed.
- All build/test outputs (tail).
- Screenshot of SignerCapabilitiesCard with pre-alpha banner.
- Test count summary: backend X passing, frontend Y Playwright passing.
```

---

## Day 7 (May 11) — Postgres Migration + Production Deploy + Honesty Pass

```text
You are the SORTS deployment & migration engineer. Migrate the backend from SQLite to managed Postgres, deploy to Vercel + Render, and run the moderate honesty pass on copy.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3
Apply the Universal Hard Rules from handoff/AGENT_PROMPTS.md.

PRECONDITIONS
- Days 1–6 complete and all tests green locally.

GOAL
1. Provision Supabase free or Render Postgres ($7/mo). DOCUMENT the choice in a `docs/INFRASTRUCTURE.md` file.
2. Translate SQLite schema to Postgres dialect; thin DAL behind a `Database` interface so existing code keeps compiling.
3. Idempotent migration script.
4. Deploy backend to Render with `DATABASE_URL=postgres://…`, frontend to Vercel with Solana env vars.
5. Smoke run all 14 demo-script steps from Priority.md against the deployed URLs.
6. Moderate honesty pass on README + landing copy.

DEPENDENCIES TO INSTALL (`pnpm --filter @sorts/backend add`)
- pg
- pg-format (for safe SQL identifier escaping in migrations)
- (Keep better-sqlite3 as devDependency for local fallback; see Cut-line gate.)

FILES TO CREATE
- backend/src/db/postgres.ts (pg-driver Database adapter implementing the same interface as schema.ts exports)
- backend/scripts/migrate-to-postgres.ts (idempotent: CREATE TABLE IF NOT EXISTS, CREATE INDEX IF NOT EXISTS, no destructive ops)
- backend/scripts/seed-devnet-demo.ts (creates 2 demo communities + a few posts so first visit isn't empty)
- docs/INFRASTRUCTURE.md (chosen DB, Render plan, Vercel project, env-var checklist, rollback plan)

FILES TO MODIFY
- backend/src/db/schema.ts — keep SQLite path for local dev; export a `selectDriver()` that picks pg if `DATABASE_URL` is set
- backend/src/config/env.ts — add `DATABASE_URL: z.string().url().optional()` and a refinement: if NODE_ENV=production then DATABASE_URL must be set
- backend/package.json — add `migrate` script
- README.md — moderate honesty pass: keep aspirational claims, add a "## Current Demo Status" section with a truthful table (live / experimental / coming) and link to disclaimer footer
- frontend/src/app/page.tsx — verify all chain-touching surfaces render DevnetBadge (already done on Day 0/3, verify regression-free)

POSTGRES SCHEMA (translate from SQLite, preserve privacy fields)
- Replicate exactly: communities, tiers, content, wallet_links, link_challenges, analytics_cache, preview_quota, nonces.
- DO NOT add `members` table. DO NOT add tier-level history. DO NOT add a per-user payment log column.
- Use TIMESTAMPTZ instead of INTEGER timestamps. Use BOOLEAN instead of INTEGER 0/1.

DEPLOYMENT
- Backend on Render: web service, Node 20, build `pnpm install --frozen-lockfile && pnpm --filter @sorts/backend build`, start `node backend/dist/index.js`.
- Frontend on Vercel: framework Next.js, build `pnpm --filter @sorts/frontend build`, env vars from frontend/.env.example with real values.
- DO NOT paste env values into the prompt response or commit them. Reference by name only.
- Configure Render Postgres connection string OR Supabase pooled connection string in `DATABASE_URL`.

ROLLBACK PLAN
If Postgres migration breaks reads from existing routes: set `DATABASE_URL` empty, redeploy, backend falls back to SQLite + Render Persistent Disk ($1/mo). Document this in INFRASTRUCTURE.md.

HONESTY PASS (moderate)
- README.md "## Current Demo Status" table:
  | Feature | Status | Notes |
  | --- | --- | --- |
  | Solana devnet community creation | ✅ Live | Quasar program on devnet |
  | Subscriber Solana subscribe + access check | ✅ Live | Devnet only |
  | Aggregate-only creator analytics | ✅ Live | No member lists, ever |
  | Privy auth | ✅ Live | Email + Solana wallet |
  | Umbra hidden membership state | 🧪 Experimental / Fallback | See UmbraMembershipCard label |
  | IKA dWallet | 🧪 Pre-alpha | Static capability card; no real funds |
  | Telegram delivery | ✅ Live | Bot token gates feature |
  | Mainnet | ❌ Not in scope | Devnet MVP only |
- Landing FAQ already has honest Q on "production-ready". Verify still accurate.
- DisclaimerFooter (Day 0) already covers per-page; just ensure it's mounted on every layout (verify by grepping for `<DisclaimerFooter />`).

VERIFICATION
```bash
# Local
pnpm --filter @sorts/backend build
DATABASE_URL=postgres://localhost/sorts_dev pnpm --filter @sorts/backend test
DATABASE_URL=postgres://localhost/sorts_dev node backend/dist/scripts/migrate-to-postgres.js
pnpm --filter @sorts/frontend build

# Deployed smoke (run on 14 Priority.md demo-script steps against the public URLs)
curl https://<backend>.onrender.com/health
curl https://<backend>.onrender.com/api/communities
# Manual browser walkthrough of all 14 steps. Capture timestamps in INFRASTRUCTURE.md.
```

OUTPUT
- DB choice + reason.
- Files changed.
- Migration log (no secrets).
- Deployed URLs.
- 14-step smoke results table (pass/fail per step).
- README "Current Demo Status" diff.
- Rollback verified (one quick test that DATABASE_URL empty => SQLite path works).
```

---

## Day 8 (May 12) — Buffer: Demo Video, Screenshots, Final Smoke

```text
You are the SORTS launch coordinator. No new code. Polish, capture, and prepare the public-facing artifacts.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3
Apply the Universal Hard Rules from handoff/AGENT_PROMPTS.md.

PRECONDITIONS
- Day 7 deploy live.
- All 14 Priority.md demo-script steps pass on the deployed URLs.

GOAL
1. Record sub-3-min demo video against the deployed Vercel URL.
2. Capture screenshot suite.
3. Final regression smoke.
4. Prepare Colosseum / Superteam submission artifacts.

DELIVERABLES
- docs/SOLANA_PHASE2_DEMO.md (already referenced in Priority.md) — finalized.
  Sections: demo script (with timestamps), known limitations, rollback plan, what NOT to demo, devnet/pre-alpha caveats.
- docs/SCREENSHOT_INDEX.md — lists every captured screenshot, file path, page covered, what it proves.
- public/demo-screenshots/*.png — actual files (gitignore if heavy).
- Demo video file (NOT committed to git; link from docs/SOLANA_PHASE2_DEMO.md to YouTube/Loom unlisted).

DEMO VIDEO STRUCTURE (target 2:45)
- 0:00–0:15 hook: "private subscription rails for paid communities on Solana — devnet"
- 0:15–0:45 creator: open studio → create Solana community → tx confirms
- 0:45–1:30 subscriber: sign in via Privy → wallet selection → preview 2 communities → 3rd preview blocked → subscribe to one
- 1:30–2:00 gated content unlocks → creator dashboard shows aggregate stats (no wallets visible)
- 2:00–2:30 IKA dWallet capability card with pre-alpha banner; Umbra membership card showing privacy mode
- 2:30–2:45 close: disclaimer footer visible; "no real funds, devnet only"

SUBMISSION CHECKLIST (verify each)
- [ ] Public Vercel URL works in incognito.
- [ ] Backend Render URL responds <500ms on /health.
- [ ] Solana program id documented in deployments/devnet.json + README.
- [ ] Privy app id is a real one (not the placeholder).
- [ ] Disclaimer footer visible on every page (DevnetBadge + PreAlpha badge).
- [ ] No console errors on landing page in production build.
- [ ] All 8 backend tests + Playwright happy-path green in CI (or reproducible locally).
- [ ] No env values committed (`git log -p .env*` returns empty).
- [ ] No secrets in screenshots (redact wallet addresses, RPC URLs in caps).
- [ ] Colosseum spec (docs/COLOSSEUM_WINNER_SPEC.md) cross-referenced; gaps closed or documented as "v2".
- [ ] Superteam grant draft (docs/SUPERTEAM_AGENTIC_ENGINEERING_GRANT.md) updated with the live deploy URL.

DO NOT
- Add new features.
- Change copy beyond typo fixes.
- Refactor working code.
- Modify deployed contracts/programs.
- Push to mainnet.

VERIFICATION
- Final full build/test sweep:
```bash
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/backend test
pnpm --filter @sorts/frontend build
pnpm --filter @sorts/frontend exec playwright test
```
- Recorded video has no UI showing "production" claims, no real wallet shown unredacted, no env values visible.

OUTPUT
- Submission checklist with each item checked off and one-line evidence.
- Demo video link.
- Final test sweep result.
- Confirmation that the launch cut-line list (Priority.md §"Launch Cut Line") items are all addressed or explicitly deferred.
```

---

## Cross-Cutting Prompts (use any time)

### Privacy-Invariant Audit Prompt

```text
Run a privacy-invariant audit on the current SORTS branch.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3

Check + report file:line for every violation:
1. Any backend route response that contains a `tier`, `tier_level`, `tier_name`, or numeric tier field — should NOT be exposed. (`grep -rn "tier" backend/src/api`)
2. Any backend route that returns a JSON array of wallet-shaped strings (`0x[a-fA-F0-9]{40}` or `[1-9A-HJ-NP-Za-km-z]{32,44}`).
3. Any Solana program account or struct with a `Vec<Pubkey>`, `members: Vec<...>`, `subscribers: Vec<...>`, or any iterable list of users.
4. Any frontend page rendering a wallet address belonging to someone other than the current authenticated user.
5. Any logger.* / console.log / println! / msg! statement in any service layer that prints private state: master seed, signature, raw tier, raw expiry, salt material.
6. Any analytics endpoint that exposes per-user history (joins, payments, churn timeline).
7. Any database column or table that holds (subscriber_wallet, tier_level) together.
8. Any feature flag default that enables real funds, real FHE, or real MPC without explicit operator opt-in.

Output: file:line table grouped by category. No fixes — audit only. Under 600 words.
```

### Pre-Push Verification Prompt

```text
Run the SORTS pre-push verification sweep.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3

```bash
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/backend test
pnpm --filter @sorts/frontend build
pnpm --filter @sorts/frontend exec playwright test 2>/dev/null || true
git status --short
git diff --stat HEAD
```

Then run:
```bash
grep -rE "(BEGIN PRIVATE KEY|sk-[a-zA-Z0-9]{20,}|0x[a-fA-F0-9]{64})" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" --include="*.md" .  | head -20
```

Output:
- Pass/fail per command.
- Any secret-like string match.
- File-count diff vs main branch.
- One-line ship/no-ship recommendation.
```

### Honesty Diff Prompt (run before any public push)

```text
Audit the current SORTS branch for false-claim risk.

Repo: /Users/rejoelm/Desktop/AI/SORTS/.claude/worktrees/clever-bhaskara-541ed3

For each file in (README.md, docs/**, frontend/src/app/page.tsx, frontend/src/components/**):
- List every claim of "production", "production-grade", "FHE", "MPC", "mainnet", "audited", "guaranteed", "100%", "fully encrypted", "real-time", "secure".
- For each, return file:line + the surrounding sentence + verdict: VERIFIED, ASPIRATIONAL-OK-WITH-DISCLAIMER, FALSE-AS-OF-TODAY.

Then:
- Confirm every page route's component tree includes either DisclaimerFooter or DevnetBadge.
- Confirm every UmbraMembershipCard / SignerCapabilitiesCard renders its pre-alpha label.

Output: 3-column table. Under 500 words. No fixes — audit only.
```

---

## Notes for the Operator

1. **Run prompts in order.** Day N depends on Day N-1 deliverables. Each prompt's `PRECONDITIONS` block enforces this.
2. **Cut-lines are not optional.** If an experimental dependency (Quasar, Umbra, IKA) breaks, switch to the documented fallback. Do not let a single library failure derail the demo.
3. **Privacy invariants are the only red line.** Performance regressions, build warnings, even feature cuts — acceptable. Member enumeration or tier leak — never acceptable.
4. **No secrets in any prompt response.** Reference env-var names, never values.
5. **The disclaimer footer carries weight.** The "moderate honesty" stance only works if every page reaches it. Verify on every Day 3+ deliverable.
6. **Day 8 is buffer.** If you need it for a Day 6 spillover bug, that is acceptable. If you need it for a Day 1 spillover, the schedule has failed — escalate.

---

## Anti-Patterns To Reject (in any agent output)

- "I added a `getMemberList()` method just in case" → reject. Privacy violation.
- "I removed the disclaimer footer because it looked cluttered" → reject. Honesty contract.
- "I disabled the Privy server-side check to make tests pass" → reject. Auth bypass.
- "I committed the .env to make CI pass" → reject. Secret leak.
- "I claimed FHE in the README because the design doc said so" → reject. False claim.
- "I broke the Arbitrum adapter; it's deprecated anyway" → reject. CLAUDE.md rule: never break Phase 1.
- "I skipped tests because I was confident the change was small" → reject. Zero coverage starting point means every test is load-bearing.

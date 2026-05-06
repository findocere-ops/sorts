# SORTS — Privacy invariant review log

This file is the running ledger from the `privacy-grep` agent. It is
append-only — closed findings are kept with their resolution recorded.

Per the spec in `.claude/agents/privacy-grep.md`, every finding uses this
format:

```
### [SEVERITY] PG-XXX — invariant N — short title
**Date**: 2026-MM-DD
**Diff/file**: path:line or commit ref
**Invariant**: number from list above
**Pattern matched**: the actual grep hit
**Why this matters**: 1 sentence on what the invariant protects
**Suggested fix**: the minimal change that restores the invariant
**Status**: Open / Resolved / Accepted
```

Per-invariant clean entries use `PG-XXX clean: <description>`.
Whole-tree clean lines use `[YYYY-MM-DD] privacy-grep clean: ...`.

---

## Run — 2026-05-06 — HEAD `3d0e7ce`

[2026-05-06] privacy-grep clean: all 13 invariants intact at `3d0e7ce`
working-tree (branch `claude/mystifying-germain-0917cf`,
worktree `clever-bhaskara-541ed3` mirror).

### Per-invariant verdict

```
PG-001 clean: invariant 1 — no Vec<Pubkey>/Vec<Address>/Vec<[u8;32]> on Solana program
PG-002 clean: invariant 2 — Subscription account stores no plaintext level
PG-003 clean: invariant 3 — SolanaService.checkAccess ignores requiredTier
PG-004 clean: invariant 4 — getMembershipStatus returns tierLevel:null on Solana
PG-005 clean: invariant 5 — getAggregateStats has no array fields, no wallet-shape
PG-006 clean: invariant 6 — PrivyService.verifyBearerToken never logs the raw token
PG-007 clean: invariant 7 — sig-replay → 401
PG-008 clean: invariant 8 — preview-quota 3rd distinct community → 403
PG-009 clean: invariant 9 — non-member content GET filters preview_eligible
PG-010 clean: invariant 10 — Telegram /status reply has no "tier" / "level [123]" / "member count"
PG-011 clean: invariant 11 — IkaDWalletService double-gates real-funds path
PG-012 clean: invariant 12 — UmbraPrivacyService no seed/signature/ciphertext logging
PG-013 clean: invariant 13 — preview_quota and wallet_links never joined or co-spread
```

### Per-invariant evidence

All 13 grep checks ran against the working tree. Comments / docstrings /
underscore-prefixed parameters / `communityId` PDA / test fixtures
explicitly exempt — exemption rationale below in the "Ambiguity log".

| # | Check | Result |
|---|---|---|
| 1 | `rg 'Vec<\s*(Pubkey\|Address)\s*>' programs/sorts-community/` + `Vec<[u8;32]>` | zero matches |
| 2 | `rg '(level\|tier_level\|tier\|plan)\s*:\s*u8' programs/sorts-community/src/state.rs` | one doc-match at `state.rs:15` describing the `level: u8` ix arg, NOT a struct field. Subscription struct (`state.rs:42-50`) has only `tier_commitment: [u8;32]` + `salt_pubkey: Address`. |
| 3 | `rg 'requiredTier' backend/src/services/chain/SolanaService.ts` | three doc matches (lines 22, 24, 76 — all describing the privacy carve-out) + one `_requiredTier: 1 \| 2 \| 3` (line 81) where the underscore prefix is the TS convention for "intentionally unused parameter". No code path branches on the value. |
| 4 | `getMembershipStatus` body grep for `tierLevel:` | exactly one match at `SolanaService.ts:120`: `tierLevel: null`. No other return path on the Solana branch. |
| 5 | `analytics.ts` route + `analytics.ts` service return shape | zero array literals in any response. Service returns three plain `{ … }` objects (lines 68, 103, 137). The `communityId` PDA is documented exempt because Day-5 `analytics-no-leak.test.ts t3` strips it before the wallet-shape regex check. |
| 6 | `console.* / logger.* / JSON.stringify(*token*)` in `PrivyService.ts` | zero matches. The class never emits any log line; failure paths return null silently. |
| 7 | sig-replay status code at `sig-nonce.ts` | `res.status(401)` on `SQLITE_CONSTRAINT_PRIMARYKEY` (line 68). 400 is reserved for missing-nonce / missing-wallet (lines 49, 53) — semantic, not a regression. |
| 8 | preview-quota status code at `preview-quota.ts` middleware | `res.status(403).json({ error: 'preview_quota_exceeded', limit: 2 })` at lines 46-49. |
| 9 | non-member branch of `content.ts` GET | `if (post.preview_eligible) return unlockMetadata(post)` at line 116, else `lockPost(post)`. Active-member branch above releases the quota slot. The serializer at line 309 echoes `preview_eligible` so the frontend can label "Preview" tags — does not unlock bodies. |
| 10 | Telegram `/status` reply text | only doc matches at `status.ts:7-8` (the privacy-invariant comment itself, NOT a reply string). The two reply strings (`active (expires <date>)` and `expired Renew: <url>`) match neither the substring `tier` nor `level [123]` nor `member count`. |
| 11 | `signRealFundsPayload` body | `IkaDWalletService.ts:67-75` — first throws `real-funds method blocked` if `!this.realFunds`, then throws `real-funds path not implemented in pre-alpha build` even when the flag is set. Both gates present, in that order. |
| 12 | `UmbraPrivacyService.ts` log emissions + secret tokens | zero `console.*` / `logger.*` calls. Two doc matches at `:24` describing the no-touch policy ("It NEVER touches a user-supplied seed or ciphertext"). |
| 13 | cross-file JOIN / spread of `preview_quota` × `wallet_links` | zero matches across `backend/src/`. Convention enforced manually; PG-014 below tracks the gap (no automated test). |

### Test confirmation

```
pnpm --filter @sorts/backend run test
Test Suites: 12 passed, 12 total
Tests:       66 passed, 66 total
```

Privacy-related suites cover invariants 1–12 directly. Run repeated 3×
to confirm a flaky `analytics-no-leak.test.ts` failure on the previous
attempt was a transient RPC timeout against the test's `invalid.local`
RPC stub — see PG-015 below for tracking.

The Day-7-onwards encoding round-trip test
(`encoding-roundtrip.test.ts`) adds 10 more privacy-adjacent assertions
(no plaintext level on the decoded Subscription shape, level boundary
refusal, discriminator collision guard).

### Privacy-related test suite mapping (current)

- `solana-service.test.ts` — invariants 2, 3, 4
- `privacy-assertions.test.ts` — invariants 3, 5
- `analytics-no-leak.test.ts` — invariants 5, 10
- `umbra-no-seed-leak.test.ts` — invariants 11, 12
- `ika-no-real-funds.test.ts` — invariant 11
- `preview-quota.test.ts` — invariants 8, 9
- `sig-replay.test.ts` — invariant 7
- `privy-auth.test.ts` — invariant 6
- `encoding-roundtrip.test.ts` — invariants 1, 2 (byte-level), 11 (boundary)

Invariant 13 has no automated test (tracked as PG-014).

---

## Findings (cumulative — open + closed)

### [Low] PG-014 — invariant 13 — no automated test for `preview_quota × wallet_links` join
**Date**: 2026-05-06 (re-numbered from earlier PG-001 placeholder; same finding)
**Diff/file**: backend/src/api/routes/*.ts (no specific line — gap, not a regression)
**Invariant**: 13
**Pattern matched**: none — the convention is enforced manually
**Why this matters**: Invariant 13 currently relies on PR review to keep
`preview_quota` and `wallet_links` from being joined in any API
response. Every other invariant has at least one jest case backing it.
**Suggested fix**: Add a unit test that imports each route file and
asserts the file body does not contain both `preview_quota` and
`wallet_links` substrings (or a more refined AST-level check). Backend
test suite owns this — `__tests__/route-shape.test.ts`.
**Status**: Open

### [Info] PG-015 — analytics-no-leak.test.ts intermittent timeout
**Date**: 2026-05-06
**Diff/file**: backend/src/__tests__/analytics-no-leak.test.ts (case "community stats response shape has no array fields")
**Invariant**: adjacent (5)
**Pattern matched**: not a privacy regression — observed once during a
3-run baseline pass: `FAIL ... (10.288 s)` against the test's
`SolanaService({ rpcUrl: 'https://invalid.local' })` stub. Subsequent
3/3 runs all pass. Likely cause: jest tried to resolve DNS for
`invalid.local` instead of failing fast, exceeding the 10 s test
timeout.
**Why this matters**: Flake risk to the privacy-test suite during demo
recording or CI. The test is the t3 invariant-5 verifier — its
unreliability is informational, not a regression.
**Suggested fix**: Mock the `Connection` constructor to never attempt a
real fetch (current mocks are at `chain.getAggregateStats`, but the
`Connection` itself is constructed). Or set `testTimeout` higher just
for that file. Privacy-grep does not own implementation; flagged for
the test-engineer agent.
**Status**: Open

### [Closed] PG-001..PG-013 — superseded by per-invariant Clean entries above
The earlier baseline used a single PG-001 numbering. Re-numbered today
to align with the agent spec's "PG-XXX clean" per-invariant convention.
No findings were lost; PG-001 (Low — invariant 13) is now PG-014.

---

## Ambiguity log

Resolution stance for the privacy-grep run, captured here so future runs
behave the same way:

1. **Comments / docstrings are not findings.** The invariants protect
   executable code, reply text, and account layouts. A comment that
   *describes* a forbidden pattern (e.g., `// NEVER contains the
   substring "tier"` inside `status.ts`) is exempt.
2. **Underscore-prefixed parameters** (`_requiredTier`) are TypeScript's
   convention for "intentionally unused", which is what invariant 3
   requires. Not a finding.
3. **`communityId` in analytics responses** is a base58 PDA that
   matches the wallet-shape regex by construction. Day-5
   `analytics-no-leak.test.ts t3` strips it before the wallet-shape
   check; the same exemption applies to grep-based runs here.
4. **Test files exempt from invariant 6 / 12 logging checks** — test
   fixtures may use `console.log` to capture output for assertions. The
   grep targets service files (`backend/src/services/`), not
   `backend/src/__tests__/*.test.ts`.

---

## Summary — 2026-05-06

- **Total invariants checked:** 13
- **Findings breakdown:**
  - Critical: 0
  - High: 0
  - Medium: 0
  - Low: 1 (PG-014 — gap in test coverage for invariant 13)
  - Info: 1 (PG-015 — flake on analytics-no-leak.test.ts)
- **Files with issues:** none with regressions; PG-014 tracks a coverage
  gap, PG-015 tracks a test flake.
- **Recommended next action:**
  1. Land PG-014 fix as `__tests__/route-shape.test.ts` after Colosseum
     submission (Low priority; doesn't block demo).
  2. Land PG-015 fix in a follow-up that mocks `Connection` at the
     module level rather than only the chain methods. Run the analytics
     suite under `--detectOpenHandles` to confirm no socket leak.
  3. Re-run privacy-grep on every PR per the agent spec — workflow
     `.github/workflows/encoding-sync.yml` already scopes to layout
     changes; the privacy-grep agent itself runs on every diff that
     touches `programs/`, `backend/src/api/`, `backend/src/services/`,
     `frontend/src/`, or `bot/`.

---

## Run — 2026-05-06 (v2) — Tier 1.2 mitigation: subscriber pseudonymization

Counter-thesis Tier 1.2 (raised in pre-implementation review): the v1
on-chain Subscription account stored `subscriber: Address` plaintext at
byte offset 33. An enumerator running
`getProgramAccounts(filter=memcmp(disc=3))` would receive every
subscriber's wallet across every community in a single RPC call — that
is, a public member graph in everything but name. The v1 PDA seed change
alone (proposed first) would have hidden the *derivation path* but left
the account body field untouched, so the leak would have remained.

This run records the full v2 fix: account-body pseudonymization plus
nonce-bound PDA seed.

### New invariant 14 — subscriber pubkey is never stored on-chain

```
PG-016 clean: invariant 14 — Subscription account stores no plaintext subscriber pubkey
```

**Threat closed.** `getProgramAccounts(programId, filter=memcmp(disc=3))`
now returns Subscription accounts whose byte 33–65 holds a 32-byte
`subscriber_commitment`, not a wallet pubkey. Without the corresponding
nonce — held only by the subscriber, derivable only by re-signing the
canonical message `"SORTS-NONCE-V1:" || community_pubkey` with the
subscriber's wallet — an enumerator cannot map any commitment to a
wallet address.

### Construction

- **Commitment.** `subscriber_commitment = derive("SORTS_SUB_V1" ||
  subscriber_pubkey || nonce)` where `derive` is the program-id-bound
  PDA derivation (matches `Address::derive_address` in
  [logic.rs:51-66](programs/sorts-community/src/logic.rs:51)).
- **Nonce.** `nonce = sha256(wallet.signMessage("SORTS-NONCE-V1:" ||
  community_pubkey))`. ed25519 signatures are deterministic per RFC
  8032, so the same wallet over the same canonical message reproduces
  the same nonce on every visit — no backend table, no localStorage.
- **PDA seed.** `[b"subscription", community: Address,
  subscriber_commitment: Address]`. The 32-byte commitment is
  exposed to the Quasar `#[seeds]` macro as an `Address`-shaped seed
  (deviation #3, alongside the existing two — see
  [state.rs](programs/sorts-community/src/state.rs)).
- **On-chain ownership check.** Both `subscribe` and
  `renew_subscription` accept `commitment: Address` and
  `nonce: [u8;32]` as ix args, then verify
  `subscriber_commitment(self.subscriber.address(), &nonce, &crate::ID)
  == commitment`. A third party who learns a public commitment cannot
  squat on it without owning the wallet that produced the nonce.
- **Backend.** `SolanaService` now exposes
  `checkAccessByCommitment(community, commitmentBytes)` and
  `getMembershipStatusByCommitment(...)`. The legacy wallet-based
  methods (`checkAccess`, `getMembershipStatus`) throw with a redirect
  message — backend cannot enumerate by wallet, by design.

### Devnet migration

**Option A wipe.** Program redeployed at the original program id
`AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV` (upgrade tx
`2nLtw6N5TjHrVGymvxLki6TLTwQ4rcBun2BRXcypX62gH6e271nau4vkj3Q14SCRDMa2rNqdVRWW7Z8KVjYh1xbz`,
2026-05-06). Pre-existing v1 Subscription accounts at the old PDA
seeds are not deserializable under v2 layout — anyone who tested the
v1 build before redeploy must re-subscribe. Acceptable cost: pre-alpha
label already site-wide, no real funds, no production users.

The orphan side-deploy created during keypair-recovery
(`EmYjPFpKBb4kjpAFPKKpxnXzE1Kzd7VB7Jy2BzYPqYFZ`) was closed via
`solana program close`, reclaiming 0.19 SOL.

### Per-invariant evidence (additions)

| # | Check | Result |
|---|---|---|
| 14 | `rg 'pub subscriber\s*:\s*Address' programs/sorts-community/src/state.rs` | zero matches. The Subscription struct's first field after `community: Address` is `pub subscriber_commitment: [u8; 32]`. Test `t7_enumeration_returns_commitments_not_pubkeys` enforces this byte ordering by reading state.rs source verbatim. |
| 14 | `rg 'subscriber:.*PublicKey' backend/src/services/chain/idl/types.ts` | zero matches in the `SubscriptionAccount` interface. The TypeScript type carries `subscriberCommitment: Uint8Array` only. |
| 14 | `rg 'fetchSubscription[^B]' backend/src/services/chain/SolanaService.ts` | zero matches outside doc comments. The legacy wallet-based fetch is gone; only `fetchSubscriptionByCommitment(community, commitmentBytes)` exists. |
| 14 | `IPrivacyComputeService` accepts `SubscriberRef` discriminated union; wallet branch is rejected on the Solana implementation | enforced by `umbra-no-seed-leak.test.ts` "rejects wallet-based evaluateEntitlement on Solana with a clear redirect" + privacy router 400-class error mapping in [privacy.ts:78](backend/src/api/routes/privacy.ts:78). |

### Test coverage (additions)

- `programs/sorts-community/src/logic.rs` — unit test
  `subscriber_commitment_is_deterministic_and_separates_inputs`
  confirms (a) reproducibility for the same `(subscriber, nonce)` pair
  and (b) distinctness across both subscribers and nonces.
- `programs/sorts-community/tests/sorts_community.rs` — t6 strengthened
  to fail if a `pub subscriber: Address` field reappears on the
  Subscription struct; t7 added asserting the byte-33 slot is the
  commitment; t8 added re-asserting helper determinism at integration
  scope.
- `backend/src/__tests__/solana-service.test.ts` — `subscriptionPda`
  now takes a 32-byte commitment (with a length-rejection test);
  `decodeSubscription` asserts no `subscriber` key on the decoded
  shape, only `subscriberCommitment`; `checkAccess` legacy-wallet path
  asserted to throw with a redirect message.
- `backend/src/__tests__/privacy-assertions.test.ts` — t1 rewritten
  against `checkAccessByCommitment` /
  `getMembershipStatusByCommitment`; new test confirms wallet-based
  `checkAccess` throws on Solana.
- `backend/src/__tests__/umbra-no-seed-leak.test.ts` — every
  `evaluateEntitlement` / `getRegistrationStatus` call now passes a
  `SubscriberRef` with `kind: 'commitment'`. Three new tests:
  wallet-based rejection, malformed-base64 rejection, wrong-length
  rejection.
- `backend/src/__tests__/encoding-roundtrip.test.ts` — Subscription
  golden buffer rebuilt with `subscriber_commitment` at byte 33; v2
  subscribe ix asserts 98-byte data layout (`disc + level + commitment
  + nonce + salt`); v2 renew ix asserts 66-byte layout (`disc + level
  + commitment + nonce`); two new "wrong-length commitment / nonce"
  rejection tests.

### Trade-off accepted

Per the pre-implementation analysis, the proposed fix had two viable
shapes for nonce custody:

1. Backend table (`subscription_nonces`) keyed by `(community,
   subscriber)` — recreates a backend-side member graph. **Rejected.**
2. Deterministic nonce derived from a wallet signature. Backend stores
   nothing. **Adopted.**

Trade-off: every chain action (subscribe, renew, gated-content
read-through) requires a `signMessage` prompt before the actual
transaction signature, plus a second prompt for the tx itself. Two
prompts, both no-op-fast on Phantom/Solflare/Privy embedded wallets.
Worth it: backend has no member-graph index to leak under breach.

Out of scope for this fix (deferred to v2 of the privacy stack):

- Backend-gated content access still uses
  `checkAccessByCommitment(community, commitmentBytes)` where the
  frontend supplies the commitment over TLS. A network observer with
  TLS-stripping capability could correlate (commitment, IP). For
  hackathon devnet this is acceptable; production needs viewing keys
  or per-request blinding.
- Compromise of a subscriber's wallet still reveals all their
  commitments via re-signing — there is no perfect-forward-secrecy in
  this scheme. Production needs a key-rotation construction.

### Updated summary

- **Total invariants checked:** 14 (was 13).
- **Findings breakdown after Tier 1.2 mitigation:**
  - Critical: 0
  - High: 0 (Tier 1.2 closed; was the only High at intake of this run)
  - Medium: 0
  - Low: 1 (PG-014 — unchanged; preview_quota × wallet_links join
    coverage gap)
  - Info: 1 (PG-015 — unchanged; analytics-no-leak.test.ts flake)
- **Build/test confirmation:**
  - `cargo test` (program): 6 unit + 8 integration = 14/14 passing.
  - `pnpm --filter @sorts/backend test`: 12 suites, 73 tests passing
    (was 66 — net +7 from this run's additions).
  - `pnpm --filter @sorts/frontend build`: green.
  - Devnet upgrade tx: `2nLtw6N5TjHrVGymvxLki6TLTwQ4rcBun2BRXcypX62gH6e271nau4vkj3Q14SCRDMa2rNqdVRWW7Z8KVjYh1xbz`.

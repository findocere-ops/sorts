# SORTS — Privacy invariant review log

This file is the running ledger from the `privacy-grep` agent. It is
append-only — closed findings are kept with their resolution recorded.

Per the spec in `.claude/agents/privacy-grep.md`, every entry uses the
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

Clean baseline lines use the abbreviated format:
```
[YYYY-MM-DD] privacy-grep clean: all 13 invariants intact at <commit>
```

---

## Baseline — Day 8 / Day 9 boundary

[2026-05-06] privacy-grep clean: all 13 invariants intact at `0e1198a`
working-tree (HEAD on `claude/mystifying-germain-0917cf` is `a332f8f`,
clever-bhaskara-541ed3 working tree mirrors it for the audit run).

### Per-invariant evidence (baseline run)

All 13 grep checks ran against the working tree. Comments and
docstrings in the matching files are intentionally excluded from the
"finding" definition — the invariants apply to executable code, reply
text, and account fields, not to documentation. Where a comment matched
the grep, it is annotated below as "doc match (no finding)".

| # | Invariant | Result |
|---|---|---|
| 1 | No `Vec<Pubkey>` / `Vec<Address>` / `Vec<[u8;32]>` on programs/ | **clean** — zero matches across `programs/sorts-community/src/` |
| 2 | `Subscription` no plaintext `level` | **clean** — single doc-match in `state.rs:15` describing the `level: u8` ix arg, not a struct field |
| 3 | `SolanaService.checkAccess` ignores `requiredTier` | **clean** — three doc matches + one `_requiredTier` (underscore-prefixed = unused parameter, the privacy carve-out) |
| 4 | `getMembershipStatus` returns `tierLevel: null` on Solana | **clean** — `SolanaService.ts:120` returns `tierLevel: null` |
| 5 | `getAggregateStats` no array fields, no wallet-shape | **clean** — `analytics.ts` has no array literals in response shape; wallet-shape exemption for `communityId` documented in `analytics-no-leak.test.ts t3` |
| 6 | `PrivyService.verifyBearerToken` no raw-token logging | **clean** — zero `console.*` / `logger.*` / `JSON.stringify(*token*)` in `PrivyService.ts` |
| 7 | sig-replay → 401 | **clean** — `sig-nonce.ts:68` returns 401 on `SQLITE_CONSTRAINT_PRIMARYKEY` (replay) |
| 8 | preview-quota → 403 | **clean** — `preview-quota.ts:46` returns 403 with `error: 'preview_quota_exceeded'` |
| 9 | Non-member content GET filters `preview_eligible` | **clean** — `content.ts:116` filters `if (post.preview_eligible) return unlockMetadata(post)` else `lockPost(post)` |
| 10 | Telegram /status reply text | **clean** — only doc matches at `status.ts:7-8` (the privacy invariant comment itself); no reply string contains `tier` / `level [123]` / `member count` |
| 11 | IKA real-funds gate | **clean** — `IkaDWalletService.ts:67-75` enforces both gates (env flag throw + "not implemented" throw with flag) |
| 12 | UmbraPrivacyService no logging | **clean** — single doc match at `UmbraPrivacyService.ts:24` mentioning the policy; zero `console.*` / `logger.*` calls |
| 13 | `preview_quota JOIN wallet_links` | **clean** — zero JOIN occurrences across `backend/src/` |

### Test confirmation

```
pnpm --filter @sorts/backend run test
Test Suites: 11 passed, 11 total
Tests:       56 passed, 56 total
```

Privacy-related suites cover invariants 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
11, 12 directly:

- `solana-service.test.ts` (10 cases) — invariants 2, 3, 4
- `privacy-assertions.test.ts` (5 cases) — invariants 3, 5
- `analytics-no-leak.test.ts` (2 cases) — invariants 5, 10
- `umbra-no-seed-leak.test.ts` (5 cases) — invariants 11, 12
- `ika-no-real-funds.test.ts` (3 cases) — invariant 11
- `preview-quota.test.ts` (8 cases) — invariants 8, 9
- `sig-replay.test.ts` (8 cases) — invariant 7
- `privy-auth.test.ts` (8 cases) — invariant 6
- `rate-limit.test.ts` (2 cases) — adjacent (60 req/min/IP)
- `chain-factory.test.ts` (2 cases) — adjacent (chain dispatch)
- `env-startup.test.ts` (3 cases) — adjacent (config refinement)

Invariant 13 has no dedicated test — it is enforced as a route-layer
convention. Spot-grep confirms compliance. Suggest adding a unit test
that asserts `analytics.ts` and `content.ts` route handlers do not
import the `preview_quota` and `wallet_links` tables in the same query
file. Tracking as PG-001 (low priority, no current regression).

---

## Findings

### [Low] PG-001 — invariant 13 — no automated test for `preview_quota × wallet_links` join
**Date**: 2026-05-06
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

---

## Ambiguity log

Resolution stance for the privacy-grep run, captured here so future runs
behave the same way:

1. **Comments / docstrings are not findings.** The invariants protect
   executable code, reply text, and account layouts. A comment that
   *describes* a forbidden pattern (e.g., "NEVER contains the substring
   `tier`" inside `status.ts`) is exempt.
2. **Underscore-prefixed parameters** (`_requiredTier`) are TypeScript's
   convention for "unused-by-design", which is exactly what invariant 3
   requires. Not a finding.
3. **`communityId` in analytics responses** is a base58 PDA that
   matches the wallet-shape regex by construction. Day-5
   `analytics-no-leak.test.ts t3` strips it before the wallet-shape
   check; the same exemption applies to grep-based runs here.
4. **Test files exempt from #6 / #12** — test fixtures may use
   `console.log` to capture output for assertions. The grep targets
   service files, not `__tests__/*.test.ts`.

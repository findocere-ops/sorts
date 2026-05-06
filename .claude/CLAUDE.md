# SORTS — Project Context for Claude Code

## What this is

SORTS is **private subscription rails for paid communities on Solana**.
We are at **Day 8 of 14**. Colosseum submission target: **May 12, 2026**.

The product is mostly built. Your job is to **harden, finish, and protect**
what's there — not to redesign it.

## Read first (always)

Before doing anything that touches code:

1. `docs/SORTS_TECH_OVERVIEW_FOR_AGENTS.md` — the canonical state of the
   codebase. Section 4 (Solana program), section 7 (privacy invariants),
   section 15 (hard rules) are load-bearing.
2. `docs/COLOSSEUM_WINNER_SPEC.md` — the demo target. If a change moves
   the demo away from this, stop.
3. `.claude/AGENT_GUARDRAILS.md` — what you must never touch.

## Stack (current state, not aspirational)

- Solana program: **Quasar** (no_std, single-byte discriminators), built
  via `cargo build-sbf` (not `quasar build` — CLI broken on pinned rev)
- Program ID (devnet): `AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV`
- Backend: Express + grammy (Telegram) + better-sqlite3 / pg
- Frontend: Next.js 14 App Router + Privy (email + EVM) +
  `@solana/wallet-adapter-react` (Solana)
- Shared: `packages/shared` with `IChainService`, `IPrivacyComputeService`,
  `IMultichainControlService`
- Legacy: Solidity contracts on Arbitrum Sepolia. **DO NOT BREAK** — they
  are part of the chain-aware demo.

## The 8 hard rules (from tech overview §15 — non-negotiable)

1. **Devnet only.** No mainnet code path.
2. **Aggregate-only creator analytics.** No member list, no tier
   distribution, no time-series of joiners-by-wallet.
3. **No tier in any read path on Solana.** `checkAccess` returns boolean
   only; `getMembershipStatus` returns `tierLevel: null`; the on-chain
   `Subscription` account stores only `tier_commitment + salt_pubkey`.
4. **No real funds without `ENABLE_IKA_REAL_FUNDS=true`.** Even with the
   flag, the pre-alpha build still throws "not implemented".
5. **No env values in commits, screenshots, PR descriptions.**
6. **Privacy compute service never logs seed / signature / ciphertext.**
7. **Sig-replay → 401, preview quota → 403, rate limit → 429.** These
   are part of the public API; clients consume them.
8. **`preview_quota` and `wallet_links` are never joined in any API
   response.**

## The 13 privacy invariants (from tech overview §7)

Each is enforced in code AND tested. **A change that regresses any of
these is a Critical finding regardless of how clean the diff looks.**

1. No `Vec<Pubkey>` / `Vec<Address>` field anywhere on the Solana program
2. Subscription account never stores plaintext `level` (only commitment+salt)
3. `SolanaService.checkAccess` ignores `requiredTier` (privacy carve-out)
4. `getMembershipStatus` returns `tierLevel: null` on Solana
5. `getAggregateStats` response has no array fields, no wallet-shaped strings
6. `PrivyService.verifyBearerToken` never serializes the raw token
7. Signature replay → 401
8. 3rd distinct community preview from same wallet → 403
9. Non-member content GET returns only `preview_eligible` posts
10. Telegram /status reply has no "tier", "level [123]", or "member count"
11. `IkaDWalletService` real-funds path blocked
12. `UmbraPrivacyService` no seed/signature/ciphertext leak in logs
13. `preview_quota` and `wallet_links` never joined in any API response

## Cut-lines (intentional fallbacks — do not "fix")

These are not bugs; they are documented decisions. Don't try to undo them.

| Cut-line | Why | When to revisit |
|---|---|---|
| `cargo build-sbf` instead of `quasar build` | Quasar CLI broken on pinned rev | Newer Quasar release |
| `UmbraPrivacyService` returns `on-chain-commitment-fallback` | Umbra not on devnet | When Umbra ships devnet programs |
| `IkaDWalletService` static `pre-alpha` | IKA pre-alpha unstable | When IKA stabilises |
| `@solana/wallet-adapter-react` instead of Privy Solana | Privy 1.99 has no compatible Solana connector | When Privy publishes 1.x Solana |
| Single Community per creator | Quasar `#[seeds]` rejects `[u8;32]` typed args | Quasar adds typed-seed support |

## Test surface (must stay green)

- `cargo test -p sorts-community` — 5 unit + 6 integration (t1..t6)
- `pnpm --filter @sorts/backend run test` — 56 tests across 11 suites
- `pnpm --filter @sorts/frontend build` — typecheck + Next build
- `pnpm --filter contracts test` — 28 Hardhat tests (legacy Arbitrum)

**A red test is the source of truth. Never modify a test to make it pass —
fix the code, or escalate.**

## Forbidden operations (without explicit user approval per occurrence)

- Changing the deployed program ID
- Touching the upgrade authority keypair or `programs/sorts-community/keys/`
- Modifying privacy invariants in §7
- Adding member-list-shaped endpoints
- Adding `tier_level` to any Solana read path
- Removing the IKA real-funds gate
- Committing `.env*` files (only `.env.example` allowed)
- Modifying test files to make failing tests pass
- Changing the chain abstraction in ways that break the legacy Arbitrum flow
- Mainnet deployments of any kind

## Workflow expectations

- **Small, reviewable diffs.** A "comprehensive refactor" PR from an
  agent is a red flag. Prefer 5 focused commits to 1 sweeping one.
- **Every PR has tests.** New behaviour → new test. Bug fix → regression
  test. No exceptions.
- **Read before writing.** Existing patterns are the spec; match them.
- **Stop and ask** when the spec is ambiguous, when a privacy invariant
  is in question, when a cut-line decision is being revisited, or when
  the change touches more than one of: program / backend / frontend /
  contracts / docs in the same diff.

## Useful commands (verified working — see tech overview §13)

```bash
pnpm install
pnpm dev                                 # turbo: frontend + backend
pnpm --filter @sorts/backend run test
pnpm --filter @sorts/backend run typecheck
pnpm --filter @sorts/frontend build
cd programs/sorts-community && cargo test
cd programs/sorts-community && cargo build-sbf
```

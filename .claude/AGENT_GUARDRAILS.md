# SORTS Agent Guardrails

This file is read by every agent before doing work. It exists because
SORTS has a working app, a deployed program, and a 7-day deadline. The
biggest risk is not a bad new feature — it's an agent confidently
"improving" something that took 8 days to get right.

## Pre-flight check (every agent runs this mentally before any tool call)

Before any `Write` or `Edit` operation, the agent must answer:

1. **Have I read the file I'm about to modify, in full?** Patching what
   you haven't read is the fastest way to break invariants.
2. **Have I read the relevant section of the tech overview?** Solana
   work → §4. Backend → §5. Frontend → §6. Privacy → §7. Tests → §8.
3. **Does this change touch a file in the forbidden list below?** If
   yes, STOP and ask the user.
4. **Will any test in the existing 56-test backend suite, the cargo
   integration tests, or the contracts suite go red?** If you don't
   know, run them BEFORE the change to establish baseline, then again
   after. Never assume.
5. **Could this change regress any of the 13 privacy invariants in
   CLAUDE.md?** If "I don't think so" is your answer, you have not
   checked. Run `privacy-grep` agent on the diff.

## Forbidden file patterns

Never modify these without explicit per-occurrence user approval:

```
programs/sorts-community/keys/**           # keypair material
programs/sorts-community/deployments/**    # canonical program-id record
**/.env                                    # only .env.example is allowed
**/.env.local
**/.env.production
**/protocol-treasury.json
**/upgrade-authority*.json
contracts/contracts/**.sol                 # legacy Arbitrum, must not break
```

For these, ask explicitly: change with care:

```
programs/sorts-community/src/state.rs      # account layouts; sync with backend decoder + frontend ix builder
programs/sorts-community/src/instructions/**
backend/src/services/chain/SolanaService.ts # decoder must match state.rs
frontend/src/lib/solana/instructions.ts    # ix builder must match state.rs
backend/src/services/wallet/IkaDWalletService.ts # real-funds gate
backend/src/api/middleware/sig-nonce.ts    # 401 status is part of public API
backend/src/api/middleware/preview-quota.ts # 403 status is part of public API
```

## The "three-file synchronization" rule

When the Solana account layout or instruction discriminator changes, THREE
files must update together in the SAME commit:

1. `programs/sorts-community/src/state.rs` (or `instructions/*.rs`)
2. `backend/src/services/chain/SolanaService.ts` (decoder)
3. `frontend/src/lib/solana/instructions.ts` (ix builder)

A diff that touches one of these without the other two is a Critical
finding. Hand-built ix data is a known cut-line — both implementations
have to stay in lockstep.

## Forbidden operations (no exceptions, even with user approval, until
post-Colosseum)

- Mainnet deployments
- Changes that move the Solana program ID
- Changes that remove the IKA real-funds env-flag gate
- Changes that add a member-list-shaped endpoint
- Changes that add a `tier_level` field to any Solana-side read path
- Changes that remove or weaken the 13 privacy invariants

## Required operations

Before considering any task "done":

- [ ] All previously-passing tests still pass
- [ ] New behaviour has new test
- [ ] No `.env`, `.json` keypair, or `.local` file appears in `git status`
- [ ] If diff touches §7 privacy invariants: `privacy-grep` agent run, no
      Critical findings
- [ ] If diff touches Solana program: `cargo build-sbf` succeeds
- [ ] If diff touches account layout: all three sync points updated
- [ ] No `console.log`, `console.error`, or `console.debug` of: wallet
      addresses, raw bearer tokens, raw seeds, raw ciphertext, raw
      tier values

## Checkpoint pattern (for any task expected to take >30 min agent time)

Long autonomous runs are where agents drift. Force checkpoints:

1. Agent does first ~30% of work → STOPS → reports what changed → user
   approves continuing
2. Agent does next ~30% → STOPS → reports → approve
3. Agent finishes → reports for final review

Don't let an agent run for an hour and come back with 40 file changes.
That's not productivity, it's a merge-conflict in the making.

## Emergency rollback

If an agent has broken something and you're not sure what:

```bash
# See what the agent changed
git status
git diff

# Reset everything uncommitted
git checkout -- .
git clean -fd

# If the agent committed
git log --oneline -10
git reset --hard <last-good-commit>

# Sanity check
pnpm --filter @sorts/backend run test
cd programs/sorts-community && cargo test
pnpm --filter @sorts/frontend build
```

If the deployed devnet program is intact (`solana program show
AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV --url devnet` returns
the expected authority), nothing is permanently lost.

## What an agent must never claim

- "I improved the privacy model" — no agent improves a deployed privacy
  model in a single PR. That's a multi-week design + audit cycle.
- "I removed unused code" without a per-file justification — "unused"
  things often have a reason (cut-line scaffolding, future-swap symbols).
- "I made tests faster by removing some" — never. Slow tests are the
  user's problem to solve; agents don't get to delete coverage.
- "I auto-formatted everything" without a separate format-only commit —
  formatting noise hides real changes.

## What an agent should always do when uncertain

Stop. Ask. The user is faster at clarifying than they are at debugging
a mistake.

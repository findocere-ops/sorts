# SORTS Agent Risk Management

This is the explicit answer to: **"how could an agent accidentally destroy
something, and how do we prevent it?"** The framework is: identify the
high-impact failure modes, build mechanical guards against the predictable
ones, and add human checkpoints for the rest.

## Failure mode inventory

For each, severity is judged by **how much work it takes to recover**.

### S1 — Pitch-killing privacy regression (Catastrophic)

**What:** An agent adds `tier_level` to a response, joins
`preview_quota` with `wallet_links`, or changes `Subscription` to store
plaintext `level`. The 56 tests still pass because they didn't anticipate
this specific regression.

**Recovery cost:** Re-build trust with judges, re-record demo, possibly
miss deadline.

**Prevention:**
- `privacy-grep` agent runs on every diff (mechanical)
- `security-auditor` on every PR (semantic)
- The 13 invariants in CLAUDE.md and AGENT_GUARDRAILS.md (preventive)
- Pre-commit hook: `pnpm --filter @sorts/backend run test -- privacy`
  (mechanical)

### S2 — Three-file sync break (High)

**What:** Agent updates `state.rs` to add a field, but doesn't update
`SolanaService.ts` decoder or `frontend/src/lib/solana/instructions.ts`
ix builder. Backend tests pass against the old layout; deployed program
runs new layout; frontend signs old encoding. Devnet stops working.

**Recovery cost:** 2-4 hours to find the desync, plus a re-deploy.

**Prevention:**
- `onchain-implementer` agent's hard rule about three sync points
- A simple test you can add: the backend decoder builds an instance,
  the frontend's ix builder builds the same instance, hash them, assert
  equal. Single test catches this whole class.
- Code review checklist: any diff touching `state.rs` or
  `instructions/*.rs` requires reviewer to confirm the other two paths
  updated.

### S3 — Deployed program ID change (High)

**What:** Agent regenerates `target/deploy/sorts_community-keypair.json`,
or modifies `deployments/devnet.json`, or commits to a fresh deploy.
Frontend and backend point at the old program; the new one has no state.
Demo dies.

**Recovery cost:** Either redeploy original program (if you still have
the keypair) or update every reference to the new ID. ~1 day.

**Prevention:**
- `programs/sorts-community/keys/` and `deployments/devnet.json` in
  AGENT_GUARDRAILS.md forbidden list
- Devops-deployer is the only agent allowed to deploy, and it requires
  explicit per-occurrence user approval
- The keypair file is `.gitignored` and lives only on your machine —
  even an agent committing fresh code won't move it

### S4 — Test deletion or test-to-pass modification (High)

**What:** Agent finds a failing test, sees that it's blocking work,
"fixes" it by changing the assertion. The 56-test guard becomes
55-test-plus-a-broken-one.

**Recovery cost:** Hard to detect after the fact. Could persist for
weeks until the bug it was guarding against shows up in production.

**Prevention:**
- AGENT_GUARDRAILS.md: "Never modify a test to make it pass"
- Pre-merge: `git diff <base> -- '*.test.ts' '*.spec.ts' | wc -l` — if
  test files changed, manually diff each one and ask "did this assertion
  weaken?"
- Stronger: require any test-touching commit to be a separate, isolated
  commit so you can review just the test changes

### S5 — Real-funds gate removal (Catastrophic if mainnet ever happens)

**What:** Agent "cleans up dead code" by removing the
`signRealFundsPayload` env-flag check in `IkaDWalletService`, or
removes the "not implemented in pre-alpha" throw. Now if anyone ever
sets the env flag, the function actually runs.

**Recovery cost:** Currently low (no real funds path). Catastrophic
the day someone tries to enable it.

**Prevention:**
- Both gates explicitly required by AGENT_GUARDRAILS.md
- `ika-no-real-funds.test.ts` (3 cases) covers this — must stay green
- security-auditor's checklist item #29

### S6 — Env / secret commit (High)

**What:** Agent runs `git add .` while iterating, accidentally commits
a `.env.local` containing the Privy app secret, RPC URL with API key,
or Telegram bot token.

**Recovery cost:** Rotate every committed secret + rewrite git history.
~2 hours, very annoying.

**Prevention:**
- `.gitignore` covers `.env*` (verify with `git check-ignore .env`)
- Pre-commit hook: `git diff --cached | grep -E '(SECRET|TOKEN|KEY|PASSWORD).*=.+'`
  — block if matches
- Use `git secrets` or `gitleaks` in CI
- Never let an agent run `git add .` blanket — always specify paths

### S7 — Legacy Arbitrum break (Medium-High)

**What:** Agent refactors the chain abstraction, breaks
`useLegacyArbitrumChain` or the Solidity contracts. The 28 Hardhat
tests go red. Demo's chain-aware story is broken.

**Recovery cost:** ~2-4 hours depending on scope.

**Prevention:**
- Run `pnpm --filter contracts test` as part of CI (green required)
- AGENT_GUARDRAILS.md flags `contracts/contracts/**.sol` as forbidden
  without explicit approval
- Chain abstraction changes require both Solana and Arbitrum adapter
  to remain working

### S8 — Demo flow regression that tests miss (Medium)

**What:** Agent refactors a UI component used in the demo; unit tests
pass; the actual demo click-path breaks. Discovered when you try to
record the video.

**Recovery cost:** ~1-3 hours, plus you've lost recording time.

**Prevention:**
- Demo-lock agent owns the Playwright e2e spec
- Manual run of the 14-step demo before any commit that touches
  `frontend/src/components/` or `frontend/src/app/`
- CI runs the e2e on every PR

### S9 — Doc drift (Low-Medium)

**What:** Tech overview, demo script, or COLOSSEUM_WINNER_SPEC.md no
longer matches the code. Submitting a misleading description to judges.

**Recovery cost:** Embarrassment + correction.

**Prevention:**
- Any agent that changes behaviour described in a doc updates the doc
  in the same commit
- Final-week pass by demo-lock agent to reconcile docs with code

### S10 — Compute budget / RPC quota explosion (Low)

**What:** Agent adds a polling loop in the frontend or a verbose log
in the backend. RPC quota burns. Render hits CPU/memory limit. Devnet
demo flakes.

**Recovery cost:** ~1 hour to find and remove. Annoying during a live
demo.

**Prevention:**
- Code review for new `setInterval`, `setTimeout`, `while(true)`
- Review for new `console.log` at info level in any service that runs
  per-request

## Defense layers

The model is **layered defense — each layer is permitted to fail because
the next layer catches it**:

1. **Agent prompts** (AGENT_GUARDRAILS.md, per-agent rules) — prevent
   most regressions by instruction
2. **Mechanical checks** (privacy-grep, pre-commit hooks, lint, tests)
   — catch the regressions agent prompts miss
3. **Semantic checks** (security-auditor, crypto-reviewer) — catch what
   mechanical checks miss
4. **Human checkpoints** (you, every ~30 min of agent work) — catch
   what semantic checks miss
5. **Rollback** (git, devnet program preservation) — catch what humans
   miss

Don't rely on layer 1 alone. Don't skip layer 4 because layers 1-3 are
working.

## Concrete pre-commit hook

Create `.husky/pre-commit` (or `.git/hooks/pre-commit`):

```bash
#!/bin/sh
set -e

# 1. Block secrets
if git diff --cached --name-only | xargs grep -lE \
   '(PRIVY_APP_SECRET|TELEGRAM_BOT_TOKEN|HELIUS_API_KEY|.*PRIVATE_KEY)' \
   2>/dev/null; then
  echo "ERROR: possible secret in staged files"
  exit 1
fi

# 2. Block .env (only .env.example allowed)
if git diff --cached --name-only | grep -E '^\.env(\..*)?$' | \
   grep -v '^\.env\.example$'; then
  echo "ERROR: only .env.example may be committed"
  exit 1
fi

# 3. Block keypair files
if git diff --cached --name-only | grep -E \
   '(programs/sorts-community/keys/|protocol-treasury\.json|.*-keypair\.json)'; then
  echo "ERROR: keypair files must never be committed"
  exit 1
fi

# 4. Privacy invariant grep on staged changes
if git diff --cached programs/sorts-community/src/state.rs | grep -E \
   '^\+.*(level|tier_level)\s*:\s*u8'; then
  echo "ERROR: plaintext level field on Subscription is forbidden"
  exit 1
fi

# 5. Run the privacy test suite
pnpm --filter @sorts/backend run test -- \
  privacy-assertions analytics-no-leak umbra-no-seed-leak \
  ika-no-real-funds || exit 1
```

Run `chmod +x .husky/pre-commit`.

## Per-agent-run safety routine

For any non-trivial agent task:

```
1. git status --short                     (snapshot before)
2. <agent runs>
3. git status --short                     (see what changed)
4. git diff                               (read every line)
5. pnpm --filter @sorts/backend run test  (sanity)
6. cargo test -p sorts-community          (if program touched)
7. pnpm --filter @sorts/frontend build    (if frontend touched)
8. Run privacy-grep agent                 (semantic)
9. Decide: commit, refine, or revert
```

## When in doubt, revert

You have git. You have a deployed program. You have 56 tests. The
worst-case scenario for reverting an agent's work is losing ~30 minutes
of wall-clock time. The worst-case scenario for not reverting a bad
agent change is losing the demo.

When something feels wrong, revert. Re-explain the task with sharper
constraints. Try again.

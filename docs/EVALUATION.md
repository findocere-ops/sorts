# SORTS Agent Performance Evaluation

How to know whether an agent is helping or hurting. This is the framework
you use after every agent session to decide whether to keep that
agent's work, revise the agent's prompt, or roll back.

## The four signals

For any agent task, four signals matter:

### 1. Test delta

Before and after running the agent:

```bash
# baseline
pnpm --filter @sorts/backend run test 2>&1 | grep -E '^Tests:'
cargo test -p sorts-community 2>&1 | grep -E 'test result'
pnpm --filter contracts test 2>&1 | grep -E 'passing|failing'

# (agent runs)

# after — compare numbers
```

| Outcome | Interpretation |
|---|---|
| Same passing count, no new tests | Agent did refactor without coverage — neutral, slightly negative |
| Same passing count, +N new tests | Agent added coverage — positive |
| Fewer passing tests | Agent broke something — investigate, likely revert |
| More passing tests after a fix | Agent fixed a real bug — positive |
| New failing tests | Agent added a test it can't make pass — investigate |
| Tests now run slower by >2x | Possible test bloat or async issue — investigate |

### 2. Privacy invariant delta

Run privacy-grep before and after. Any new finding = the agent regressed
something. This is the highest-priority signal — it overrides
test deltas.

```bash
# Before agent run
"Use privacy-grep on the current working tree."
# Note the result.

# (agent runs)

# After
"Use privacy-grep on the current working tree."
# Compare.
```

A clean → clean transition is the only acceptable outcome here for any
agent except those explicitly hardening privacy.

### 3. Diff size and surface

```bash
git diff --stat HEAD
```

Look at:
- **Files changed**: 1-3 files for a focused task is normal. 10+ files
  for a "small change" is a red flag.
- **Lines changed**: more than ~150 lines without an explicit reason
  warrants careful review.
- **Surfaces touched**: a single change touching `programs/`, `backend/`,
  `frontend/`, AND `contracts/` is suspicious unless explicitly
  cross-cutting (like the three-file sync rule).

### 4. Time vs. value

How long did the agent take, and what did you get?

| Time | Output | Verdict |
|---|---|---|
| 10 min | Working feature with test | Excellent |
| 30 min | Working feature with test | Normal |
| 60 min | Working feature with test | Acceptable |
| 60 min | "Almost working" or "needs review" | Investigate the prompt |
| 60 min | "Refactored a lot, will commit later" | Stop and review now |

## The agent scorecard

Maintain a running log per agent. After each task:

```
Date: 2026-05-05
Agent: onchain-implementer
Task: Add subscribe instruction validation for max tier price
Tests before: backend 56/56, cargo 11/11, contracts 28/28
Tests after:  backend 57/57, cargo 12/12, contracts 28/28
Privacy-grep: clean → clean
Diff:        4 files changed, 47 insertions(+), 8 deletions(-)
Time:        ~25 min
Verdict:     Good. Three-file sync respected. New test added.
```

After 5-10 tasks per agent, you'll see patterns:

- An agent that consistently produces "needs review" output → the
  prompt needs to be sharper. Add specific examples or stricter
  done-criteria.
- An agent that frequently regresses an invariant → add a check for
  that invariant explicitly to its prompt's "before you commit" list.
- An agent that produces large diffs → add a max-files-changed
  expectation.

## Quality criteria by agent

Different agents have different definitions of good output.

### protocol-architect — quality of design
- Does the spec answer every "open question" before declaring frozen?
- Does it include a privacy analysis section?
- Does it include an economic / attack analysis section?
- Could a competent implementer build from it without asking
  follow-ups?

### onchain-implementer — quality of implementation
- All three sync points updated (if account layout changed)?
- `cargo build-sbf` succeeded?
- `cargo test -p sorts-community` green?
- No new `.env` or keypair files in `git status`?
- Coding conventions match existing files?

### privacy-grep — quality of vigilance
- Did it run all 13 invariant checks?
- Did findings include a concrete fix recommendation?
- Did it write to `docs/PRIVACY_REVIEW.md`?
- Does the result match what `pnpm test -- privacy` says?

### security-auditor — quality of audit
- Did it follow the full standing checklist (33 items)?
- Are findings written with concrete exploit/regression scenarios?
- Are severities calibrated against the SORTS-specific table?
- Did it correctly NOT flag intentional cut-lines as bugs?

### test-engineer — quality of tests
- Are new tests adversarial (try to break) or just confirmatory?
- Do they cover error paths, not only happy paths?
- Do they include privacy-invariant assertions where applicable?
- Are they deterministic (no time/random/network flakes)?

### demo-lock — quality of submission readiness
- Do screenshots actually match the live deploy?
- Are wallet/token strings redacted?
- Does the Playwright spec walk all 14 steps?
- Does the video script timing fit under 3 minutes?

### devops-deployer — quality of operational safety
- Did it refuse to deploy to mainnet?
- Did it require explicit approval for the deployment?
- Did it run pre-deployment smoke tests?
- Did it document the rollback path?

## The "would I have done this myself" test

For any non-trivial change an agent makes:

1. Read the diff line by line
2. Ask: "If I were typing this myself, would I write it this way?"
3. If no, ask: "Why is the agent's version different — better, worse, or
   just stylistic?"
4. If you can't tell, ask the agent to explain. Force it to defend
   its choices.

If the agent can't defend a choice, the choice is probably wrong.

## Red flags

These should trigger immediate stop-and-review:

- Agent reports "I refactored to make the code cleaner" without
  acknowledging the cut-line decisions in the tech overview
- Agent reports "I removed unused code" — verify NOTHING in the
  removed code is referenced by symbol name only (Umbra/IKA fallback
  scaffolding, future-swap symbols)
- Agent reports "all tests pass" but the diff includes test files —
  read the test diff carefully
- Agent reports "I improved the privacy model" — privacy improvements
  are user-approved architectural decisions, not in-flight implementation
- Agent commits to a `main` branch instead of a feature branch
- Agent's output is paragraph after paragraph of self-narration with
  little code — a sign it's confused

## Green flags

- Diff is small and focused
- New tests for new behaviour
- Cut-line awareness mentioned ("kept the on-chain-commitment-fallback
  label as the spec specifies")
- Three-file sync confirmation when relevant
- Privacy-grep result quoted in the agent's report
- Honest acknowledgment of what was NOT changed and why

## Calibration over time

Agent quality is a function of prompt quality. After 1-2 weeks of use:

1. Review which agents you ended up overriding most often.
2. For those agents, find the pattern of override and codify it as an
   explicit rule in the agent's `.md` file.
3. Test the change on a small task.
4. Promote to standard use.

Agent prompts are version-controlled code. Treat them like it.

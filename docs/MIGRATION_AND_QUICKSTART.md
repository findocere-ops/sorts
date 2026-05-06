# SORTS Agent System — Migration & Quick Start

## What you have now

Drop-in replacements for the agents I gave you before, tuned to where
SORTS actually is (Day 8 of 14, working app, deployed devnet program,
Colosseum deadline May 12).

```
.claude/
├── CLAUDE.md                   # NEW — full SORTS context, hard rules, invariants
├── AGENT_GUARDRAILS.md         # NEW — pre-flight checks, forbidden ops, rollback
└── agents/
    ├── privacy-grep.md         # NEW — mechanical invariant checker
    ├── security-auditor.md     # UPDATED — SORTS-specific checklist (33 items)
    ├── onchain-implementer.md  # UPDATED — Quasar-aware, three-file sync rule
    ├── demo-lock.md            # NEW — owns Colosseum deliverables
    └── (keep your existing)
        ├── protocol-architect.md
        ├── crypto-reviewer.md
        ├── client-sdk.md
        ├── gateway-engineer.md
        ├── test-engineer.md
        └── devops-deployer.md

docs/
├── RISK_MANAGEMENT.md          # NEW — failure modes + prevention
└── EVALUATION.md               # NEW — agent performance scorecard
```

## Patches to existing agents I gave you before

If you keep using the older versions of these agents, apply these
edits — they're the SORTS-specific updates:

### protocol-architect.md
Add to "Hard rules for SORTS":
- Architecture changes that contradict a documented cut-line in the
  tech overview require explicit user approval. Don't try to "fix"
  the Quasar CLI bypass, the Umbra fallback, or the IKA placeholder.
- Multi-community-per-creator requires solving the Quasar
  `[u8; 32]` typed-seed issue first; document the chosen workaround
  before specifying the user-facing change.

### crypto-reviewer.md
Add to "What you review":
- The commitment scheme: `tier_commitment = derive("SORTS_TIER_V1" ||
  level || salt_pubkey)`. Verify domain separation is preserved if
  this changes. Check that `salt_pubkey` is unique per subscription
  (otherwise commitments collide and link).
- Umbra fallback: `UmbraPrivacyService` currently returns
  `on-chain-commitment-fallback`. The privacy guarantee for v1 is
  "platform-queryable but not publicly enumerable" — flag any drift
  toward stronger or weaker claims in user-facing copy.

### client-sdk.md
Add to "Your responsibilities":
- The `frontend/src/lib/solana/instructions.ts` file hand-builds
  buffer data because Quasar uses single-byte discriminators. Any
  account layout or instruction discriminator change in
  `programs/sorts-community/src/state.rs` must trigger an update here
  in the same commit. (See three-file sync rule.)

### gateway-engineer.md
Add to "Anti-piracy layered defense":
- The Telegram bot's `/status` reply is a privacy invariant. Reply
  text must never include the substring "tier", "level [123]", or
  "member count". Asserted in `analytics-no-leak.test.ts` t5.

### test-engineer.md
Add to "What you write":
- Tests are the spec. Modifying a test to make it pass is forbidden.
- The existing 56-backend + 11-cargo test suite is the baseline. New
  features need tests; they don't need to displace existing ones.

### devops-deployer.md
Add to "What you own":
- The `cargo build-sbf` + `solana program deploy` pattern (NOT
  `quasar build`) is the canonical Solana build. Don't try to fix
  the Quasar CLI.
- Devnet program ID `AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV`
  is canonical. Any deploy that produces a different ID is forbidden
  unless the user explicitly authorizes a fresh deploy and accepts
  the migration cost.
- Render + Vercel + Supabase are the chosen stack per
  `docs/INFRASTRUCTURE.md`. Don't switch providers without approval.

## How to use the system in the next 7 days

### Day 1 (today, May 5)

```
1. "Read .claude/CLAUDE.md and .claude/AGENT_GUARDRAILS.md.
    Confirm you understand the 13 privacy invariants and the
    forbidden file list. List any ambiguity."

2. "Run privacy-grep on the current working tree. Establish baseline.
    Output to docs/PRIVACY_REVIEW.md."

3. "Run security-auditor on programs/sorts-community/ and
    backend/src/services/. Output to docs/AUDIT.md."

4. Install the pre-commit hook from RISK_MANAGEMENT.md §"Concrete
   pre-commit hook".
```

This gives you a clean baseline. Now you know exactly what state
the codebase is in, by the same metrics agents will be evaluated by
later.

### Days 2-4 (May 6-8)

Hardening week. Use Crew B from the tech overview §12:

```
"Use privacy-grep + security-auditor in parallel. Any Critical or
 High findings: fix them via onchain-implementer or by hand. Update
 PRIVACY_REVIEW.md and AUDIT.md as you go. Privacy-grep must close
 every Open finding before May 9."
```

Also: install the CSP / CORS hardening per Crew B item 5.

### Days 5-6 (May 9-10)

Demo lock. Use demo-lock agent:

```
"Use demo-lock to write the Playwright e2e spec for the 14-step
 demo flow. Mock Privy + wallet adapter. Get it green on a local
 dev server."

"Use demo-lock to capture the 14 screenshots from the deployed
 Vercel URL. Verify redaction. Place in
 frontend/public/demo-screenshots/."
```

### Day 7 (May 11)

Final polish:

```
"Run privacy-grep one more time. Run security-auditor one more time.
 Confirm zero Open Critical/High findings. Confirm 56-test backend
 still green, cargo green, contracts 28/28 green, frontend builds.
 Confirm the deployed devnet program ID matches CLAUDE.md."

"Use demo-lock to record the 2:45 video per docs/SOLANA_PHASE2_DEMO.md.
 Then walk docs/COLOSSEUM_WINNER_SPEC.md and fill every field with
 evidence."
```

### Day 8 (May 12) — submit

Submission day. Don't make code changes. Just verify and submit.

## Communication patterns that materially help

### Pattern: "show your work before committing"

```
"Implement the X feature. Before committing, show me:
 1. The diff
 2. Which tests you ran and their output
 3. Whether the three-file sync applies and which files you updated
 4. The privacy-grep result on the diff
 Then ask before committing."
```

This forces a checkpoint at the point where mistakes are still cheap.

### Pattern: "explain why, not what"

```
"Why is X implemented this way?" instead of "Change X to Y."
```

This catches the case where the agent is about to "improve" a cut-line
decision. If the agent's "why" doesn't match the tech overview's
documented rationale, you've caught a misunderstanding before it
becomes a regression.

### Pattern: "scope the blast radius"

```
"Change X. Constraints: only edit files in backend/src/services/.
 If you need to change anything else, stop and ask."
```

Agents drift when given freedom they don't need. Tight scope keeps
diffs reviewable.

### Pattern: "definition of done"

```
"X is done when:
  - The change is in
  - All 56 backend tests still pass
  - The new test for the new behaviour is added and green
  - privacy-grep is clean
  - You've reported what you changed in 5 bullet points"
```

This is the single highest-leverage prompt change. Most agent
underperformance is "I thought I was done; you wanted more." Solved
by writing the bar explicitly.

## When the system is working

- Daily test counts trending upward (more coverage)
- Zero Open Critical findings in PRIVACY_REVIEW.md
- Zero Open Critical findings in AUDIT.md
- Diffs are small (1-3 files, <100 lines per task)
- Demo flow video is recordable on demand without manual fixes

## When the system is breaking down

- Agents producing 10+ file diffs for "small" tasks
- Tests being modified more than added
- Privacy-grep findings reappearing after being closed
- You're spending more time supervising than the agent saves
- Agents reporting confidence on changes you don't understand

If any of these show up: stop, read the agent prompt that produced
the issue, sharpen it. Don't keep using a misbehaving agent and hope.

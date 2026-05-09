# Contributing to SORTS

This file is short on purpose. SORTS has narrow contribution rules during
the Colosseum submission window (2026-05-06 → 2026-05-12); they get less
strict afterwards. The full posture is in `docs/RISK_MANAGEMENT.md` and
`docs/INCIDENT_RESPONSE.md`.

## One-time setup

After cloning the repo (or each new worktree):

```bash
git config core.hooksPath .githooks
```

This activates the layer-2 privacy / secret guard at
[.githooks/pre-commit](../.githooks/pre-commit). It runs on every commit
and is mandatory.

To verify it is active:

```bash
git config --get core.hooksPath  # must print: .githooks
ls -l .githooks/pre-commit       # must show the executable bit (-rwxr-xr-x)
```

If either check fails, run the `git config` line again. The hook itself
is committed to the repo, so it is always available; the only operator
step is wiring `core.hooksPath`.

## What the pre-commit hook checks

It blocks five classes of regression that history shows are the most
damaging:

1. Real `.env` files (only `.env.example` is allowed).
2. Likely-secret payloads (`PRIVY_APP_SECRET`, `TELEGRAM_BOT_TOKEN`,
   `HELIUS_API_KEY`, `*PRIVATE_KEY` in any non-`.md`, non-`.example`
   file with a 16+ character value).
3. Solana keypair / treasury JSON files (`programs/sorts-community/keys/`,
   `*-keypair.json`, `protocol-treasury.json`).
4. Re-introduction of a plaintext `level: u8` (or `tier_level: u8`) field
   on the `Subscription` account in
   `programs/sorts-community/src/state.rs` — privacy invariant 2 from
   `docs/PRIVACY_REVIEW.md`.
5. Privacy-related backend test suites going red when files under
   `backend/src/{api,services,bot}/` change.

Tested durations on the canonical machine (2026-05-07):

| Scenario | Outcome | Duration |
|---|---|---|
| Real `.env` (force-staged) | blocked at gate 1 | 27 ms |
| Keypair JSON in `keys/` | blocked at gate 3 | 31 ms |
| `pub level: u8` on `Subscription` | blocked at gate 4 | 41 ms |
| Docs-only commit | allowed | 29 ms |
| Backend code change (test gate fires) | allowed | 4.36 s |

Total budget is < 5 s. If a future change makes the hook slower, the
test-suite branch should be the first thing inspected — it is the only
branch that exceeds 100 ms.

## Bypassing the hook

The hook can be skipped with `git commit --no-verify`. **Skipping the
hook is an incident-level event.** It is not a debugging convenience.

Use it only when one of the following is true:

- The hook itself is broken (e.g., `pnpm` is not installed, jest is
  failing for an unrelated reason). Fix the hook first when possible;
  `--no-verify` is the last resort.
- A reviewer has formally accepted a documented exception via a
  `docs/AUDIT.md` entry written *before* the commit lands.

Mandatory follow-up steps when `--no-verify` is used:

1. Add a new entry to [docs/AUDIT.md](AUDIT.md) within 24 hours
   describing:
   - The commit SHA produced.
   - The author + the date.
   - Which guard fired (or would have fired).
   - Why the bypass was necessary.
   - The remediation plan (if any) and its target date.
2. Open a GitHub issue tagged `audit-bypass` linking the commit and the
   `AUDIT.md` entry.
3. If the bypass concerns a privacy invariant, also update
   `docs/PRIVACY_REVIEW.md` with a non-clean status for the affected
   invariant.

`--no-verify` without an `AUDIT.md` entry is treated as a regression to
be reverted, not a question of style. The reviewer's first action on
seeing one is to revert and ask for the audit entry.

## Other contribution rules during submission week (2026-05-06 → 2026-05-12)

- No SDK / framework / toolchain upgrades (see `INCIDENT_RESPONSE.md`
  scenarios S4, S5).
- No dependency bumps. `pnpm install --frozen-lockfile` must succeed
  without lockfile diff (see scenario S7).
- No new features. Only bug fixes scoped to ≤ 50 lines and covered by
  an existing test.
- All commits must reference an existing issue or scenario. "Cleanup
  pass" or "misc" commits are out of scope this week.

## Outside submission week

The hook stays on permanently. The other "submission week" rules relax;
normal review applies. New contributors should still run the hook
activation step above.

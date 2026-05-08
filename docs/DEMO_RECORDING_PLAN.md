# SORTS — Demo Recording Plan

**Coverage period:** 2026-05-07 → 2026-05-12 submission deadline.
**Author:** solo developer.

This file pre-decides how the demo video is captured, when a backup
substitution happens, and how to keep the primary and backup recordings
visually identical so a swap requires no audience explanation.

The plan is designed to be calm under pressure. Read it once on a good
day; on the bad day, just follow the matrix.

---

## What is being recorded

A single ~3-minute video walking through the canonical flow in
[docs/SOLANA_PHASE2_DEMO.md](SOLANA_PHASE2_DEMO.md). Two recordings
exist:

- **Primary** — the deployed Vercel + Render + Solana devnet stack.
  Demonstrates real network state and a real upgrade-tx footprint that
  judges can verify on Solana Explorer.
- **Backup** — the same code, same UI, same wallet, against
  `solana-test-validator` running locally with the same program id
  (`AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV`). Demonstrates the
  flow with no devnet dependency.

The backup exists because devnet outages of 6–24 hours occur often
enough that they are a **known risk**, not an emergency.

### Cloak narration segment (mandatory, ~25s of the 3-minute total)

The Cloak code path does NOT fire on the recorded demo because Cloak's
program is mainnet-only (see [SUBMISSION_RISKS.md](SUBMISSION_RISKS.md)).
The recording must include a labeled narration covering this honestly.

Suggested script (read at ~145–170s into the demo, after the subscribe
flow lands and the creator-side aggregate stats appear):

> "On devnet, payments use a transparent `system_program::transfer`.
> The dual-path code in `programs/sorts-community/src/instructions/
> subscribe.rs` switches automatically when we activate Cloak on
> mainnet — the Subscription account already carries a 64-byte
> `cloak_payment_sigs` slot, the frontend already orchestrates Cloak's
> `transact` and `partialWithdraw`, and the creator payroll widget on
> the analytics page is wired. This devnet recording does not show
> Cloak firing. Mainnet activation is gated behind a feature flag and
> requires a backend verifier service that we've documented as the
> next-sprint commitment."

Visual aid during this narration: split-screen showing
`programs/sorts-community/src/instructions/subscribe.rs` (dual-path
logic) on the left and the analytics page with the labeled
`CreatorPayrollWithdraw` "mainnet only" card on the right. Three to
five seconds of code visible is enough; the rest is voiceover.

The narration must NOT claim the demo "uses" Cloak. It must NOT show
the Cloak relayer URL. It must NOT show non-zero `cloak_payment_sigs`
on any explorer view. Same posture as the IKA pre-alpha card narration
already in the build.

---

## Visual equivalence — the substitution rule

A judge watching either recording must not be able to tell which one
they are seeing without knowing in advance. To preserve that:

1. **Same code.** No conditional branches, no UI strings, no env-only
   features change between primary and backup. The constraint
   "JANGAN modify program code untuk make local recording bekerja" is
   the rule. The local validator runs the **identical** `.so` artifact
   the devnet has.
2. **Same program id.** Both targets use
   `AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV`. Frontend env vars
   change; user-visible identifiers do not.
3. **Same wallet.** The same Solana wallet (e.g. Phantom configured to
   "Devnet" or "Localnet" — the wallet UI hides the cluster name from
   the SORTS UI). Use a freshly-airdropped wallet for both recordings
   so balances start identical.
4. **Same community name + tier prices.** Use a fixed seed: community
   name `Alpha Signals`, symbol `ALFA`, three tiers at 0.05 / 0.25 /
   1.00 SOL with 30-day duration. Documented as the canonical demo
   fixture in `docs/SOLANA_PHASE2_DEMO.md`.
5. **Same browser layout.** Same browser (Chromium-based, Chrome
   profile in 1-window 1280×800), same DevTools state (closed), same
   font scale (100%), same wallet popup position. Recording uses
   QuickTime full-screen capture to keep edges clean.
6. **Same audio.** Single take of the same script, same microphone,
   same room. If audio differs between takes, re-record both.

The single visible difference is the **DevnetBadge label** in the
top-bar: `Solana devnet` vs `Solana localnet`. The substitution rule
says this label is the only allowed deviation. If the operator forgets
to point the env vars at the right cluster, the badge will lie — that
is the visible failure mode that the rule defends against.

---

## Decision matrix

Run this matrix ahead of submission, not during.

| Scenario | Trigger | Action | Notes shipped |
|---|---|---|---|
| **A — devnet stable, recording smooth** | First take of the primary recording is clean (no retries, no UI errors, no spinner > 5 s). Solana Explorer shows the txs from the recording. | Submit primary recording. Backup stays on disk as proof of resilience. | None — submission notes can omit this entirely. |
| **B — devnet flaky, recording works after retry** | Primary recording requires ≤ 2 retries because of a single 1–10 s devnet stall. Final take is clean. | Submit primary recording. Mention in submission notes: *"Primary recording was captured against Solana devnet on <date>; one retry was required for an RPC stall typical of devnet."* | One paragraph in `SUBMISSION_RISKS.md` describing the retry, no badge change. |
| **C — devnet down ≥ 24 h before submission** | `solana cluster-version --url devnet` fails or the deployed program is unreachable for ≥ 30 min, with no recovery in 60 min, with > 24 h until submission. | Bring up `scripts/local-demo.sh up`. Re-record using the local-validator backup configuration. The new recording becomes the submission. Old primary is archived as `recordings/primary-devnet-down-<date>.mp4`. | Add a `SUBMISSION_RISKS.md` note: *"Primary demo target was Solana devnet (program <id>). Devnet was unstable in the 24 h before submission, so the live recording uses a local validator running the identical program artifact. The deployed program on devnet remains alive; reviewers can verify via Solana Explorer at <link>."* The badge still says `localnet`, which the note explains. |
| **D — devnet down < 6 h before submission** | Same as C but discovered with < 6 h to deadline; no time to plan a re-record. | Submit the **already-recorded backup** without modification. Do not attempt to re-shoot. | Same `SUBMISSION_RISKS.md` note as C. The fact that the backup exists is the entire reason for this plan. |
| **E — both targets fail simultaneously** | Devnet down AND local validator fails to start (e.g., `solana-test-validator` crashes on the host machine). | Refer to [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) §S1 cut-off branch and §S6. PULL is on the table. | If shipping at all, full disclosure in `SUBMISSION_RISKS.md`. |

The matrix never asks the operator to invent a new option under
pressure. Everything routes to one of: ship-primary, ship-backup,
ship-with-disclosure, or pull.

---

## Pre-deadline recording sequence (run by 2026-05-09 → T-3 days)

1. **Record the backup first.** Counterintuitive but right: the backup
   must exist before the primary is attempted, because the primary's
   resilience story depends on the backup being available. Steps:

   ```bash
   scripts/local-demo.sh up
   solana-keygen new --outfile ~/.config/solana/demo.json --no-bip39-passphrase --force
   scripts/local-demo.sh airdrop $(solana-keygen pubkey ~/.config/solana/demo.json) 5

   # Frontend
   cat <<EOF > frontend/.env.local
   NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL=http://localhost:8899
   NEXT_PUBLIC_SOLANA_PROGRAM_ID=AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV
   NEXT_PUBLIC_API_URL=http://localhost:3001
   NEXT_PUBLIC_PRIVY_APP_ID=<your real privy app id>
   NEXT_PUBLIC_DEMO_MODE=false
   EOF

   # Backend
   cat <<EOF > backend/.env
   SOLANA_DEVNET_RPC_URL=http://localhost:8899
   SOLANA_PROGRAM_ID=AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   PRIVY_APP_ID=<your real privy app id>
   PRIVY_APP_SECRET=<your real privy app secret>
   EOF

   # Run
   pnpm dev   # or pnpm --filter @sorts/backend dev + pnpm --filter @sorts/frontend dev
   ```

   Record the demo per the script in `docs/SOLANA_PHASE2_DEMO.md`. Save
   to `recordings/backup-localvalidator-<date>.mp4`.

   Tear down:

   ```bash
   scripts/local-demo.sh down
   ```

2. **Record the primary.** Switch the `.env` files back to devnet (use
   `git checkout .env.example` then re-fill secrets, or restore from
   1Password). Re-airdrop the same demo wallet on devnet:

   ```bash
   solana airdrop 5 $(solana-keygen pubkey ~/.config/solana/demo.json) --url devnet
   ```

   Record the same script. Save to
   `recordings/primary-devnet-<date>.mp4`.

3. **Compare.** Open both recordings in QuickTime side by side. Verify:
   - Same lengths within 5 seconds.
   - Same UI state at every cut.
   - Same audio level.
   - Only difference: top-bar badge label.

   If anything else differs, re-record the primary. Backup is the
   reference; primary must match it visually.

4. **Upload both** to Loom unlisted. Save URLs in
   `docs/SOLANA_PHASE2_DEMO.md` under the heading `Recording links`.

5. **Verify in incognito** that both Loom URLs play without login.

---

## Operator quick card

Pin this near your monitor during submission week.

```
DEVNET DOWN?
  > 24h to deadline → record backup, choose at deadline-12h
  12–24h            → ship backup, write disclosure
  < 6h              → ship pre-recorded backup as-is, write disclosure

PRIMARY OK?
  > submit primary, no notes needed

UNCERTAIN?
  > re-read DEMO_RECORDING_PLAN.md "Decision matrix"
  > do not invent a fifth option
```

The hardest decision in submission week is the one nobody pre-decided.
This file removes that decision.

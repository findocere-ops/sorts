# SORTS — Pre-Submission Incident Response

**Author:** solo developer · **Coverage period:** 2026-05-06 → 2026-05-12 submission deadline · **Last revised:** 2026-05-06.

This document is a pilot's pre-flight checklist. Decisions are made calmly here, in advance, so that when something fires during submission week the response is mechanical: read the trigger, follow the tree, hit the cut-off. Do not improvise during the week. If a scenario isn't covered here, the default is the most conservative option that still ships a truthful submission.

---

## Reading guide

Every scenario uses the same five-line shape:

- **Trigger** — the signal that tells you the scenario is live. If the signal isn't there, do not act.
- **Severity** — one of S0..S3. Defined below. The severity drives the tree, not the other way around.
- **Decision tree** — a short if/then chain that arrives at one of three outcomes: SHIP, SHIP-WITH-DISCLOSURE, PULL.
- **Decision authority** — solo dev. Recorded explicitly so that "ask the team" is never an option you reach for under pressure.
- **Cut-off time** — the absolute latest moment a given option is reversible. Past the cut-off, the decision is locked.

### Severity scale

| Code | Meaning | Default action |
|---|---|---|
| **S0** | Submission blocker — cannot ship without resolving | PULL or fix-then-ship |
| **S1** | Quality blocker — submission is technically valid but a privacy / honesty / functional regression is present | SHIP-WITH-DISCLOSURE in `docs/SUBMISSION_RISKS.md` |
| **S2** | Cosmetic — log it, ship it, fix in v2 | SHIP, write a known-issue line |
| **S3** | False alarm — confirm and dismiss | SHIP, no further action |

### Three outcomes (the only outcomes)

- **SHIP** — submission proceeds as planned.
- **SHIP-WITH-DISCLOSURE** — submission proceeds; a one-paragraph note in `docs/SUBMISSION_RISKS.md` describes what is broken or experimental, why we shipped anyway, and what the v2 fix is.
- **PULL** — withdraw the submission, or do not submit. This is a real option. It is not a failure mode.

Solo means there is no escalation path. The decision authority for every scenario below is **you, alone, before fatigue sets in.** Pre-deciding here is the entire point of this file.

---

## S1 — Devnet down within 24h of submission

### Trigger

Any of the following:

- `solana cluster-version --url devnet` returns a network error or commits to a height that does not advance over 5 minutes of polling.
- The Solana status page (https://status.solana.com) shows a devnet incident with severity `major` or `critical`.
- A devnet smoke run (`scripts/smoke-solana-flow.ts` or equivalent) fails on the deployed program id `AEp6V…BkFV` with a network-class error, twice in a row, 60 seconds apart.

### Severity

- **S0** if devnet outage prevents the live-demo URL from completing the create→subscribe→access flow at submission moment.
- **S1** if devnet is degraded but reachable through Helius / QuickNode / a different RPC endpoint.

### Decision tree

```
Is devnet reachable through ANY RPC provider you can swap NEXT_PUBLIC_SOLANA_DEVNET_RPC_URL to?
├── Yes → swap RPC, re-record demo only if the original recording shows a stuck spinner.
│        Severity drops to S2. SHIP.
└── No  → How many hours until submission deadline?
         ├── ≥ 24h → wait. Devnet outages of <24h are common; check every 2h.
         │           If still down at the 12h mark, escalate to the next branch.
         ├── 12–24h → start the local-validator backup demo NOW. Record it.
         │            Submit BOTH demos: the deployed-devnet one (may show error)
         │            and the local-validator one (proves the program works).
         │            SHIP-WITH-DISCLOSURE.
         └── < 12h → submit the local-validator demo only, with a SUBMISSION_RISKS.md
                     entry naming the devnet outage and linking the Solana status page.
                     SHIP-WITH-DISCLOSURE.
```

### Backup options (in order of preference)

1. **Helius devnet RPC** — `https://devnet.helius-rpc.com/?api-key=<key>`. Most stable, ≤ 50ms swap (one env var).
2. **QuickNode devnet RPC** — second fallback. Free tier exists.
3. **Public `https://api.devnet.solana.com`** — already the current default.
4. **Local validator** — `solana-test-validator --reset --upgradeable-program AEp6V…BkFV programs/sorts-community/target/deploy/sorts_community.so 2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ.json`. Documented in `programs/sorts-community/README.md`.

### Decision authority

Solo dev.

### Cut-off time

- **T-24h:** decide whether to keep watching (Yes branch) or start the local-validator preparation (No branch).
- **T-12h:** if devnet still down, local validator is the only viable demo path. Past this point, do not attempt to re-record on devnet even if it comes back — recording-quality risk outweighs the marginal credibility gain.
- **T-2h:** submission package is locked. No new demo recordings after this. If devnet recovers between T-2h and submission, do not retroactively swap the demo.

---

## S2 — Privacy invariant regression discovered post-recording

### Trigger

Privacy-grep job (`docs/PRIVACY_REVIEW.md` workflow), `pre-commit` hook, or manual review surfaces one of:

- A new `Vec<Pubkey>` / `Vec<Address>` / `Vec<[u8;32]>` on the Solana program.
- `pub subscriber: Address` (or any plaintext subscriber field) reappearing on `Subscription`.
- A backend route returning a JSON array of wallet-shaped strings.
- A frontend page rendering a wallet address belonging to someone other than the authenticated user.
- A logger statement printing seed material, signature blobs, ciphertext, or raw tier values.
- An IKA real-funds method exported without the double-flag gate.

### Severity

Anchored to the invariant table in `docs/PRIVACY_REVIEW.md`:

- **S0** — invariants 1, 2, 5, 11, 12, 14 (member enumeration, tier leak, aggregate-only, real-funds gate, no-seed-leak, subscriber pseudonymization). These are the load-bearing claims of the submission. A regression here makes the submission false.
- **S1** — invariants 3, 4, 6, 7, 8, 9, 10, 13 (interface carve-outs, auth, rate-limit, quota, content gate, telegram bot copy, table join). Regressions here are real but smaller; ship with disclosure.

### Decision tree

```
Step 1 — confirm the regression is real (not a doc-comment / test-fixture / underscore-prefix exemption).
├── False positive (matches an exemption in PRIVACY_REVIEW.md "Ambiguity log") → S3, dismiss.
└── Real regression → continue.

Step 2 — severity from the table above.
├── S0 (load-bearing claim) →
│   Is there a fix you can land + retest in ≤ 2 hours and still hit the recording cut-off?
│   ├── Yes → land fix, re-run privacy-grep + the impacted test suite, re-record demo, SHIP.
│   └── No  → PULL. The submission's privacy claim is its primary judging axis;
│             shipping with a known load-bearing regression is worse than not shipping.
└── S1 (smaller invariant) →
    Add an entry to docs/SUBMISSION_RISKS.md naming the invariant, the regression,
    and the v2 fix. SHIP-WITH-DISCLOSURE. Do not re-record unless the regression
    is visible on screen during the demo.
```

### Decision authority

Solo dev.

### Cut-off time

- **T-12h:** last opportunity to land a fix that requires a redeploy (program upgrade or backend release). Past this, freeze the program code regardless.
- **T-6h:** last opportunity to re-record the demo without quality regression from rushed takes. Past this, the demo is locked even if a smaller fix lands.
- **T-2h:** documents (`SUBMISSION_RISKS.md`, `PRIVACY_REVIEW.md`) lock. Past this, submit as-is.

---

## S3 — Critical bug found in deployed program

### Trigger

- A user / reviewer / test report surfaces a tx that should succeed but reverts, or succeeds but writes incorrect state.
- An automated check (`scripts/smoke-solana-flow.ts`) fails on a path that previously passed against the same program id.
- A privacy-grep variant detects on-chain state that was supposed to be hidden (functionally equivalent to S2 if it's privacy-related).

### Severity

- **S0** — bug breaks the demo's golden path (create-community → subscribe → access-check → aggregate-stats).
- **S1** — bug affects an edge case the demo does not exercise (renew-after-expiry, multi-tier, etc.).
- **S2** — bug is observable only in test fixtures, not against real RPC.

### Decision tree

```
Step 1 — does the bug affect the recorded demo's golden path?
├── No  (S1/S2) → SHIP-WITH-DISCLOSURE. Add to SUBMISSION_RISKS.md with steps-to-reproduce.
└── Yes (S0)   → continue.

Step 2 — is a hot-fix patch ≤ 50 lines AND covered by an existing test that already passes
                (i.e., a regression that test missed, you can write the missing test fast)?
├── No  → PULL. Do not redeploy under stress; redeploys are not free in pre-alpha.
└── Yes → continue.

Step 3 — does the fix require redeployment?
├── No  (backend / frontend only) → land the fix, re-run all 73 backend tests + frontend
│        Playwright happy-path, re-record demo if visible. SHIP.
└── Yes (Rust program) → REDEPLOY decision tree:
    ├── Same program id (Option A) → existing v2 Subscription accounts may break
    │   under v3 layout. If the bug is in subscribe/renew args layout, this WILL
    │   strand existing test data. Acceptable: re-create demo data on the fresh
    │   program. Document in SUBMISSION_RISKS.md.
    └── New program id (Option B) → updates to env vars across backend + frontend
    +   declare_id! in lib.rs + deployments/devnet.json. Higher coordination cost
    +   but no in-place data loss. Use only if the existing program account
    +   itself is compromised (e.g., wrong upgrade authority).
```

### Re-deploy checklist (if Step 3 = Yes)

1. `cargo build-sbf` → confirm fresh `.so` artifact.
2. `cargo test` → confirm all 14 program tests pass against the new layout.
3. `solana program deploy --program-id <existing keypair>` (Option A) or fresh keypair (Option B).
4. Update `programs/sorts-community/deployments/devnet.json` with the new tx signature and timestamp.
5. If Option B: update `NEXT_PUBLIC_SOLANA_PROGRAM_ID`, `SOLANA_PROGRAM_ID`, `declare_id!`, all docs that name the old id.
6. Re-record demo on the fresh program.
7. Add a `SUBMISSION_RISKS.md` entry naming the bug, the fix, and the redeploy timestamp.

### Decision authority

Solo dev.

### Cut-off time

- **T-18h:** last redeploy. Past this, freeze the program. Any S0 bug discovered post-T-18h becomes PULL.
- **T-12h:** last backend / frontend fix that requires re-deploying to Render or Vercel.
- **T-6h:** last demo re-record.

---

## S4 — Quasar CLI fix lands but breaks current build

### Trigger

- A new Quasar release on https://github.com/blueshift-gg/quasar fixes the `Anyhow` CLI errors documented in `programs/sorts-community/README.md`.
- A teammate / community member opens a PR offering to switch from `cargo build-sbf` to `quasar build`.

### Severity

**S2 always.** This is a tooling improvement, not a submission requirement.

### Decision tree

```
Is it submission week (post-2026-05-06)?
├── Yes → REJECT the swap, full stop. No exceptions. Ship on the current
│         cargo build-sbf + solana program deploy toolchain. Document the
│         missed opportunity as a v2 task in SUBMISSION_RISKS.md.
└── No  → out of scope of this document; evaluate normally per Priority.md.
```

### Decision authority

Solo dev. Pre-decided here: **no toolchain changes during submission week.** Even if the new toolchain is objectively better, the cost of a regression introduced by tooling at T < 7 days is asymmetric — gain is marginal, loss is total.

### Cut-off time

This decision is already locked as of 2026-05-06. There is no cut-off because there is no decision to make during the week.

---

## S5 — Privy outage OR Privy 1.x Solana connector lands mid-week

### Trigger

#### Outage variant
- `https://status.privy.io` shows an incident.
- Login attempts on a fresh browser session return a 500 or hang for >30 seconds.
- The Privy SDK throws on every `usePrivy().login()` call.

#### Mid-week-release variant
- A new Privy 1.x release ships official Solana connector support, deprecating the `@solana/wallet-adapter-react` workaround documented in `frontend/src/components/providers/AuthProvider.tsx:36`.
- A blog post / changelog suggests we should swap.

### Severity

- Outage: **S0** if it persists into submission window; **S2** if transient.
- Mid-week release: **S2 always** — same posture as S4. Tooling improvement, not a submission requirement.

### Decision tree

```
Outage variant:
Is Privy reachable now?
├── Yes → S3, dismiss.
└── No  →
    ├── Have you already enabled the demo-mode fallback (NEXT_PUBLIC_DEMO_MODE=true)?
    │   The fallback shipped in commit 6c9593a. It does NOT allow real wallet tx,
    │   but it lets the UI render so the OTHER demo paths can still be recorded.
    │   ├── No → enable it locally for the demo recording only. Do NOT push to
    │   │       production with demo-mode on.
    │   └── Yes → record the wallet flow against the demo stub, label the segment
    │             "Privy outage — fallback path" verbally during the demo.
    │             SHIP-WITH-DISCLOSURE.
    └── If Privy outage persists at T < 6h → SHIP the local-validator-only demo,
        same as S1 cut-off.

Mid-week-release variant:
Is it submission week?
├── Yes → REJECT the swap. No exceptions. Same rule as S4.
└── No  → evaluate normally.
```

### Decision authority

Solo dev. Pre-decided here: **no SDK swaps during submission week,** regardless of how attractive the new SDK looks.

### Cut-off time

- **Outage:** T-6h. Past this, the demo is the demo; do not switch wallet stacks.
- **Release:** locked, no cut-off (no decision to make).

---

## S6 — Render / Vercel / Supabase / Cloak relayer outage

### Trigger

- Vercel deploy URL returns 500 across multiple regions.
- Render web service is unreachable, build queue stalled, or persistent disk unmounted.
- Supabase (or Render Postgres, whichever was chosen at Day-7) returns connection errors.
- **Cloak relayer (`https://api.cloak.ag`) returns 5xx or hangs for >30s on `transact()` calls.** Only matters when `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=true`; the devnet submission flag is OFF, so the relayer is not on the demo critical path.

### Severity

- **S0** if the live-demo URL is unreachable and there is no alternative URL.
- **S1** if the URL is up but a feature is degraded (e.g., gated content fetch fails because Postgres is down but the wallet flow works).
- **S2** if Cloak relayer is down while `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=false` — no impact on submission demo (the Cloak code path doesn't fire on devnet). Document and continue.

### Decision tree

```
Step 1 — which provider is down?

Vercel down →
├── Self-host the frontend build with `pnpm --filter @sorts/frontend start`
│   on a tmp tunnel (cloudflared / ngrok / tailscale-funnel). Update demo
│   recording's URL caption. SHIP-WITH-DISCLOSURE.

Render down →
├── Spin up a tmp backend on Fly.io or Railway free tier from the existing
│   .env.example template. Update NEXT_PUBLIC_API_URL on Vercel + redeploy.
│   30-min RTO. If RTO > 60min, fall back to local backend on a tunnel.

Supabase / Postgres down →
├── Set DATABASE_URL empty on the backend service. The DAL falls back to
│   SQLite per backend/src/db/schema.ts selectDriver(). The Render
│   Persistent Disk (if enabled at Day-7) preserves data; if not, the
│   demo will start from an empty schema. The Solana program is the
│   authoritative source of truth for membership state, so this is
│   tolerable for the demo flow.

Cloak relayer down →
├── Check NEXT_PUBLIC_ENABLE_CLOAK_MAINNET on the deployed frontend.
│   ├── flag = false (default for submission) → S2, no action.
│   │   Confirm with: curl https://<vercel>/api/health → response should
│   │   never include "cloak" as an active path because the flag is off.
│   ├── flag = true → SHIP-WITH-DISCLOSURE. Subscribe / renew / payroll
│   │   surfaces will throw "Cloak relayer unreachable" until the relayer
│   │   recovers. Mainnet-only: this branch should not fire during the
│   │   submission week because the flag stays off.

Two of the three (Vercel/Render/Supabase) down at the same time → PULL is on the table; see Step 2.
```

```
Step 2 — how much time to submission?
├── ≥ 12h → swap providers per Step 1. SHIP.
├── 6–12h → swap providers per Step 1 IF the swap is one provider. If two
│           are down concurrently, SHIP-WITH-DISCLOSURE on the local-only
│           demo path (no live URL).
└── < 6h  → SHIP-WITH-DISCLOSURE on the local-only demo path. Do not
            attempt provider swaps under T-6h pressure.
```

### Backup deploy targets

- **Frontend:** Cloudflare Pages, Netlify, Fly.io, ngrok-tunneled local `pnpm start`.
- **Backend:** Fly.io, Railway, Northflank, ngrok-tunneled local `pnpm start`.
- **Database:** Render Persistent Disk + SQLite (the documented fallback in `INFRASTRUCTURE.md`), or Neon free tier as a Postgres-compatible alternative.
- **Cloak relayer:** none. Cloak does not document an alternate relayer, and self-hosting one is out of scope. If `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=true` and `https://api.cloak.ag` is down, the only path is to flip the flag back to false (mainnet deploy regresses to transparent payment). Document via SUBMISSION_RISKS.md and proceed.

### Decision authority

Solo dev.

### Cut-off time

- **T-12h:** last provider swap. Past this, do not change DNS records or env URLs.
- **T-6h:** last `vercel deploy` or `render deploy`. Past this, the deploy is what it is.

---

## S7 — Test suite goes red from a third-party update

### Trigger

- A `pnpm install` or transitive update changes a hash in `pnpm-lock.yaml` and tests start failing.
- A jest / vitest / cargo dependency publishes a new minor that breaks our snapshot or assertion API.

### Severity

- **S0** if the failure is in a test that gates a privacy invariant (any of the privacy-grep / encoding-roundtrip / solana-service / privacy-assertions / umbra-no-seed-leak / ika-no-real-funds suites).
- **S1** if the failure is in a non-privacy test (typecheck, build).
- **S2** if the failure is in a snapshot-style cosmetic test.

### Decision tree

```
Step 1 — pin everything NOW (do this on 2026-05-06, do not wait for a failure).
├── Run: pnpm install --frozen-lockfile (already the standard; keep it).
├── Confirm pnpm-lock.yaml is committed in HEAD.
├── Confirm Cargo.lock is committed for the program (check
│    .gitignore — currently programs/**/Cargo.lock IS gitignored;
│    UN-IGNORE for submission week, commit the lock file).
├── Add a comment to package.json files: "DO NOT BUMP DURING SUBMISSION WEEK"
│    above the dependencies block.

Step 2 — if a test goes red anyway:
├── Was the failure introduced by a dep change in the LAST hour?
│   ├── Yes → revert the lockfile change: git checkout HEAD -- pnpm-lock.yaml
│   │         + pnpm install --frozen-lockfile. Re-run tests.
│   └── No  → the failure is real (caused by something else, like a
│             pre-deadline edit). Treat as S2 or S3 from the relevant scenario.
└── Solo flow: do NOT investigate the dep upgrade itself this week. Pin and move on.
```

### Concrete pin actions (run today, 2026-05-06)

```bash
# 1. Confirm lockfile is the source of truth.
pnpm install --frozen-lockfile
git status  # pnpm-lock.yaml should not appear

# 2. Un-ignore Cargo.lock for the program crate.
sed -i.bak '/^programs\/\*\*\/Cargo\.lock$/d' .gitignore
git add .gitignore programs/sorts-community/Cargo.lock

# 3. Mark every package.json with a freeze comment in the dependencies block.
# (Manual edit; pre-commit hook will not catch this.)
```

### Decision authority

Solo dev.

### Cut-off time

The pinning is **already overdue** as of 2026-05-06; do it today. The decision tree's Step 2 has no cut-off — it applies any time a test goes red between now and submission. The "revert the lockfile change" branch is always available because the lockfile is committed.

---

## S8 — Solo dev unavailable (you)

### Trigger

- Illness, family emergency, hardware failure (laptop dead, no backup), credential loss (lost YubiKey, lost 1Password access).
- Power outage that exceeds expected duration.
- Internet outage at your location with no nearby alternative.

### Severity

- **S0** if you cannot reach any computer with the repo and credentials for ≥ 6 hours during submission week.

### Decision tree

```
Are you online and able to commit?
├── Yes → continue normally.
└── No  →
    ├── Can a friend / family member access your laptop with your password and
    │   run the pre-deadline checklist below verbatim?
    │   The submission is then a copy-paste of pre-recorded demo + pre-written
    │   docs into the Colosseum portal. NO code changes by the friend.
    │   ├── Yes → walk them through the checklist by phone. SHIP.
    │   └── No  → PULL or skip submission. The work survives in the repo;
    │             grant deadlines are usually not the only opportunity.
```

### Critical-path identification (solo)

The submission package's critical path is, in order:

1. The deployed program at `AEp6V…BkFV` is alive.
2. The Vercel URL is alive.
3. The Render / Fly URL is alive.
4. The demo video is recorded and uploaded to Loom / YouTube unlisted.
5. The README's `Current Demo Status` table is accurate.
6. The `docs/SOLANA_PHASE2_DEMO.md` script matches the recorded video.
7. The Colosseum portal submission form is filled in.

Anything not in this list is non-critical for the submission moment. Production polish (SEO, analytics dashboards, full E2E test suite, additional Privy SSO providers, Telegram bot reliability) is not on the critical path. Treat them as nice-to-have, not must-have.

### Single-person delivery plan

To minimize the surface for "you alone are blocking the submission," do these by 2026-05-09 (T-3 days):

1. Record a 3-minute demo video. Upload to Loom unlisted. Save the URL in `docs/SOLANA_PHASE2_DEMO.md`.
2. Fill in every text field of the Colosseum submission form (do not click submit). Save the draft.
3. Pre-write the social media announcement copy. Save in `docs/SUBMISSION_ANNOUNCEMENT.md` (create if missing).
4. Test login to the Colosseum portal twice from two different networks. Confirm 2FA recovery codes are accessible.

Once 1–4 are done, the submission moment is clicking one button. That button can be clicked under almost any condition.

### Decision authority

Solo dev.

### Cut-off time

- **2026-05-09 T-72h:** demo video recorded, portal draft saved.
- **2026-05-11 T-24h:** pre-deadline checklist below run.

---

## Pre-deadline checklist — run on 2026-05-11

Treat as a pilot's pre-flight. Each item is a binary pass/fail. If any item fails, the response is in this document; do not improvise. Allocate **one focused 90-minute window** to run the entire checklist. Do not interleave with other work.

### Code & deps

- [ ] `pnpm install --frozen-lockfile` exits 0. Lockfile unchanged.
- [ ] `pnpm-lock.yaml` and `programs/sorts-community/Cargo.lock` are both committed and unchanged in the last 24h.
- [ ] Every workspace `package.json` has the freeze comment near the dependencies block.
- [ ] `git status --short` returns empty (clean working tree).
- [ ] `git log --oneline -5` matches the expected last commit on `claude/clever-bhaskara-541ed3` and the merge to `main` (if a merge is planned for submission).

### Tests

- [ ] `cargo test -p sorts-community` — 6 unit + 8 integration green (14/14).
- [ ] `pnpm --filter @sorts/backend build` — exit 0.
- [ ] `pnpm --filter @sorts/backend test` — 12 suites, 73 tests green.
- [ ] `pnpm --filter @sorts/frontend build` — exit 0.
- [ ] `pnpm --filter contracts compile` — exit 0 (Phase-1 intact per CLAUDE.md).
- [ ] `pnpm --filter contracts test` — 22 Hardhat tests green (Arbitrum legacy still buildable).

### Privacy invariants

- [ ] Privacy-grep workflow last run on `main` (or the submission branch) is green for all 14 invariants documented in `docs/PRIVACY_REVIEW.md`.
- [ ] `grep -rn 'pub subscriber:' programs/sorts-community/src/` returns nothing.
- [ ] `grep -rn 'Vec<Pubkey>\|Vec<Address>' programs/sorts-community/src/` returns nothing.
- [ ] Backend response shapes for `/api/analytics/community/:cid` and `/api/privacy/entitlement` contain no `tier`, `commitment`, `salt`, or wallet-array fields (verify by curl against the deployed backend).

### Devnet program

- [ ] `solana program show AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV --url devnet` shows the expected upgrade authority and last upgrade tx `2nLtw6N…JtAs7`.
- [ ] `solana balance` for the deployer wallet ≥ 0.5 SOL (so a hot-fix redeploy is mechanically possible if S3 fires).
- [ ] `programs/sorts-community/deployments/devnet.json` matches the on-chain state.
- [ ] A fresh `ts-node scripts/smoke-solana-flow.ts` (or equivalent) completes the create→subscribe→access path against devnet.

### Demo & artifacts

- [ ] Demo video uploaded to Loom unlisted. URL saved in `docs/SOLANA_PHASE2_DEMO.md` and verified by clicking it from a logged-out browser.
- [ ] Backup demo recorded against `solana-test-validator` (S1 fallback). Saved on local disk plus a cloud copy.
- [ ] Screenshot suite captured per `docs/SCREENSHOT_INDEX.md`. Each file opens.
- [ ] `README.md` "Current Demo Status" table reflects today's reality.
- [ ] `docs/PRIVACY_REVIEW.md` last run timestamp is ≤ 24h old.

### Submission credentials & portal

- [ ] Colosseum portal login works. Confirmed from two separate networks (or one network + mobile hotspot) within the last 24h.
- [ ] 2FA recovery codes accessible (1Password export saved to a USB key + a printed copy).
- [ ] Submission form draft saved in the portal with every text field filled.
- [ ] Linked GitHub URL points to the public submission branch and resolves to a 200 in incognito.
- [ ] Linked Vercel URL points to the deployed frontend and resolves to a 200 in incognito with no console errors on the landing page.
- [ ] Linked Render / Fly URL responds to `GET /health` with `{"status":"ok"}` in incognito.

### Infrastructure runtime

- [ ] Vercel project shows the expected last deploy hash and a green build.
- [ ] Render service shows green health and persistent disk mounted.
- [ ] If using Postgres: connection from a fresh `psql` session succeeds with the documented `DATABASE_URL`.
- [ ] Privy app id (production) is configured on Vercel; `NEXT_PUBLIC_DEMO_MODE` is unset on production.

---

## Closing principles

1. **Pre-decide.** Every panic is a decision you didn't make in advance. This file is the antidote.
2. **Default to truthful.** SHIP-WITH-DISCLOSURE beats SHIP-WITH-FALSE-CLAIM in every scenario. PULL beats both when the claim is load-bearing.
3. **Cut-offs are absolute.** Past the cut-off, the previous decision wins. This is not a negotiation with future-you.
4. **Tooling is frozen.** No SDK upgrades, no framework swaps, no toolchain changes between 2026-05-06 and 2026-05-12. The only changes are bug fixes scoped to ≤ 50 lines and covered by an existing test.
5. **Solo means single-decision.** There is no escalation. The decision authority on every line above is you. The recipe for not panicking is to make the decisions here, today, while calm.

When in doubt: re-read the relevant scenario. The answer is already written. Trust the doc you wrote when calm.

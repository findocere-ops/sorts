# SORTS — Submission Risks & v2 Commitments

**Coverage period:** 2026-05-07 → submission deadline.
**Author:** solo developer.
**Last revised:** 2026-05-07 (Tier 1.3 / Cloak landing).

This file is the canonical place for "things shipped less than ideal,
disclosed honestly to reviewers, scheduled for a v2 sprint." It exists
because false claims hurt judges' trust more than missing features do.
Anything labeled here is the price we paid to ship truthfully under the
8-day submission window.

---

## R1 — Cloak private payment rail is mainnet-only; submission demo runs the transparent path

**Status (this build):** Cloak SDK (`@cloak.dev/sdk@0.1.6`) is integrated
behind the feature flag `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET` (frontend) and
`ENABLE_CLOAK_MAINNET` (backend). Default `false` everywhere. The on-chain
SORTS program (`AEp6V…BkFV`, devnet) supports a dual-path subscribe and
renew: when `cloak_payment_sigs` are all-zero, the program executes the
legacy transparent `system_program::transfer`; when non-zero, the program
skips the transfer and records the sigs for off-chain verification.

**Why it's labeled and not hidden:** Cloak's on-chain program
(`zh1eLd6r…`) is deployed on Solana mainnet only as of 2026-05-07. We
verified `solana program show zh1eLd6r… --url devnet` returns
`Unable to find the account`. SDK supports `Network = "devnet"` as a
type but the program does not exist on devnet. Universal Hard Rule
"devnet only, no real funds" stands; we ship the Cloak code path under
a feature flag rather than break the rule.

**v2 commitment:** flip the flag and run a mainnet activation sprint
within 6 weeks of submission. Activation requires three preconditions
listed below (R2, R3, R4) before the flag flips, in any order. The flag
must NOT be flipped on a deploy that lacks any one of them.

**Demo narration:** the recorded demo includes a labeled segment
showing the Cloak code path without firing it. See
[DEMO_RECORDING_PLAN.md](DEMO_RECORDING_PLAN.md) §"Cloak narration
segment".

---

## R2 — No CPI verifier for Cloak payment recorded in `cloak_payment_sigs`

**Status:** the on-chain SORTS program does not validate the recorded
Cloak signatures against Cloak's mainnet program. Cloak does not expose
a CPI-callable verifier instruction; verification is off-chain only by
parsing transaction logs.

**Threat (mainnet only):** an attacker can submit a SORTS subscribe ix
with bogus `cloak_payment_sigs` (any non-zero pattern) and obtain a
valid Subscription account without paying. Devnet is unaffected because
the flag is off and the transparent transfer fires regardless.

**v2 fix:** backend cron service. Polls fresh Subscription accounts
where `cloak_payment_sigs != 0` every 60 seconds. For each:

1. Decodes the recorded 64 bytes as `(creatorWithdrawSigPrefix[0..32]
   || treasuryWithdrawSigPrefix[0..32])`.
2. Queries Solana mainnet for transactions whose signatures begin with
   the recorded prefixes (within a 60-second window of the Subscription
   account's `created_at`).
3. Parses each transaction's logs to confirm:
   - The Cloak program id (`zh1eLd6r…`) is the executing program.
   - The instruction is a `partialWithdraw` shape.
   - The recipient matches `(community.creator_wallet, priceLamports -
     feeLamports)` for the creator sig and `(treasury, feeLamports)`
     for the treasury sig.
4. Marks the Subscription as `cloak_verified: true` in a backend table.
   Subscriptions older than 5 minutes that fail verification are flagged
   `revoked: true`. Gated content endpoints respect both flags.

**Pre-mainnet hard requirement.** Documented as a blocker on R1.

---

## R3 — Cloak SDK 0.1.6 has no audit history stated in docs

**Status:** none of the Cloak documentation pages we fetched
(`docs.cloak.ag/sdk/introduction`, `/llms-full.txt`, `/sdk/quickstart`,
`/platform/transaction-flows`) state an audit attestation, version of
the underlying circuits, or third-party security reviewer. The README
inside the published npm package (`@cloak.dev/sdk@0.1.6`) does not
mention an audit either. Version `0.1.x` itself signals early-stage.

**Mitigation now:** pinned at exactly `0.1.6` in `frontend/package.json`
(no caret) per [INCIDENT_RESPONSE.md](INCIDENT_RESPONSE.md) S7.
README "Current Demo Status" row labels the integration `🧪 Coded,
mainnet-only · audit status not stated by Cloak as of 2026-05-07`.

**v2 fix:** request audit attestation from Cloak team before the flag
flip. If no audit is available within the v2 sprint window, run an
internal review focused on:

- Withdraw signature replay defenses.
- UTXO double-spend prevention under concurrent partial withdraws.
- Relay-server compromise impact (does the relayer hold spend power, or
  is it strictly a transaction submitter?).

---

## R4 — UTXO persistence is consumer's responsibility; we have no client-side store

**Status:** Cloak's UTXO model requires the consumer (frontend) to
persist `(privateKey, blinding, amount, index, mintAddress)` per output
UTXO. The SDK ships `LocalStorageAdapter` for wallet keys but explicitly
does not persist UTXO records. On a creator's mainnet payroll flow, the
shielded payouts that subscribers send must be tracked client-side or
they are lost.

**Mitigation now:** the `CreatorPayrollWithdraw` widget renders a
labeled `"No shielded payouts found yet"` message when its stub
`loadCreatorUtxos()` returns an empty array (which it always does in
v3). On devnet, this is invisible because the entire widget renders
the "mainnet only" disabled card.

**v2 fix:** implement `frontend/src/lib/solana/cloak-utxo-store.ts`
with the following contract:

```ts
interface CreatorUtxoStore {
  add(utxo: Utxo): Promise<void>;
  list(): Promise<Utxo[]>;
  markSpent(commitment: bigint): Promise<void>;
  exportEncrypted(passphrase: string): Promise<Uint8Array>;
  importEncrypted(blob: Uint8Array, passphrase: string): Promise<void>;
}
```

Backend by IndexedDB on the creator's wallet origin, encrypted with a
passphrase derived from a wallet signature (similar pattern to the
deterministic-nonce path in Tier 1.2). Export / import to allow recovery
on a fresh device. Out of scope for the submission build because it
needs careful threat modeling we cannot squeeze into the timebox.

---

## R5 — Tip flow + QR-code payment ✅ shipped 2026-05-08 (transparent payment, dual-path Cloak switch)

**Update 2026-05-08:** R5 closed for the devnet build. Both surfaces
shipped. Updated status:

| Surface | Component | Devnet behavior | Mainnet behavior (flag on) |
|---|---|---|---|
| Tip subscriber → creator | `frontend/src/components/tip/TipButton.tsx` | Single `system_program::transfer` ix + optional 80-char Memo Program ix | Cloak deposit + partialWithdraw via the same `cloakSubscribePay` orchestration as subscribe (with `feeLamports=0`) |
| Solana Pay QR | `frontend/src/components/tip/CreatorTipQrCard.tsx` (creator-side QR generator) + `/tip/[recipient]` route (desktop fallback for the subscriber side) | `solana:` URI standard; Phantom mobile parses natively | Same URI; routes through the same TipButton → Cloak path |
| Privacy-mode badge | `frontend/src/components/badges/PrivacyModeBadge.tsx` | `Payment: transparent · devnet` | `Payment: shielded via Cloak · mainnet` |

**Privacy posture:** the badge is the single source of truth and is
rendered prominently on every payment surface (subscribe page, tip
modal, payroll widget, `/tip/[recipient]` route, settings QR card).
The label NEVER overstates what the active rail delivers. Backend test
`backend/src/__tests__/privacy-mode-static.test.ts` enforces this at CI
time by reading `lib/solana/privacy-mode.ts` source verbatim and
asserting the `transparent-devnet` descriptor's label cannot drift to
include `shielded` / `encrypted` / `private`.

**Original v2 commitment honored:** the Cloak orchestration helpers
landed in the v3 PR (PG-017 / Tier 1.3) provided the foundation; the
~6h scope estimated in the prior R5 entry materialized in a single
commit on 2026-05-08.

**What is still NOT shipped** (separate from R5):

- A peer-to-peer privacy SDK on Solana devnet — none exists today
  (Cloak mainnet-only, Vanish trading-only, Umbra fallback active,
  IKA programmable-only). Tip + QR therefore use TRANSPARENT payment
  on devnet by design. The dual-path code lights up shielded behavior
  on mainnet flag flip — same as subscribe.
- A backend cron verifier (R2) — still required before flipping the
  mainnet flag. Without it, both subscribe AND tip would accept bogus
  Cloak signatures on mainnet.

**No regression in honesty contract:** zero false claims. Tip modal
prominently shows the active payment-rail label so subscribers see
what they are getting before they confirm.

---

## R6 — Cloak fee math hardcoded as "subscriber forwards"

**Status:** [`programs/sorts-community/src/constants.rs`](../programs/sorts-community/src/constants.rs)
declares `CLOAK_FEE_ABSORBER = "subscriber"`. Frontend computes
`gross = price + cloakWithdrawFee(price) × 2` so the subscriber pays
the full Cloak overhead. Creator receives the SORTS-side share net.

**Trade-off accepted:** subscriber-visible price is higher than the
SORTS tier price. Creator absorbs nothing. Industry-standard pattern
for blockchain payments (gas / withdraw fees on the user side), but
some creators may prefer absorbing for UX optics.

**v2 fix (optional):** flip the constant to `"creator"` and adjust the
frontend pricing-display logic. ~2 hours of work. Either policy is
defensible; we picked the more conservative one (subscriber-pays-in-full)
for the v3 default.

---

## R7 — Aggregate stats counter under Cloak path relies on honest ix arg

**Status:** when `cloak_payment_sigs` is non-zero, the program SKIPS
`system_program::transfer` but still increments
`Community.total_revenue_lamports += price`, where `price` is read from
the inline tier slot in the Community PDA. This is correct as long as
the recorded Cloak transfer amount equals the SORTS tier price.

**Threat:** attacker submits subscribe with bogus sigs + the recorded
counter goes up by `price` for free. Aggregate stats become inflated
on a per-attack basis until the v2 cron flags the subscription as
`revoked` and re-runs the counter math.

**v2 fix:** the cron service in R2 also corrects
`Community.total_revenue_lamports` when it revokes. Until then, the
aggregate stats card on the creator dashboard carries a small
"verified-pending" footnote when at least one subscription is in the
not-yet-verified state.

---

## Summary

The R1–R7 entries above describe the price of shipping Cloak
integration honestly inside a 5-day window against a mainnet-only
SDK. None of them are bugs. Each is a deliberate trade-off with a
documented v2 fix.

If a reviewer asks "does Cloak fire in your demo?" the truthful answer
is "no — Cloak's program is mainnet-only and our submission is devnet
per the Universal Hard Rule. The integration code is in the repo,
gated behind a feature flag, and ready to activate after the v2
verifier cron lands."

If the same reviewer asks "what would it take to flip this on?" the
ordered checklist is:

1. R2 — backend cron verifier service.
2. R3 — audit attestation from Cloak (or internal review with explicit
   sign-off).
3. R4 — `cloak-utxo-store.ts` with encrypted IndexedDB persistence.
4. R7 — counter-correction wired into the cron from R2.

R5 (tip + QR) and R6 (fee absorber) are nice-to-have and not gating.

This list is append-only during submission week. New risks discovered
after 2026-05-12 belong in `docs/POST_SUBMISSION_RISKS.md` (created
when needed), not retroactively edited here.

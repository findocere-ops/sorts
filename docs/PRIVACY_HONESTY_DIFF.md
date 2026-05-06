# SORTS — Privacy honesty diff (pre-Colosseum)

**Status:** ANALYSIS ONLY. No file changes applied. Awaiting user approval before edits.

## Counter-thesis review — both concerns verified by code

Two structural privacy regressions confirmed by reading the on-chain
program and the backend service:

### Concern 1 — Member graph IS enumerable on-chain

`programs/sorts-community/src/state.rs:42`:

```rust
#[account(discriminator = 3, set_inner)]
#[seeds(b"subscription", community: Address, subscriber: Address)]
pub struct Subscription {
    pub community: Address,    // plaintext
    pub subscriber: Address,   // plaintext
    pub expiry_ts: i64,
    pub tier_commitment: [u8; 32],
    pub salt_pubkey: Address,
    pub bump: u8,
}
```

Anyone can call `connection.getProgramAccounts(programId, { filters: [{ memcmp: { offset: 0, bytes: '3' } }] })` and dump every Subscription account. Each row exposes `(community, subscriber)` as plaintext pubkeys. Backend already uses this exact pattern for `getCreatorCommunities` against Community accounts (`backend/src/services/chain/SolanaService.ts:147–152`). The same memcmp scan against Subscription rebuilds the full member graph in one RPC call.

**Product-surface protection still exists:** SORTS UI + API never expose this. **On-chain protection does not.**

### Concern 2 — Tier brute-force is trivial

`programs/sorts-community/src/logic.rs:31–39`:

```rust
pub fn tier_commitment(level: u8, salt: &Address, program_id: &Address) -> [u8; 32] {
    let level_bytes = [level];
    let derived = Address::derive_address(
        &[b"SORTS_TIER_V1", &level_bytes, salt.as_ref()],
        None,
        program_id,
    );
    derived.to_bytes()
}
```

`level ∈ {1, 2, 3}`. `salt_pubkey` is stored on the Subscription account as a public field. Three derivations to find which level matches the on-chain `tier_commitment`. Tier reveal is constant-time per subscriber.

**This is a commitment, not a hiding scheme.** Calling it "tier hidden" is wrong. Calling it "tier not stored as a plaintext field" is technically accurate but materially misleading.

---

## Replacement framing (the honest differentiation)

Three pillars that survive the review:

1. **Product-surface privacy.** Creator UI + every SORTS API never expose member lists, tiers, or per-member data. The creator dashboard cannot reach individual subscribers through any product path. TRUE.

2. **Commitment scheme as bar-raising.** The on-chain layout stores `tier_commitment + salt`, not a plaintext `level` column. A casual indexer scraping account tables sees opaque 32-byte values. A determined attacker brute-forces 3 candidates and learns the tier — still trivial, but distinct from leaking it on a column read. Honest framing: "commitment, not hiding".

3. **Umbra v2 is the encrypted-state roadmap.** When Umbra ships devnet programs we swap `UmbraPrivacyService.evaluateEntitlement` to read encrypted-balance entitlement; the on-chain Subscription account becomes a registration token, not a tier carrier. Public claim: v2 closes the on-chain gap.

Differentiation from Skool / Patreon / Whop survives without overclaiming:

- Skool/Patreon: creator sees a member roster + tier per row by design. SORTS: aggregate counters only. **Product-surface diff: real.**
- Skool/Patreon: identity = email/username on a centralised server. SORTS: identity = Solana wallet, no email-keyed roster. **Identity model diff: real.**
- Skool/Patreon: payment = Stripe with off-chain ledger. SORTS: payment = on-chain SOL with 5/95 split at the program level. **Money rail diff: real.**
- SORTS v1 commitment scheme: lifts the bar over a plaintext column. v2 with Umbra: closes on-chain enumeration. **Roadmap diff: real.**

The honest pitch line: "SORTS hides membership state in the product surface and behind a commitment scheme on-chain. Full encrypted-state membership lands in v2 via Umbra. We do not claim hiding from a determined on-chain investigator today."

---

## Diff table

Cells in **Original** quote the file verbatim. **Replacement** preserves the differentiation pillar but drops the overclaim.

| File:Line | Original | Replacement | Why |
|---|---|---|---|
| `docs/COLOSSEUM_WINNER_SPEC.md:7` | "SORTS lets creators sell recurring access to private communities while subscribers prove membership without exposing a public member graph." | "SORTS lets creators sell recurring access to private communities. Subscribers prove membership against an on-chain commitment, with member identity hidden in the SORTS product surface (creator dashboard, APIs, public UI). On-chain Subscription accounts are publicly indexable today; the v2 path moves entitlement to Umbra encrypted balances." | Subscription PDA seeds embed plaintext `subscriber` — `getProgramAccounts` rebuilds the graph. "Without exposing a public member graph" is wrong on-chain. Honest version still differentiates from Skool by emphasising the product-surface guarantee + the v2 path. |
| `docs/COLOSSEUM_WINNER_SPEC.md:21` | "3. Membership state is private or non-leaky." | "3. Membership state is hidden in the SORTS product surface and stored on-chain as a commitment+salt, not a plaintext tier column. On-chain enumeration is possible today; v2 closes it via Umbra encrypted balances." | "Private or non-leaky" is materially false against an on-chain investigator. Replacement keeps the demo bullet but is verifiable. |
| `docs/COLOSSEUM_WINNER_SPEC.md:55` | "hidden or non-leaky membership state," | "commitment-based membership state with no plaintext tier on the chain (brute-forceable today; encrypted-balance v2 via Umbra is the roadmap)," | Same as above. Calling tier_commitment "hidden" implies hiding. It is a commitment. |
| `docs/COLOSSEUM_WINNER_SPEC.md:90` | "no wallet member list." | "no wallet member list in the SORTS dashboard or API (the on-chain Subscription accounts are publicly indexable; this is documented in the demo doc)." | The dashboard claim is true. The implicit "you cannot see members at all" is false. Disclose the on-chain side. |
| `docs/COLOSSEUM_WINNER_SPEC.md:106–108` | "1. Public UI never shows a member list. 2. Creator dashboard shows aggregate stats only. 3. API does not return raw hidden balances, raw private tier values, or member wallet lists." | "1. Public UI never shows a member list. 2. Creator dashboard shows aggregate stats only. 3. API does not return per-member data, tier values, or member wallet lists. 4. On-chain Subscription accounts are publicly readable; tier values are stored as commitments rather than plaintext columns, but a 3-candidate brute force over the salt + level reveals the tier. v2 (Umbra encrypted balance) closes this." | Adds the disclosure. Keeps the three SORTS guarantees that ARE real. |
| `docs/COLOSSEUM_WINNER_SPEC.md:175–185` (Layer 3 Umbra section) | "Use Umbra for: registration status, hidden/encrypted balance membership state, private entitlement checks, optional compliance grants. Do not expose hidden balance values in API responses." | "Day-4 cut-line: real Umbra integration is not active in this build (devnet programs unavailable; see `docs/SOLANA_PHASE2_DEMO.md` Known limitations). Privacy mode in this build reads `on-chain-commitment-fallback`. The Umbra service boundary stays so v2 swap is one-line. Demo MUST surface this label and not imply Umbra hiding is live." | The current Umbra section sounds like Umbra hiding is live. Day-4 cut-line says it isn't. Calibrate. |
| `docs/COLOSSEUM_WINNER_SPEC.md:264` (3-min video) | "private membership state powers access." | "commitment-based membership check powers access today; encrypted-balance hiding via Umbra is the roadmap." | Video voiceover should match what the on-chain code does. |
| `docs/COLOSSEUM_WINNER_SPEC.md:262–265` (Problem narration) | "Paid communities leak too much. Your wallet can reveal what you subscribe to, your net worth, and your community graph." | "Paid communities leak too much. Wallets reveal what you subscribe to. SORTS can't fully fix that today — what we can do is keep your tier and identity out of the creator's product surface, and move toward encrypted-state membership in v2 via Umbra." | If the next sentence claims SORTS solves the leak, the narration becomes the broken promise. Pair the problem with the scoped fix. |
| `docs/COLOSSEUM_WINNER_SPEC.md:281` | "no public member list," | "no member list in the SORTS app or API (Solana account state is independently indexable; commitment scheme raises the bar over plaintext columns)." | Same disclosure pattern. |
| `docs/COLOSSEUM_WINNER_SPEC.md:304` | "The privacy claim is accurate and not overstated." | "The privacy claim is scoped: hidden in the SORTS product surface; on-chain commitment-based; full encrypted-state membership planned for v2." | Currently the line is aspirational; replacement is the actual judging criterion. |
| `README.md:1–5` | "SORTS is a Solana-first platform for private paid communities. It helps creators sell recurring access to gated content, Telegram/web spaces, and premium community workflows while keeping subscriber identity and membership state non-leaky." | "SORTS is a Solana-first platform for paid communities with privacy-conscious membership rails. It helps creators sell recurring access to gated content, Telegram/web spaces, and premium community workflows while keeping subscriber identity and membership state out of the creator dashboard, the SORTS APIs, and the public UI. The on-chain Subscription account is independently indexable; the commitment scheme raises the bar above plaintext tier columns and the v2 roadmap moves entitlement under Umbra encrypted balances." | Replaces "non-leaky" (false) with "privacy-conscious" + the scoped explanation. Differentiation pillars (product-surface, commitment, v2) preserved. |
| `README.md:18` | "No public subscriber wallet list." | "No subscriber wallet list in the SORTS app, dashboard, or API. (On-chain Subscription accounts are publicly readable; the SORTS surface never indexes them.)" | True version of the same claim. |
| `README.md:24` | "No public member graph exposed by the app." | "No member graph exposed by the SORTS app. (Solana account state is independently public; the SORTS UI never aggregates or surfaces it.)" | Disclose the on-chain side; affirm the app-side guarantee. |
| `README.md:30–35` | "SORTS must preserve these invariants: - No public member list. - No enumerable member registry. - Creator dashboards show aggregate stats only. - APIs must not return raw hidden balances, raw private tier encodings, or subscriber wallet lists. - Experimental privacy layers must be labeled honestly." | "SORTS preserves these invariants in the SORTS product surface (creator dashboard, public UI, every API): - No member list. - No member registry. - Creator dashboards show aggregate stats only. - APIs must not return per-member data, tier values, or subscriber wallet lists. The on-chain Solana program does not provide an additional anti-enumeration guarantee in v1; that is the v2 Umbra encrypted-balance roadmap." | "No enumerable member registry" is wrong on-chain. Move the scope to "in the SORTS surface" and explicitly carve out the on-chain layer. |
| `README.md:39–41` (Umbra paragraph) | "Umbra is used for Solana hidden membership-state experiments and encrypted-balance-style entitlement checks." | "Umbra is the planned v2 source-of-truth for entitlement checks. In this devnet build the integration is gated by a cut-line — `UmbraPrivacyService` returns `on-chain-commitment-fallback`, derived from the Subscription account's commitment+salt. Real encrypted-balance entitlement lands when Umbra ships devnet programs." | Says what we actually do today. |
| `README.md:89` (Current Demo Status) | "Aggregate-only creator analytics ... ✅ Live ... No member lists, ever" | "Aggregate-only creator analytics ... ✅ Live in the SORTS dashboard + API. (Solana accounts remain independently indexable.)" | "Ever" is too strong; replace with the scoped version. |
| `CLAUDE.md (root):6` | "Creators deploy on-chain membership contracts; subscribers get cryptographically-gated content delivered through a web app and Telegram bot. Individual membership data is never exposed." | "Creators deploy on-chain membership programs; subscribers get gated content delivered through a web app and Telegram bot. Individual membership data is never exposed in the SORTS product surface (creator dashboard, APIs, public UI). The on-chain Subscription account is independently indexable; we use a commitment scheme on tier and plan to move entitlement to Umbra encrypted balances in v2." | Replaces "cryptographically-gated" + "never exposed" (both overclaims) with the scoped version. |
| `CLAUDE.md (root):26` | "Creators NEVER see individual member wallet addresses or tiers." | "In the SORTS product, creators NEVER see individual member wallet addresses or tiers. (The on-chain account state is publicly readable by anyone running their own RPC; SORTS does not surface it.)" | Project-level rule should be honest about its scope. |
| `.claude/CLAUDE.md:42` | "the on-chain `Subscription` account stores only `tier_commitment + salt_pubkey`." | "the on-chain `Subscription` account stores `tier_commitment + salt_pubkey` (no plaintext `level` column). The commitment is brute-forceable across the 3 candidate levels — this raises the bar over a plaintext column but does not hide the tier from a determined attacker. v2 path: Umbra encrypted balance." | The phrasing "stores only" implies privacy guarantee that the commitment scheme doesn't deliver. |
| `.claude/CLAUDE.md:58` (invariant 2 rephrasing) | "Subscription account never stores plaintext `level` (only commitment+salt)" | "Subscription account never stores plaintext `level` (only commitment+salt). NOTE: 3-candidate brute-force reveals the tier; this raises the bar above plaintext columns but is not hiding. Captured by privacy-grep as written." | Keep the invariant; add the calibration. |
| `frontend/src/components/privacy/UmbraMembershipCard.tsx:60` (fallback body) | "Membership entitlement is derived from the on-chain Subscription PDA. Your tier level is never stored in plaintext; only a tier_commitment plus a salt are written by the program." | "Membership entitlement is derived from the on-chain Subscription PDA. Your tier level is stored as a commitment over (tier, salt), not as a plaintext column — but the salt is on-chain too, so an attacker brute-forcing 3 candidate tiers can reveal it. The SORTS app never surfaces tier on a per-member basis. The v2 path uses Umbra encrypted balances and removes the on-chain reveal." | This is the most user-visible overclaim. The replacement is longer; can be trimmed if needed (see "compact" variant below). |
| `frontend/src/components/privacy/UmbraMembershipCard.tsx:60` (compact variant) | (same as above) | "Membership entitlement is derived from the on-chain Subscription PDA. Tier is stored as a commitment+salt, not a plaintext column. SORTS does not surface tier per-member anywhere; the v2 path moves entitlement under Umbra encrypted balances for stronger on-chain hiding." | Compact, screen-friendly, retains the v2 hook. |
| `frontend/src/components/privacy/UmbraMembershipCard.tsx:91` (footer) | "Information shown here is aggregate to the wallet itself; tier level and member count are never exposed." | "This card shows your own membership liveness only — never another wallet's. The SORTS app never exposes tier values or member counts per community in any UI or API. (Solana account state is publicly readable; the commitment scheme reduces but does not eliminate on-chain leakage of tier.)" | "Never exposed" is false at the chain level. The card-scoped privacy guarantee is real and worth stating; the global guarantee needs the disclosure. |
| `frontend/src/components/privacy/UmbraMembershipCard.tsx:84–88` (fallback caption) | "Devnet experimental — encrypted membership state coming via Umbra in v2. The current build derives entitlement from on-chain commitments only." | "Devnet experimental — entitlement is derived from on-chain commitments today (commitment+salt; not full hiding). Encrypted membership state via Umbra ships in v2 and removes on-chain enumeration." | Strengthens the honesty by saying "not full hiding". |
| `docs/SOLANA_PHASE2_DEMO.md:30–34` (Known limitations / Umbra) | "Umbra: ... we still derive entitlement from the on-chain Subscription PDA's `tier_commitment`, but we do **not** claim Umbra is active." | "Umbra: ... we derive entitlement from the on-chain Subscription PDA's `tier_commitment`. The commitment hides the tier from naive table reads but is brute-forceable across 3 candidates. The SORTS demo NEVER surfaces tier per-member, but a determined on-chain investigator can recover it. v2 (Umbra encrypted balance) closes this. We do **not** claim Umbra hiding is active in this build." | The paragraph already does some honesty work; the upgrade adds the brute-force disclosure that is the actual counter-thesis. |
| `docs/SOLANA_PHASE2_DEMO.md:24` (analytics row) | "AggregateStatsCard shows total / active / expired / revenue / posts — never any wallet, ENS, or tier breakdown." | "AggregateStatsCard shows total / active / expired / revenue / posts — never any wallet, ENS, or tier breakdown in the SORTS dashboard or API. The underlying Solana program does not provide an additional anti-enumeration guarantee in v1." | Card guarantee is real; explicit on-chain carve-out keeps the doc honest. |

---

## Things that are FINE as written (no change recommended)

- `frontend/src/components/badges/DevnetBadge.tsx`, `PreAlphaBadge.tsx` — both accurate, no privacy-related copy.
- `docs/SOLANA_PHASE2_DEMO.md:14` — "5/95 fee split" — verifiable, accurate.
- `docs/COLOSSEUM_WINNER_SPEC.md:138–146` ("Do Not Ship") — already lists "Public member list" as a non-goal — this is a goal-statement, not a guarantee, so it stays.
- `README.md:166–169` (Safety section) — `Do not add member enumeration` etc. are commands to internal builders, not external claims. Stay.
- All `tier_required` / `preview_eligible` UI labels in `studio/[cid]/content/page.tsx` — these are creator-facing tools, not privacy claims.
- `Telegram /status` reply ("never includes the substring 'tier' or any tier number") — this is a verifiable test claim about the reply text shape, not a privacy guarantee about the underlying chain. Stays.
- `IkaDWalletService` real-funds gate copy — accurate.

---

## Suggested order of edits when you approve

1. Apply `frontend/src/components/privacy/UmbraMembershipCard.tsx` first — it is on every join + feed page and is the most user-visible. Use the compact variant.
2. Apply `README.md` next — first impression for a Colosseum reviewer browsing the repo.
3. Apply `docs/COLOSSEUM_WINNER_SPEC.md` — judges read this directly.
4. Apply `docs/SOLANA_PHASE2_DEMO.md` — your own runbook.
5. Apply both `CLAUDE.md` files — least visible to outside reviewers but governs every future agent edit.

If you want a single sentence to anchor every edit, suggest:

> "SORTS hides membership state in the product surface and behind a commitment scheme on-chain. Full encrypted-state membership lands in v2 via Umbra. We do not claim hiding from a determined on-chain investigator today."

This sentence can be referenced from any later doc as the canonical scope.

---

## What this diff does NOT change

- Code in `programs/sorts-community/` — the on-chain layout stays. The honesty pass is about copy alignment with what the code actually guarantees.
- Tests — invariant 2 ("no plaintext `level` column") is still real and tested. The grep test passes; we are recalibrating what the invariant *means* in user-facing copy.
- Architecture — the v2 path (Umbra encrypted balance) was always the plan; this just stops claiming v2 guarantees in v1 copy.

---

## v2 implementation hooks that the new copy depends on

To keep the "v2 closes this" claim honest, the v2 PR has to land these:

1. `Subscription` PDA seed change OR a separate "membership token" PDA whose seeds do not embed `subscriber`. Stealth-address pattern (one-time recipient pubkey) is the standard fix.
2. `tier_commitment` replaced by Umbra encrypted-balance entitlement OR a high-entropy salt that is not stored on-chain (held client-side, recovered from the wallet's signing key).
3. `UmbraPrivacyService.evaluateEntitlement` reads encrypted-balance state instead of the on-chain commitment.

The post-Colosseum punch list in `docs/SORTS_TECH_OVERVIEW_FOR_AGENTS.md` §11 already flags items 1–3. Worth adding a one-line cross-reference from the README to the punch list when this diff is applied so the v2 promise has a follow-the-link.

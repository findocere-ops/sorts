# SORTS — UX research findings (first-time visitor audit)

**Audit date:** 2026-05-08 (Day 10 of 14, Colosseum deadline May 12).
**Persona under test:** a non-crypto-native creator who clicked through to
the SORTS landing for the first time. Did not arrive from a Twitter thread,
does not already know what Umbra / IKA / Privy are.
**Scope:** entire frontend at HEAD (post-v3-Cloak landing). Code unchanged
by this report — analysis only.

---

## TL;DR

What a first-time visitor encounters today, ranked roughly by drop-off
risk:

1. **Landing wall-of-text + protocol jargon at the top of the page.** The
   user lands on "Confidential communities, built for the onchain era" /
   "private subscription rails" / "hidden membership state" / "aggregate-only
   analytics" within 200 pixels. Three of these four phrases assume crypto
   fluency. Drop-off before they reach the FAQ.
2. **Wallet-shaped CTAs without explanation of which wallet.** "Connect
   Wallet" + "Sign in" + "Create a community" + "Join a community" all
   visible above the fold. The first three do different things; the user
   does not know that.
3. **Pre-alpha + Devnet + Disclaimer footer on every page.** Honest, per
   the privacy-honesty pass — but anxiety-inducing without a paired
   "what does work today" panel. New users read "PRE-ALPHA — NOT FOR REAL
   FUNDS" and assume the demo is broken.
4. **No try-before-connect path.** Almost every meaningful action requires
   wallet connect. There is no read-only sandbox, no demo community open
   to anonymous browsing without a quota gate.
5. **Privacy card copy is correct but unreadable.** `UmbraMembershipCard`
   shows "Privacy mode: on-chain-commitment-fallback" as monospace label.
   A subscriber sees a string they cannot parse.

The good news: the structure is solid. The fixes below are mostly copy +
placement + a small number of new components. None require touching the
on-chain program or the chain adapters.

---

## Section A — Critical (blocks first-time understanding)

### A1 — Hero promises four privacy properties, none with proof on screen
**Where:** `frontend/src/app/page.tsx:30-111` (hero section).
**What:** The H1 + subhead claim "No public subscriber list. No leaked
membership graph. Creator analytics stay aggregate-only." Below the hero
the "Community Preview Card" shows `Total members: 1,247 (aggregate only)`
— a hardcoded fixture, not live data. A user who pattern-matches "1,247
members" to "this number is real" then notices the preview is fake will
distrust the rest of the page.
**Why it matters:** Trust collapses on a single mismatch. A demo
community using `/api/analytics/community/<demo-cid>` against the actual
deployed program would land a real "12 members, 0.42 SOL revenue" card
and prove the aggregate-only claim by example.
**Suggested fix:** Replace the hardcoded preview with a live fetch
against the seeded demo community (`backend/scripts/seed-devnet-demo.ts`
already creates `demo-research`). Cache the response 60s. If the fetch
fails, show "—" placeholders and the explainer rather than fake numbers.
**Effort:** 30 min (existing endpoint, existing component).

### A2 — "Create a community" and "Sign in" coexist with no order
**Where:** Landing hero CTAs at `page.tsx` + `Navbar.tsx:69-91` marketing
nav.
**What:** Hero shows three primary CTAs (Create a community / Join a
community / View protocol demo). Top-right shows two more (Sign in /
Connect Wallet). A first-time visitor cannot tell which is the "start
here" path.
**Why it matters:** Five entry points = five chances to pick wrong. New
users freeze.
**Suggested fix:** Pick one primary path. Recommended order:
- **Visible primary CTA:** "See it work — 90 second demo" → `/demo`
  (a curated seeded community, no wallet required).
- **Secondary:** "Create a community" → `/studio/create`.
- **Tertiary, in nav:** "Sign in" → `/auth`.
Drop "Connect Wallet" from the marketing nav — it surfaces inside flows
already.
**Effort:** 1-2 hrs (new `/demo` page wraps existing `/join/[cid]` against
seeded community + visible-only-when-anonymous logic).

### A3 — Pre-alpha banner + Devnet badge + Disclaimer footer all fire
without a "what works" pairing
**Where:**
- `DisclaimerFooter.tsx:68-78` (every page, footer)
- `DevnetBadge.tsx:1-38` (topbar, every page)
- `PreAlphaBadge.tsx:1-31` (Umbra card, IKA card)
- `SignerCapabilitiesCard.tsx` (red/orange "PRE-ALPHA — NOT FOR REAL
  FUNDS" stripe at top of /account section)

**What:** A first-time visitor on a single screen sees four "this is not
production" disclosures stacked: topbar badge + IKA red stripe + Umbra
"v2 in progress" + footer "no real funds". The honesty pass landed all
of these correctly. The cumulative effect is "the demo is broken".
**Why it matters:** Trust modulation. We tell the visitor four times
what *isn't* working but never tell them what *is*.
**Suggested fix:** Add a paired "What works today" component near every
"pre-alpha" stripe. Bullet list, mirrored from README "Current Demo
Status" table:
- ✅ Solana devnet community creation
- ✅ Subscriber subscribe + access check
- ✅ Aggregate-only creator analytics
- ✅ Telegram delivery
- 🧪 Umbra v2 hiding (in progress)
- 🧪 IKA dWallet (pre-alpha)
The pair (✅ list + 🧪 list) reads as "calibrated", not "broken".
**Effort:** 2-3 hrs (one new `<DemoStatusCard />` component, three
mounting points).

### A4 — `UmbraMembershipCard` shows raw protocol strings to subscribers
**Where:** `UmbraMembershipCard.tsx:55-92` (rendered on `/join/[cid]`,
`/app/[cid]/feed`).
**What:** Card shows:
- Header heading: "On-chain commitment fallback"
- Field row: "Privacy mode: on-chain-commitment-fallback" (monospace)
- Field row: "Registered: yes / no"
- Field row: "Entitlement: active / inactive"
- Footer: "Devnet experimental — encrypted membership state coming via
  Umbra in v2"

The middle row is jargon. "Privacy mode" with a literal kebab-case
identifier is internal-API copy, not subscriber copy.
**Why it matters:** The card is the subscriber's primary trust signal.
If they cannot parse it, the privacy claim is invisible.
**Suggested fix:** Two variants of the card:
- **Subscriber view (default):** "Your tier and identity are hidden from
  the creator. The chain stores a commitment, not your tier." + a
  one-line explainer + an info icon → modal with the technical detail.
- **Developer / press view (opt-in via `?dev=1`):** the current monospace
  field row.
Keep the v2 callout. Drop the protocol-mode literal from the default view.
**Effort:** 1 hr (component split, one new modal).

### A5 — No anonymous "try the product" path
**Where:** every protected route gates on wallet connect.
**What:** A visitor cannot read a single full post body without:
- Connecting a Solana wallet (Phantom, Solflare),
- Holding devnet SOL (airdrop friction),
- Going through a 4-step wizard or a subscribe flow.

The 2-community preview quota exists in code (`preview-quota.ts`) but
fires at the API layer when a wallet is provided. Anonymous browsers
fall through to a "locked" view with no body content.
**Why it matters:** Demo flow ≠ adoption flow. We need both.
**Suggested fix:** Loosen the non-member content GET so anonymous
sessions get the full body of `preview_eligible` posts (already filtered
to 2 communities by IP via the existing quota middleware). The quota
prevents abuse; loosen the body-reveal predicate to allow read of
preview posts for anonymous visitors. The seeded `demo-research-p1`
("Welcome to the On-chain Research Lab") is already marked
`preview_eligible: true`. Make it readable.
**Effort:** 30 min route handler tweak. **Caveat:** route the
predicate change through privacy-grep + security-auditor — invariant 9
must still hold (only `preview_eligible` posts unlock; everything else
stays locked).

---

## Section B — High (causes drop-off mid-flow)

### B1 — `/studio/create` wizard surfaces tier price as raw "0.05" with no unit hint until Step 3
**Where:** `frontend/src/components/studio/CreateCommunityWizard.tsx`,
`wizardSteps/TiersStep.tsx`.
**What:** The Tier price input is a text field with no inline currency
hint. The wizard converts decimal SOL × 1e9 to lamports under the hood
(per Day 3 wizard refactor). Creators looking at "0.05" do not know
whether that is SOL, USDC, or a percentage.
**Why it matters:** Pricing mistakes are hard to undo on-chain. We've
all seen creators set a price 1000× lower than intended.
**Suggested fix:** Inline unit suffix `SOL` next to the input + a
hover-tooltip showing the lamport conversion + a "monthly recurring"
clarifier. Add a "0.05 SOL ≈ $5.40 USD at $108/SOL today" exchange-rate
hint pulled from CoinGecko free tier (cache 1 hr). Mark the rate as
"approximate, devnet" so we don't overclaim.
**Effort:** 2 hrs.

### B2 — `/role` page exists but is not on the obvious path
**Where:** `frontend/src/app/role/page.tsx`.
**What:** A `/role` route exists (creator vs subscriber picker) but the
landing CTAs bypass it ("Create a community" → /studio/create directly).
Users who land on `/auth` first then sign in get pushed to `/role`. The
inconsistency means some users see role choice, others don't.
**Why it matters:** Two-funnel UX is fine; *random* two-funnel UX is
confusing.
**Suggested fix:** Pick one. Either:
- Drop `/role` and rely on the landing CTAs (fewer pages = simpler).
- Or route `/auth` success → `/role` always, and `/role` is the only
  place CTAs live.
**Effort:** 1 hr.

### B3 — Loading states are bare "Loading…" text everywhere
**Where:** `/join/[cid]/page.tsx`, `/app/[cid]/feed/page.tsx`,
`/studio/[cid]/analytics/page.tsx`, `/account/page.tsx`.
**What:** Every page that fetches data shows
`<p className="t-sm">Loading…</p>` for the first 1-3 seconds. On slow
RPC + Render cold start, the text-only state can persist 5-8 seconds
without a progress signal.
**Why it matters:** Static "Loading…" text reads as "stuck".
**Suggested fix:** Skeleton screens for the three highest-traffic
pages: landing community preview card, /join card, /app feed list.
Match the visual rhythm of the loaded state (card outline, ghost text
bars). Tailwind has `animate-pulse` built-in — ~15 lines of JSX per
skeleton.
**Effort:** 2-3 hrs total.

### B4 — Empty states say "No content has been published yet" but don't help the visitor
**Where:** `MvpStates.tsx:243-253` `NoContentPublished`.
**What:** Body: "This community exists, but there are no published
posts to show. Members will see new posts here once the creator
publishes them." Doesn't tell the visitor what to do next, doesn't link
back to discover.
**Why it matters:** Empty state should always have a forward action.
**Suggested fix:** Add a secondary CTA: "Browse other communities" →
`/discover`. Keep the body copy, just add the link.
**Effort:** 5 min.

### B5 — `WrongNetworkState` says "Switch to Arbitrum Sepolia" by default
**Where:** `MvpStates.tsx:268-293`.
**What:** The empty state hardcodes "Switch to Arbitrum Sepolia" — but
the primary chain is now Solana devnet (per Day-3 chain-aware refactor).
A user on `/studio/create` (default Solana path) seeing this banner
asks: "Wait, why am I switching to Arbitrum?"
**Why it matters:** Looks like a regression from the chain-aware story
the rest of the product tells.
**Suggested fix:** Make `WrongNetworkState` chain-aware. When
`adapter.chain === 'solana-devnet'`, body says "Switch your wallet to
Solana devnet". Keep the Arbitrum branch for the legacy `?chain=` flow.
**Effort:** 30 min.

### B6 — Privacy card position is too far below the fold on `/join/[cid]`
**Where:** `frontend/src/app/join/[cid]/page.tsx`.
**What:** The order on the join page is:
1. Community name (H1)
2. Description paragraph
3. **UmbraMembershipCard** (privacy disclosure)
4. "Subscribe" button

The privacy card — the load-bearing differentiation visible to a new
subscriber — sits below the description. On a phone the card is below
the fold for descriptions longer than 200 chars.
**Why it matters:** The card is the reason someone subscribes here
instead of Patreon.
**Suggested fix:** Move the privacy card above the description, or pin
it to the right column on desktop with a shorter "your identity is
hidden from the creator" tagline that links to the full card lower on
the page.
**Effort:** 30 min.

---

## Section C — Medium (polish for trust + speed)

### C1 — No global search affordance on landing
**Where:** `Navbar.tsx` `MarketingNav` vs `AppTopBar`.
**What:** Anonymous visitors get the marketing nav (no search box).
Authenticated users get a search box. New users cannot search for "alpha"
or "research" without logging in first.
**Suggested fix:** Add a public search-by-category to the landing's
"Browse communities" CTA. Surface 3-5 seeded categories as chips.
**Effort:** 1.5 hrs.

### C2 — Microcopy length on FAQ answers is great; FAQ visibility is poor
**Where:** `page.tsx:345-402`.
**What:** Six FAQs are written well. They live below the role-split
section, which means new users have already scrolled past 5 sections of
hero / problem / privacy / role to reach them. By that point most have
bounced.
**Suggested fix:** Move 1-2 high-value FAQs ("Can the creator see who
subscribed?", "Is this production-ready?") into the hero as inline
collapsibles or as quote cards. Keep the full FAQ at the bottom for
search-engine + deep-readers.
**Effort:** 1 hr.

### C3 — `SignerCapabilitiesCard` capability matrix is opaque to non-developers
**Where:** `SignerCapabilitiesCard.tsx`.
**What:** The matrix shows columns `prepare / sign / broadcast` × rows
`solana-devnet / arbitrum-sepolia` with cells "✓ pre-alpha" or "—". A
subscriber browsing /account does not know what `prepare` means.
**Suggested fix:** Replace column headers with verbs from the
subscriber's frame:
- "prepare" → "Build a transaction"
- "sign" → "Sign with your wallet"
- "broadcast" → "Send to the network"
Or hide the matrix behind a "show technical details" toggle and show by
default a single-line summary: "IKA dWallet is in pre-alpha. Once it
ships, you'll be able to sign Solana and Arbitrum transactions from one
account."
**Effort:** 1 hr.

### C4 — `MessageApprovalLifecycle` 6-state stepper renders even when no approval is pending
**Where:** `MessageApprovalLifecycle.tsx` mounted unconditionally on
`/account` page.
**What:** The stepper shows `prepared → awaiting-approval → ... → failed`
with no real approval flowing through it. To a new user this looks like
"there's an action pending I haven't done".
**Suggested fix:** Hide the component when the parent state is `idle`
and there is no real approval to display. Show only when a
`MessageApproval` row exists. Add a "no pending approvals" empty state
that doesn't surface 6 unreached steps.
**Effort:** 30 min.

### C5 — `MultichainAssetPanel` shows "— SOL / — ETH" placeholder values
**Where:** `MultichainAssetPanel.tsx`.
**What:** Pre-alpha placeholder showing two rows with em-dash values.
Reads as "balance failed to load" rather than "feature not yet active".
**Suggested fix:** Replace dash values with explicit "Coming with IKA
v2" text. Or hide the panel entirely behind a feature flag until v2
lands.
**Effort:** 15 min.

### C6 — No tx-status announcer for screen readers
**Where:** `TransactionState` in `MvpStates.tsx:295-323`.
**What:** Component renders pending / success / failed states but uses
no `aria-live="polite"` region. A screen-reader user who fired a tx
gets no audible state change.
**Suggested fix:** Wrap the `TransactionState` body in
`<div aria-live="polite" aria-atomic="true">`.
**Effort:** 5 min.

### C7 — `BasicsStep.tsx` has no example or constraint hint for "Symbol"
**What:** Symbol input has placeholder "ALPHA" but no character limit hint
or "must match name" guidance. A creator types "ALPHATRADERS123" and
discovers downstream the program enforces ≤8 chars.
**Suggested fix:** Inline character counter `0/8` + a "max 8 chars,
A-Z" hint.
**Effort:** 15 min.

### C8 — `/discover` page exists but is not surfaced in marketing nav
**What:** The marketing nav at `Navbar.tsx:69-91` lists "Features /
Privacy / Pricing / Docs". None of those exist as routes; "Pricing"
is buried in the FAQ; "Docs" 404s. Meanwhile `/discover` (the
discoverable community list) is not linked from the marketing nav.
**Suggested fix:** Replace the four placeholder links with three real
ones: "Discover" (→ `/discover`), "Privacy" (→ landing#privacy), "FAQ"
(→ landing#faq).
**Effort:** 15 min.

---

## Section D — Low (nice-to-have for polish)

### D1 — Hero "Solana devnet launch sprint" status pill is internal-team copy
**Where:** `page.tsx:30-40` (status pill at the top of the hero).
**What:** The pill says "Solana devnet launch sprint" — phrased as if the
team is talking to itself. Visitors translate this as "this is a
work-in-progress, come back later".
**Suggested fix:** "Live on Solana devnet — try the demo". Same status
pill style, calibrated to the visitor's frame.

### D2 — No favicon / OpenGraph image variations for social shares
**Where:** `frontend/src/app/layout.tsx` Metadata + `frontend/public/`.
**What:** Standard Next.js metadata; haven't verified OG image renders
on a Twitter / LinkedIn paste.
**Suggested fix:** Generate a 1200×630 OG image with the H1 + Devnet
badge. Saves a "what's this link" reaction on shares.

### D3 — Footer copyright says "© 2026 SORTS Protocol — Private subscription rails"
**What:** Repeats the H1 verbatim. Wastes a chance to link to the
GitHub repo, the Telegram, or the demo video.
**Suggested fix:** Add three small links in the footer: GitHub, Demo
video, Twitter / X.

### D4 — Dark mode is the only theme
**What:** The CSS variables in `globals.css` define one color palette.
Dark-only is fine for crypto product, but accessibility-conscious
reviewers (and grant readers in bright offices) will wish for a light
mode.
**Suggested fix:** Add a `prefers-color-scheme: light` block in
`globals.css` post-Colosseum. Not blocking for May 12.

### D5 — No skip-link for keyboard users
**Where:** `frontend/src/app/layout.tsx`.
**What:** No `<a href="#main">Skip to content</a>` at the very top of
every page. Screen-reader + keyboard-only users have to tab through the
nav every time.
**Suggested fix:** One-line addition to root layout.
**Effort:** 5 min.

---

## Section E — Things that already work (don't change)

For balance — these are the existing UX wins. The reviewer should NOT
"improve" them in the next 4 days because they would lose more than
they'd gain.

- **`DisclaimerFooter` consistently mounted globally** — every page
  carries the long-form devnet / no-real-funds / no-FHE / no-MPC
  disclosure. Calibration of the privacy claim is correct.
- **Empty state copy in `MvpStates.tsx`** — `ContractNotConfigured`,
  `NoContentPublished`, `MembershipNotActive` all give the user a clear
  next step.
- **Wizard step navigation with disabled-Next on validation fail** —
  prevents bad on-chain submits.
- **Form labels are correctly paired with `htmlFor`** — `BasicsStep.tsx`
  has proper a11y on inputs.
- **`/account` privacy section copy ("🛡 Your wallet address, email,
  and tier memberships are never shared with community creators")** —
  honest, scoped to the SORTS surface, mirrors the privacy-honesty pass.
- **CSS variables for design tokens** — no hardcoded colors. Easy to
  retheme later.
- **Mobile breakpoint at 768px with `MobileBottomNav`** — responsive
  baseline is in place.
- **Suspense fallback `null` for `useSearchParams()` pages** — Next.js
  App Router contract honored without a flash of empty state.

---

## Recommended action list — 4 days to Colosseum (May 8 → 12)

The following is a prioritized punch list scoped to "ships in time for
the May 12 demo recording". Each item maps back to a section above.

### Tuesday May 9 (~6 hrs)

1. **A1 fix** — replace fake "1,247 members" preview card with live
   fetch against seeded `demo-research`. Cache 60s.
2. **A3 fix** — add `<DemoStatusCard />` mirroring README "Current Demo
   Status" table. Mount once on landing + once on `/account`.
3. **A2 partial** — re-order landing CTAs. New primary: "See it work —
   90 second demo". Defer the actual `/demo` route to Wednesday.

### Wednesday May 10 (~6 hrs)

4. **A2 finish** — build `/demo` route as a curated wrapper around
   `/join/<demo-cid>` that allows anonymous read of preview-eligible
   posts (depends on A5).
5. **A5 fix** — content GET allows anonymous read of `preview_eligible`
   posts. **Route through privacy-grep + security-auditor before
   merging** (invariant 9 must still hold).
6. **B5 fix** — `WrongNetworkState` chain-aware, defaults to Solana
   devnet copy.
7. **B6 fix** — move privacy card above description on `/join/[cid]`.

### Thursday May 11 (~6 hrs)

8. **A4 fix** — `UmbraMembershipCard` subscriber-default vs
   developer-opt-in views.
9. **B3 fix** — skeleton screens on three highest-traffic pages
   (landing preview card, `/join` card, `/app` feed list).
10. **C2 fix** — surface "Can the creator see who subscribed?" and "Is
    this production-ready?" inline in the hero as collapsibles.
11. **B4 + B7 + C8** — empty-state CTAs, marketing nav links to real
    pages.

### Friday May 12 (recording day)

12. **D1, D5, C6** — three quick polish items:
    - Hero pill copy → "Live on Solana devnet — try the demo".
    - Skip-link in root layout.
    - `aria-live="polite"` on `TransactionState`.
13. Final manual walk of the 14-step demo. Re-record video.

### Deferred (post-Colosseum)

- B1 SOL → USD exchange rate hint (CoinGecko free tier integration).
- B2 `/role` consolidation.
- C1 public search.
- C3 capability matrix verb-rename.
- C4 `MessageApprovalLifecycle` conditional render.
- C5 `MultichainAssetPanel` "Coming with IKA v2" copy.
- C7 Symbol input character counter.
- D2-D5 OG image, footer links, light mode.

---

## Time estimate roll-up

| Section | Items | Est. hrs |
|---|---|---|
| Critical (A) | 5 items, 4 in scope for Colosseum | ~7 hrs |
| High (B) | 6 items, 4 in scope | ~5 hrs |
| Medium (C) | 8 items, 1 in scope | ~1 hr |
| Low (D) | 5 items, 3 in scope | ~30 min |
| **Total in scope for May 8 → 12** | **12 items** | **~14 hrs** |

Realistic delivery: 9-10 of the 12 items land. The remaining 2-3 are the
recommended Friday polish items that can be skipped without breaking the
demo if Wed-Thu run long.

---

## What this report does NOT recommend

- **No new framework / library additions.** No `react-tour`, no
  `framer-motion` upgrade, no design-system migration. The current
  Tailwind + CSS-variable stack is sufficient.
- **No new pages beyond `/demo`.** Adding `/about`, `/faq` as separate
  routes burns time and splits the SEO surface. Keep one landing.
- **No on-chain change.** The privacy card copy fix (A4) and the
  anonymous preview unlock (A5) both stay backend / frontend only. The
  on-chain `Subscription` account layout, the v2 commitment scheme, and
  the v3 Cloak dual-path stay frozen for the demo.
- **No removal of disclaimers.** Every Devnet badge, Pre-alpha badge,
  and DisclaimerFooter mention stays. The fix is to *pair* them with a
  "what works" panel (A3), not to soften the disclosure.

---

## Risk callouts for the implementer

- **A5 (anonymous preview unlock)** is the highest-risk item because it
  loosens a non-member content path. Run privacy-grep on the diff
  before merging. The invariant being changed is #9; the new shape is
  "anonymous → only `preview_eligible: true` posts unlock; same as the
  authenticated non-member path today". The change is in *who* can hit
  the unlocked path, not *what* unlocks. Document the change in
  `docs/PRIVACY_REVIEW.md` and add a fixture to
  `preview-quota.test.ts`.
- **A3 (DemoStatusCard)** must NOT regress the honesty pass. The
  ✅/🧪/❌ split lives in the README "Current Demo Status" table; the
  new component should be a pure read of those values, not a fresh
  re-claim.
- **B5 (chain-aware WrongNetworkState)** has a dependency on the
  current `useChain()` factory shape. Verify with the
  `encoding-roundtrip.test.ts` cohort before merging — chain-id
  branches in UI code should never grow without the route layer
  knowing.

---

End of UX research report.

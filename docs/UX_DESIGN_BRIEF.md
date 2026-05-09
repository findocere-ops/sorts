# SORTS — UX design brief for claude design

A handoff brief for the visual redesign pass. The goal is to take a
working but generic crypto-template product and pull it into a distinct,
calm, trust-forward aesthetic that holds up across long sessions —
without resorting to playful illustration or glow-heavy gradients that
read as "AI slop".

This brief is meant to be pasted into claude design with the repo path
attached. Every reference is real (file paths cite the existing
codebase) so the design tool can audit current state before producing
new directions.

---

## 1. Project context (one paragraph)

SORTS is private subscription rails for paid communities on Solana
devnet. Creators sell recurring access; subscribers prove membership
without leaking a public member graph. The product is privacy-first by
construction (commitment scheme on-chain, aggregate-only creator
analytics, no member roster anywhere in the SORTS surface). The current
build is a Colosseum hackathon submission — Day 12 of 14, deadline
May 12. Frontend is Next.js 14 App Router, Tailwind plus CSS variables
for design tokens, no shadcn/ui yet. The current design uses a
dark-only palette with cyan + orange glow gradients, DM Sans for body,
DM Mono for data — readable but template-shaped.

---

## 2. Voice + positioning

The voice the redesign should carry into every surface:

- **Calm, not loud.** Privacy products that shout "PRIVACY" lose
  credibility. Show, don't yell.
- **Calibrated, not aspirational.** The honesty pass already landed —
  pre-alpha disclosures are paired with "what works today" panels. The
  visual redesign should feel as careful as the copy already does.
- **Architectural, not decorative.** A good SORTS screen reads like a
  technical drawing or a research note: structured, dense where it
  needs to be, generous where it doesn't.
- **Confident in restraint.** One accent color used sparingly hits
  harder than three accents used everywhere.

What the voice is **not**:

- Not "Web3 cyberpunk" (drop the neon scan-lines, pulsing dots,
  cyan-orange double-glow).
- Not "playful Linear-style" (we don't ship cartoons or rainbow
  gradients).
- Not "bank app earnest" (we're not pretending to be a regulated
  fintech).
- Not "AI assistant glassy" (no frosted blur stacks, no soft-cloud
  "coming soon" cards).

---

## 3. Honest critique of the current visual state

Reviewed every page and component in `frontend/src/`. Findings the
redesign should address:

### 3.1 Reads as a crypto-template page

- `frontend/src/app/page.tsx` hero uses two ambient radial gradients
  (cyan glow at 50% 30%, orange echo). Combined with the cyan-dim
  status pill and the cyan-glowing community-preview card, the screen
  reads as a Generic Crypto Landing™. Five other Solana devnet
  hackathon submissions in the same week could publish under this
  visual.
- `lp-section` cards use `glow-cyan` and `glow-orange` classes
  uniformly. Every section glows. Result: nothing glows, because
  contrast is gone.
- `Icon` chips on cards (`width: 38, height: 38, borderRadius: 8,
  background: var(--cyan-dim)`) repeat per section. Pattern density
  hides hierarchy.

### 3.2 Type system is functional but uninvested

- DM Sans + DM Mono is a perfectly reasonable choice; nothing wrong
  with it, but nothing memorable either. Every Solana product picks
  one of {Inter, DM Sans, Geist}. Pick a less-used pair to lock the
  identity.
- Headings use `letterSpacing: '-0.03em'` only on the preview-card
  numbers. Inconsistent — sometimes heading kerning is tightened,
  sometimes not.
- Body line-height is 1.65 in some places, 1.5 in others, default
  elsewhere. No vertical rhythm.

### 3.3 Color tokens are fragmented

Inspected `frontend/src/styles/globals.css`. Tokens in use:

- `--cyan` `#2DE8E0`, `--cyan-dim`, `--border-cyan`
- `--orange` (warm gold `#ffb02e`), `--orange-dim`, `--border-orange`
- `--gold` (separate from orange), `--gold-dim`
- `--success` `#22c55e`, `--danger` `#ef4444`
- `--text-1` `--text-2` `--text-3`, `--bg-elevated` `--bg-card`
  `--bg-panel`, `--border-subtle`

Three accent families (cyan, orange, gold) compete. Cards use
all three at once (cyan glow + orange-glow on creator card +
gold for "Devnet"). Visual hierarchy depends on which accent
shouts loudest, not on importance. Pick one accent + one
warning + one success/danger pair. Drop the others or recede
them to neutrals.

### 3.4 Density inconsistency between marketing and app

- Landing (`page.tsx`) is generous — 60px section spacing, large
  type, lots of breathing room.
- Studio dashboard (`/studio/[cid]/analytics`, content, settings) is
  cramped — 14-pixel labels, dense grids, mono numbers.
- Account page is somewhere in the middle.

Three density modes coexist. Pick a clear policy — marketing is
editorial (generous), studio is workstation (dense), subscriber app
is transitional (medium).

### 3.5 The existing component library is partial

- `card`, `card-elevated`, `card-hover`, `card-sm` — four card
  variants with overlapping responsibilities.
- Buttons via `Button` component plus `.btn .btn-primary` CSS
  classes. Two button systems coexist (one TS, one CSS-only).
- Empty states (`MvpStates.tsx`) are well-designed but the rest of
  the app doesn't reuse the `EmptyStateShell` shape.
- New components landed Day-10 (`DemoStatusCard`, `Skeleton.tsx`,
  the chain-aware empty states) need a redesign-time pass to align
  visual language.

### 3.6 Privacy disclosures are visually loud

- `SignerCapabilitiesCard` — red/orange stripe at top.
- `UmbraMembershipCard` — orange `PreAlphaBadge` chips.
- `DevnetBadge` — cyan pulsing dot, topbar.
- `DisclaimerFooter` — long-form caveats on every page.

The honesty is calibrated correctly per the privacy pass. The
visual treatment is not. Stacking four warning surfaces on a single
screen reads as "broken demo". The redesign should keep the
disclosures (legally / honestly required) but visually mute them
into the architecture rather than scream them at the visitor.

---

## 4. Direction recommendation

Pick **one** of three direction archetypes for the redesign — the rest
of the brief assumes whichever the reviewer picks. My ranked
recommendation, with rationale:

### Option A (recommended) — Editorial workstation

Inspiration: Things 3 (Mac), Linear's documentation pages, Pirate
Wires. Stripe's developer dashboard, Vercel's analytics view. The
Brutalist Report.

The aesthetic: sober, document-shaped, type-driven. Fixed-width type
columns on landing. Dense data tables on studio. One accent color used
sparingly to mark progression states. Heavy use of horizontal rules
and small caps eyebrows. No glows, no gradients in the chrome (only in
status indicators where they earn their pixels).

This direction is right for SORTS because:

- The pitch is a privacy infrastructure protocol, not a consumer
  social app. Editorial chrome reinforces the seriousness.
- The product is most-used during creator review sessions
  (analytics, content management). Long-session comfort beats
  first-glance dazzle.
- The aesthetic is harder to parody as "AI-generated SaaS landing".
  Most automated design tools default to gradient-heavy soft-blue
  chrome; an editorial direction stands apart.

### Option B — Quiet color (warm monochrome)

Inspiration: Wise (formerly TransferWise) circa 2021, Are.na, Notion
Calendar (the desktop one).

A single warm hue used at 12 brightness levels for almost everything,
with one cool accent reserved for actionable affordances. The screen
feels like a bound notebook. No "dim" variants, no glow.

This direction is right for SORTS if the team wants to invest in a
distinct tone but doesn't want full editorial density on subscriber-
facing pages.

### Option C — Stark minimal

Inspiration: Apple Numbers, Bret Victor's writing site, Moom.

Black-on-white (or near-black on near-white), 1px hairline borders,
zero gradients, modular grid. One accent for state.

Cleanest of the three options. Risk: easy to read as "underdesigned"
or "we ran out of time". Works better in print than on screen for
data-heavy products.

---

## 5. Brand spec — assuming Direction A (editorial workstation)

If the reviewer picks B or C, regenerate this section with the chosen
archetype's tokens.

### 5.1 Color

| Token | Value | Used for |
|---|---|---|
| `--ink-1` | `#0B0F14` | Primary background (reduces from current `#05070A` to allow more depth) |
| `--ink-2` | `#10161D` | Card background |
| `--ink-3` | `#181F27` | Elevated card |
| `--paper-1` | `#E8EAEC` | Primary text |
| `--paper-2` | `#A8AFB7` | Secondary text |
| `--paper-3` | `#6E7680` | Tertiary text, captions, dates |
| `--accent` | `#5BD9C9` | Single accent. Active state, selected tab, primary action. **Cooler, less neon than current `#2DE8E0`.** |
| `--accent-soft` | `#0F2C2A` | Hover background, badge fill, subtle highlights |
| `--rule` | `#1C2530` | 1px hairlines |
| `--rule-strong` | `#2C3947` | Section dividers |
| `--warn` | `#D9A85B` | Pre-alpha + devnet — warmer + lower-saturation than the current orange / gold |
| `--warn-soft` | `#2C2419` | Pre-alpha background |
| `--danger` | `#E5707A` | Error / destructive — coral, not neon red |
| `--success` | `#7CC992` | Confirmed / live — sage, not Slack-green |

**Drop:** the current `--cyan-dim` glow, the `--orange` + `--gold` split
(merge into one `--warn`), the `--border-cyan` + `--border-orange`
border tints (replace with `--rule` / `--rule-strong`).

**Single-accent rule:** the accent should appear at most twice per
viewport. If three things on screen are competing for accent, two of
them are wrong.

### 5.2 Typography

Drop DM Sans + DM Mono. Pair:

- **Display + body:** Söhne (Klim), or a free alternative — Inter
  Tight at -0.02em letterspacing for display sizes 32px+. Body stays
  Inter at default tracking.
- **Editorial / quote:** Tiempos Text (Klim) for blockquotes + the
  occasional pull-quote in marketing copy. Free alt: Source Serif 4.
- **Mono:** JetBrains Mono Light. Replaces DM Mono. Use only for
  on-chain hashes, addresses, and code blocks. Never for UI labels.

Type scale (8 sizes only, no in-between):

```
display  44/52  -0.02em  600
h1       28/36  -0.015em 600
h2       20/28  -0.01em  600
h3       16/24   0       600
body     14/22   0       400
sm       13/20   0       400
xs       12/18   0.01em   500
caption  11/16   0.04em   500 uppercase  // eyebrows, small caps
```

Kill in-between sizes (currently the codebase has 13.5, 14.5, 17,
18px floating around). Eight sizes maximum.

Vertical rhythm: 4px baseline grid. Every margin / padding is a
multiple of 4. Drop the current 14, 18, 22, 26 oddballs.

### 5.3 Gradients + glow

Forbidden in chrome. Allowed only:

- **Status indicators** — a 2px high accent bar at the top of an
  active state card. Solid color, no gradient.
- **Live data dot** — a 6px filled circle, no glow, no pulse. Pulse
  only on actively-updating data points; never on a static page.
- **Hover shadow** — subtle (0 1px 2px rgba(0,0,0,0.4)). No bloom,
  no inner glow.

Drop:

- The radial ellipse glows in `frontend/src/app/page.tsx:35-41` and
  `:117`. Replace with one horizontal hairline divider above the
  hero.
- `glow-cyan`, `glow-orange` CSS classes throughout. Strip from
  `RoleSplit` cards.
- The cyan box-shadow on the hero status pill. Solid border, no
  glow.

### 5.4 Density modes

Three explicit density modes, mapped to route prefixes:

- **Editorial** — landing (`/`), `/auth`, `/role`, `/discover`. 64px
  vertical section padding. Max content width 720px. Generous.
- **Reading** — `/join/[cid]`, `/app/[cid]/feed`, `/app/[cid]/library`,
  `/app/[cid]/classroom`. 32px section padding. Max content width
  860px. Reading-rhythm typography.
- **Workstation** — `/studio/*`, `/account`, `/status`. 16px section
  padding, dense grids, mono accents on tabular data. Max content
  width 1200px. Sidebar visible.

The current build mixes these freely (the studio analytics page is in
"reading" density when it should be "workstation"). Lock it.

### 5.5 Motion

- **Page transitions:** 120ms fade-in on route change. No slide.
- **State transitions:** 80ms ease-out. No springs, no bounce.
- **Skeleton shimmer:** 1.4s linear (already implemented in
  `Skeleton.tsx`) — keep, no change.
- **Status updates:** one cross-fade on data updates. No accordion
  expansion, no list-shuffle.

Drop framer-motion if it's only used for entrance choreography —
CSS handles the above without the bundle cost.

### 5.6 Iconography

Replace mixed icon set in `frontend/src/components/icons/Icon.tsx`
with one consistent line-icon family. Recommended: Phosphor Icons
(line weight 1.5px). Currently the codebase pulls icon names like
`shield`, `eye_off`, `bot`, `crown` — half are filled, half are
line. Pick one weight and stick.

### 5.7 Border-radius scale

Two values only:

- `--r-sm` 6px — buttons, inputs, badges
- `--r-md` 12px — cards, panels, modals

Drop `--r-lg`, `--r-full` for cards. Pills can use `999px` directly
without a token.

---

## 6. Per-page visual direction

### 6.1 Landing (`/`)

Current: 9 sections, lots of glow, lots of cards. Reads as a
template.

Redesigned:

- Hero is one viewport tall maximum. Centered headline (display
  size), one supporting paragraph (body size, max 580px), one
  primary CTA, one secondary text link. Drop the trust row — move
  to a dedicated section or kill.
- Replace the gradient-glow community preview with a small
  inline live-data card (already implemented A1 — keep functional,
  redesign visual). The card should look like a research note,
  not a marketing widget.
- Drop the "Two products. One protocol." dual-card section as a
  separate area; collapse into a single "What it does" section
  with two columns.
- Drop the "Privacy architecture" tabbed-card section — compress
  into a single bordered panel with three columns of small caps
  + bullet lists.
- FAQ stays but redesigned: hairline-bordered list, no card
  wrapping. Press/click expands inline.
- Final CTA (the gradient box) becomes a single rule + a paragraph
  + one link. Cut the SVG logo in the CTA — overkill.

Total page should land at 4 sections: Hero, What it does, Status
table, FAQ. Drop the "Privacy protocol" + "Problem" sections —
fold their content into Hero subhead + a single explanatory
paragraph.

### 6.2 `/studio/create` wizard

Current: 4-step wizard with progress indicator + step components +
deploy button.

Redesigned:

- Replace progress bar with breadcrumb-style step list at the top
  (small caps, current step bolded).
- Move from one-step-per-page to one-step-per-card on a single
  scrollable page. Reviewer can scroll back up to verify any field
  before deploying.
- Tier price input gets a unit suffix `SOL` and a hover-tooltip
  showing the lamport conversion (per UX research B1).
- The "Deploy" button becomes the only accented element on the
  page. Everything else is neutral.

### 6.3 `/studio/[cid]/analytics`

Already aggregate-only. Redesign:

- Hero counters: large numbers, mono, no chrome around them.
  Aligned in a 4-column grid.
- One sparkline beneath each (members-over-time aggregate; fits
  the "no per-member time series" privacy invariant). Sparkline
  is single accent line, no fill, no axes.
- Drop the `AggregateStatsCard` "card" wrapper. Numbers + labels
  alone. Whitespace as the divider.
- `CreatorPayrollWithdraw` widget moves to a separate
  "Payouts" section below. Currently sits inside the analytics
  card; visually conflated.

### 6.4 `/join/[cid]`

Current: header → privacy card → description → preview/subscribe
section.

Redesigned (per UX research B6):

- Two-column desktop layout: left column = community name,
  description, list of preview-eligible posts. Right column
  (sticky) = privacy card + subscribe button + price.
- Mobile: stack with privacy card pinned to a small floating bar
  at the bottom (showing "Hidden from creator · Subscribe →").
- Drop the giant cyan "Subscribe" primary button. Replace with
  inline text-button with a small leading icon.

### 6.5 `/app/[cid]/feed`

- Single-column reading view, max 720px.
- Posts as bordered article elements with hairline rule
  separators between them. No card chrome per post.
- Locked post body shows a 3-line dotted-line preview with the
  word "Subscribe" inline-linked at the end. Currently shows
  "Locked — body hidden until your subscription is active" — too
  formal.
- Privacy card moves to a small persistent footer pill (collapsed
  by default, expandable). Currently dominates the top of every
  feed page.

### 6.6 `/account`

- Three sections: Identity, Wallets, Build status. Drop the
  separate "IKA dWallet" section into "Build status" as a
  collapsed expandable. Currently four sections compete.
- `MultichainAssetPanel` placeholder rows hidden when balances
  are zero (per UX C5). Mount only when v2 lands.
- `MessageApprovalLifecycle` 6-step stepper → hide unless an
  active approval exists (per UX C4). Replace with a single line
  of empty-state text: "No pending wallet approvals."

---

## 7. Component inventory + revision priorities

Highest-leverage components to redesign first, in order:

1. **Buttons** — three variants: primary (accent), secondary
   (rule outline), ghost (no chrome, just text + 1px underline on
   hover). Drop the current `cyan` / `outline` / `danger` / `xl` /
   `sm` matrix. Three button sizes: 28px / 36px / 44px.
2. **Cards** — two variants: panel (rule border, no shadow) and
   sheet (background `--ink-2`, no border). Drop card-elevated /
   card-hover / glow-cyan / glow-orange.
3. **Empty states** — keep `EmptyStateShell` shape but drop the
   left-side colored bar. Use a single icon + one-line eyebrow +
   title + body + 1-2 actions. Less ceremony.
4. **Privacy disclosures** — `DevnetBadge`, `PreAlphaBadge`,
   `DisclaimerFooter`, `UmbraMembershipCard`,
   `SignerCapabilitiesCard` → all visually quieted. The chrome
   should match the rest of the product, not announce itself in
   warning-tape orange.
5. **Forms** — input style is currently `var(--bg-elevated)` with
   30px height. Move to 36px, hairline border, focus ring as a
   2px accent outline (not a glow).
6. **Skeletons** — already shipped Day-10. Keep the shimmer; swap
   the gradient to use new tokens.

---

## 8. Anti-AI-slop rules

Rules the redesign must obey. Violation of any of these is "AI
template" territory.

### 8.1 Forbidden patterns

- **Glassmorphism** — no frosted blur stacks, no `backdrop-filter:
  blur(...)` outside of the existing topbar where it has a real
  reason.
- **Soft-cloud gradient cards** — no `linear-gradient(145deg,
  rgba(45,232,224,0.06), rgba(255,138,0,0.04))` (currently in
  `CTASection:408`). Solid backgrounds only.
- **Glow rings around the logo** — drop.
- **Multiple emoji on a single screen** — currently the
  `DemoStatusCard` ships ✅/🧪/❌. Keep those because they ARE
  the data. But no decorative emoji elsewhere.
- **"Animated" text reveal** on hero headlines. Static text. Trust
  builds when the page doesn't perform.
- **Three-column "feature" grids of icon + heading + body** —
  currently used in `PrivacyProtocol` (6 cards) and
  `PrivacyArchitecture` (3 cards). Compress to text-only with
  rule separators.
- **Icon chips inside circular backgrounds** — replace with bare
  line icons inline with the heading.
- **"Cyan-dim" hover backgrounds** — replace with 8% paper-1.

### 8.2 Required patterns

- **Hairline rules.** Every section divider is a 1px line, not a
  background-color band.
- **Small caps eyebrows.** `text-transform: uppercase;
  letter-spacing: 0.04em; font-size: 11px; color: var(--paper-3);`
  Use generously.
- **Mono numbers, only.** Numbers in tables + on chain-state
  display. Body copy never goes mono.
- **Real horizontal rule between hero and content.** Currently
  every section is a self-contained card; no clear scroll rhythm.
- **Single-color accent.** Pick one of the new accent values and
  use it sparingly. If a screen has 5 accents, 4 are wrong.

### 8.3 Voice + microcopy rules

- **Drop "Confidential communities, built for the onchain era."**
  Two empty phrases stacked. Replace with the actual product
  promise: "Private subscription rails for Solana communities."
- **Drop "Privacy is enforced at the protocol layer, not as a UI
  toggle."** True statement, but reads as marketing-speak.
  Replace with what we actually do, e.g. "We never expose member
  identity in the dashboard or API. On-chain we use a commitment
  scheme."
- **Drop "Cryptographic guarantees, not platform promises."** The
  honesty pass landed — we are NOT making cryptographic
  guarantees today (commitment scheme is brute-forceable across
  3 candidates). Replace with the calibrated version.
- **Sentence-case headings everywhere.** No Title-Case in
  marketing or app surfaces.

---

## 9. Reference set (what to look at)

For Direction A (editorial workstation), the design tool should
study:

- **Linear's documentation site** (linear.app/docs) — type
  rhythm, sidebar density, single-accent treatment.
- **Things 3 desktop** — the app, not the marketing page. Card
  density, status indicators, no chrome.
- **Stripe's developer dashboard** — workstation-density tables,
  status pills, explorer-link buttons.
- **Pirate Wires** (pirate-wires.com) — editorial type
  composition, hairline layout.
- **The Brutalist Report** (brutalist.report) — extreme
  restraint; useful as a "too far" reference to calibrate against.
- **Are.na** (are.na) — quiet color, generous whitespace,
  unmistakable identity.

For comparison, the design should explicitly NOT look like:

- Phantom wallet (cyber-purple, glassy chrome).
- Magic Eden (gradient-heavy, neon).
- A Vercel template clone (centered hero, three-column features,
  emoji icons).
- Any gradient-soft-blue SaaS landing.

---

## 10. Implementation notes for the design tool

If claude design or whichever tool is producing the new visual:

- The repo uses Tailwind CSS plus a CSS-variable design token
  system in `frontend/src/styles/globals.css`. Replacing tokens
  there propagates to most components.
- Do not introduce shadcn/ui mid-redesign. We can add later if
  it's worth it; a redesign + a new component library at once
  doubles the risk surface.
- Components live under `frontend/src/components/`. The
  privacy-load-bearing ones are `UmbraMembershipCard`,
  `SignerCapabilitiesCard`, `DemoStatusCard`, `DisclaimerFooter`,
  `DevnetBadge`, `PreAlphaBadge`. Treat the COPY in those as
  frozen (the honesty pass already calibrated it). Restyle the
  visuals only.
- Pages to redesign in priority order:
  1. `/` (landing) — highest traffic, first impression.
  2. `/join/[cid]` — load-bearing differentiation page.
  3. `/studio/[cid]/analytics` — proves the aggregate-only claim.
  4. `/app/[cid]/feed` — long-session reading surface.
  5. `/studio/create` — wizard.
  6. `/account` — quiet polish.
  7. Other studio routes (content, settings, tiers, invites).
- Keep the Day-10 functional changes intact:
  - Live `CommunityPreviewCard` fetch (A1)
  - `DemoStatusCard` mounted on landing + /account (A3)
  - `?dev=1` developer view on `UmbraMembershipCard` (A4)
  - Anonymous `preview_eligible` content unlock (A5)
  - `WrongNetworkState` chain-aware (B5)
  - Skeleton screens (B3)
  - Skip-link in root layout (D5)
- No backend changes. No on-chain program changes.

### 10.1 Hand-off deliverables expected

From the design tool, the redesign pass should produce:

1. Updated `globals.css` with the new token set (color, type,
   spacing, radius, motion).
2. Per-page Figma-equivalent or HTML/CSS mockups for the 7 pages
   listed above.
3. A "before/after" diff for each redesigned component, showing
   the visual delta and the tailwind/css-variable changes.
4. A short brand.md (200-400 words) that the rest of the team can
   reference as the visual source-of-truth — voice, accent rule,
   density modes, anti-slop rules condensed.
5. A "do not regress" list — the parts of the current build that
   are working (the privacy-disclosure system, the skeleton
   shimmer, the skip-link, the ARIA-live transaction state) that
   the redesign must preserve.

### 10.2 Hard constraints (the design must respect)

- **Devnet badge stays site-wide.** Universal Hard Rule.
- **Pre-alpha badges stay on Umbra + IKA cards.** Universal Hard
  Rule.
- **DisclaimerFooter stays mounted globally.** Universal Hard
  Rule.
- **No page can claim production privacy.** Match the
  honesty-pass copy.
- **No member roster anywhere.** Already enforced by the API; the
  redesign cannot accidentally introduce a "Top members"
  visualization or a "Most active subscribers" panel.

If the design tool produces a layout that violates any of these,
flag it before shipping.

---

## 11. Success criteria

After the redesign, the following should be true:

1. A first-time visitor on the landing for 8 seconds can answer:
   "What does SORTS do?" without scrolling. (Currently fails — the
   hero subhead is jargon.)
2. A subscriber on `/join/[cid]` for 4 seconds can answer:
   "Will the creator see I joined?" without clicking. (Currently
   fails — the privacy card is monospace-jargon below the
   description fold.)
3. A creator on `/studio/[cid]/analytics` for 30 seconds can
   answer: "How many active members do I have, what's my
   revenue?" — and visibly NOT have any way to drill into a
   single member. (Currently OK; redesign must preserve.)
4. The product reads as different from at least three other
   Solana hackathon submissions in the same week. The "I've seen
   this before" reaction does not fire.
5. Long sessions (45+ min in studio) don't fatigue. Test by
   running the redesigned pages on a 1080p monitor at 100%
   brightness for 30 minutes — eyes shouldn't ache from glow or
   contrast.

End of brief.

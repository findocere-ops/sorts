# SORTS Frontend MVP — Implementation Plan

Audit + plan derived from `handoff/sorts/` (Claude Design bundle) and the existing repo.
**Approved with corrections — see §0 below.**

## 0. Approved corrections (overrides anything below)

1. **Backend route gaps are NOT frontend blockers.** Build every page with typed API clients, then handle four states explicitly: loading / empty / error / `backend-not-connected`. New backend routes (`calendar`, `classroom`, `leaderboard`, `membership`) get implemented only after the frontend route + layout system compiles end-to-end.
2. **Static ABI files only.** Never import from `contracts/artifacts/**` inside client code. Place ABIs at `frontend/src/lib/chain/abis/{SortsFactory,SortsMembership}.ts` (typed, hand-maintained for MVP). After every contracts deploy, regenerate by hand or via a small `pnpm --filter @sorts/frontend sync-abis` script. Until contracts compile, ship minimal stubs covering only the functions used by the UI (`createCommunity`, `subscribe`, `renew`, `getAggregateStats`).
3. **Contract deployment is a separate, explicit step** (not part of any frontend page):
   - `pnpm --filter contracts compile`
   - `pnpm --filter contracts deploy:sepolia` → writes `contracts/deployments/arbitrum-sepolia.json`
   - copy `factoryAddress` into `frontend/.env.local` as `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS`
   - if the address is unset or `0x000…`, the frontend MUST still build and render a "Contract not configured" empty state on every screen that needs it.
4. **Premium empty states, never fake data.** Five canonical empty states, each with the SORTS logo mark, a one-line headline, an explainer, and a single CTA:
   - `BackendNotConnected` — for any 5xx / network failure
   - `ContractNotConfigured` — when factory address is missing
   - `NoCommunitySelected` — when a `[cid]` route resolves to nothing
   - `NoContentYet` — empty content/classroom/calendar/library/leaderboard
   - `MembershipNotActive` — for gated subscriber views
   These live in `components/ui/empty/` and are imported wherever needed. Fixtures (`MOCK_*`) only run in `*.test.tsx` and Storybook-style playgrounds.
5. **MVP build priority (replaces §7 ordering for steps 5-8):**
   1. Landing page (`/`)
   2. Role gateway (`/role`)
   3. Creator Studio shell (layout + sidebar + topbar, plus `/studio` overview)
   4. Create Community Wizard (`/studio/create`)
   5. Invite/Join page (`/join/[cid]`)
   6. Subscribe flow (`/join/[cid]/subscribe`)
   7. Subscriber Feed (`/app/[cid]/feed`)
   8. Membership page (`/app/[cid]/membership`)
   9. Privacy Proof + Privacy Center (`/studio/[cid]/privacy-proof`, `/app/[cid]/privacy`)
   10. Telegram linking shell (`/app/[cid]/telegram`)
6. **Polished shells only for non-core surfaces.** Classroom, calendar, library, and leaderboard ship as designed shells with the empty state from §0.4 — no data wiring this MVP. They must look production-ready, just not be functional.
7. **Logo is the user-supplied SVG/PNG set** (cyan/orange gradient stripe S-mark, `SORTS` wordmark in geometric sans, `CONFIDENTIAL COMMUNITY PROTOCOL` cyan tagline). Use the bundled handoff PNGs (`sorts-logo-mark.png`, `sorts-logo-mark-trans.png`, `sorts-icon.png`, `sorts-app-icon.png`) verbatim — do not redraw, do not generate alternates.

---

**Original plan below; defer to §0 wherever it conflicts.**

---

## 1. Detected stack

| Layer | What's there | Notes |
|---|---|---|
| Repo | pnpm + Turborepo monorepo (`pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`) | Workspaces: `packages/*`, `frontend`, `backend`, `contracts` |
| Package manager | **pnpm** (NOT npm) | `frontend/package.json` references `workspace:*` |
| Frontend | Next.js 14.2.4 App Router + TypeScript 5.4 strict, React 18.3 | Tailwind 3.4 installed but barely used — components mostly use inline styles + CSS vars |
| Wallet/auth | Privy `@privy-io/react-auth@1.90`, `@privy-io/wagmi@0.2`, `wagmi@2.10`, `viem@2.12` | NO RainbowKit. `AuthProvider` ships a "demo auth" fallback when `NEXT_PUBLIC_PRIVY_APP_ID` is the placeholder |
| Data | `@tanstack/react-query@5.45` provider already mounted | `framer-motion@11` available |
| Backend | Express + better-sqlite3 + grammy on port 3001 | Routes: `/api/communities`, `/api/content`, `/api/analytics`, `/api/link`. Services exist for `analytics`, `community`, `calendar`, `classroom`, `leaderboard` — most are not yet exposed via routes. |
| Shared | `@sorts/shared` exports `IChainService`, `IContentService`, `IWalletService` + types (`Community`, `Tier`, `AggregateStats`, `MembershipStatus`, `Content`) | ArbitrumService implementation exists in `backend/src/services/chain/` |
| Contracts | Hardhat project with `SortsFactory.sol` + `SortsMembership.sol`. `deployments/` is empty — **no Factory deployed yet** | Frontend env has `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS=0x000…` |

## 2. Target frontend stack (no new framework choices needed)

Continue with the existing stack. **Do not introduce shadcn/ui, RainbowKit, or a new CSS framework.** The handoff is plain HTML/CSS/JS — porting to existing primitives is the lower-risk path and matches the brief ("recreate visually, don't copy structure").

- **Routing:** Next.js App Router (file-based)
- **Styling:** CSS variables in `frontend/src/styles/globals.css` (rewrite tokens to handoff palette) + utility classes mirroring the prototype (`.card`, `.btn-*`, `.t-h1`, `.g3`, etc.). Tailwind kept available for layout utilities only — do not delete it.
- **State / data:** React Query for fetches, Privy + wagmi for wallet/tx, lightweight `useState` for local UI. No Redux.
- **Wallet:** Privy embedded wallet + external wallet, single chain `arbitrumSepolia`. Continue using the existing `useSorts*` hook wrappers in `AuthProvider.tsx` so the demo-auth fallback keeps working in CI/preview.
- **Icons:** Inline SVG `<Icon name="…">` component ported from `sorts-app.jsx` lines 85-124 (no icon library).
- **Fonts:** Inter (body), Space Grotesk (display/headings), DM Mono (data/code) — replace current DM Sans.

## 3. Route map (from `sorts-app.jsx` + UI/UX spec)

> **Two completely separate apps under one Next.js project.** Creator and Subscriber must not share layouts, sidebars, or data fetching. Privacy invariant: nothing in the Creator tree may render member-level identity.

### Public (no shell)
| Route | Component | Source in prototype | Existing? |
|---|---|---|---|
| `/` | `LandingPage` | `sorts-app.jsx:336-508` | exists, must be **replaced** to match new design |
| `/role` | `RoleGateway` | `sorts-app.jsx:513-560` | new |
| `/auth` | `AuthConnect` | `sorts-app.jsx:565-592` | new (Privy login screen) |
| `/join/[communityId]` | `JoinPage` | `sorts-app.jsx:597-707` | exists, must be replaced |
| `/join/[communityId]/subscribe?tier=…` | `SubscribeFlow` | `sorts-app.jsx:712-800` | new — 5-step wizard |

### Creator Studio — `(creator)` route group with `CreatorStudioLayout`
| Route | Component |
|---|---|
| `/studio` | `CreatorOverview` (sorts-app.jsx:805-875) |
| `/studio/communities` | `CreatorCommunities` (877-910) |
| `/studio/create` | `CreateCommunityWizard` 5-step (912-1052) |
| `/studio/[cid]/content` | `CreatorContentManager` (1054-1116) |
| `/studio/[cid]/classroom` | `CreatorClassroomBuilder` (1118-1141) |
| `/studio/[cid]/calendar` | `CreatorCalendarManager` (1143-1170) |
| `/studio/[cid]/tiers` | `CreatorTierAccess` (1172-1224) |
| `/studio/[cid]/invites` | `CreatorInvites` (1226-1263) |
| `/studio/[cid]/analytics` | `CreatorAnalytics` (1265-1318) |
| `/studio/[cid]/telegram` | `CreatorTelegramBot` (1320-1369) |
| `/studio/[cid]/privacy-proof` | `CreatorPrivacyProof` (1371-1412) |
| `/studio/[cid]/settings` | `CreatorSettings` (1414-1453) |

> The prototype keeps `[cid]` implicit via shared state. In Next.js we make it an explicit segment so deep links work and creators can switch communities. Top-level `/studio` and `/studio/communities` and `/studio/create` are community-agnostic.

### Subscriber App — `(subscriber)` route group with `SubscriberAppLayout`
| Route | Component |
|---|---|
| `/app/[cid]/feed` | `SubscriberFeed` (1458-1509) |
| `/app/[cid]/classroom` | `SubscriberClassroom` (1511-1532) |
| `/app/[cid]/library` | `SubscriberLibrary` (1534-1562) |
| `/app/[cid]/calendar` | `SubscriberCalendar` (1564-1592) |
| `/app/[cid]/leaderboard` | `SubscriberLeaderboard` (1594-1617) |
| `/app/[cid]/membership` | `SubscriberMembership` (1619-1664) |
| `/app/[cid]/telegram` | `SubscriberTelegram` (1666-1690) |
| `/app/[cid]/privacy` | `SubscriberPrivacyCenter` (1692-1722) |
| `/account` | `AccountWallet` (1724-1751) |

### Existing routes to retire / migrate
- `/dashboard`, `/dashboard/[communityId]` → moved into `/studio/*`
- `/community/[communityId]` → moved into `/app/[communityId]/feed`
- `/discover` → kept as-is for Phase 2 polish (not in prototype but mentioned in UI/UX spec); leave a stub redirecting to `/role` for MVP
- `/create` → redirected to `/studio/create`
- `/link` → moved to `/app/[cid]/telegram`

## 4. Component map

```
frontend/src/
├── app/
│   ├── layout.tsx                       (keep, swap fonts + favicon)
│   ├── page.tsx                         → REPLACE (LandingPage)
│   ├── role/page.tsx                    NEW
│   ├── auth/page.tsx                    NEW
│   ├── join/[communityId]/page.tsx      → REPLACE
│   ├── join/[communityId]/subscribe/page.tsx  NEW
│   ├── (creator)/                       NEW route group
│   │   ├── layout.tsx                   wraps CreatorStudioLayout
│   │   └── studio/
│   │       ├── page.tsx                 CreatorOverview
│   │       ├── communities/page.tsx
│   │       ├── create/page.tsx
│   │       └── [cid]/
│   │           ├── content/page.tsx
│   │           ├── classroom/page.tsx
│   │           ├── calendar/page.tsx
│   │           ├── tiers/page.tsx
│   │           ├── invites/page.tsx
│   │           ├── analytics/page.tsx
│   │           ├── telegram/page.tsx
│   │           ├── privacy-proof/page.tsx
│   │           └── settings/page.tsx
│   ├── (subscriber)/                    NEW route group
│   │   ├── layout.tsx                   wraps SubscriberAppLayout
│   │   ├── app/[cid]/
│   │   │   ├── feed/page.tsx
│   │   │   ├── classroom/page.tsx
│   │   │   ├── library/page.tsx
│   │   │   ├── calendar/page.tsx
│   │   │   ├── leaderboard/page.tsx
│   │   │   ├── membership/page.tsx
│   │   │   ├── telegram/page.tsx
│   │   │   └── privacy/page.tsx
│   │   └── account/page.tsx
│   └── (legacy redirects: dashboard, community, create, discover, link)
├── components/
│   ├── brand/
│   │   ├── SortsLogoMark.tsx            from sorts-app.jsx:129
│   │   └── SortsLogoFull.tsx            from sorts-app.jsx:133
│   ├── icons/
│   │   └── Icon.tsx                     port lines 85-124 (24 named glyphs)
│   ├── layout/
│   │   ├── PublicLayout.tsx             header for landing/role/auth/join
│   │   ├── CreatorStudioLayout.tsx      Sidebar(creator) + TopBar + main + optional RightRail
│   │   ├── SubscriberAppLayout.tsx      Sidebar(subscriber) + TopBar + main + optional RightRail
│   │   ├── Sidebar.tsx                  driven by CREATOR_NAV / SUBSCRIBER_NAV consts
│   │   ├── TopBar.tsx                   crumbs + search + bell + WalletButton
│   │   ├── MobileBottomNav.tsx          shown <900px
│   │   └── RightRail.tsx                contextual right column (optional slot)
│   ├── ui/
│   │   ├── Badge.tsx                    extend existing — add cyan/orange/gold/success/warning variants
│   │   ├── Button.tsx                   extend existing — add primary(orange)/cyan/secondary/ghost/outline/danger + sm/lg/xl
│   │   ├── Card.tsx                     extend existing — `card`, `card-sm`, `card-elevated`, `card-hover`
│   │   ├── PrivacyBadge.tsx             shield + label
│   │   ├── ChainBadge.tsx               arbitrum/solana variants
│   │   ├── Stat.tsx                     value/label/delta
│   │   ├── EmptyState.tsx
│   │   ├── Toast.tsx                    + ToastProvider
│   │   ├── TierCard.tsx
│   │   ├── Stepper.tsx                  for SubscribeFlow + CreateCommunityWizard
│   │   ├── DataTable.tsx                .dtable styling
│   │   ├── Modal.tsx                    + ModalLg
│   │   ├── Toggle.tsx
│   │   ├── Segmented.tsx
│   │   └── TabBar.tsx
│   ├── creator/                         screen components, one per route
│   │   ├── CreatorOverview.tsx
│   │   ├── CreatorCommunities.tsx
│   │   ├── CreateCommunityWizard.tsx
│   │   ├── CreatorContentManager.tsx
│   │   ├── CreatorClassroomBuilder.tsx
│   │   ├── CreatorCalendarManager.tsx
│   │   ├── CreatorTierAccess.tsx
│   │   ├── CreatorInvites.tsx
│   │   ├── CreatorAnalytics.tsx
│   │   ├── CreatorTelegramBot.tsx
│   │   ├── CreatorPrivacyProof.tsx
│   │   └── CreatorSettings.tsx
│   ├── subscriber/                      screen components, one per route
│   │   ├── SubscriberFeed.tsx
│   │   ├── SubscriberClassroom.tsx
│   │   ├── SubscriberLibrary.tsx
│   │   ├── SubscriberCalendar.tsx
│   │   ├── SubscriberLeaderboard.tsx
│   │   ├── SubscriberMembership.tsx
│   │   ├── SubscriberTelegram.tsx
│   │   ├── SubscriberPrivacyCenter.tsx
│   │   └── AccountWallet.tsx
│   └── public/
│       ├── LandingPage.tsx              (composed of HeroSection, ProblemSection, etc.)
│       ├── RoleGateway.tsx
│       ├── AuthConnect.tsx
│       ├── JoinPage.tsx
│       └── SubscribeFlow.tsx            5-step wizard
├── lib/
│   ├── api/                             NEW — typed fetch clients
│   │   ├── client.ts                    base fetch + zod parse + React Query keys
│   │   ├── communities.ts               list, getById, getByCreator, create
│   │   ├── content.ts                   list, get, create, delete (with wallet proof helper)
│   │   ├── analytics.ts                 community + dashboard
│   │   ├── classroom.ts                 (needs backend route mount — see §5)
│   │   ├── calendar.ts                  (needs backend route mount)
│   │   ├── leaderboard.ts               (needs backend route mount)
│   │   ├── membership.ts                getStatus, list for wallet
│   │   └── link.ts                      generate / verify wallet↔Telegram
│   ├── chain/                           NEW — frontend chain client
│   │   ├── factoryAbi.ts                from contracts/typechain
│   │   ├── membershipAbi.ts             from contracts/typechain
│   │   └── useChain.ts                  thin wagmi hooks (createCommunity, subscribe, renew, getAggregateStats)
│   ├── nav.ts                           CREATOR_NAV + SUBSCRIBER_NAV consts (ported)
│   ├── tokens.ts                        small TS mirror of CSS vars for inline-style components
│   ├── wagmi.ts                         keep
│   └── constants.ts                     keep PLATFORM_PLANS + add CHAIN constants
├── styles/
│   └── globals.css                      → REWRITE tokens + utility classes from sorts-app prototype
├── public/
│   └── assets/                          NEW — copy from handoff/sorts/project/assets/
│       ├── sorts-logo-mark-trans.png    (used by .logo-mark CSS)
│       ├── sorts-logo-mark.png
│       ├── sorts-icon.png
│       └── sorts-app-icon.png
└── test/                                fixtures live here (NOT in app data path)
    ├── fixtures/communities.ts
    ├── fixtures/posts.ts
    └── fixtures/leaderboard.ts
```

## 5. Backend gaps to unblock the frontend

The prototype shows screens that map to data the backend doesn't yet expose. Add these routes (services already exist where noted):

| Route | Method | Service | Status |
|---|---|---|---|
| `/api/calendar/:communityId` | GET, POST, DELETE | `services/calendar.ts` exists | route file missing — add `backend/src/api/routes/calendar.ts` and mount in `index.ts` |
| `/api/classroom/:communityId` | GET, POST | `services/classroom.ts` exists | route file missing |
| `/api/leaderboard/:communityId` | GET | `services/leaderboard.ts` exists | route file missing |
| `/api/membership/:wallet` | GET | needs new service that calls `IChainService.getMembershipStatus` per community | new |
| `/api/communities/:id/aggregate-stats` | GET | already covered by `/api/analytics/community/:id` | reuse, no new route |

> Wallet-gated reads must continue using the existing `verifyContentReadProof` pattern (signed-message proof of wallet control, matching ArbitrumService's `checkAccess`). Do not relax this for the new routes.

## 6. Missing dependencies

None for runtime. The current stack covers everything in the prototype. Optional helpers we should add:

- `clsx@^2` — small classname helper used heavily in ported components (~3KB)
- `zod@^3` — already in `backend`, add to `frontend` for runtime validation of API responses

That's it. **Do NOT add:** shadcn/ui, RainbowKit, Heroicons, Lucide, Mantine, Chakra, styled-components, Emotion, Next-Themes, Headless UI. The handoff intentionally uses plain CSS + inline SVG; matching that keeps bundle small and avoids redesign.

## 7. Build order (exact, top-to-bottom)

Each step must compile (`pnpm --filter @sorts/frontend build`) before moving on. Steps 1-4 are pure foundation; verify visually after step 5.

1. **Brand foundation**
   - Copy `handoff/sorts/project/assets/*.png` → `frontend/public/assets/`
   - Rewrite `frontend/src/styles/globals.css`: replace token block with handoff `:root` (cyan/orange/gold), swap font imports to Inter+Space Grotesk+DM Mono, port the utility classes (`.card`, `.btn-*`, `.badge-*`, `.t-*`, `.g2/g3/g4`, `.flex`, `.tier-card`, `.dtable`, `.steps-row`, `.tab-bar`, `.modal-bg`, `.toast`, `.lp-nav`, `.hero-headline`, `.section-*`, `.role-tile`, `.right-rail`, `.mobile-bottom-nav`, responsive breakpoints).
   - Rewrite `tailwind.config.ts` color tokens to mirror new vars (so any Tailwind classes we keep don't clash).
   - Drop `Icon` component into `components/icons/Icon.tsx` (port lines 85-124 verbatim, JSX-typed).
   - Drop `SortsLogoMark`, `SortsLogoFull` into `components/brand/`.
2. **UI primitives**
   - Extend existing `Button.tsx`, `Badge.tsx`, `Card.tsx` to cover all variants used by prototype (don't break existing imports — keep prop API forward-compat).
   - Add `PrivacyBadge`, `ChainBadge`, `Stat`, `EmptyState`, `Toast`+`ToastProvider`, `TierCard`, `Stepper`, `DataTable`, `Modal`, `Toggle`, `Segmented`, `TabBar`.
   - Mount `<ToastProvider>` inside `app/layout.tsx` so any screen can fire toasts.
3. **Layouts**
   - `PublicLayout` (lp-nav header)
   - `Sidebar` (driven by `lib/nav.ts`), `TopBar` (with new `WalletButton` that wraps `useSortsPrivy`), `MobileBottomNav`
   - `CreatorStudioLayout` and `SubscriberAppLayout` route-group layouts
4. **API client + chain hooks**
   - Build `lib/api/client.ts` with `apiFetch<T>()` + React Query key factory
   - One typed module per existing endpoint (`communities`, `content`, `analytics`, `link`)
   - `lib/chain/useChain.ts`: wagmi hooks for `createCommunity`, `subscribe`, `renew`, `getAggregateStats` reading from typechain ABIs (re-export ABIs from `contracts/artifacts/*` via a tiny `chain/factoryAbi.ts` shim).
   - Wire env: `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS` already present; gracefully render empty state when address is `0x0…`.
5. **Public flow** (verify in browser after this step)
   - `/` Landing
   - `/role` Role gateway
   - `/auth` Privy login
   - `/join/[cid]` and `/join/[cid]/subscribe` (subscribe wizard, real wagmi tx)
6. **Backend route gaps** — add `routes/calendar.ts`, `routes/classroom.ts`, `routes/leaderboard.ts`, `routes/membership.ts` and mount in `backend/src/index.ts`.
7. **Creator Studio**
   - Layout + nav working
   - In order: `Overview`, `Communities`, `Create Community Wizard` (real `Factory.createCommunity` tx), `Content`, `Classroom`, `Calendar`, `Tiers & Access`, `Invites`, `Analytics`, `Telegram Bot`, `Privacy Proof`, `Settings`
8. **Subscriber App**
   - Layout + nav working
   - In order: `Feed`, `Classroom`, `Library`, `Calendar`, `Leaderboard`, `Membership` (renew tx), `Telegram` (link wallet), `Privacy`, `Account`
9. **Legacy route cleanup**
   - Delete `app/dashboard`, `app/community`, `app/create`, `app/discover`, `app/link` page files; replace each with a tiny `redirect()` shim to the new route so old links don't 404.
10. **Polish & deploy prep**
    - Empty / loading / error states audited on every screen (UI/UX spec rule)
    - `frontend/.env.example` + README updated with `NEXT_PUBLIC_*` vars
    - Verify `pnpm build` passes from repo root
    - Lighthouse mobile pass + 900px / 600px responsive sweep
    - Vercel deploy: ship from repo root with `frontend` as root directory

## 8. Privacy invariants — enforce in code, not in copy

These must be cross-checked during steps 6-8. Treat as build-blockers, not nice-to-haves.

- Every Creator screen fetch goes through `/api/analytics/community/:id` or `/api/communities/:id` — never hits `/api/membership/*` or any wallet-keyed endpoint.
- Creator screens render `community.creatorWallet` only for the *signed-in* creator, never any other wallet.
- `getAggregateStats` is the only stats source. No client-side aggregation over a list of members — that list does not exist.
- Subscriber-facing tier/expiry data is rendered on `/app/*` and `/account` only, never on `/studio/*`.
- `MOCK_*` arrays from `sorts-app.jsx` go into `frontend/test/fixtures/` and are imported only from `*.test.tsx` files or Storybook-style component playgrounds (none yet). They must NOT be imported from any file under `app/`.

## 9. Risks & blockers

| Risk | Severity | Mitigation |
|---|---|---|
| **Factory contract not deployed** — frontend tx hooks will fail until address is set | HIGH | Render a clear "Configure factory address" empty state on `/studio/create`. Defer real deploy to a separate task. The wizard UI works without a live address; only the final "Deploy" button needs the env var. |
| **Privy app id is placeholder** — login flows hit the demo-auth fallback | MED | Keep `AuthProvider` fallback. Document `NEXT_PUBLIC_PRIVY_APP_ID` as a required env var in README + Vercel project. |
| **Brand palette swap touches every existing page** | MED | Migrate `globals.css` first; old pages will pick up new tokens automatically (they use `var(--bg-base)` etc.). Visual diff after step 1. |
| **Existing `/dashboard`, `/community`, `/create`, `/discover`, `/link` pages** are different IA | MED | Replace with `redirect()` shims in step 9; do not delete the file (otherwise old bookmarks 404 instantly). |
| **Prototype prices in USDC, PRD prices in ETH** | LOW | Treat the design's `$XX USDC` labels as visual placeholders. The tier model in `@sorts/shared` uses `priceWei` — keep that. Display formatting decision: use ETH on Phase 1 (matches contracts), and document the discrepancy in the wizard's review step. |
| **`SORTS-offline.html` is 1.9 MB self-bundle**, not editable source | LOW | Already noted: prototype source is `sorts-app.jsx` + `SORTS-standalone.html`. Treat the offline bundle as a screenshot, not a spec. |
| **No deployed contract ABIs in `frontend/`** | MED | Step 4 imports ABIs from `contracts/artifacts/contracts/SortsFactory.sol/SortsFactory.json`. Wire via a tiny `lib/chain/factoryAbi.ts` shim that re-exports `abi`. Requires `pnpm --filter contracts compile` before frontend build. |
| **Tailwind theme drift** | LOW | Rewrite `tailwind.config.ts` colors so any utility classes we keep (`bg-bg-elevated` etc.) point at the new vars. |
| **Backend service files exist but routes don't** (calendar, classroom, leaderboard) | MED | Step 6 — adds ~3 small route files. Each service is already implemented and tested by the existing pattern. |
| **Time-to-deploy** vs feature breadth | HIGH | Steps 1-5 alone yield a deployable public landing + subscribe flow. Creator/Subscriber inner screens can ship incrementally without breaking the public surface. Optimize for that order. |

## 10. Verification

Before marking implementation done:

- `pnpm install && pnpm --filter contracts compile && pnpm --filter @sorts/frontend build` → succeeds from a clean clone
- `pnpm dev` boots frontend (`:3000`) and backend (`:3001`) together via Turbo
- Public flow walkable end-to-end without a wallet: `/ → /role → /join/<seeded-id> → /join/<id>/subscribe` (subscribe halts at the wallet-required step in demo-auth mode and prompts to set Privy)
- Creator flow walkable with a Privy wallet: `/auth → /studio → /studio/create` (the "Deploy" button fires a real Arbitrum Sepolia tx if `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS` is set)
- Subscriber flow walkable: `/app/<cid>/feed`, `/library`, `/membership`, `/telegram`
- No screen anywhere under `/studio/*` calls a wallet-keyed endpoint or renders an individual member identity (manual audit + grep)
- `frontend/.env.example` documents every `NEXT_PUBLIC_*` var
- README updated with the new IA + deploy steps for Vercel

---

**Next action (awaiting approval):** start at §7 step 1 (brand foundation). No code is written until you approve this plan.

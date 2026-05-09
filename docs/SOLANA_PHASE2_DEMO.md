# SORTS — Solana Phase 2 demo (devnet)

This document is the canonical script for the launch demo recording and the
Colosseum / Superteam submission walkthrough. It is **not** marketing
material — it doubles as the operator runbook, so every claim is traceable
back to a file or test.

## TL;DR

- **Network:** Solana devnet only. No mainnet code path exists in this build.
- **Program ID:** `AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV` (Quasar; Day 1).
- **Authority / deployer wallet:** `2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ`.
- **Protocol treasury:** `8z2PLCHhGwGU8PHQd1zByD64E4CeZaQuF2NBy3jrdssf`.
- **Fee split:** 5 % protocol / 95 % creator (mirrors Solidity `PROTOCOL_FEE_BPS = 500`).
- **Pre-alpha labels:** Umbra fallback + IKA dWallet card carry their disclaimers on every page.

## Demo script (target run-time 2:45)

| Time | Action | Expected on screen | Source |
|---|---|---|---|
| 0:00–0:15 | Open `/` (landing) | Hero copy: "private subscription rails for paid communities on Solana — devnet". Topbar shows the **Devnet** badge. Footer shows the long-form disclaimer. | `frontend/src/app/page.tsx`, `DisclaimerFooter` mounted in `frontend/src/app/layout.tsx`, `DevnetBadge` in `frontend/src/components/layout/TopBar.tsx` |
| 0:15–0:45 | Click "Create a community" → `/studio/create` → connect Solana wallet → fill the wizard → submit | `SolanaWalletButton` (Phantom/Solflare) connects via wallet-adapter-react. Wizard (basics → tiers → review → deploy) runs. `useSolanaChainAdapter.createCommunity` builds + signs `initialize_community` ix and confirms on devnet. | `frontend/src/components/studio/CreateCommunityWizard.tsx`, `frontend/src/lib/chain/adapters/SolanaChainAdapter.ts`, `frontend/src/lib/solana/instructions.ts` |
| 0:45–1:30 | Sign in with Privy → preview 2 communities → 3rd preview blocked → subscribe to one | `useUmbraPrivacy` hits `/api/privacy/status`. `useSolanaMembership` hits `/api/privacy/entitlement`. The 3rd distinct community returns 403 `{error:'preview_quota_exceeded', limit:2}` — UI surfaces it. Subscribe runs `useSolanaChainAdapter.subscribe` (`subscribe` ix → 5/95 split). | `backend/src/services/community/preview-quota.ts`, `backend/src/api/middleware/preview-quota.ts`, `frontend/src/app/join/[cid]/subscribe/page.tsx` |
| 1:30–2:00 | Open `/app/<cid>/feed` → unlocked posts visible → open `/studio/<cid>/analytics` | `UmbraMembershipCard` reads "On-chain commitment fallback" + "Devnet experimental". `AggregateStatsCard` shows total / active / expired / revenue / posts — never any wallet, ENS, or tier breakdown. | `frontend/src/components/privacy/UmbraMembershipCard.tsx`, `frontend/src/components/studio/AggregateStatsCard.tsx`, `backend/src/services/analytics.ts` (chain-aware, formats SOL on Solana) |
| 2:00–2:30 | Open `/account` → IKA dWallet section | `SignerCapabilitiesCard` renders the red/orange "PRE-ALPHA — NOT FOR REAL FUNDS" stripe + capability matrix. `MultichainAssetPanel` + `MessageApprovalLifecycle` (state: prepared) below. | `frontend/src/components/wallet/SignerCapabilitiesCard.tsx`, `IkaDWalletService` ⇒ `/api/wallet/capabilities` |
| 2:30–2:45 | Scroll to footer | Disclaimer footer: "Devnet only — no real funds. Privy / Umbra / IKA pre-alpha. Aggregate-only creator analytics." | `frontend/src/components/layout/DisclaimerFooter.tsx` |

## Known limitations (call out in the video voice-over)

- **Umbra:** Day 4 cut-line tripped. Real Umbra registration call returns
  `Transaction simulation failed` on devnet and `MXE account not found
  on-chain` on mainnet. Privacy mode is `on-chain-commitment-fallback` —
  we still derive entitlement from the on-chain Subscription PDA's
  `tier_commitment`, but we do **not** claim Umbra is active.
- **IKA:** Day 6 cut-line tripped. `IkaDWalletService` ships as a static
  capability descriptor. The real-funds method throws even when
  `ENABLE_IKA_REAL_FUNDS=true` is set, with an explicit "not implemented in
  pre-alpha" message.
- **Quasar CLI:** `quasar build` and `quasar test` return opaque "Anyhow
  error" on the pinned revision. We bypass with `cargo build-sbf` +
  `solana program deploy`. Underlying framework macros (`#[program]`,
  `#[account(set_inner)]`, `#[seeds]`, `#[derive(Accounts)]`) all work.
- **Two forced spec deviations on the Solana program** (Quasar `#[seeds]`
  derive limitations): Community PDA seeded by `[b"community", creator]`
  only (name_hash kept as a field, not a seed); tiers stored as 3 inline
  slots in Community instead of separate Tier PDAs. Public ix surface
  unchanged.
- **Playwright:** the e2e happy-path spec is **not** wired into CI yet.
  The 11-suite jest set + `cargo test` cover privacy / quota / replay /
  rate-limit / fee-split / chain-factory / IKA-no-real-funds / env-startup
  contracts. Browser-flow assertion is a follow-up.

## What NOT to demo

- Do not click any UI that mentions mainnet, real funds, or USDC payment.
  None of those paths are wired in this build, but a stray demo click would
  surface "not implemented" toasts that read worse than the planned silence.
- Do not screenshare the connected wallet's secret recovery phrase.
- Do not show the Render / Supabase / Privy admin consoles on screen.
  Redact wallet addresses and RPC URLs in any capture.

## Devnet / pre-alpha caveats (must be visible on the video)

- `DevnetBadge` is mounted site-wide in the topbar.
- `PreAlphaBadge` mounts on the Umbra membership card and on the IKA
  capabilities card.
- `DisclaimerFooter` mounts globally in `frontend/src/app/layout.tsx`.

## Rollback plan

- **Backend / DB:** clear `DATABASE_URL` on Render → backend boots into
  the existing better-sqlite3 path on the Persistent Disk addon.
  Confirmed locally: `selectDriver()` returns `'sqlite'`. See
  [INFRASTRUCTURE.md](./INFRASTRUCTURE.md).
- **Frontend:** revert the Vercel deployment to the previous commit from
  the dashboard.
- **On-chain program:** the deployed Solana program is upgrade-authority
  controlled by the deployer wallet. `solana program deploy --program-id
  target/deploy/sorts_community-keypair.json` against the same id replays
  the rollback artifact.

## Demo video link

Recording target: unlisted YouTube or Loom. The link replaces this line
once captured:

```
TODO: paste the unlisted video URL after recording.
```

Captures live in `frontend/public/demo-screenshots/` (gitignored — see
[SCREENSHOT_INDEX.md](./SCREENSHOT_INDEX.md)).

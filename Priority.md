# SORTS Priority Plan - Phase 2 Solana Launch

Current target: ship a fast Phase 2 Solana devnet launch using Privy, Umbra Privacy SDK, IKA dWallet, and encrypted membership-state flows.

Deadline: May 12, 2026.

Ship posture: build a credible devnet MVP in 10 days. Do not overclaim production privacy, production MPC, or mainnet readiness.

## Operating Rules

- Do not edit `.env` or `.env.*` files.
- Do not print private keys, RPC URLs, access tokens, API secrets, or secret environment values.
- Do not deploy unless explicitly requested.
- Do not add public member-list or enumerable member-registry functions.
- Preserve the SORTS privacy invariant: no public member list, no enumerable member registry, aggregate stats only, and single-address or single-user membership reads only.
- Keep Arbitrum work intact. Solana must be additive behind adapters, not a rebuild.
- Keep feature modules chain-agnostic.
- Do not claim real production FHE, real production MPC, or mainnet privacy guarantees from pre-alpha systems.
- Use feature flags for Umbra, IKA, Encrypt-like, mixer, compliance, and real-funds paths.
- Test after each implementation step.

## Source Documents Used

- `/Users/rejoelm/Downloads/sorts_privy_wallet_skill_spec.json`
- `/Users/rejoelm/Downloads/sorts_ika_multichain_wallet_skill_spec.json`
- `/Users/rejoelm/Downloads/sorts_umbra_nox_like_privacy_skill_spec.json`
- `/Users/rejoelm/Downloads/sorts_solana_privacy_skill_spec.json`
- `/Users/rejoelm/Downloads/sorts-low-llm-prompt-pack.md`
- `/Users/rejoelm/Desktop/AI Projects/PrivateSubscriptionRails_GrandDesign.md`
- Existing repo instructions in `AGENTS.md`

## Phase 2 Decision Lock

- Phase 2 launch chain is Solana devnet.
- Umbra Privacy SDK is the privacy layer for Solana hidden membership state.
- IKA dWallet is the programmable multichain wallet and signing-control layer.
- Privy remains the account/authentication and wallet-orchestration layer.
- Umbra is not a full Nox-equivalent confidential smart-contract runtime.
- IKA pre-alpha must not be treated as production MPC signing.
- Encrypt-like pre-alpha flows, if used, must be marked experimental and feature-flagged.
- DataProtector remains a content-delivery/protection concern, not the Solana membership-state layer.
- The first privacy demo is confidential membership state, not confidential payments.
- Free-preview access is not an on-chain zero-price tier.
- Preview access is limited to 2 community previews, tracked by wallet address plus browser session.
- Creators choose which content and community surfaces are free-preview eligible.
- Buying, subscribing, and upgrading membership use normal wallet transaction confirmation for MVP.
- No extra typed-data signature is required before payment for MVP.

## Important Architecture Correction

Transparent proxy is an EVM upgrade pattern. It should not be forced onto Solana.

For the Solana launch:

- Use Solana program upgrade authority and explicit program versioning for program-level upgrades.
- Use creator-owned community admin accounts or PDAs for creator-controlled community configuration.
- Plan future production upgrade control with protocol owner multisig plus a 2-hour timelock.
- Keep the earlier transparent proxy idea only for future EVM community contracts.

## Truth Constraints From Attached Specs

### Privy

- Privy is auth, wallet onboarding, wallet selection, and transaction orchestration.
- Privy is not the privacy protocol.
- Privy must not be described as hiding balances, hiding tiers, or encrypting content.
- Support embedded wallets and external wallets.
- Support Arbitrum and Solana wallet contexts through a project wallet abstraction.
- Backend should verify Privy identity for protected app operations.
- Server-side or offline wallet actions stay disabled unless explicitly designed and feature-flagged.

### Umbra

- Package target from attached spec: `@umbra-privacy/sdk`.
- Umbra Solana privacy modes: encrypted balances and optional mixer/UTXO flows.
- Use encrypted balances as the hidden membership-state approximation.
- Use mixer/UTXO only if unlinkability is needed; keep mixer disabled for the 10-day MVP unless there is extra time.
- Master seed is sensitive like a private key. Do not log it, persist it casually, or alter its derivation message.
- Registration should be idempotent.
- Compliance grants are voluntary and user-initiated.
- Revocation does not erase ciphertext already obtained by a grantee.
- Umbra is not a content encryption system by itself.

### IKA

- IKA dWallet is programmable multichain signing and wallet-control infrastructure.
- IKA is not a replacement for Privy.
- Current IKA environment is pre-alpha and must not be treated as production MPC.
- Pre-alpha state can be wiped.
- Signing is async: prepare, approve, pending signature, signed, broadcasted.
- Gas deposit lifecycle matters.
- Program-controlled dWallet authority is the long-term differentiator, but user-controlled or hybrid mode is safer for a fast MVP.

### Solana Privacy Infrastructure

- Solana support must extend the existing chain adapter pattern.
- Feature modules must not call Umbra, IKA, or Solana SDKs directly.
- Solana-specific behavior belongs behind backend services, shared interfaces, hooks, and adapters.
- Real FHE and real MPC flags must remain false until supported and verified.
- Devnet-only assumptions must be visible in UI and docs.

## Feature Flags

Use feature flags instead of hardcoding experimental behavior.

Recommended flags:

- `ENABLE_SOLANA_PHASE2`
- `ENABLE_PRIVY_SOLANA`
- `ENABLE_UMBRA_ENCRYPTED_BALANCES`
- `ENABLE_UMBRA_MIXER`
- `ENABLE_UMBRA_COMPLIANCE_GRANTS`
- `ENABLE_SERVER_SIDE_TIER_EVALUATION`
- `ENABLE_IKA_DWALLET`
- `ENABLE_IKA_PROGRAM_CONTROL`
- `IKA_PRE_ALPHA_MODE`
- `ENABLE_IKA_REAL_FUNDS`
- `ENABLE_REAL_FHE`
- `ENABLE_REAL_MPC_SIGNING`

MVP defaults:

- Solana devnet enabled.
- Umbra encrypted balances enabled.
- Umbra compliance enabled only if needed for backend tier evaluation.
- Umbra mixer disabled.
- IKA dWallet enabled only for pre-alpha wallet/signing demo.
- IKA real funds disabled.
- Real FHE disabled.
- Real MPC signing disabled.

## Target MVP Demo

The 10-day demo should show:

1. Creator creates a Solana private subscription community.
2. Creator marks preview content and sees aggregate-only dashboard stats.
3. Subscriber signs in with Privy.
4. Subscriber sees EVM and Solana wallet context.
5. Subscriber previews up to 2 communities by wallet plus browser session.
6. Subscriber opens the Solana community flow.
7. Subscriber registers or checks Umbra registration.
8. Subscriber confirms a wallet transaction for subscribe/join.
9. App checks Umbra-backed hidden membership state or a feature-flagged private-membership service.
10. App gates content without exposing public member lists.
11. Subscriber sees locked/unlocked content state.
12. User sees IKA dWallet status/capability card.
13. IKA flow shows pre-alpha lifecycle stages without claiming production MPC.
14. Arbitrum path remains available and not broken.

Out of scope for the 10-day MVP:

- Mainnet.
- Real funds through IKA.
- Production MPC claims.
- Full mixer/UTXO subscription flow.
- Full Solana institutional dashboard.
- Full cross-chain EVM broadcast through IKA.
- Replacing all Arbitrum membership flows.

## Colosseum Winner Spec

Canonical spec: `docs/COLOSSEUM_WINNER_SPEC.md`.

Judging posture:

- Pitch SORTS as **private subscription rails for paid communities**, not a generic Skool clone.
- The wedge is private recurring access for creators, paid Telegram/research communities, and gated content.
- The demo must be understandable in under 3 minutes.
- The strongest proof is: creator creates community, subscriber joins, private membership/access state unlocks content, creator sees aggregate revenue/subscriber stats only, and expired/cancelled access locks content.
- Privacy claims must be accurate: no public member list, non-leaky membership state, Umbra/IKA devnet/pre-alpha caveats visible.
- Business model should stay simple: 2-5% subscription take rate plus future Creator Pro SaaS.
- GTM should target paid crypto trading/research communities first because they already sell access and care about privacy.

## Required Architecture

### Shared Interfaces

Create or update:

- `packages/shared/src/interfaces/IChainService.ts`
- `packages/shared/src/interfaces/IWalletService.ts`
- `packages/shared/src/interfaces/IMultichainControlService.ts`
- `packages/shared/src/interfaces/IPrivacyComputeService.ts`
- `packages/shared/src/types/chain.ts`
- `packages/shared/src/types/wallet.ts`
- `packages/shared/src/types/privacy.ts`
- `packages/shared/src/types/membership.ts`

Minimum shared responsibilities:

- `IChainService`: create community, subscribe, renew, check access, get aggregate stats.
- `IWalletService`: authenticate, list wallets, get chain address, get wallet capabilities.
- `IMultichainControlService`: prepare action, approve message, poll approval, read signature, broadcast signed action.
- `IPrivacyComputeService`: evaluate private entitlement, simulate encrypted check, return non-leaky access result.

### Backend Services

Create or update:

- `backend/src/services/chain/SolanaService.ts`
- `backend/src/services/chain/ChainServiceFactory.ts`
- `backend/src/services/chain/UmbraPrivacyService.ts`
- `backend/src/services/chain/UmbraComplianceService.ts`
- `backend/src/services/chain/UmbraMixerService.ts`
- `backend/src/services/wallet/PrivyService.ts`
- `backend/src/services/wallet/IkaDWalletService.ts`
- `backend/src/services/wallet/CrossChainSigningService.ts`
- `backend/src/services/wallet/GasDepositService.ts`
- `backend/src/api/middleware/auth.ts`
- `backend/src/api/routes/wallet.ts`
- `backend/src/api/routes/solana.ts`
- `backend/src/api/routes/privacy.ts`

Backend service rules:

- `SolanaService` owns Solana community subscribe/access/stats orchestration.
- `UmbraPrivacyService` owns Umbra client construction, registration, deposits, encrypted balance queries.
- `UmbraComplianceService` owns voluntary disclosure and audit flows.
- `UmbraMixerService` stays optional and disabled by default.
- `IkaDWalletService` owns dWallet metadata, lifecycle, capability, and pre-alpha state.
- `CrossChainSigningService` owns async signing stages, not raw UI components.
- `GasDepositService` owns preflight gas deposit status and warnings.
- API responses must not leak exact private tier amounts or hidden balances.

### Frontend

Create or update:

- `frontend/src/components/providers/PrivyProvider.tsx`
- `frontend/src/components/providers/ChainProvider.tsx`
- `frontend/src/hooks/useWallet.ts`
- `frontend/src/hooks/useChain.ts`
- `frontend/src/hooks/useSolanaMembership.ts`
- `frontend/src/hooks/useUmbraPrivacy.ts`
- `frontend/src/lib/chains.ts`
- `frontend/src/lib/solana/*`
- `frontend/src/lib/umbra/*`
- `frontend/src/components/account/CrossChainIdentityCard.tsx`
- `frontend/src/components/wallet/WalletManager.tsx`
- `frontend/src/components/wallet/MultichainAssetPanel.tsx`
- `frontend/src/components/wallet/SignerCapabilitiesCard.tsx`
- `frontend/src/components/privacy/UmbraMembershipCard.tsx`
- `frontend/src/components/privacy/PrivacyModeBadge.tsx`

Frontend rules:

- Pages should use project hooks/services, not direct Umbra/IKA SDK calls.
- Show pre-alpha warning badges for IKA and any Encrypt-like functionality.
- Show "devnet" clearly.
- Distinguish auth identity, wallet authority, privacy state, and target-chain action.
- Show IKA signing as async lifecycle: prepared, awaiting approval, pending signature, signed, broadcasted.

### Solana Programs

Create only if time allows after adapter services are stable:

- `programs/sorts-community/`
- `programs/sorts-dwallet/`

Fast MVP path:

- Start with backend Solana adapter and Umbra devnet flows.
- Add program scaffolding only if it does not derail the demo.
- If programs are scaffolded, keep account layouts versioned and tests minimal.

Program responsibilities:

- `sorts-community`: community config, tier model, expiry, points, access-policy inputs.
- `sorts-dwallet`: dWallet control references, message approval references, future CPI authority flow.

## 10-Day Shipping Plan

### Day 1 - May 2: Scope Lock And Browser Recovery

Goal: make the repo safe to build on.

Tasks:

- Fix any raw/default frontend styling regression on `/studio/create`.
- Confirm global CSS, Tailwind, and SORTS tokens load correctly.
- Add this Solana Phase 2 plan as the current priority.
- Add docs warning that Solana privacy launch is devnet/pre-alpha.
- Do not install Umbra or IKA packages yet unless the repo builds cleanly.

Files:

- `frontend/src/app/layout.tsx`
- `frontend/src/styles/globals.css`
- `frontend/src/app/studio/layout.tsx`
- `frontend/src/app/studio/create/page.tsx`
- `Priority.md`

Verification:

```bash
pnpm --filter @sorts/frontend build
```

Done when:

- Existing frontend styling is restored.
- The app is visually usable again.
- Solana launch plan is clear.

### Day 2 - May 3: Wallet/Auth Abstraction

Goal: make Privy the account and wallet-orchestration layer for both EVM and Solana.

Tasks:

- Add or normalize `IWalletService` shared interface.
- Add wallet descriptor types for embedded wallet, external wallet, EVM, and Solana.
- Add Privy auth middleware on backend.
- Add frontend `useWallet` hook.
- Ensure wallet code does not claim privacy properties.
- Keep server-side/offline wallet actions disabled by default.

Files:

- `packages/shared/src/interfaces/IWalletService.ts`
- `packages/shared/src/types/wallet.ts`
- `packages/shared/src/types/chain.ts`
- `backend/src/api/middleware/auth.ts`
- `backend/src/services/wallet/PrivyService.ts`
- `frontend/src/hooks/useWallet.ts`
- `frontend/src/components/providers/PrivyProvider.tsx`

Verification:

```bash
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

Done when:

- Protected backend actions can identify a Privy user.
- Frontend can display active wallet context.
- No private keys are stored or logged.

### Day 3 - May 4: Solana Adapter Skeleton

Goal: add Solana without breaking Arbitrum.

Tasks:

- Add Solana chain metadata and devnet capability flags.
- Add `SolanaService` implementing chain adapter methods.
- Add `ChainServiceFactory` routing by chain.
- Add safe placeholder responses where SDK work is not yet wired.
- Add anti-regression checks that Arbitrum service still builds.

Files:

- `packages/shared/src/interfaces/IChainService.ts`
- `packages/shared/src/types/chain.ts`
- `backend/src/services/chain/SolanaService.ts`
- `backend/src/services/chain/ChainServiceFactory.ts`
- `backend/src/services/chain/ArbitrumService.ts`

Verification:

```bash
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

Done when:

- Backend can choose Arbitrum or Solana adapter.
- Generic feature code does not import Solana SDK directly.

### Day 4 - May 5: Umbra SDK Boundary

Goal: create the Umbra service layer without leaking SDK details into app features.

Tasks:

- Verify current Umbra SDK APIs before coding.
- Install only required Umbra packages if verified.
- Create `UmbraPrivacyService`.
- Add registration status/check flow.
- Add encrypted balance query wrapper.
- Add deposit/subscribe wrapper if SDK flow is clear.
- Keep master seed handling session-scoped or re-derived; do not store sensitive seed material in the DB.
- Keep mixer disabled.

Files:

- `backend/src/services/chain/UmbraPrivacyService.ts`
- `backend/src/services/chain/UmbraComplianceService.ts`
- `backend/src/services/chain/UmbraMixerService.ts`
- `frontend/src/lib/umbra/*`
- `frontend/src/hooks/useUmbraPrivacy.ts`
- `packages/shared/src/types/privacy.ts`

Verification:

```bash
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

Done when:

- Umbra is isolated behind services.
- App can check registration or encrypted-balance state.
- No seed or private material is logged.

### Day 5 - May 6: Confidential Membership State

Goal: make Umbra encrypted balances the Solana hidden membership-state approximation.

Tasks:

- Define membership state as private entitlement result, not public tier leakage.
- Implement Solana access check through `SolanaService`.
- Subscribe flow should create/update encrypted membership state where SDK supports it.
- Access check should return boolean/entitlement level only, not raw hidden balances.
- Add backend API route for Solana membership status.
- Add tests for non-leaky responses.

Files:

- `backend/src/services/chain/SolanaService.ts`
- `backend/src/services/chain/UmbraPrivacyService.ts`
- `backend/src/api/routes/solana.ts`
- `backend/src/api/routes/community.ts`
- `packages/shared/src/types/membership.ts`

Verification:

```bash
pnpm --filter @sorts/backend build
```

Done when:

- Solana access checks can power gated content.
- API never returns exact encrypted tier/balance values.

### Day 6 - May 7: IKA dWallet Pre-Alpha Layer

Goal: add IKA wallet capability/status flow without claiming production MPC.

Tasks:

- Verify current IKA SDK/API before coding.
- Add `IkaDWalletService`.
- Add dWallet descriptor and capability matrix.
- Add MessageApproval lifecycle types.
- Add GasDeposit status type.
- Add backend endpoints for dWallet status and capability.
- Do not enable real-funds flows.
- Add UI pre-alpha warnings.

Files:

- `packages/shared/src/interfaces/IMultichainControlService.ts`
- `packages/shared/src/types/wallet.ts`
- `backend/src/services/wallet/IkaDWalletService.ts`
- `backend/src/services/wallet/CrossChainSigningService.ts`
- `backend/src/services/wallet/GasDepositService.ts`
- `backend/src/api/routes/wallet.ts`
- `frontend/src/components/wallet/SignerCapabilitiesCard.tsx`
- `frontend/src/components/wallet/MultichainAssetPanel.tsx`

Verification:

```bash
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

Done when:

- User can see dWallet status/capabilities.
- UI clearly says pre-alpha and not for real funds.
- No signing path runs without explicit feature flag.

### Day 7 - May 8: Solana Frontend Join Flow

Goal: connect the UI to Solana membership and privacy services.

Tasks:

- Add chain-aware join route behavior.
- Add Solana privacy membership card.
- Prompt Privy login first.
- Select Solana wallet context.
- Show Umbra registration/check state.
- Show subscribe button and wallet transaction confirmation flow.
- Show locked/preview/member content states.

Files:

- `frontend/src/app/join/[communityId]/page.tsx`
- `frontend/src/hooks/useSolanaMembership.ts`
- `frontend/src/hooks/useUmbraPrivacy.ts`
- `frontend/src/components/privacy/UmbraMembershipCard.tsx`
- `frontend/src/components/wallet/WalletManager.tsx`
- `frontend/src/lib/api/*`

Verification:

```bash
pnpm --filter @sorts/frontend build
```

Done when:

- A user can move from login to Solana membership action UI.
- Wrong chain/wrong wallet states are clear.
- No direct Umbra/IKA SDK calls are scattered in page components.

### Day 8 - May 9: Creator Preview Controls

Goal: implement the 2-community preview model and creator-selected preview content.

Tasks:

- Track preview quota by wallet address plus browser session.
- Let creators mark content as free-preview eligible.
- Let creators choose preview surfaces.
- Enforce 2 community previews total for non-members.
- Paid content remains locked.
- Do not expose member lists or private membership state.

Files:

- `backend/src/services/community.ts`
- `backend/src/api/routes/community.ts`
- `backend/src/api/routes/content.ts`
- `frontend/src/components/studio/*`
- `frontend/src/app/studio/*`
- `frontend/src/lib/api/*`

Verification:

```bash
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

Done when:

- Creator can mark preview content.
- Non-member preview cannot exceed quota.
- Access logic does not require member enumeration.

### Day 9 - May 10: Devnet E2E And Safety Copy

Goal: prove the demo flow and remove unsafe claims.

Tasks:

- Add or run Solana devnet smoke checks.
- Test Privy login plus Solana wallet state.
- Test Umbra registration/encrypted membership state.
- Test IKA dWallet status/capability.
- Test preview quota.
- Test creator dashboard aggregate-only stats.
- Test locked/unlocked content state.
- Test Arbitrum path still builds.
- Update copy to say devnet/pre-alpha where appropriate.
- Align the demo story with `docs/COLOSSEUM_WINNER_SPEC.md`.

Verification:

```bash
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

Done when:

- All builds pass.
- Demo script works.
- No UI claims production FHE or production MPC.

### Day 10 - May 11: Freeze And Demo Script

Goal: freeze scope and prepare the launch walkthrough.

Tasks:

- Write `docs/SOLANA_PHASE2_DEMO.md`.
- Use `docs/COLOSSEUM_WINNER_SPEC.md` as the judge-facing product spec.
- Include exact demo steps.
- Include known limitations.
- Include devnet/pre-alpha warnings.
- Include rollback plan.
- Include what not to demo.
- Draft the under-3-minute video script.
- Include business model and first-creator GTM wedge.
- Run full verification.

Verification:

```bash
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

Done when:

- Demo doc exists.
- Full verification passes.
- No new feature work is accepted after freeze unless it fixes a blocker.

### May 12: Deadline Buffer

Use this day only for:

- fixing blockers,
- recording demo,
- final browser verification,
- screenshots,
- documentation polish,
- deployment only if explicitly approved.

Do not add new features on May 12.

## Implementation Prompt Sequence

Use these prompts one by one. Do not combine them.

### Prompt A - Fix Styling And Freeze Scope

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Fix the visible frontend styling regression and freeze the Solana Phase 2 launch scope.

Hard rules:
- Do not touch .env files.
- Do not print secrets or RPC URLs.
- Do not deploy.
- Do not add dependencies.
- Do not redesign unrelated UI.

Inspect:
- frontend/src/app/layout.tsx
- frontend/src/styles/globals.css
- frontend/src/app/studio/layout.tsx
- frontend/src/app/studio/create/page.tsx
- Priority.md

Goal:
- Restore SORTS styling on / and /studio/create.
- Keep the app visually usable.
- Confirm Priority.md reflects Solana devnet + Umbra + IKA as Phase 2 launch.

Run:
pnpm --filter @sorts/frontend build

Final response:
- root cause
- files changed
- build result
- manual browser checks
```

### Prompt B - Add Shared Wallet And Chain Interfaces

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Add shared Phase 2 wallet, chain, privacy, and multichain-control interfaces.

Hard rules:
- Do not touch .env files.
- Do not change runtime behavior broadly.
- Do not install SDKs yet.
- Do not break Arbitrum.

Create/update:
- packages/shared/src/interfaces/IWalletService.ts
- packages/shared/src/interfaces/IMultichainControlService.ts
- packages/shared/src/interfaces/IPrivacyComputeService.ts
- packages/shared/src/types/chain.ts
- packages/shared/src/types/wallet.ts
- packages/shared/src/types/privacy.ts
- packages/shared/src/types/membership.ts

Requirements:
- Include Solana devnet as additive chain support.
- Include feature flags for Umbra, IKA, real FHE false, real MPC false.
- Include wallet descriptors for Privy embedded/external, EVM, Solana, IKA dWallet.
- Do not import Umbra or IKA SDKs in shared types.

Run:
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build

Final response:
- files changed
- interfaces added
- build results
```

### Prompt C - Privy Auth And Wallet Service

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Implement Privy as the auth and wallet-orchestration layer.

Hard rules:
- Do not touch .env files.
- Do not print secrets.
- Privy is not the privacy protocol.
- Do not enable server-side wallet actions by default.

Inspect:
- existing frontend auth provider
- backend routes
- package shared interfaces

Implement:
- backend PrivyService and auth middleware
- frontend useWallet hook
- wallet descriptors for embedded/external EVM/Solana wallets
- protected route helper for creator/backend actions

Run:
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build

Final response:
- files changed
- auth behavior
- build results
- remaining env setup notes without printing secret values
```

### Prompt D - Solana Chain Adapter

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Add SolanaService behind the Chain Adapter Pattern.

Hard rules:
- Do not touch .env files.
- Do not break ArbitrumService.
- Do not put Solana SDK calls in feature modules.
- Do not overclaim privacy.

Implement:
- backend/src/services/chain/SolanaService.ts
- backend/src/services/chain/ChainServiceFactory.ts if missing
- chain capability metadata
- safe devnet-only responses where SDK pieces are not wired yet

Run:
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build

Final response:
- files changed
- adapter behavior
- anti-regression notes
- build results
```

### Prompt E - Umbra Privacy Service

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Add Umbra Privacy SDK service boundary for Solana hidden membership state.

Hard rules:
- Verify current Umbra SDK API before coding.
- Do not touch .env files.
- Do not print seeds, signatures, private keys, RPC URLs, or secret env values.
- Do not log master seed or hidden balances.
- Do not enable mixer by default.

Implement:
- backend/src/services/chain/UmbraPrivacyService.ts
- backend/src/services/chain/UmbraComplianceService.ts
- backend/src/services/chain/UmbraMixerService.ts as disabled/optional boundary
- frontend/src/lib/umbra/* if needed
- frontend/src/hooks/useUmbraPrivacy.ts if needed

Requirements:
- registration check
- idempotent registration flow
- encrypted-balance query wrapper
- deposit/subscribe wrapper only if SDK API is verified
- compliance grant boundary if needed for server-side tier evaluation

Run:
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build

Final response:
- files changed
- Umbra APIs used
- feature flags
- build results
```

### Prompt F - Solana Confidential Membership Flow

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Wire Solana confidential membership state using Umbra encrypted balances.

Hard rules:
- Do not touch .env files.
- Do not expose raw hidden balances or tier amounts.
- Do not add member enumeration.
- Do not claim full Nox parity.

Implement:
- SolanaService subscribe/access-check methods
- backend API route for Solana membership status
- non-leaky entitlement response shape
- frontend hook useSolanaMembership
- UI card showing hidden membership state without raw values

Run:
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build

Final response:
- files changed
- membership flow summary
- privacy confirmation
- build results
```

### Prompt G - IKA dWallet Layer

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Add IKA dWallet pre-alpha wallet/signing capability layer.

Hard rules:
- Verify current IKA APIs before coding.
- Do not touch .env files.
- Do not print secrets.
- Do not claim production MPC.
- Do not enable real-funds paths.

Implement:
- backend/src/services/wallet/IkaDWalletService.ts
- backend/src/services/wallet/CrossChainSigningService.ts
- backend/src/services/wallet/GasDepositService.ts
- backend/src/api/routes/wallet.ts
- frontend wallet capability cards

Requirements:
- dWallet status
- supported chain/signature scheme capability matrix
- MessageApproval lifecycle types
- gas deposit warning state
- pre-alpha UI badges

Run:
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build

Final response:
- files changed
- IKA boundaries
- pre-alpha warnings
- build results
```

### Prompt H - Solana Join UI

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Build the Solana join/subscription UI path.

Hard rules:
- Do not touch .env files.
- Do not redesign unrelated pages.
- Use existing CSS tokens and styling.
- Do not call Umbra or IKA SDKs directly from page components.

Implement:
- chain-aware join flow
- Privy login first
- Solana wallet selection
- Umbra registration state
- subscribe/payment wallet transaction confirmation
- privacy membership card
- locked/preview/member states

Run:
pnpm --filter @sorts/frontend build

Final response:
- files changed
- UI behavior
- build result
- manual browser checks
```

### Prompt I - Preview Quota And Creator Controls

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Implement free-preview access controls.

Hard rules:
- Do not touch .env files.
- Do not add zero-price on-chain membership.
- Do not expose member lists.
- Do not redesign unrelated UI.

Product rules:
- No active membership means preview state.
- Preview quota is 2 community previews total.
- Track quota by wallet address plus browser session.
- Creators choose free-preview content and preview surfaces.

Implement:
- backend quota tracking
- creator preview flags
- frontend locked/preview/member states
- safe API responses

Run:
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build

Final response:
- files changed
- quota enforcement
- build results
```

### Prompt J - Final Solana Phase 2 Verification

```text
You are GPT-5.5 Codex High working in the SORTS repo.

Task: Final verification for Solana Phase 2 devnet launch.

Hard rules:
- Do not touch .env files.
- Do not print secrets or RPC URLs.
- Do not deploy unless explicitly asked.
- Do not add new features.
- Only fix blockers required for verification.

Run:
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build

Verify:
- Arbitrum path still builds.
- Solana adapter is additive.
- Privy wallet/auth works.
- Umbra membership state is hidden/non-leaky.
- IKA UI says pre-alpha and no real funds.
- Preview quota works.
- No public member list or member enumeration was added.
- No production FHE/MPC claims remain.

Final response:
## Passed checks
## Fixes made during verification
## Remaining manual steps
## Demo warnings
```

## Testing Matrix

### Required Build Checks

Run these before the deadline:

```bash
pnpm --filter contracts compile
pnpm --filter contracts test
pnpm --filter @sorts/backend build
pnpm --filter @sorts/frontend build
```

### Backend Tests To Add

- Privy auth rejects missing/invalid identity.
- Wallet descriptor does not expose key material.
- Solana adapter returns non-leaky access decisions.
- Umbra service does not log seed, private state, or raw hidden balances.
- IKA real-funds path is disabled.
- Feature flags disable experimental services cleanly.
- Preview quota rejects the third community preview.

### Frontend Tests To Add

- Login state renders.
- Solana wallet selection renders.
- Umbra membership card renders devnet/privacy state.
- IKA dWallet card renders pre-alpha warning.
- Preview/locked/member states render correctly.
- Wrong chain/wrong wallet states are readable.

### Devnet Smoke Tests

- Privy login.
- Solana wallet available.
- Umbra registration status can be checked.
- Solana membership status can be checked.
- Preview quota works.
- IKA status/capability route works if enabled.

## Demo Script

1. Open landing page.
2. Show SORTS wallet/account area.
3. Sign in with Privy.
4. Show EVM and Solana wallet contexts.
5. Open Solana community.
6. Show free-preview state.
7. Preview up to 2 communities.
8. Attempt third preview and show lock.
9. Show creator-selected free-preview content.
10. Open Solana membership card.
11. Show Umbra registration or hidden membership-state check.
12. Trigger subscribe/payment confirmation if devnet flow is ready.
13. Show gated content access after membership.
14. Show IKA dWallet card and pre-alpha lifecycle/status.
15. State clearly: devnet, pre-alpha, no real funds, no production MPC claims.

## Launch Cut Line

If time runs short, ship in this order:

1. Fix styling and restore app shell.
2. Privy wallet/auth.
3. Solana adapter skeleton.
4. Umbra registration and hidden membership-state check.
5. Solana join UI.
6. Preview quota.
7. IKA dWallet status card.
8. IKA signing lifecycle.
9. Solana program scaffolding.
10. Mixer/UTXO.

Do not sacrifice build stability or privacy truthfulness for deeper IKA or mixer features.

## Do Not Ship

- Real-funds IKA flows.
- Mainnet Umbra flows.
- Mixer as required path.
- Claims of production FHE.
- Claims of production MPC.
- Public member lists.
- Full raw hidden balances in API responses.
- SDK calls scattered through frontend pages.
- Direct Solana-specific imports in generic feature modules.
- New `.env` files committed to git.

## Final Definition Of Done

Phase 2 Solana launch is done when:

- Full build/test command set passes.
- Solana devnet path is visible and usable.
- Privy auth/wallet context is active.
- Umbra hidden membership-state flow is available or clearly feature-flagged with safe fallback.
- IKA dWallet capability/status appears with pre-alpha warnings.
- Preview quota works for wallet plus browser session.
- Arbitrum path still works.
- Docs and UI avoid false privacy/security claims.
- No secrets were printed or committed.

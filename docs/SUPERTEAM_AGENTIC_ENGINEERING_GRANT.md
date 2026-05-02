# SORTS - Superteam Agentic Engineering Grant Application Draft

Grant target: Agentic Engineering Grants by Superteam.

Grant page: `https://superteam.fun/earn/grants/agentic-engineering/`

Current public listing facts checked on May 2, 2026:

- Grant is open and global.
- Cheque size shown: `200 USDG`.
- Average response time shown: `1 Week`.
- Skills listed: frontend, blockchain, backend, content.

## Application Summary

Project name: SORTS

One-liner:

SORTS is private subscription rails for paid communities on Solana, letting creators sell recurring access while subscribers prove membership without exposing a public member graph.

Short description:

SORTS helps paid communities move from manual Telegram/Discord subscription management to private Solana-based access rails. Creators can launch a subscription community, mark preview content, and see aggregate revenue and subscriber stats. Subscribers can preview communities, subscribe with wallet confirmation, and unlock gated content through non-leaky membership checks. The Phase 2 build focuses on Solana devnet, Privy wallet/auth, Umbra hidden membership state, and IKA dWallet capability display.

## Suggested Grant Form Answers

### What are you building?

I am building SORTS, private subscription rails for paid communities on Solana.

The product lets a creator launch a paid community, accept Solana-based subscription payments, gate content or Telegram/web access, and see aggregate subscriber and revenue stats without exposing a public subscriber wallet list. The subscriber flow is designed around privacy: users can preview up to two communities, join with wallet confirmation, and prove active membership through a non-leaky membership-state layer.

For the current sprint, I am shipping a Solana devnet demo with Privy for auth and wallet orchestration, Umbra Privacy SDK for hidden membership-state experiments, and IKA dWallet for programmable multichain wallet capability display. I am explicitly treating Umbra and IKA as devnet/pre-alpha where appropriate and will not claim production FHE or production MPC.

### Why does this matter for Solana?

Paid communities are already a real behavior, but current tools leak too much. Public wallets can reveal which communities someone subscribes to, what they pay for, and sometimes their broader financial activity. This blocks use cases like paid research groups, trading signal communities, mental health/support groups, private creator communities, and institution/research memberships.

Solana is a strong fit because subscriptions need low-cost, fast transactions and consumer-grade wallet UX. A private subscription rail built on Solana can become a recurring payment primitive for creators and communities, not just another token-gated app.

### What will the grant help you do?

The grant will directly fund high-tier AI engineering tools used to accelerate the implementation sprint. I am using Codex/agentic workflows to ship faster across frontend, backend, Solana adapters, wallet integration, privacy service boundaries, tests, and demo documentation.

The immediate deliverable is a working Solana devnet MVP for the Colosseum deadline:

- Privy login and Solana wallet context.
- Solana chain adapter behind the existing SORTS chain abstraction.
- Umbra service boundary for hidden membership-state checks.
- IKA dWallet capability/status card with pre-alpha warnings.
- Creator-selected preview content.
- Two-community preview quota for non-members.
- Gated content state with aggregate-only creator analytics.
- No public member-list or enumerable member registry.

### What have you built so far?

SORTS is already a Turborepo monorepo with:

- `frontend`: Next.js app with creator studio, community creation flow, wallet/chain utilities, and status pages.
- `backend`: Express API, SQLite persistence, Telegram bot foundation, content/community services, and chain service adapters.
- `contracts`: Hardhat Solidity contracts for Arbitrum membership/factory flow, including USDC migration work.
- `packages/shared`: shared interfaces and types for chain/service abstractions.

Recent progress includes:

- USDC-based membership contract migration work.
- Create Community wizard planning and implementation work.
- Safe status/debug page planning.
- Colosseum winner spec for a Solana private subscription rails demo.
- Phase 2 Solana plan focused on Privy, Umbra, IKA, and non-leaky membership state.

### What will you ship in the next 10 days?

The target launch plan is:

- Day 1: restore frontend styling and freeze scope.
- Day 2: add shared wallet/auth abstraction and Privy auth path.
- Day 3: add Solana chain adapter skeleton without breaking Arbitrum.
- Day 4: add Umbra service boundary and registration/check flow.
- Day 5: wire hidden membership-state checks into Solana access logic.
- Day 6: add IKA dWallet capability/status service and UI.
- Day 7: build Solana join/subscription UI.
- Day 8: implement creator-selected preview content and two-community preview quota.
- Day 9: run devnet E2E checks, safety copy, and aggregate-only dashboard checks.
- Day 10: freeze demo, write walkthrough, and record the 3-minute pitch.

### What is the demo?

The demo shows:

1. A creator creates a Solana private subscription community.
2. The creator marks preview content.
3. A subscriber signs in with Privy and selects a Solana wallet.
4. The subscriber previews up to two communities.
5. The subscriber joins with wallet transaction confirmation.
6. The app checks hidden/non-leaky membership state.
7. Gated content unlocks for the subscriber.
8. The creator sees aggregate stats, not a member wallet list.
9. The app shows IKA dWallet capability as a future programmable signing layer, clearly labeled pre-alpha.

### Why are you a good fit for an Agentic Engineering Grant?

This project is exactly the kind of build where agentic engineering has leverage. The repo spans frontend, backend, wallet UX, privacy integrations, smart contracts, chain adapters, docs, and demo packaging. I am using AI coding tools as an active pair-programming system to inspect the repo, design implementation prompts, generate scoped tasks, verify builds, and keep the sprint moving without losing safety constraints.

The grant would directly support the tools needed to ship faster and more safely during the Colosseum/Solana build window.

## Milestone Proposal

Milestone 1: Solana adapter and wallet layer

Deliverables:

- Shared chain and wallet interfaces updated for Solana.
- Privy auth/wallet hook and backend auth boundary.
- SolanaService skeleton behind the Chain Adapter Pattern.

Milestone 2: Private membership-state demo

Deliverables:

- UmbraPrivacyService boundary.
- Hidden membership-state check route.
- Non-leaky entitlement API response.
- Frontend Solana membership card.

Milestone 3: Demo polish

Deliverables:

- Creator-selected preview content.
- Two-community preview quota.
- IKA dWallet capability/status card with pre-alpha copy.
- Demo guide and 3-minute pitch script.

## Safety And Honesty Notes

I will not claim production privacy or production MPC before the underlying integrations support it.

For the deadline, SORTS will describe:

- Umbra as hidden membership-state infrastructure on Solana devnet.
- IKA as pre-alpha programmable signing/wallet capability.
- Privy as auth and wallet orchestration.
- SORTS privacy as no public member-list, no enumerable member registry, aggregate-only creator stats, and non-leaky access checks.

## Links To Prepare Before Submission

Fill these before applying:

- GitHub repo:
- Demo URL:
- Pitch/demo video:
- X/Twitter:
- Telegram:
- Discord:
- Builder profile:

## Short Version For Small Text Boxes

SORTS is private subscription rails for paid communities on Solana. Creators can launch a paid community, mark preview content, and see aggregate revenue/subscriber stats without seeing a public member wallet list. Subscribers can preview communities, join with wallet confirmation, and unlock gated content through non-leaky membership checks. I am shipping a Solana devnet MVP using Privy for auth/wallet orchestration, Umbra for hidden membership-state experiments, and IKA dWallet for programmable multichain wallet capability display. The grant will fund agentic coding tools used to accelerate the 10-day sprint across frontend, backend, Solana adapters, privacy service boundaries, and demo polish.

## 280-Character Version

SORTS is private subscription rails for paid communities on Solana. Creators sell recurring access; subscribers prove membership without exposing a public member graph. Shipping a devnet MVP with Privy, Umbra hidden membership state, IKA dWallet capability, and gated content.

## Submission Checklist

- Superteam Earn profile is complete.
- GitHub repo is public or shareable.
- README explains Solana devnet scope.
- `docs/COLOSSEUM_WINNER_SPEC.md` is up to date.
- `Priority.md` reflects current 10-day plan.
- Demo route works locally or on a deployed preview.
- No `.env` files are committed.
- No private keys, RPC URLs, tokens, or secret env values appear in screenshots.
- Privacy claims are accurate and do not overstate Umbra or IKA.
- Application asks for the grant as AI coding tool support, not general runway.

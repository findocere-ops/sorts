# SORTS Colosseum Winner Spec

Deadline target: May 12, 2026.

Positioning: SORTS is private subscription rails for paid communities on Solana.

One-liner: SORTS lets creators sell recurring access to private communities while subscribers prove membership without exposing a public member graph.

## Why This Should Win

Colosseum-winning projects usually need more than a working demo. They need a startup-shaped wedge: real pain, a clear market, Solana-native execution, and a demo that judges can understand quickly.

SORTS should not be pitched as a generic Skool clone. The winning wedge is:

> Stripe-like subscription infrastructure for private creator communities.

The strongest demo is not "create a course." The strongest demo is:

1. A creator launches a paid private community.
2. A subscriber joins with a Solana wallet.
3. Membership state is private or non-leaky.
4. The creator sees revenue and aggregate subscriber stats, not member wallets.
5. A Telegram or web gate grants access when active.
6. Expiry/cancel locks access and protected content.

## Public Colosseum Alignment

Use this as the product lens:

- Colosseum emphasizes startup-quality teams and products, not just toy demos.
- Colosseum says the final presentation must be concise and demo-driven.
- Colosseum recommends showing team background, product, why now, market opportunity, initial usage/GTM, and how the product works.
- Colosseum accelerator is for winners who can become serious Solana startups.

References:

- Colosseum hackathon page: `https://colosseum.com/hackathon`
- Colosseum accelerator page: `https://colosseum.com/accelerator`
- Colosseum guide: `https://blog.colosseum.com/how-to-win-a-colosseum-hackathon/`

## Product Thesis

Existing paid-community tools solve access but not private recurring access.

The gap:

- Layer 1: access gates are common.
- Layer 2: subscription billing is partially solved.
- Layer 3: private subscriber graph plus encrypted/revocable content is still underbuilt.

SORTS wins by combining:

- creator monetization,
- Solana USDC subscriptions,
- hidden or non-leaky membership state,
- aggregate-only creator analytics,
- Telegram/web gated access,
- content preview and revocation,
- future compliance/selective disclosure.

## Target User

Primary wedge:

- crypto trading signal groups on Telegram,
- paid research groups,
- alpha communities,
- private creator/institution communities.

Why this wedge:

- users already pay for access,
- creators already manage subscribers manually,
- privacy matters because membership reveals trading edge, net worth, interests, or affiliations,
- Telegram gating is easy to demo and easy to understand.

## Colosseum Demo Scope

The 10-day demo should show one clean path end-to-end.

### Creator Flow

1. Creator signs in.
2. Creator creates a Solana community.
3. Creator sets USDC subscription price.
4. Creator marks preview content.
5. Creator sees dashboard:
   - monthly revenue,
   - active subscribers count,
   - churn/expiry count if available,
   - no wallet member list.

### Subscriber Flow

1. Subscriber signs in with Privy.
2. Subscriber chooses Solana wallet context.
3. Subscriber previews up to 2 communities.
4. Subscriber joins a community.
5. Subscriber completes wallet transaction confirmation.
6. App checks Umbra-backed hidden membership state or feature-flagged private-membership service.
7. Subscriber gets access to gated web content or Telegram flow.
8. Expired/cancelled state locks content.

### Privacy Flow

1. Public UI never shows a member list.
2. Creator dashboard shows aggregate stats only.
3. API does not return raw hidden balances, raw private tier values, or member wallet lists.
4. Umbra hidden-balance membership state is described as devnet/private-state approximation, not full Nox parity.
5. IKA dWallet is shown as pre-alpha programmable signing, not production MPC.

## What To Build For The Demo

### Must Ship

- Restored SORTS styling and app shell.
- Privy login/wallet context.
- Solana chain adapter behind `IChainService`.
- Umbra service boundary for registration and hidden membership state.
- Solana join/subscription UI.
- Creator-selected preview content.
- 2-community preview quota tracked by wallet address plus browser session.
- Creator dashboard aggregate stats.
- IKA dWallet capability/status card with pre-alpha warning.
- Demo doc and 3-minute video script.

### Should Ship If Time Allows

- Telegram bot grant/revoke demo path.
- Expiry/cancel state simulation.
- Webhook-style event log for subscription lifecycle.
- Basic content lock/revoke UI.
- Devnet smoke script.

### Do Not Ship For This Deadline

- Mainnet.
- Real-funds IKA flow.
- Production MPC claims.
- Production FHE claims.
- Required mixer/UTXO payment path.
- Public member list.
- Full institutional dashboard.
- Full Discord bot.
- Card-to-USDC onramp.
- Real dunning automation.

## Architecture For Winning Demo

### Layer 1: Account And Wallet

Use Privy for:

- login,
- user identity,
- embedded/external wallet UX,
- EVM and Solana wallet context,
- transaction prompts.

Do not claim Privy provides privacy.

### Layer 2: Solana Membership Adapter

Use `SolanaService` behind `IChainService` for:

- create community,
- subscribe,
- renew,
- check access,
- aggregate stats.

Feature modules must not import raw Solana SDK calls.

### Layer 3: Umbra Hidden Membership State

Use Umbra for:

- registration status,
- hidden/encrypted balance membership state,
- private entitlement checks,
- optional compliance grants.

Do not expose hidden balance values in API responses.

Do not enable mixer by default unless the demo is already stable.

### Layer 4: IKA dWallet Capability

Use IKA for:

- dWallet capability display,
- future programmable multichain signing story,
- optional MessageApproval lifecycle visualization.

For demo:

- show status/capabilities,
- show pre-alpha badge,
- keep real-funds disabled.

### Layer 5: Content And Community Access

For 10-day MVP:

- gate web content using membership checks,
- show creator-selected preview content,
- show locked state for paid content,
- optionally integrate Telegram grant/revoke if already stable.

Post-demo:

- add stronger encrypted content storage and key revocation.

## API Shape For The Demo

Keep responses non-leaky.

Example membership status response:

```json
{
  "chain": "solana-devnet",
  "communityId": "community_123",
  "access": "active",
  "tierLabel": "Pro",
  "expiresAt": "2026-06-01T00:00:00.000Z",
  "privacyMode": "umbra-encrypted-balance",
  "rawPrivateBalanceExposed": false
}
```

Do not return:

- member lists,
- raw hidden balances,
- raw encrypted seed material,
- raw private tier encoding,
- RPC URLs,
- secret env values.

## Business Model

Simple pitch:

- take rate on subscriptions: 2-5%,
- Creator Pro SaaS: optional monthly plan,
- enterprise/institution plan later.

Hackathon metric target:

- one or more real creator conversations,
- one live demo community,
- one repeatable subscribe/access/revoke flow,
- a clear path to first 10 paid creator pilots.

## 3-Minute Video Script

Target length: under 3 minutes.

0:00-0:25 - Problem

- "Paid communities leak too much. Your wallet can reveal what you subscribe to, your net worth, and your community graph."

0:25-0:50 - Product

- "SORTS is private subscription rails for creators: recurring Solana access, private membership state, aggregate-only analytics, and gated content."

0:50-1:35 - Demo

- creator creates community,
- subscriber previews,
- subscriber joins,
- wallet confirms,
- membership becomes active,
- content unlocks.

1:35-2:05 - Privacy

- creator sees revenue and active count,
- no public member list,
- private membership-state service powers access.

2:05-2:30 - Market

- trading groups, research communities, coaching, private institutions,
- creators already sell subscriptions manually.

2:30-2:50 - Business

- subscription take rate plus Creator Pro SaaS.

2:50-3:00 - Ask

- "We are looking for Solana creators and paid communities to pilot private subscriptions."

## Judging Checklist

Before submission, make sure the demo proves:

- It is Solana-native or Solana-first.
- It solves a real paid-community pain.
- The product is understandable in one sentence.
- There is a working demo, not only slides.
- The privacy claim is accurate and not overstated.
- The business model is simple.
- The creator dashboard does not reveal subscriber wallets.
- The subscriber flow has wallet confirmation before payment.
- The preview model works before payment.
- The IKA/Umbra pieces are clearly labeled devnet/pre-alpha where needed.

## Failure Modes To Avoid

- Pitching as "Skool on-chain" instead of private subscription rails.
- Spending too much time on Solana program scaffolding and not enough on the demo.
- Showing IKA as production MPC.
- Showing Umbra as full Nox-equivalent smart-contract privacy.
- Returning private balances or member lists from APIs.
- Breaking the existing Arbitrum flow.
- Having no creator story or GTM wedge.
- Having a demo that requires five minutes of explanation before the value is clear.

## Post-Hackathon Roadmap

### Month 1

- onboard 5-10 paid creator communities,
- add Telegram grant/revoke automation,
- improve content lock/revoke UX,
- harden auth and preview quota.

### Month 2-3

- add Discord integration,
- add real creator analytics,
- add paid Creator Pro plan,
- add stronger encrypted content storage.

### Month 4-6

- add public API/SDK,
- add compliance/selective disclosure,
- explore mixer/UTXO private payment path,
- prepare audit scope.

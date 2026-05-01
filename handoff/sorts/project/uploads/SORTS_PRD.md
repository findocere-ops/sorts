# SORTS — Product Requirements Document (PRD)

**Version:** 1.0
**Date:** April 17, 2026
**Author:** Rejoel (@findocere)
**Contact:** findocere@gmail.com
**Context:** iExec Vibe Coding Challenge 2026

---

## 1. Executive Summary

Sorts is a confidential community monetization protocol that enables creators to run paid communities — similar to Skool — where memberships, tier levels, and payments are cryptographically hidden. Built on iExec's NOX Protocol and Confidential Tokens (ERC-7984) deployed on Arbitrum Sepolia, Sorts proves that privacy and monetization are complementary forces rather than opposing constraints.

The product targets crypto-native creators (trading signal providers, research DAOs, alpha groups) who lose competitive advantage when their subscriber lists are visible on-chain. Sorts eliminates this leakage while maintaining full DeFi composability.

---

## 2. Problem Statement

### 2.1 The Transparency Tax on Creator Communities

Every existing community monetization platform exposes the membership graph. Skool shows member lists. Patreon publishes patron counts per tier. Token-gated Discord channels reveal who holds which NFT. On-chain subscription payments broadcast wallet addresses, amounts, and frequency.

### 2.2 Who Gets Hurt

**Crypto alpha group operators** lose their edge when competitors scrape subscriber wallets. If a known whale joins a signals group, the market can infer what trades are coming. The membership itself becomes a tradable signal — and the creator has no way to prevent it.

**Institutional research communities** cannot operate on-chain because subscription data constitutes material non-public information leakage. Fund managers and analysts avoid token-gated groups for compliance reasons.

**Course creators and educators** face subscriber list scraping. Competitors poach top-tier members with targeted offers, enabled by visible membership data.

### 2.3 Why This Hasn't Been Solved

Existing privacy solutions (Tornado Cash, zkBob) focus on payment privacy — hiding who sent money to whom. They don't address membership privacy: the fact that holding a token in your wallet reveals your subscription status. The missing piece is a privacy-native membership token where the balance itself (which encodes tier level) is encrypted.

---

## 3. Solution Overview

Sorts wraps the Skool community model in confidential computing:

**For Creators:**
- Deploy a paid community with tiered memberships (Basic / Pro / VIP)
- View only aggregate statistics: total members, total revenue, tier distribution
- Cannot see individual member addresses or their tier level
- Manage content that auto-locks when memberships expire

**For Members:**
- Subscribe by purchasing a Confidential Membership Token
- Token balance is encrypted — on-chain observers cannot determine tier
- Access gated content via Telegram bot verification
- When subscription expires, content becomes cryptographically inaccessible

**For the Protocol:**
- Every subscription mints a Confidential Token (ERC-7984 compliant)
- Membership verification happens without revealing tier
- Content access keys are time-bound and auto-expire
- Full DeFi composability: tokens are standard ERC-7984 assets

---

## 4. Product Requirements

### 4.1 User Roles

| Role | Description | Primary Interface |
|------|-------------|-------------------|
| Creator | Launches and manages communities, sets tiers, publishes content | Web Dashboard |
| Member | Subscribes, accesses gated content, manages membership | Telegram Bot + Web |
| Observer | Any on-chain viewer trying to analyze community membership | Sees only encrypted data |

### 4.2 Functional Requirements

#### FR-01: Community Creation (Creator)
- **FR-01.1:** Creator connects wallet (Arbitrum Sepolia) via RainbowKit
- **FR-01.2:** Creator fills in community name, symbol (max 5 characters), and up to 5 tier configurations
- **FR-01.3:** Each tier has: name, price (in ETH), and duration (in days, default 30)
- **FR-01.4:** "Create Community" triggers SortsFactory.createCommunity() on Arbitrum Sepolia
- **FR-01.5:** On successful transaction, redirect to dashboard with community details
- **FR-01.6:** Factory emits CommunityCreated event with community ID, creator address, and deployed contract address

#### FR-02: Membership Subscription (Member)
- **FR-02.1:** Member navigates to /join/[communityId] page
- **FR-02.2:** Page displays community info, available tiers with prices
- **FR-02.3:** Member connects wallet and selects tier
- **FR-02.4:** "Subscribe" calls SortsMembership.subscribe(tier) with ETH payment
- **FR-02.5:** Contract mints Confidential Membership Token with encrypted tier balance
- **FR-02.6:** Membership has expiry timestamp = block.timestamp + tier.duration
- **FR-02.7:** Contract emits MemberSubscribed event (no tier data in event)

#### FR-03: Creator Dashboard
- **FR-03.1:** Shows only AGGREGATE data — never individual member addresses or tiers
- **FR-03.2:** Stats displayed: total member count, total revenue (ETH), active vs expired ratio
- **FR-03.3:** Per-community card with: name, symbol, status, aggregate metrics
- **FR-03.4:** "Copy Invite Link" generates shareable /join URL
- **FR-03.5:** Content management: create, edit, delete gated posts
- **FR-03.6:** Creator cannot enumerate subscribers — this is a feature, not a limitation

#### FR-04: Content Gating
- **FR-04.1:** Creator publishes content with required minimum tier level
- **FR-04.2:** Content is stored in backend database with tier requirement
- **FR-04.3:** Content retrieval requires membership verification via smart contract
- **FR-04.4:** Verification checks: (a) membership exists, (b) tier sufficient, (c) not expired
- **FR-04.5:** Expired memberships return "Membership expired. Renew to access." — NO content shown
- **FR-04.6:** This is the Content Decay mechanic: expiry = cryptographic lock, not deletion

#### FR-05: Telegram Bot
- **FR-05.1:** /start — Welcome message with wallet linking instructions
- **FR-05.2:** /subscribe — Lists available communities, links to subscribe page
- **FR-05.3:** /status — Shows current membership status (active/expired/none) and expiry date
- **FR-05.4:** /content — Retrieves gated content after membership verification
- **FR-05.5:** Bot verifies membership on-chain for every /content request — no caching
- **FR-05.6:** Wallet linking via signed message (EIP-712) connecting Telegram ID to wallet address

#### FR-06: Membership Lifecycle
- **FR-06.1:** Subscribe: mint token, set expiry, record tier
- **FR-06.2:** Renew: extend expiry by tier.duration, accept payment
- **FR-06.3:** Expire: automatic — no admin action needed, contract checks timestamp
- **FR-06.4:** Upgrade: pay difference, update tier (future scope)
- **FR-06.5:** Leave: member can burn their token voluntarily (no refund for MVP)

#### FR-07: ERC-7984 Compliance
- **FR-07.1:** MUST implement full IERC7984 interface (ALL functions listed in spec)
- **FR-07.2:** name(), symbol(), decimals(), contractURI() — standard metadata
- **FR-07.3:** confidentialTotalSupply() — returns encrypted total supply
- **FR-07.4:** confidentialBalanceOf(address) — returns encrypted balance (tier encoded in balance)
- **FR-07.5:** confidentialTransfer(address, bytes32) — transfer with encrypted amount
- **FR-07.6:** confidentialTransfer(address, bytes32, bytes) — transfer with proof data
- **FR-07.7:** confidentialTransferFrom variants (4 functions total)
- **FR-07.8:** confidentialTransferAndCall variants (4 functions total)
- **FR-07.9:** confidentialTransferFromAndCall variants (4 functions total)
- **FR-07.10:** setOperator(address, uint48) — time-limited operator approval
- **FR-07.11:** isOperator(address, address) — check operator status
- **FR-07.12:** Events: ConfidentialTransfer, OperatorSet, AmountDisclosed
- **FR-07.13:** ERC-165 supportsInterface with interface ID 0x4958f2a4
- **FR-07.14:** onConfidentialTransferReceived callback support on receiver contracts

### 4.3 Non-Functional Requirements

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-01 | All transactions on Arbitrum Sepolia only | Chain ID 421614 |
| NFR-02 | Zero mock/dummy/fake data anywhere in the application | End-to-end real testnet |
| NFR-03 | feedback.md exists in repo root | Honest iExec tools feedback |
| NFR-04 | Demo video ≤ 240 seconds | 3:45 target, 4:00 hard max |
| NFR-05 | Tag @iEx_ec + @Chain_GPT on X submission | Mandatory for submission |
| NFR-06 | Frontend loads under 3 seconds | Acceptable for demo |
| NFR-07 | Telegram bot responds under 5 seconds | Including on-chain verification |
| NFR-08 | Smart contracts verified on Arbiscan | Recommended for credibility |

---

## 5. Confidential Mechanics: How Privacy Works

### 5.1 Tier Encoding in Token Balance

Each membership tier maps to a numeric token balance:
- Basic = 1 token
- Pro = 10 tokens
- VIP = 100 tokens

When wrapped via Confidential Token, this balance becomes a bytes32 encrypted pointer. On-chain observers see the pointer — not the number. They know you hold a Sorts membership token but cannot determine whether you're Basic, Pro, or VIP.

### 5.2 Access Verification Without Disclosure

When a member requests content:
1. Backend reads their `confidentialBalanceOf(address)` — returns encrypted pointer
2. The smart contract internally checks whether the encrypted balance meets the tier requirement
3. Returns boolean (access granted / denied) without revealing the actual tier
4. Content is served or denied based on this binary result

The key insight: the access check produces a yes/no without disclosing the member's actual tier level.

### 5.3 Content Decay (Programmatic Expiry)

Each membership has an on-chain expiry timestamp. The `checkAccess` function checks:
```
isActive = (block.timestamp < memberExpiry[user])
hasTier  = (encryptedBalance >= requiredTier)
access   = isActive AND hasTier
```

When expiry passes, `isActive` becomes false. No admin action needed. Content becomes inaccessible automatically. If the member renews, access is restored instantly.

### 5.4 Creator Blindness

The creator's dashboard calls `getAggregateStats()` which returns:
- `totalMembers`: count of addresses with non-zero balance
- `totalRevenue`: sum of all payments received
- `activeMemberships`: count of non-expired memberships

The contract does NOT expose functions that enumerate individual members or reveal per-address tier levels. The creator is deliberately "blind" to individual membership data.

---

## 6. User Journeys

### 6.1 Creator Journey: "Alex Launches Alpha Traders"

1. Alex, a Solana DeFi researcher, visits sorts.app
2. Connects MetaMask (Arbitrum Sepolia)
3. Clicks "Create Community" → fills in:
   - Name: "Alpha Traders"
   - Symbol: "ALPHA"
   - Basic tier: 0.001 ETH / 30 days
   - Pro tier: 0.005 ETH / 30 days
   - VIP tier: 0.01 ETH / 30 days
4. Confirms transaction in MetaMask
5. Redirected to dashboard → sees "Alpha Traders" with 0 members
6. Creates 3 content posts:
   - "Welcome Guide" (Basic+)
   - "Weekly Market Analysis" (Pro+)
   - "Exclusive Arbitrage Strategy" (VIP only)
7. Copies invite link → shares on Twitter: "Join Alpha Traders on Sorts — private by default"
8. Over next week: dashboard shows "14 members, 0.09 ETH revenue" — Alex has NO idea who they are

### 6.2 Member Journey: "Jordan Joins Alpha Traders"

1. Jordan sees Alex's tweet, clicks invite link → /join/alpha-traders
2. Connects wallet → sees 3 tier options
3. Selects Pro (0.005 ETH) → confirms in MetaMask
4. Transaction succeeds → "Welcome! You're a Pro member."
5. Opens Telegram → messages @SortsBot
6. Types /start → bot sends wallet linking instructions
7. Clicks link → signs message → wallet linked to Telegram
8. Types /content → bot verifies on-chain → shows "Welcome Guide" + "Weekly Market Analysis"
9. Types /content again after 30 days → "Membership expired. Renew to access."
10. Goes to /join/alpha-traders → clicks "Renew" → pays again → access restored

### 6.3 Observer Journey: "Eve Tries to Scrape"

1. Eve checks Jordan's wallet on Arbiscan
2. Sees: Jordan holds "ALPHA" token (Sorts Membership)
3. Balance field: `0x7a4f...b2c1` (encrypted pointer)
4. Eve CANNOT determine:
   - What tier Jordan holds (Basic? Pro? VIP?)
   - How much Jordan paid
   - When Jordan's membership expires
5. Eve checks Alex's factory contract
6. Sees: "Alpha Traders" exists, emitted CommunityCreated event
7. Eve can see contract code but NOT individual membership data
8. Cohort mining: BLOCKED. Eve cannot build a subscriber list.

---

## 7. Information Architecture

### 7.1 Web Pages

```
/                           Landing page (hero + feature cards + CTAs)
/create                     Create Community form (wallet required)
/dashboard                  Creator dashboard (wallet required, shows owned communities)
/join/[communityId]         Member subscription page (public view + wallet for subscribe)
/community/[communityId]    Community content feed (membership required)
/link                       Wallet ↔ Telegram linking page
```

### 7.2 Telegram Bot Commands

```
/start      Welcome + wallet linking flow
/subscribe  Browse communities + subscribe links
/status     Current membership status + expiry
/content    Retrieve gated content (verified on-chain)
/help       Command reference
```

### 7.3 API Endpoints

```
GET  /api/communities                    List all communities
GET  /api/communities/:id                Community details
GET  /api/communities/:id/stats          Aggregate stats (no PII)
POST /api/content                        Create content (creator authenticated)
GET  /api/content/:communityId           Get gated content (membership verified)
POST /api/link/generate                  Generate wallet-linking code
POST /api/link/verify                    Verify signed linking message
GET  /api/member/:address/status         Membership status check
```

---

## 8. Data Model

### 8.1 On-Chain (Smart Contracts)

**SortsFactory**
- communities: mapping(uint256 => address) — community ID to membership contract
- communityCreators: mapping(address => address[]) — creator to their communities
- communityCount: uint256

**SortsMembership** (per community, ERC-7984 compliant)
- _name, _symbol, _decimals, _contractURI — token metadata
- _balances: mapping(address => bytes32) — encrypted tier balance (ERC-7984 pointer)
- _operators: mapping(address => mapping(address => uint48)) — time-limited operators
- memberExpiry: mapping(address => uint256) — subscription expiry timestamp
- tierPrices: mapping(uint8 => uint256) — tier level to price in wei
- tierDurations: mapping(uint8 => uint256) — tier level to duration in seconds
- creator: address — community creator
- totalMembers: uint256 — aggregate count
- totalRevenue: uint256 — aggregate revenue

### 8.2 Off-Chain (SQLite — Backend)

**wallet_links**
| Column | Type | Note |
|--------|------|------|
| id | INTEGER PK | Auto-increment |
| telegram_user_id | TEXT UNIQUE | Telegram numeric user ID |
| wallet_address | TEXT | Checksummed ETH address |
| linked_at | TEXT | ISO 8601 timestamp |

**content**
| Column | Type | Note |
|--------|------|------|
| id | INTEGER PK | Auto-increment |
| community_address | TEXT | Contract address |
| title | TEXT | Content title |
| body | TEXT | Content body (plaintext for MVP) |
| tier_required | INTEGER | Minimum tier to access (1/2/3) |
| created_at | TEXT | ISO 8601 timestamp |
| creator_address | TEXT | Who published it |

**communities_cache**
| Column | Type | Note |
|--------|------|------|
| id | INTEGER PK | Auto-increment |
| community_address | TEXT UNIQUE | Contract address |
| name | TEXT | Cached from contract |
| symbol | TEXT | Cached from contract |
| creator_address | TEXT | Cached from contract |
| created_at | TEXT | When cached |

---

## 9. MVP Scope vs Future Scope

### 9.1 In Scope (Hackathon MVP)

| Feature | Priority | Status |
|---------|----------|--------|
| SortsFactory + SortsMembership contracts | P0 | ⬜ |
| ERC-7984 full interface implementation | P0 | ⬜ |
| Deploy to Arbitrum Sepolia | P0 | ⬜ |
| Creator dashboard (create + view stats) | P0 | ⬜ |
| Member subscribe page | P0 | ⬜ |
| Telegram bot (start/subscribe/status/content) | P0 | ⬜ |
| Wallet ↔ Telegram linking | P0 | ⬜ |
| Content gating with tier verification | P0 | ⬜ |
| Content decay (expiry = no access) | P0 | ⬜ |
| feedback.md | P0 | ⬜ |
| Demo video ≤ 4 min | P0 | ⬜ |
| X post with @iEx_ec + @Chain_GPT | P0 | ⬜ |

### 9.2 Out of Scope (Post-Hackathon Roadmap)

| Feature | Phase |
|---------|-------|
| Full Skool classroom/course module | v2 |
| Calendar and live events | v2 |
| Leaderboards and gamification engine | v2 |
| Multi-platform (Discord, custom web) | v2 |
| Referral/affiliate program with confidential tracking | v2 |
| Revenue-backed DeFi primitives (lending against subscription streams) | v3 |
| Mobile app (React Native) | v3 |
| ChainGPT-powered content moderation | v2 |
| iExec DataProtector for encrypted content storage | v2 |
| Multi-chain deployment (Arbitrum mainnet, Ethereum) | v3 |

---

## 10. Success Metrics

### 10.1 Hackathon Success (Pass/Fail)

| Metric | Target |
|--------|--------|
| All 6 disqualifiers avoided | ✅ |
| Working end-to-end demo on Arbitrum Sepolia | ✅ |
| ERC-7984 full spec compliance | ✅ |
| Demo video submitted ≤ 4 min | ✅ |
| X post published with correct tags | ✅ |

### 10.2 Product Quality (Judging Differentiation)

| Metric | Target |
|--------|--------|
| Unique angle vs other submissions | Privacy-first community platform (no one else is building this) |
| Technical depth of NOX integration | Confidential membership tokens with tier encoding |
| UI/UX polish | Dark, crypto-native, professional |
| Real-world applicability | Crypto alpha groups, research DAOs, institutional networks |
| Demo clarity | Problem → solution → live demo → privacy proof in under 4 min |

---

## 11. Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| NOX Protocol not fully available on Arbitrum Sepolia | HIGH | MEDIUM | Implement ERC-7984 with simulation layer; use hashed/committed balances if FHE not available |
| ERC-7984 spec ambiguity (draft status) | MEDIUM | MEDIUM | Follow OpenZeppelin reference implementation exactly; document any deviations |
| Arbitrum Sepolia testnet instability | HIGH | LOW | Have Hardhat local fork as fallback for demo |
| Telegram Bot API rate limits | LOW | LOW | Cache membership checks for 60 seconds |
| Demo video exceeds 4 minutes | HIGH | MEDIUM | Write script first; rehearse 3 times; cut to 3:45 |
| Zero coding background → build complexity | HIGH | HIGH | Use Claude Code with structured prompts; keep scope minimal; one feature at a time |

---

## 12. Technical Constraints

- **Chain:** Arbitrum Sepolia ONLY (chain ID 421614) — any other chain = disqualification
- **Token Standard:** ERC-7984 FULL spec — partial implementation = disqualification
- **Data:** Real end-to-end — mock/fake/dummy data = disqualification
- **Encryption:** ERC-7984 uses bytes32 pointers for amounts; on Arbitrum Sepolia (non-FHE chain), implement with commitment scheme (hash-based privacy) rather than full FHE
- **AI Partner:** ChainGPT offers free API credits — integrate if time permits, not required for MVP
- **Team:** Max 5 members

---

## 13. Appendix

### 13.1 Competitive Landscape

| Platform | Membership Visible? | Payment Visible? | Tier Visible? | On-Chain? |
|----------|---------------------|-------------------|---------------|-----------|
| Skool | Yes (member list) | No (Stripe) | Yes (public) | No |
| Patreon | Yes (patron count per tier) | No (Stripe) | Yes (public) | No |
| Token-gated Discord | Yes (wallet + token) | Yes (on-chain) | Yes (balance) | Yes |
| Lens/Farcaster gates | Yes (NFT holders) | Yes (on-chain) | Yes (NFT type) | Yes |
| **Sorts** | **No** | **No** | **No** | **Yes** |

### 13.2 One-Paragraph Pitch

Sorts is a confidential community protocol — the Stripe for private membership monetization built on iExec's NOX Protocol. Today, every paid community leaks its most valuable asset: the member list. Competitors mine subscriber cohorts. On-chain observers front-run alpha groups. Creators become involuntary surveillance agents. Sorts fixes this by wrapping the entire community monetization stack in confidential computing. Membership tokens have hidden balances. Payments are invisible. Content access is verified without exposing who holds what tier. When a subscription expires, content becomes cryptographically unreadable — not deleted, but locked. Sorts gives creators Skool-level monetization with a privacy guarantee no centralized platform can match. Your community. Your members. Nobody else's business.

### 13.3 Contact

**Builder:** Rejoel — @findocere
**Email:** findocere@gmail.com

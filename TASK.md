# SORTS MVP: Arbitrum Sepolia Deployment Assessment

This document evaluates the current state of the SORTS MVP and outlines the specific gaps that must be addressed to achieve a fully functional deployment on the Arbitrum Sepolia Network. 

---

## 1. Current State Summary

*   **Frontend (Visuals):** **DONE.** The landing page (`/`), navigation, typography, CSS tokens, and core components (`Button`, `Badge`, `Card`, `Icon`) have been completely rewritten to perfectly match the high-fidelity cyan/orange design handoff.
*   **Smart Contracts:** **COMPILED.** The `SortsFactory` and `SortsMembership` ERC-7984 contracts compile successfully with Hardhat (Exit code 0).
*   **Backend:** **PARTIAL.** Express server runs, SQLite is configured, and core routes (`analytics`, `community`, `content`) exist.
*   **Monorepo:** **WORKING.** Turborepo pipeline (`pnpm dev`, `pnpm build`) works seamlessly.

---

## 2. Gaps & Implementation Tasks

To deploy the MVP to Arbitrum Sepolia and have a working app, the following gaps must be closed:

### Phase 1: Smart Contract Deployment
Currently, the contracts compile but have not been deployed, meaning the frontend has no backend factory to talk to.
- [ ] **Fund Deployer:** Ensure a deployer wallet has Arbitrum Sepolia ETH and its `PRIVATE_KEY` is in `contracts/.env`.
- [ ] **Deploy Factory:** Run `pnpm --filter contracts deploy:sepolia` to deploy `SortsFactory`.
- [ ] **Update Frontend Env:** Copy the deployed factory address to `frontend/.env.local` as `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS`.

### Phase 2: Frontend App Logic & Wiring
We built the landing page, but the actual app routing and Web3 wiring are missing.
- [ ] **Chain Hooks:** Create `frontend/src/lib/chain/useChain.ts` and `factoryAbi.ts` to connect wagmi hooks to the deployed ABIs.
- [ ] **API Clients:** Build `frontend/src/lib/api/client.ts` and route-specific clients (`communities.ts`, `content.ts`) to fetch data from the Express backend.
- [ ] **App Layouts:** Implement `CreatorStudioLayout` and `SubscriberAppLayout` to handle the sidebar/topbar shell for authenticated users.
- [ ] **Core Pages:** Implement the public flows (`/role`, `/auth`, `/join/[cid]`, `/join/[cid]/subscribe`).
- [ ] **Studio Pages:** Implement the Creator Studio flows (`/studio`, `/studio/create`, `/studio/[cid]/content`).
- [ ] **App Pages:** Implement the Subscriber App flows (`/app/[cid]/feed`, `/app/[cid]/membership`, `/account`).
- [ ] **Premium Empty States:** Implement the 5 canonical empty states (e.g., `ContractNotConfigured`, `BackendNotConnected`) as defined in the roadmap.

### Phase 3: Backend Completion
The backend is missing a few routes required by the frontend screens.
- [ ] **Missing Routes:** Add route files for `/api/calendar`, `/api/classroom`, `/api/leaderboard`, and `/api/membership`.
- [ ] **Mount Routes:** Mount these new routes in `backend/src/index.ts`.
- [ ] **iExec Config:** Ensure `IEXEC_PRIVATE_KEY` and `IEXEC_SORTS_IAPP_ADDRESS` are configured in `backend/.env` to allow the DataProtector worker to function.

---

## 3. Pre-Deployment Checklist

Before announcing the MVP as "Live on Arbitrum Sepolia":

1. **End-to-End Test (Creator):** Log in via Privy → Create Community → Tx confirms on Sepolia → Redirected to Studio.
2. **End-to-End Test (Subscriber):** Go to `/join/[cid]` → Connect Wallet → Pay USDC equivalent → Membership token minted on Sepolia → Redirected to Feed.
3. **Privacy Invariant Check:** Verify that NO individual wallet addresses or tier IDs are exposed in the Creator Studio analytics.
4. **Environment Variables:**
   * `NEXT_PUBLIC_SORTS_FACTORY_ADDRESS` (Frontend)
   * `NEXT_PUBLIC_PRIVY_APP_ID` (Frontend)
   * `PRIVATE_KEY` (Contracts)
   * `IEXEC_PRIVATE_KEY` (Backend)

---

**Next Recommended Action:** Proceed to **Phase 1 (Smart Contract Deployment)** and establish the frontend chain hooks (`lib/chain/useChain.ts`), followed by building the `/auth` and `/role` routing gateways.

---
name: sorts-arbitrum-privacy-infrastructure
description: A high-detail skill for building SORTS privacy infrastructure on Arbitrum using iExec Nox, DataProtector, and iApp Generator.
---

# SORTS Arbitrum Privacy Infrastructure

## Title and Purpose
This skill provides a definitive guide for building the Arbitrum privacy infrastructure layer for SORTS. It synthesizes live iExec primitives—Nox for confidential contract state, DataProtector for gated content/data, and iApp/TEE execution for secure processing—into the SORTS Chain Adapter architecture.

## Current-State Disclaimer Block
> [!WARNING]
> **DOCS GAPS AND SAFE DEFAULTS**
> The Nox Protocol documentation is explicitly under development. Several sections (e.g., Hardhat/Foundry setup) may be incomplete.
> **DO NOT** rely on missing Nox guide sections as stable or complete. Where official docs are incomplete, prefer interface scaffolding, repository TODOs, and validation tasks over inventing undocumented Solidity APIs.
> The Nox SDK default support is currently documented exclusively for **Arbitrum Sepolia (421614)**.

## Architecture Fit Inside SORTS
SORTS uses a Chain Adapter Pattern. Arbitrum privacy must be implemented as the Phase-1 adapter, ensuring compatibility with future extensions (e.g., Solana).

**Must Keep:**
- `packages/shared/src/interfaces/IChainService.ts`
- `backend/src/services/chain/ArbitrumService.ts`
- `backend/src/services/content/DataProtectorService.ts`
- `backend/src/services/chain/ChainServiceFactory.ts`
- Frontend chain-agnostic hooks and providers.

**New or Reworked Targets:**
- `contracts/contracts/SortsMembership.sol`
- `contracts/contracts/SortsFactory.sol`
- `contracts/contracts/SortsLeaderboard.sol`
- `contracts/contracts/interfaces/INoxMembership.sol`
- `backend/src/services/chain/NoxHandleService.ts`
- `backend/src/services/content/ProtectedContentOrchestrator.ts`
- `backend/src/services/iapp/IExecIAppService.ts`
- `backend/src/services/access/PrivacyAccessCoordinator.ts`
- `frontend/src/lib/nox.ts`
- `frontend/src/lib/dataprotector.ts`

## Source-of-Truth Docs to Ingest
Before writing any code, you must read the official documentation in this specific order:
1. **SORTS Build Guide** (Attached): Locks the monorepo shape, Arbitrum-first sequencing, and chain-adapter requirements.
2. **iExec Root Docs** (`https://docs.iex.ec/`): Understand the high-level separation between Nox and the Privacy toolkit.
3. **Nox Protocol Docs** (`https://docs.iex.ec/nox-protocol/`): Extract the confidential-contract model (Getting Started, JS SDK, Advanced Config, Protocol Architecture).
4. **DataProtector Docs**: Define the content-protection subsystem (protect-data, manage-access).
5. **iApp Generator & SDK Docs**: Define the TEE execution and order-management subsystem.

## Role Split: Nox vs DataProtector vs iApp Generator vs iExec SDK

### 1. Nox Protocol
- **Owns:** Encrypted membership tier values, confidential balances/tier state represented as handles, on-chain ACL for computing/decrypting handles, confidential contract arithmetic.
- **Does NOT Own:** File/content storage, general premium content encryption, TEE app order monetization for protected datasets.

### 2. DataProtector
- **Owns:** Content/dataset encryption, protected-data ownership artifact, user+iApp scoped access grants, optional usage pricing/access-count limits.
- **Does NOT Own:** Confidential token balances, contract-native encrypted arithmetic, wallet-level membership state.

### 3. iApp Generator & iExec SDK
- **Owns:** TEE app bootstrap, local iApp test flow, iApp deployment/execution, app order creation (via SDK/CLI).
- **Does NOT Own:** On-chain confidential balance logic, frontend membership UX.

## Network Compatibility Matrix
- **Nox Protocol**: Arbitrum Sepolia (Chain ID: 421614) ONLY by default.
- **DataProtector & iApp**: Validate network compatibility per subsystem; do not assume Arbitrum mainnet and Arbitrum Sepolia are universally interchangeable across all iExec subsystems.

## Repository Mapping and File-by-File Targets
*(See Architecture Fit above for exact file paths)*
- **Contracts (`contracts/`)**: Build Nox-backed confidential membership logic.
- **Shared (`packages/shared/`)**: Update interfaces to support confidential handles without breaking agnostic design.
- **Backend (`backend/`)**: Implement `NoxHandleService`, `ProtectedContentOrchestrator`, `IExecIAppService`, and bridge them via `PrivacyAccessCoordinator`.
- **Frontend (`frontend/`)**: Implement client-side encryption via `@iexec-nox/handle` before submitting to contracts.

## Contract Design Strategy (Confidential Membership & ERC-7984)
- Create a Nox-backed membership contract (`SortsMembership`) that stores confidential tier state as encrypted handles, NOT plaintext integers.
- Accept encrypted tier inputs plus proofs from the Nox handle flow.
- Use Nox ACL primitives so the contract can compute on handles and selectively grant viewer access.
- **Crucial:** Keep aggregate stats as coarse public or creator-readable outputs only. Do NOT leak per-member tier assignments.

## Protected Content and Anti-Piracy Pipeline
- Use DataProtector `protectData` for premium posts, lessons, and files.
- Store returned protected data addresses in `encrypted_ref` columns.
- Grant access to BOTH the authorized user and the authorized iApp.
- Use `pricePerAccess=0` and bounded `numberOfAccess` for standard membership content. Use paid access exclusively for one-off monetized datasets.
- Automatically revoke or stop renewing grants when a membership expires.

## TEE Execution and App-Order Governance
- Bootstrap an iApp using `@iexec/iapp`.
- Test locally using the `iapp test` command.
- Deploy the iApp via `iapp deploy`.
- Manage app orders using the iExec SDK or CLI (Generator does not yet manage app orders).
- Use TDX ONLY behind an explicit feature flag (`EXPERIMENTAL_TDX_APP=true`), and only after local parity tests pass.

## Implementation Sequence
1. **Phase 0: Alignment Checks**: Verify Arbitrum Sepolia scope, exact package imports, and membership encoding (confidential ledger/token hybrid).
2. **Phase 1: Contracts**: Build Nox-backed membership contract.
3. **Phase 2: Backend Services**: Build Nox, Arbitrum, Privacy Access, and iApp orchestration services.
4. **Phase 3: Content Protection**: Implement DataProtector for content blobs and access revocations.
5. **Phase 4: iApp Pipeline**: Bootstrap, test, and deploy the TEE processing app.
6. **Phase 5: Frontend**: Add wallet login and client-side handle encryption; ensure aggregate-only analytics.

## Pseudocode and Adapter Contracts

**Membership Flow Outline:**
```text
1. Frontend encrypts tier using @iexec-nox/handle.
2. Frontend submits handle + proof to SortsMembership.subscribeConfidential().
3. Contract validates input via Nox entrypoint.
4. Contract computes updates on encrypted values and persists ACL.
5. Backend checkAccess evaluates encrypted comparisons or allowed disclosures.
```

**DataProtector Flow Outline:**
```text
1. Creator protects blob via protectData.
2. Backend stores address as encrypted_ref.
3. Backend grantAccess authorizes Sorts iApp and member.
4. Backend revokes access on membership expiry.
```

**iApp Flow Outline:**
```text
1. iapp init -> iapp test -> iapp deploy.
2. Publish app order with iexec CLI.
3. Backend triggers processProtectedData or run flow.
```

## Feature Flags and Fallbacks
Configure the following feature flags in the environment:
- `ENABLE_NOX_CONFIDENTIAL_MEMBERSHIP` (Boolean, Default: `true`): Enable Nox-backed state.
- `ENABLE_DATAPROTECTOR_CONTENT` (Boolean, Default: `true`): Enable DataProtector content.
- `ENABLE_IAPP_CONTENT_PROCESSING` (Boolean, Default: `false`): Route protected content through iApp execution.
- `ENABLE_EXPERIMENTAL_TDX_APP` (Boolean, Default: `false`): Enable TDX-tagged deployment.
- `ENABLE_PUBLIC_DECRYPTION` (Boolean, Default: `false`): Opt-in to Nox public decryption for intentional public handles.

## Testing Strategy
- **Nox SDK**: Verify `encryptInput` returns handle/proof; verify `decrypt` enforces viewer access; verify `viewACL` accuracy.
- **Contracts**: Ensure `subscribeConfidential` accepts external encrypted inputs; ensure plaintext tiers cannot be inferred from events; verify upgrade/renewal does not expose balances.
- **DataProtector**: Verify `protectData` returns an address; verify `grantAccess` requires app/user targets; ensure expired members lose access.
- **iApp**: Ensure local tests pass, deployment yields metadata, and order publication works via CLI.
- **E2E**: Validate confidential Arbitrum Sepolia subscription, gated content access bound to DataProtector grants, and robust expiry blocking.

## Risks, Limitations, and Anti-Overclaim Rules
> [!CAUTION]
> **ANTI-OVERCLAIM RULES**
> - **NEVER** describe DataProtector as a replacement for Nox handles. DataProtector protects datasets/content; Nox handles confidential values/contract state.
> - **NEVER** describe Nox as purely on-chain. It strictly depends on off-chain components (Ingestor, Runner, Handle Gateway, NATS, KMS).
> - **NEVER** invent Solidity APIs that are not confirmed by the official docs.
> - **NEVER** reuse the old "keccak256 commitment simulation" approach to fake confidentiality. Prefer real handle-based flows.
> - **DO NOT** assume missing docs guide sections are stable.

## Definition of Done
- [ ] A generated `SKILL.md` (this file) cleanly separating Nox, DataProtector, and iApp boundaries.
- [ ] Explicit package installation commands provided for `@iexec-nox/handle`, `@iexec/dataprotector`, `iexec`, and `@iexec/iapp`.
- [ ] Implementation sequence strictly orders Contract Privacy -> Content Privacy -> TEE Execution.
- [ ] Acceptance tests are defined for all sub-modules.
- [ ] Anti-overclaim language prevents inventing missing Nox APIs.

---

### Required Installation Commands
To bootstrap the required iExec packages, run:
```bash
# Frontend/Backend Nox Handle Client
pnpm add @iexec-nox/handle

# Contracts Nox Protocol
pnpm add -D @iexec-nox/nox-protocol-contracts @iexec-nox/nox-confidential-contracts

# Backend DataProtector
pnpm add @iexec/dataprotector

# iApp Generator and iExec SDK
pnpm add -g @iexec/iapp iexec
```

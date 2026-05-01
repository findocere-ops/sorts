# iExec Tools Feedback — SORTS

**Submission:** iExec Vibe Coding Challenge 2026
**Date:** 2026-04-20
**Project:** SORTS — Privacy-First Community Platform

---

## Tools evaluated

### ERC-7984 Confidential Token Standard

**Overall impression:** Very promising standard with a clear use-case fit. The non-transferable, commitment-based membership model maps naturally to subscription access control.

**What worked well:**
- The interface is clean and composable. Defining the 8 transfer variants plus `IERC7984Receiver` gave us everything we needed to structure the membership contract.
- The "confidential balance" concept (commitment instead of plaintext amount) maps directly to tier privacy. We were able to implement it using `keccak256(abi.encodePacked(tier, salt))` on Arbitrum Sepolia where FHE is not available.
- The interface ID `0x4958f2a4` is well-chosen and allows standard ERC-165 discovery.

**Pain points:**
- **No reference implementation** for non-FHE chains. The standard documents the interface but leaves the commitment scheme entirely to implementers. We had to design our own `keccak256`-based approach with no guidance on whether this is acceptable for production use.
- **No documentation on the `salt` lifecycle** — when to generate it, where to store it, whether it should be per-user or per-subscription. We stored it off-chain in the backend, which may not be the intended pattern.
- **Aggregate stats** are not part of the standard. We added `getAggregateStats()` as a custom method. It would be valuable to include a recommended interface for analytics that doesn't leak individual data.
- **Renewal flow** is not addressed. The standard covers initial subscription but doesn't specify whether renewing should use the same commitment or a new one. We chose a new commitment on renewal.

**Suggestions:**
1. Publish a reference implementation for non-FHE chains (Arbitrum, Optimism, Base) that shows the `keccak256` commitment pattern with security analysis.
2. Document the recommended salt generation and storage pattern.
3. Add `getAggregateStats()` or similar to the standard interface as an optional extension.
4. Provide a Hardhat plugin or test helper that validates a contract's ERC-7984 compliance.

---

### iExec DataProtector (evaluated but not integrated in Phase 1)

We reviewed DataProtector for protecting content before delivery to Telegram. We ultimately deferred integration to Phase 2 for the following reasons:

**Blockers for Phase 1:**
- The DataProtector SDK requires a Web3Mail or iExec Worker setup. On Arbitrum Sepolia, we couldn't find a straightforward path to trigger content delivery to Telegram without running a dedicated iExec worker.
- The documentation for protecting arbitrary binary content (JSON posts, PDFs) rather than email was sparse.

**What looked promising:**
- The `protectData` + `grantAccess` pattern is exactly what we need for content delivery. The model is correct.
- Access revocation on subscription expiry (`revokeAccess`) aligns perfectly with our `checkAccess` contract function.

**Suggestions:**
1. A Telegram delivery tutorial would significantly lower the barrier for bots using DataProtector.
2. The SDK needs clearer docs for protecting arbitrary `Uint8Array` content (not just string/email).
3. An example showing `revokeAccess` triggered by on-chain subscription expiry (via a contract event listener) would be invaluable.

---

## General hackathon feedback

- The iExec documentation is spread across multiple domains (docs.iex.ec, thegraph integration pages, GitHub READMEs). A single "build with iExec" landing page would reduce context-switching.
- The Vibe Coding Challenge brief was clear and well-structured. The truth hierarchy (PRD > Build Guide > Design) was a smart framing device.
- Arbitrum Sepolia faucet availability was inconsistent during development — a dedicated hackathon faucet link in the brief would help.

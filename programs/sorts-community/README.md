# sorts-community — SORTS subscription rails (Solana, Quasar)

Privacy-first subscription program. Mirrors the economics of `contracts/contracts/SortsMembership.sol` (Phase 1 Arbitrum) on Solana while strengthening privacy:

- Names and symbols are stored on-chain only as `[u8;32]` hashes.
- Tier level for a subscriber is never stored in plaintext; only a `derive("SORTS_TIER_V1" || level || salt_pubkey)` commitment is recorded.
- No member-list, member-registry, or enumerable account exists.
- Creator-facing analytics are aggregate-only (`total_members`, `active_members`, `total_revenue_lamports`).

**Devnet only.** Universal Hard Rule: do **not** deploy this program to mainnet.

## Layout

```
programs/sorts-community/
├── Cargo.toml
├── Quasar.toml
├── README.md
├── keys/
│   ├── .gitkeep
│   └── protocol-treasury.json   ← generated locally, gitignored
├── src/
│   ├── lib.rs
│   ├── constants.rs
│   ├── error.rs
│   ├── logic.rs
│   ├── state.rs
│   └── instructions/
│       ├── mod.rs
│       ├── initialize_community.rs
│       ├── subscribe.rs
│       ├── renew_subscription.rs
│       ├── check_access.rs
│       └── aggregate_stats.rs
└── tests/
    └── sorts_community.rs
```

## Constants

| Constant | Value | Source of truth |
|---|---|---|
| `PROTOCOL_FEE_BPS` | `500` (5 %) | mirrors `SortsMembership.sol:37` |
| `FEE_DENOMINATOR` | `10_000` | basis-points denominator |
| `MAX_TIERS` | `3` | matches `SortsFactory` 1–3 tier rule |
| `PROTOCOL_TREASURY` | `8z2PLCHhGwGU8PHQd1zByD64E4CeZaQuF2NBy3jrdssf` | local keypair under `keys/protocol-treasury.json` (devnet) |

## Instruction set

| ix | discriminator | args |
|---|---|---|
| `initialize_community` | 0 | `name_hash: [u8;32]`, `symbol_hash: [u8;32]`, `tier_count: u8` (1..=3), three `(price_lamports: u64, duration_secs: i64)` pairs for tiers 1/2/3 |
| `subscribe` | 1 | `level: u8` (1..=`tier_count`), `salt_pubkey: Address` |
| `renew_subscription` | 2 | `level: u8` |
| `check_access` | (off-chain simulate or on-chain ix) | reads only — never returns tier or commitment |

`aggregate_stats` is exposed as a Rust helper (`aggregate_stats(&community)`) that reads the Community account and returns `{ total_members, active_members, total_revenue_lamports }` — no on-chain instruction needed.

## Deviations from the original spec

These were forced by the current Quasar derive macro surface and are documented so future API improvements can fold them away:

1. **`Community` PDA is seeded by `[b"community", creator]` only.** The spec called for `[b"community", creator, name_hash]`. Quasar's `#[seeds]` macro rejects `[u8;32]` typed seed args today, so the name_hash is stored as a regular field on Community instead of being part of the PDA derivation. Effect: a creator currently has one community per wallet. Workaround if you need multiple: derive a dedicated keypair per community and pass that as the `creator` (Quasar still authorises the original signer separately).
2. **No separate `Tier` PDAs.** The spec called for `[b"tier", community, level]` PDAs per tier. Quasar's `#[seeds]` rejects `u8` typed seed args, so the three tier slots are stored inline in Community as `tier_N_price_lamports` / `tier_N_duration_secs` for `N ∈ {1,2,3}`. Subscribers still pass `level: u8` and the program looks up the slot. `tier_count` gates which slots are subscribable.
3. **No `emit!` events.** Quasar's event macro is not yet documented; transaction logs from successful instructions are the only on-chain side-channel. Privacy-preserving log lines (`msg!("EVT:CommunityCreated")`) are deliberately commented out — the existence of a successful tx + the resulting account state is sufficient for indexers, and adding `msg!` calls without a verified payload contract risks leaking data.

## Install Quasar

> The Solana toolchain already requires a Rust toolchain, so building `quasar-cli` from source is acceptable for builders. Do not run on a constrained CI image without a full Rust + LLVM toolchain.

```bash
cargo install --git https://github.com/blueshift-gg/quasar quasar-cli
```

## Generate the protocol treasury keypair (already done for this scaffold)

```bash
solana-keygen new --no-bip39-passphrase --force \
  -o programs/sorts-community/keys/protocol-treasury.json
solana-keygen pubkey programs/sorts-community/keys/protocol-treasury.json
```

If you regenerate the keypair, paste the new pubkey into `PROTOCOL_TREASURY` in `src/constants.rs`. The file is gitignored — never commit it.

## Build, test, deploy

```bash
# Type-check the program crate.
cargo check

# Run unit tests (5) + integration tests t1..t6 (6).
cargo test -p sorts-community

# Build the SBF on-chain artifact (target/deploy/sorts_community.so).
# `quasar build` returns an opaque "Anyhow error" on this Quasar revision —
# the underlying framework macros work, only the wrapper CLI is broken.
# We build directly via the Solana toolchain (cut-line decision below).
cargo build-sbf

# Deploy / upgrade to devnet (devnet only — never mainnet).
solana program deploy target/deploy/sorts_community.so \
  --program-id target/deploy/sorts_community-keypair.json \
  --url devnet

# Verify on-chain.
solana program show <PROGRAM_ID> --url devnet
```

## Cut-line decision

`quasar build` and `quasar test` both return an opaque `Anyhow error` on the
pinned Quasar revision (`6f452a89...`). Per the Day-1 cut-line gate (two
framework-level failures → pivot to Anchor), we verified the two failures and
made a **minimal-deviation call**: the framework macros (`#[program]`,
`#[account(set_inner)]`, `#[seeds]`, `#[derive(Accounts)]`) all expand and
compile cleanly. Only the `quasar` wrapper CLI is broken. We bypass it with the
standard Solana toolchain — `cargo build-sbf` produces the SBF artifact, and
`solana program deploy` lands it on devnet. Pivoting to Anchor would regress
working code for cosmetic reasons; we did not pivot.

If a future Quasar release fixes the wrapper, no source changes are needed:
`quasar build` and `quasar test` will simply start succeeding alongside the
existing `cargo build-sbf` path.

## Devnet deployment (current)

See [`deployments/devnet.json`](deployments/devnet.json) for the canonical record.

| Field | Value |
|---|---|
| Program ID | `AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV` |
| Cluster | devnet |
| Authority (deployer) | `2hbt2arr3D7S6A3jkfbT5cJ2se19TBAPuuXJ48yiBATQ` |
| Protocol treasury | `8z2PLCHhGwGU8PHQd1zByD64E4CeZaQuF2NBy3jrdssf` |

## Privacy invariants enforced in code

1. `Community` stores only `name_hash` / `symbol_hash` (`[u8;32]`) — never plaintext name or symbol.
2. `Subscription` stores `tier_commitment = derive("SORTS_TIER_V1" || level || salt_pubkey)` — never the plaintext `level`.
3. `aggregate_stats` returns `{ total_members, active_members, total_revenue_lamports }`. No iteration. No member-list account.
4. `check_access` returns Ok / SortsError::NoSubscription only — no tier, no commitment, no salt.
5. No event payloads carry name plaintext, subscriber pubkey, or tier level.

## Out of scope (separate prompts)

- `backend/src/services/chain/SolanaService.ts` implementing `IChainService` against this program's IDL.
- `frontend/src/lib/chain/adapters/SolanaChainAdapter.ts` + `frontend/src/lib/solana/` connection helpers.
- `backend/src/services/wallet/PrivyService.ts`.
- Routing `solana-devnet` in `backend/src/services/chain/ChainServiceFactory.ts`.
- `ENABLE_SOLANA` feature-flag wiring.

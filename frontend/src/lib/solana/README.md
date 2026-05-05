# frontend/src/lib/solana

Frontend Solana client for the deployed `sorts_community` program.

## Files

| File | Purpose |
|---|---|
| `connection.ts` | Cached `Connection` to the configured devnet RPC + explorer URL helpers. |
| `program.ts` | Cached `PublicKey` for the program id + PDA derivation helpers (Community, Subscription) + the hardcoded `PROTOCOL_TREASURY`. |
| `idl.ts` | Re-export of the hand-written IDL from `backend/src/services/chain/idl/sorts_community.json` + discriminator constants. |
| `instructions.ts` | Hand-built `TransactionInstruction` factories for `initializeCommunity`, `subscribe`, `renewSubscription`. |

## Quasar discriminator caveat

The on-chain program is built with **Quasar**, which uses single-byte instruction
discriminators (`#[instruction(discriminator = N)]`) instead of Anchor's 8-byte sighash.
The default `@coral-xyz/anchor` `Program` coder will **not** encode our instructions
correctly — it would prepend an 8-byte sighash and the on-chain dispatch would reject
the call with a custom-error code.

We therefore:

1. Use `@coral-xyz/anchor` only for IDL TypeScript types (no `Program` instance).
2. Hand-build instruction data buffers in `instructions.ts` (`Buffer.alloc` + raw
   `writeUInt8` / `writeBigUInt64LE` / `writeBigInt64LE` writes). Account ordering
   mirrors `programs/sorts-community/src/instructions/*.rs`.

If a future Quasar release fixes the Anchor-coder mismatch, the call sites can swap
to `Program.methods.<ix>(...).accounts(...).instruction()` without touching the
adapter or the wizard.

## Auth + signing path (cut-line decision)

`@privy-io/react-auth@1.90.0` does **not** include Solana support. Per the Day-3
cut-line gate, we did **not** upgrade Privy. Privy stays for email login and
identity (the bearer token still gates backend writes). For Solana wallet
connection + signing we use `@solana/wallet-adapter-react` + the standard wallet
adapter UI (`SolanaWalletButton`).

When Privy publishes a stable Solana connector compatible with our 1.90 line, the
swap is mechanical: replace `useWallet()` calls in the SolanaChainAdapter with the
Privy hook of the same shape.

## Testing

There is currently no frontend test runner in `@sorts/frontend` (the `test` script
runs `next build`). The Solana surface here is exercised end-to-end via the
`/studio/create` flow on devnet and at the type-check level via `next build`.

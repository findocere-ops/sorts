use quasar_lang::prelude::*;

/// Public-facing community config + aggregate counters + inline tier table.
///
/// Privacy:
/// - `name_hash` and `symbol_hash` are 32-byte digests; plaintext stays off-chain.
/// - Per-tier prices/durations are stored as 3 fixed slots; `tier_count` gates which
///   slots are subscribable. (Storing them inline avoids a Quasar `#[seeds]` limitation
///   where `u8`-typed seed args are not currently supported by the derive.)
/// - Counters are aggregate-only — there is no member list and no per-member field.
///
/// Deviation from the original spec: the spec called for separate `Tier` PDAs seeded
/// by `[b"tier", community, level]`. Quasar's `#[seeds]` derive only accepts
/// `Address`-typed seed args today, so we inline 3 tier slots into Community. The
/// public ix surface is unchanged — clients still pass `level: u8` and the program
/// looks up `(price_lamports[level], duration_secs[level])` internally.
#[account(discriminator = 1, set_inner)]
#[seeds(b"community", creator: Address)]
pub struct Community {
    pub creator: Address,
    pub name_hash: [u8; 32],
    pub symbol_hash: [u8; 32],
    pub created_at: i64,
    pub tier_count: u8,

    pub tier_1_price_lamports: u64,
    pub tier_1_duration_secs: i64,
    pub tier_2_price_lamports: u64,
    pub tier_2_duration_secs: i64,
    pub tier_3_price_lamports: u64,
    pub tier_3_duration_secs: i64,

    pub total_members_counter: u64,
    pub active_members_counter: u64,
    pub total_revenue_lamports: u64,
    pub bump: u8,
}

/// Per-subscriber receipt PDA — pseudonymous (v2) with Tier 1.3 payment-rail
/// abstraction (v3, 2026-05-07).
///
/// Privacy posture:
///
/// **Tier 1.2 (subscriber identity)** — `subscriber_commitment` replaces the
/// plaintext `subscriber: Address` field:
/// - The account holds `subscriber_commitment = derive("SORTS_SUB_V1" ||
///   subscriber_pubkey || nonce)`, where the nonce is a 32-byte secret derived
///   client-side from `sha256(wallet.signMessage("SORTS-NONCE-V1:" ||
///   community_pubkey))`. ed25519 signatures are deterministic (RFC 8032), so
///   the subscriber re-derives the same nonce on every visit without any
///   backend state.
/// - The PDA seed is `[b"subscription", community, subscriber_commitment]`.
///   Without the nonce, an enumerator who only knows `subscriber_pubkey` cannot
///   derive the PDA address, and looking at all Subscription accounts via the
///   discriminator filter yields commitments only.
///
/// **Tier 1.3 (payment-rail privacy)** — `cloak_payment_sigs` records the Cloak
/// signatures that moved funds when subscribing under the Cloak path:
/// - When `cloak_payment_sigs == [0u8; 64]` (devnet default), the program
///   executes the legacy transparent `system_program::transfer` payment flow.
///   Lamport movement is visible on Solana Explorer (Tier 1.3 leak).
/// - When `cloak_payment_sigs` is non-zero, the program SKIPS the transparent
///   transfer (assumes Cloak handled the payment off-band) and stores the two
///   32-byte Cloak transaction signatures concatenated. An off-chain verifier
///   (planned v2 cron, see docs/SUBMISSION_RISKS.md) confirms that the recorded
///   signatures resolve to genuine Cloak `transact` calls that paid the
///   expected amounts to the right recipients.
/// - The Cloak path activates only when the frontend feature flag
///   `NEXT_PUBLIC_ENABLE_CLOAK_MAINNET=true`. Cloak's program is mainnet-only,
///   so devnet builds always see the all-zero default.
///
/// **Tier-level secrecy** — the plaintext tier level is still never stored,
/// only `tier_commitment = derive("SORTS_TIER_V1" || level || salt_pubkey)`.
///
/// Quasar `#[seeds]` derive only accepts `Address`-typed seed args. The 32-byte
/// `subscriber_commitment` is therefore exposed to the macro as an
/// `Address`-shaped seed (`Address` is a transparent newtype over `[u8; 32]`).
///
/// Account layout (202 bytes including 1-byte discriminator):
///
/// ```text
/// [0]      disc                        u8        = 3
/// [1..33]  community                   Address   (32)
/// [33..65] subscriber_commitment       [u8;32]
/// [65..73] expiry_ts                   i64       (8)
/// [73..105] tier_commitment            [u8;32]
/// [105..137] salt_pubkey               Address   (32)
/// [137..201] cloak_payment_sigs        [u8;64]
/// [201]    bump                        u8
/// ```
#[account(discriminator = 3, set_inner)]
#[seeds(b"subscription", community: Address, subscriber_commitment: Address)]
pub struct Subscription {
    pub community: Address,
    /// `derive("SORTS_SUB_V1" || subscriber_pubkey || nonce)`. Equivalent to a
    /// blinded subscriber identity — recoverable only by the subscriber.
    pub subscriber_commitment: [u8; 32],
    pub expiry_ts: i64,
    pub tier_commitment: [u8; 32],
    pub salt_pubkey: Address,
    /// Concatenated Cloak transfer signatures (`tx1[0..32] || tx2[0..32]`) when
    /// the subscriber paid via Cloak. All-zero on the transparent (devnet)
    /// path. See struct docstring for the full Tier 1.3 contract.
    pub cloak_payment_sigs: [u8; 64],
    pub bump: u8,
}

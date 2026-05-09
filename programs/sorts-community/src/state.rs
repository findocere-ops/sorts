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

/// Per-subscriber receipt PDA. The plaintext tier level is NEVER stored —
/// only `tier_commitment = derive("SORTS_TIER_V1" || level || salt)`.
#[account(discriminator = 3, set_inner)]
#[seeds(b"subscription", community: Address, subscriber: Address)]
pub struct Subscription {
    pub community: Address,
    pub subscriber: Address,
    pub expiry_ts: i64,
    pub tier_commitment: [u8; 32],
    pub salt_pubkey: Address,
    pub bump: u8,
}

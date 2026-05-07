use quasar_lang::prelude::*;

// Discriminators (must not collide).
pub const IX_INITIALIZE_COMMUNITY: u8 = 0;
pub const IX_SUBSCRIBE: u8 = 1;
pub const IX_RENEW_SUBSCRIPTION: u8 = 2;

pub const ACCT_COMMUNITY: u8 = 1;
pub const ACCT_TIER: u8 = 2;
pub const ACCT_SUBSCRIPTION: u8 = 3;

// Mirrors contracts/contracts/SortsMembership.sol:37 — keep in lockstep.
pub const PROTOCOL_FEE_BPS: u16 = 500;
pub const FEE_DENOMINATOR: u64 = 10_000;
pub const MAX_TIERS: u8 = 3;

// Protocol treasury — keypair under keys/protocol-treasury.json (gitignored).
// Devnet only. Update after regenerating the keypair.
pub const PROTOCOL_TREASURY: Address =
    solana_address::address!("8z2PLCHhGwGU8PHQd1zByD64E4CeZaQuF2NBy3jrdssf");

/// Tier 1.3 Cloak integration — who absorbs Cloak's withdraw fee
/// (0.005 SOL flat + 0.3% variable per docs.cloak.ag fee-model).
///
/// Default `'subscriber'` means the SORTS frontend computes the gross
/// price as `tier_X_price_lamports + cloak_withdraw_fee(price)` and the
/// subscriber pays the gross via Cloak. Creator receives the SORTS price
/// minus the SORTS protocol fee. Treasury receives the SORTS protocol
/// fee. Cloak's fee comes off the top.
///
/// Flip to `'creator'` (post-launch) if the SORTS team prefers the
/// creator absorbing — then `tier_X_price_lamports` is the gross and the
/// Cloak fee is deducted from `creator_share` before transfer.
///
/// String-typed for clarity in source review; not consumed on-chain (the
/// program does not enforce the absorber — it's a frontend pricing rule).
pub const CLOAK_FEE_ABSORBER: &str = "subscriber";

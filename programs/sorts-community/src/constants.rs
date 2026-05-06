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

//! SORTS — private subscription rails (Solana, Quasar).
//!
//! Mirrors the economics of `contracts/contracts/SortsMembership.sol` (Phase 1
//! Arbitrum) and strengthens privacy:
//!   - Names/symbols on-chain only as `[u8;32]` hashes (plaintext stays off-chain).
//!   - Tier level for a subscriber is never stored — only a derived commitment.
//!   - No member-list account exists. Creator analytics are aggregate-only.

#![cfg_attr(all(not(feature = "no-entrypoint"), not(test)), no_std)]

use quasar_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod logic;
pub mod state;

use instructions::{InitializeCommunity, RenewSubscription, Subscribe};

// Devnet sentinel — replace after first `quasar build` with the program id
// emitted under target/deploy/sorts_community-keypair.json.
declare_id!("AEp6VuJqfctTRQpZP3LDjKcua4C1jGP8YT721AMSBkFV");

#[program]
mod sorts_community {
    use super::*;

    #[instruction(discriminator = 0)]
    pub fn initialize_community(
        ctx: Ctx<InitializeCommunity>,
        name_hash: [u8; 32],
        symbol_hash: [u8; 32],
        tier_count: u8,
        tier_1_price_lamports: u64,
        tier_1_duration_secs: i64,
        tier_2_price_lamports: u64,
        tier_2_duration_secs: i64,
        tier_3_price_lamports: u64,
        tier_3_duration_secs: i64,
    ) -> Result<(), ProgramError> {
        ctx.accounts.initialize_community(
            &ctx.bumps,
            name_hash,
            symbol_hash,
            tier_count,
            tier_1_price_lamports,
            tier_1_duration_secs,
            tier_2_price_lamports,
            tier_2_duration_secs,
            tier_3_price_lamports,
            tier_3_duration_secs,
        )
    }

    #[instruction(discriminator = 1)]
    pub fn subscribe(
        ctx: Ctx<Subscribe>,
        level: u8,
        salt_pubkey: Address,
    ) -> Result<(), ProgramError> {
        ctx.accounts.subscribe(&ctx.bumps, level, salt_pubkey)
    }

    #[instruction(discriminator = 2)]
    pub fn renew_subscription(
        ctx: Ctx<RenewSubscription>,
        level: u8,
    ) -> Result<(), ProgramError> {
        ctx.accounts.renew_subscription(level)
    }
}

pub use instructions::aggregate_stats::{aggregate_stats, AggregateView};

use {
    crate::{
        constants::MAX_TIERS,
        error::SortsError,
        state::{Community, CommunityInner},
    },
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
pub struct InitializeCommunity {
    #[account(mut)]
    pub creator: Signer,

    #[account(
        init,
        payer = creator,
        address = Community::seeds(creator.address()),
    )]
    pub community: Account<Community>,

    pub clock: Sysvar<Clock>,
    pub rent: Sysvar<Rent>,
    pub system_program: Program<SystemProgram>,
}

impl InitializeCommunity {
    pub fn initialize_community(
        &mut self,
        bumps: &InitializeCommunityBumps,
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
        if tier_count < 1 || tier_count > MAX_TIERS {
            return Err(SortsError::InvalidTierCount.into());
        }

        let creator = *self.creator.address();
        let now: i64 = self.clock.unix_timestamp.into();

        self.community.set_inner(CommunityInner {
            creator,
            name_hash,
            symbol_hash,
            created_at: now,
            tier_count,
            tier_1_price_lamports: if tier_count >= 1 { tier_1_price_lamports } else { 0 },
            tier_1_duration_secs: if tier_count >= 1 { tier_1_duration_secs } else { 0 },
            tier_2_price_lamports: if tier_count >= 2 { tier_2_price_lamports } else { 0 },
            tier_2_duration_secs: if tier_count >= 2 { tier_2_duration_secs } else { 0 },
            tier_3_price_lamports: if tier_count >= 3 { tier_3_price_lamports } else { 0 },
            tier_3_duration_secs: if tier_count >= 3 { tier_3_duration_secs } else { 0 },
            total_members_counter: 0,
            active_members_counter: 0,
            total_revenue_lamports: 0,
            bump: bumps.community,
        });

        Ok(())
    }
}

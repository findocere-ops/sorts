use {
    crate::{
        constants::PROTOCOL_TREASURY,
        error::SortsError,
        logic::{split_protocol_fee, tier_commitment},
        state::{Community, CommunityInner, Subscription, SubscriptionInner},
    },
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
pub struct Subscribe {
    #[account(mut)]
    pub subscriber: Signer,

    #[account(mut)]
    pub community: Account<Community>,

    #[account(
        init,
        payer = subscriber,
        address = Subscription::seeds(community.address(), subscriber.address()),
    )]
    pub subscription: Account<Subscription>,

    /// Hardcoded protocol treasury — verified against PROTOCOL_TREASURY in the handler.
    #[account(mut)]
    pub protocol_treasury: UncheckedAccount,

    /// Verified against community.creator in the handler.
    #[account(mut)]
    pub creator: UncheckedAccount,

    pub clock: Sysvar<Clock>,
    pub rent: Sysvar<Rent>,
    pub system_program: Program<SystemProgram>,
}

impl Subscribe {
    pub fn subscribe(
        &mut self,
        bumps: &SubscribeBumps,
        level: u8,
        salt_pubkey: Address,
    ) -> Result<(), ProgramError> {
        if self.protocol_treasury.address() != &PROTOCOL_TREASURY {
            return Err(SortsError::UnauthorizedTreasury.into());
        }
        if self.creator.address() != &self.community.creator {
            return Err(SortsError::UnauthorizedCreator.into());
        }
        let tier_count: u8 = self.community.tier_count.into();
        if level < 1 || level > tier_count {
            return Err(SortsError::InvalidTierLevel.into());
        }

        let (price, duration) = match level {
            1 => (
                self.community.tier_1_price_lamports.into(),
                self.community.tier_1_duration_secs.into(),
            ),
            2 => (
                self.community.tier_2_price_lamports.into(),
                self.community.tier_2_duration_secs.into(),
            ),
            3 => (
                self.community.tier_3_price_lamports.into(),
                self.community.tier_3_duration_secs.into(),
            ),
            _ => return Err(SortsError::InvalidTierLevel.into()),
        };
        let price: u64 = price;
        let duration: i64 = duration;

        let (fee, creator_share) = split_protocol_fee(price)?;

        if fee > 0 {
            self.system_program
                .transfer(&self.subscriber, &self.protocol_treasury, fee)
                .invoke()?;
        }
        if creator_share > 0 {
            self.system_program
                .transfer(&self.subscriber, &self.creator, creator_share)
                .invoke()?;
        }

        let now: i64 = self.clock.unix_timestamp.into();
        let expiry_ts = now.checked_add(duration).ok_or(SortsError::MathOverflow)?;
        let commitment = tier_commitment(level, &salt_pubkey, &crate::ID);
        let community_addr = *self.community.address();
        let subscriber_addr = *self.subscriber.address();

        self.subscription.set_inner(SubscriptionInner {
            community: community_addr,
            subscriber: subscriber_addr,
            expiry_ts,
            tier_commitment: commitment,
            salt_pubkey,
            bump: bumps.subscription,
        });

        let creator = self.community.creator;
        let name_hash = self.community.name_hash;
        let symbol_hash = self.community.symbol_hash;
        let created_at: i64 = self.community.created_at.into();
        let tier_1_price: u64 = self.community.tier_1_price_lamports.into();
        let tier_1_dur: i64 = self.community.tier_1_duration_secs.into();
        let tier_2_price: u64 = self.community.tier_2_price_lamports.into();
        let tier_2_dur: i64 = self.community.tier_2_duration_secs.into();
        let tier_3_price: u64 = self.community.tier_3_price_lamports.into();
        let tier_3_dur: i64 = self.community.tier_3_duration_secs.into();
        let total_members: u64 = self.community.total_members_counter.into();
        let active_members: u64 = self.community.active_members_counter.into();
        let total_revenue: u64 = self.community.total_revenue_lamports.into();
        let community_bump = self.community.bump;

        self.community.set_inner(CommunityInner {
            creator,
            name_hash,
            symbol_hash,
            created_at,
            tier_count,
            tier_1_price_lamports: tier_1_price,
            tier_1_duration_secs: tier_1_dur,
            tier_2_price_lamports: tier_2_price,
            tier_2_duration_secs: tier_2_dur,
            tier_3_price_lamports: tier_3_price,
            tier_3_duration_secs: tier_3_dur,
            total_members_counter: total_members
                .checked_add(1)
                .ok_or(SortsError::MathOverflow)?,
            active_members_counter: active_members
                .checked_add(1)
                .ok_or(SortsError::MathOverflow)?,
            total_revenue_lamports: total_revenue
                .checked_add(price)
                .ok_or(SortsError::MathOverflow)?,
            bump: community_bump,
        });

        Ok(())
    }
}

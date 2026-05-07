use {
    crate::{
        constants::PROTOCOL_TREASURY,
        error::SortsError,
        logic::{is_zero_64, split_protocol_fee, subscriber_commitment},
        state::{Community, CommunityInner, Subscription, SubscriptionInner},
    },
    quasar_lang::prelude::*,
};

#[derive(Accounts)]
#[instruction(level: u8, commitment: Address, nonce: [u8; 32], cloak_payment_sigs: [u8; 64])]
pub struct RenewSubscription {
    #[account(mut)]
    pub subscriber: Signer,

    #[account(mut)]
    pub community: Account<Community>,

    /// Subscription PDA seeded by the same `subscriber_commitment` produced at
    /// subscribe-time. The handler asserts both that `commitment` matches the
    /// stored value and that `(self.subscriber.address(), nonce)` re-derives
    /// the same commitment — only the genuine subscriber, replaying the same
    /// nonce, can renew.
    #[account(
        mut,
        address = Subscription::seeds(community.address(), &commitment),
    )]
    pub subscription: Account<Subscription>,

    /// Verified against PROTOCOL_TREASURY in the handler.
    #[account(mut)]
    pub protocol_treasury: UncheckedAccount,

    /// Verified against community.creator in the handler.
    #[account(mut)]
    pub creator: UncheckedAccount,

    pub clock: Sysvar<Clock>,
    pub system_program: Program<SystemProgram>,
}

impl RenewSubscription {
    pub fn renew_subscription(
        &mut self,
        level: u8,
        commitment: Address,
        nonce: [u8; 32],
        cloak_payment_sigs: [u8; 64],
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

        // Recompute commitment from caller + nonce. The PDA derivation in the
        // account attribute already enforces that the account was created with
        // this commitment, but we re-check explicitly to defend against a
        // future refactor that drops the macro-level binding, AND to verify
        // that the signing subscriber actually owns this commitment (not just
        // someone who knows the public commitment bytes).
        let recomputed = subscriber_commitment(self.subscriber.address(), &nonce, &crate::ID);
        if recomputed != self.subscription.subscriber_commitment {
            return Err(SortsError::NoSubscription.into());
        }
        if commitment.to_bytes() != self.subscription.subscriber_commitment {
            return Err(SortsError::NoSubscription.into());
        }

        let (price, duration): (u64, i64) = match level {
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

        // Tier 1.3 dual-path renewal payment, mirroring `subscribe`. When
        // `cloak_payment_sigs` is all-zero (devnet default), execute the
        // transparent transfer flow. When non-zero, payment was already
        // moved off-band by Cloak; the program records the new sigs and
        // skips the transparent transfer.
        let cloak_path_active = !is_zero_64(&cloak_payment_sigs);
        if !cloak_path_active {
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
        }

        let now: i64 = self.clock.unix_timestamp.into();
        let current_expiry: i64 = self.subscription.expiry_ts.into();
        let was_expired = now >= current_expiry;
        let new_expiry = if was_expired {
            now.checked_add(duration).ok_or(SortsError::MathOverflow)?
        } else {
            current_expiry
                .checked_add(duration)
                .ok_or(SortsError::MathOverflow)?
        };

        let community_addr = self.subscription.community;
        let sub_commit = self.subscription.subscriber_commitment;
        let tier_commitment_existing = self.subscription.tier_commitment;
        let salt_pubkey = self.subscription.salt_pubkey;
        let sub_bump = self.subscription.bump;

        // Always overwrite the stored Cloak sigs with the current renewal's
        // sigs. A subscription created on the transparent path can renew via
        // Cloak (sigs flip from zero to non-zero) and vice versa. Each cycle
        // records its own payment evidence; only the latest is kept on-chain.
        self.subscription.set_inner(SubscriptionInner {
            community: community_addr,
            subscriber_commitment: sub_commit,
            expiry_ts: new_expiry,
            tier_commitment: tier_commitment_existing,
            salt_pubkey,
            cloak_payment_sigs,
            bump: sub_bump,
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

        let next_active = if was_expired {
            active_members
                .checked_add(1)
                .ok_or(SortsError::MathOverflow)?
        } else {
            active_members
        };

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
            total_members_counter: total_members,
            active_members_counter: next_active,
            total_revenue_lamports: total_revenue
                .checked_add(price)
                .ok_or(SortsError::MathOverflow)?,
            bump: community_bump,
        });

        Ok(())
    }
}

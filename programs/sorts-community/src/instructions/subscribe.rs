use {
    crate::{
        constants::PROTOCOL_TREASURY,
        error::SortsError,
        logic::{is_zero_64, split_protocol_fee, subscriber_commitment, tier_commitment},
        state::{Community, CommunityInner, Subscription, SubscriptionInner},
    },
    quasar_lang::prelude::*,
};

/// `commitment` is the seed for the Subscription PDA. The handler asserts
/// `commitment.bytes == subscriber_commitment(subscriber.address(), nonce, ID)`,
/// so a caller cannot create a Subscription account that doesn't bind to their
/// own pubkey + nonce. Both args are present because:
///   - `commitment: Address` lives on the heap-free arg slice and can be
///     borrowed by the `#[account(address = ...)]` macro without a temp.
///   - `nonce: [u8; 32]` is the secret preimage that the handler re-derives
///     to enforce ownership.
///
/// `cloak_payment_sigs` is the Tier 1.3 payment-rail dual-path switch:
///   - all-zero (default, devnet) → handler executes the legacy transparent
///     `system_program::transfer` flow.
///   - non-zero (mainnet, Cloak path) → handler SKIPS the transfer and
///     records the sigs on the Subscription account for off-chain
///     verification. See state.rs Subscription docstring.
#[derive(Accounts)]
#[instruction(
    level: u8,
    commitment: Address,
    nonce: [u8; 32],
    salt_pubkey: Address,
    cloak_payment_sigs: [u8; 64],
)]
pub struct Subscribe {
    #[account(mut)]
    pub subscriber: Signer,

    #[account(mut)]
    pub community: Account<Community>,

    #[account(
        init,
        payer = subscriber,
        address = Subscription::seeds(community.address(), &commitment),
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
        commitment: Address,
        nonce: [u8; 32],
        salt_pubkey: Address,
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

        // The PDA seed binding above only proves a Subscription account at
        // address `derive(b"sub", community, commitment)` was created. The
        // handler must additionally verify that `commitment` is the genuine
        // pseudonym of the signing subscriber — otherwise a third party could
        // squat on someone else's commitment.
        let expected = subscriber_commitment(self.subscriber.address(), &nonce, &crate::ID);
        if commitment.to_bytes() != expected {
            return Err(SortsError::NoSubscription.into());
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

        // Tier 1.3 dual-path payment rail. When the recorded Cloak signatures
        // are all-zero, this is a transparent (devnet) path — the program
        // moves lamports via system_program::transfer as before. When the
        // sigs are non-zero, this is the Cloak path — payment was already
        // moved off-band by the frontend's signAllTransactions bundle and
        // the program only records the sigs for off-chain verification.
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
        let expiry_ts = now.checked_add(duration).ok_or(SortsError::MathOverflow)?;
        let tier_commit = tier_commitment(level, &salt_pubkey, &crate::ID);
        let community_addr = *self.community.address();

        self.subscription.set_inner(SubscriptionInner {
            community: community_addr,
            subscriber_commitment: expected,
            expiry_ts,
            tier_commitment: tier_commit,
            salt_pubkey,
            cloak_payment_sigs,
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

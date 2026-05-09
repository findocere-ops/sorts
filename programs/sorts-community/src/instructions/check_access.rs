use {
    crate::{
        error::SortsError,
        logic::is_active,
        state::{Community, Subscription},
    },
    quasar_lang::prelude::*,
};

/// Read-only liveness check. Returns Ok(()) if the subscription is active.
/// The instruction is callable on-chain but in practice clients simulate it
/// off-chain to avoid landing a transaction.
///
/// Privacy: never returns `tier`, `tier_commitment`, or `salt_pubkey`.
#[derive(Accounts)]
pub struct CheckAccess {
    pub subscriber: UncheckedAccount,

    pub community: Account<Community>,

    #[account(address = Subscription::seeds(community.address(), subscriber.address()))]
    pub subscription: Account<Subscription>,

    pub clock: Sysvar<Clock>,
}

impl CheckAccess {
    pub fn check_access(&self) -> Result<(), ProgramError> {
        if self.subscription.community != *self.community.address() {
            return Err(SortsError::InvalidCommunity.into());
        }
        let now: i64 = self.clock.unix_timestamp.into();
        let expiry: i64 = self.subscription.expiry_ts.into();
        if !is_active(expiry, now) {
            return Err(SortsError::NoSubscription.into());
        }
        Ok(())
    }
}

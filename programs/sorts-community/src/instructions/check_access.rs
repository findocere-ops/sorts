use {
    crate::{
        error::SortsError,
        logic::{is_active, subscriber_commitment},
        state::{Community, Subscription},
    },
    quasar_lang::prelude::*,
};

/// Read-only liveness check. Returns Ok(()) if the subscription is active and
/// the caller knows the nonce that produces the stored `subscriber_commitment`.
///
/// In practice clients simulate this off-chain to avoid landing a transaction —
/// the Rust helper `is_active` plus a client-side commitment derive is enough.
/// The on-chain ix exists for cross-program access checks (CPI from other
/// programs) and to back-stop privacy-preserving gating.
///
/// Privacy: never returns `tier`, `tier_commitment`, `salt_pubkey`, or the
/// subscriber's plaintext pubkey.
#[derive(Accounts)]
#[instruction(commitment: Address, nonce: [u8; 32])]
pub struct CheckAccess {
    pub subscriber: UncheckedAccount,

    pub community: Account<Community>,

    #[account(address = Subscription::seeds(community.address(), &commitment))]
    pub subscription: Account<Subscription>,

    pub clock: Sysvar<Clock>,
}

impl CheckAccess {
    pub fn check_access(
        &self,
        commitment: Address,
        nonce: [u8; 32],
    ) -> Result<(), ProgramError> {
        if self.subscription.community != *self.community.address() {
            return Err(SortsError::InvalidCommunity.into());
        }
        let recomputed = subscriber_commitment(self.subscriber.address(), &nonce, &crate::ID);
        if recomputed != self.subscription.subscriber_commitment {
            return Err(SortsError::NoSubscription.into());
        }
        if commitment.to_bytes() != self.subscription.subscriber_commitment {
            return Err(SortsError::NoSubscription.into());
        }
        let now: i64 = self.clock.unix_timestamp.into();
        let expiry: i64 = self.subscription.expiry_ts.into();
        if !is_active(expiry, now) {
            return Err(SortsError::NoSubscription.into());
        }
        Ok(())
    }
}

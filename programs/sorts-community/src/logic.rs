use {
    crate::{
        constants::{FEE_DENOMINATOR, PROTOCOL_FEE_BPS},
        error::SortsError,
    },
    quasar_lang::prelude::*,
};

#[inline(always)]
pub fn split_protocol_fee(amount_lamports: u64) -> Result<(u64, u64), ProgramError> {
    let protocol_fee = amount_lamports
        .checked_mul(PROTOCOL_FEE_BPS as u64)
        .ok_or(SortsError::MathOverflow)?
        .checked_div(FEE_DENOMINATOR)
        .ok_or(SortsError::MathOverflow)?;
    let creator_revenue = amount_lamports
        .checked_sub(protocol_fee)
        .ok_or(SortsError::MathOverflow)?;
    Ok((protocol_fee, creator_revenue))
}

#[inline(always)]
pub fn is_active(expiry_ts: i64, now: i64) -> bool {
    now < expiry_ts
}

/// Tier commitment = derive("SORTS_TIER_V1" || level || salt) as a 32-byte digest.
/// Uses `Address::derive_address` (PDA derivation) as a deterministic hash function —
/// available in `solana-address` without pulling in a separate keccak crate.
#[inline(always)]
pub fn tier_commitment(level: u8, salt: &Address, program_id: &Address) -> [u8; 32] {
    let level_bytes = [level];
    let derived = Address::derive_address(
        &[b"SORTS_TIER_V1", &level_bytes, salt.as_ref()],
        None,
        program_id,
    );
    derived.to_bytes()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::constants::PROTOCOL_FEE_BPS;

    #[test]
    fn fee_split_matches_solidity_constant() {
        assert_eq!(PROTOCOL_FEE_BPS, 500);
        let (fee, share) = split_protocol_fee(1_000_000).unwrap();
        assert_eq!(fee, 50_000);
        assert_eq!(share, 950_000);
        assert_eq!(fee + share, 1_000_000);
    }

    #[test]
    fn fee_split_handles_round_down() {
        let (fee, share) = split_protocol_fee(123_456).unwrap();
        // 123_456 * 500 / 10_000 = 6172 (integer division)
        assert_eq!(fee, 6_172);
        assert_eq!(share, 117_284);
        assert_eq!(fee + share, 123_456);
    }

    #[test]
    fn is_active_strict_less_than() {
        assert!(is_active(100, 99));
        assert!(!is_active(100, 100));
        assert!(!is_active(100, 101));
    }

    #[test]
    fn tier_commitment_changes_with_level_and_salt() {
        let program_id = Address::new_from_array([7; 32]);
        let salt_a = Address::new_from_array([1; 32]);
        let salt_b = Address::new_from_array([2; 32]);
        assert_ne!(
            tier_commitment(1, &salt_a, &program_id),
            tier_commitment(2, &salt_a, &program_id)
        );
        assert_ne!(
            tier_commitment(1, &salt_a, &program_id),
            tier_commitment(1, &salt_b, &program_id)
        );
        assert_eq!(
            tier_commitment(1, &salt_a, &program_id),
            tier_commitment(1, &salt_a, &program_id)
        );
    }
}

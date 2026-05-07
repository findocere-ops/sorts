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

/// Tier 1.3 dual-path discriminator. Returns true if every byte in the
/// `cloak_payment_sigs` slot is zero — the transparent (devnet) path.
/// Returns false when ANY byte is non-zero — the Cloak (mainnet) path.
///
/// We do not use `slice == [0u8; 64]` directly because that would compile to
/// a heap-equivalent compare on some Rust targets. Manual loop is constant-
/// time on every byte and `no_std`-friendly.
#[inline(always)]
pub fn is_zero_64(bytes: &[u8; 64]) -> bool {
    let mut acc: u8 = 0;
    let mut i = 0;
    while i < 64 {
        acc |= bytes[i];
        i += 1;
    }
    acc == 0
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

/// Subscriber commitment = derive("SORTS_SUB_V1" || subscriber_pubkey || nonce).
///
/// The 32-byte `nonce` is a secret held by the subscriber, derived client-side as
/// `sha256(wallet.signMessage("SORTS-NONCE-V1:" || community_pubkey))`. Solana
/// ed25519 signatures are deterministic per RFC 8032, so the same wallet over the
/// same canonical message always produces the same signature, the same nonce, and
/// therefore the same commitment.
///
/// Why this matters for privacy: the on-chain `Subscription` account stores only
/// this commitment, never the raw subscriber pubkey. An enumerator running
/// `getProgramAccounts(programId, filter=memcmp(disc=3))` sees blinded identities
/// only. To map a commitment back to a wallet, an attacker would need both the
/// subscriber pubkey AND the wallet-bound signature secret — they cannot derive
/// the latter without the subscriber actively signing.
#[inline(always)]
pub fn subscriber_commitment(
    subscriber: &Address,
    nonce: &[u8; 32],
    program_id: &Address,
) -> [u8; 32] {
    let derived = Address::derive_address(
        &[b"SORTS_SUB_V1", subscriber.as_ref(), nonce.as_ref()],
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

    #[test]
    fn is_zero_64_detects_all_zero_and_any_non_zero() {
        let zero = [0u8; 64];
        assert!(is_zero_64(&zero), "all-zero must return true");

        let mut one_byte = [0u8; 64];
        one_byte[0] = 1;
        assert!(!is_zero_64(&one_byte), "first byte non-zero must return false");

        let mut last_byte = [0u8; 64];
        last_byte[63] = 0xff;
        assert!(!is_zero_64(&last_byte), "last byte non-zero must return false");

        let mid_byte_only = {
            let mut b = [0u8; 64];
            b[31] = 0x42;
            b
        };
        assert!(!is_zero_64(&mid_byte_only), "interior non-zero byte must return false");

        let all_ones = [0xffu8; 64];
        assert!(!is_zero_64(&all_ones), "every byte 0xff must return false");
    }

    #[test]
    fn subscriber_commitment_is_deterministic_and_separates_inputs() {
        let program_id = Address::new_from_array([7; 32]);
        let alice = Address::new_from_array([0xA1; 32]);
        let bob = Address::new_from_array([0xB2; 32]);
        let nonce_a: [u8; 32] = [0x11; 32];
        let nonce_b: [u8; 32] = [0x22; 32];

        // Same inputs reproduce the same commitment — required so subscribers can
        // re-derive their PDA on every visit without on-chain or backend state.
        assert_eq!(
            subscriber_commitment(&alice, &nonce_a, &program_id),
            subscriber_commitment(&alice, &nonce_a, &program_id),
        );
        // Different subscriber → different commitment.
        assert_ne!(
            subscriber_commitment(&alice, &nonce_a, &program_id),
            subscriber_commitment(&bob, &nonce_a, &program_id),
        );
        // Same subscriber, different nonce → different commitment (nonce-blinded).
        assert_ne!(
            subscriber_commitment(&alice, &nonce_a, &program_id),
            subscriber_commitment(&alice, &nonce_b, &program_id),
        );
    }
}

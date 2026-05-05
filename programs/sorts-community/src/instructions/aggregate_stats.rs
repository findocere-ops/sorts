use crate::state::Community;

/// Aggregate-only view. Mirrors Solidity `getAggregateStats`
/// (contracts/contracts/SortsMembership.sol:176-186). No iteration, no per-member fields.
pub struct AggregateView {
    pub total_members: u64,
    pub active_members: u64,
    pub total_revenue_lamports: u64,
}

pub fn aggregate_stats(community: &Community) -> AggregateView {
    AggregateView {
        total_members: community.total_members_counter.into(),
        active_members: community.active_members_counter.into(),
        total_revenue_lamports: community.total_revenue_lamports.into(),
    }
}

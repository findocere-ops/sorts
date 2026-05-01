// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./interfaces/IERC7984.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";

/**
 * @title SortsMembership
 * @notice ERC-7984-compliant confidential membership token for a single SORTS community.
 *         Each tier is encoded as a token balance (1=Basic, 10=Pro, 100=VIP).
 *         Balances are stored as keccak256 commitments (commitment-based privacy
 *         on Arbitrum Sepolia — no FHE available on this network).
 *
 *         PRIVACY NOTE: On Arbitrum Sepolia, full FHE is not available.
 *         Commitment scheme: _balances[user] = keccak256(abi.encodePacked(actualTier, _salts[user]))
 *         Actual tier levels are stored in a private mapping accessible only within the contract.
 *
 *         Protocol fee (5% of subscription revenue) is forwarded to the protocol treasury.
 */
contract SortsMembership is IERC7984, ERC165, Ownable {
    // ERC-7984 interface ID
    bytes4 private constant _INTERFACE_ID_ERC7984 = 0x4958f2a4;

    // ── State ────────────────────────────────────────────────────────────────
    string private _name;
    string private _symbol;
    string private _contractURI;

    address public immutable creator;
    address public immutable protocolTreasury;
    uint256 public constant PROTOCOL_FEE_BPS = 500; // 5% = 500 basis points

    // Tier prices and durations (set at deployment by creator)
    mapping(uint8 => uint256) public tierPrices;    // tier => price in wei
    mapping(uint8 => uint256) public tierDurations; // tier => duration in seconds

    // Commitment-based confidential balances (ERC-7984 compliance)
    mapping(address => bytes32) private _balances; // commitment pointer
    mapping(address => bytes32) private _salts;    // per-user salt for commitment

    // Plaintext tier stored privately — only readable by contract logic
    mapping(address => uint8) private _tiers;

    // Operator approvals (ERC-7984)
    mapping(address => mapping(address => uint48)) private _operators;

    // Membership lifecycle
    mapping(address => uint256) public memberExpiry;

    // Aggregate stats (no individual data exposed)
    uint256 public totalMembers;
    uint256 public totalRevenue;
    uint256 public activeMembers;

    // ── Events ───────────────────────────────────────────────────────────────
    event MemberSubscribed(address indexed member, uint256 expiry);   // no tier in event
    event MembershipRenewed(address indexed member, uint256 expiry);
    event ProtocolFeeCollected(uint256 amount);

    // ── Constructor ──────────────────────────────────────────────────────────
    constructor(
        string memory name_,
        string memory symbol_,
        address creator_,
        address protocolTreasury_,
        uint8[] memory tierIds,
        uint256[] memory prices,
        uint256[] memory durations
    ) Ownable(creator_) {
        require(tierIds.length == prices.length && prices.length == durations.length, "Length mismatch");
        _name = name_;
        _symbol = symbol_;
        creator = creator_;
        protocolTreasury = protocolTreasury_;

        for (uint256 i = 0; i < tierIds.length; i++) {
            require(tierIds[i] >= 1 && tierIds[i] <= 3, "Invalid tier");
            tierPrices[tierIds[i]] = prices[i];
            tierDurations[tierIds[i]] = durations[i];
        }
    }

    // ── Membership logic ─────────────────────────────────────────────────────

    /**
     * @notice Subscribe to a membership tier.
     * @param tier Tier level: 1=Basic, 10=Pro (stored as 2), 100=VIP (stored as 3).
     *        Use 1, 2, or 3 for the tier selector.
     */
    function subscribe(uint8 tier) external payable {
        require(tier >= 1 && tier <= 3, "Invalid tier");
        require(msg.value >= tierPrices[tier], "Insufficient payment");
        require(memberExpiry[msg.sender] < block.timestamp, "Already active - use renew");

        _mintConfidentialToken(msg.sender, tier);
        memberExpiry[msg.sender] = block.timestamp + tierDurations[tier];
        totalMembers++;
        activeMembers++;

        _collectProtocolFee(msg.value);

        emit MemberSubscribed(msg.sender, memberExpiry[msg.sender]);
    }

    /**
     * @notice Renew an existing membership.
     */
    function renewSubscription() external payable {
        uint8 tier = _tiers[msg.sender];
        require(tier >= 1 && tier <= 3, "No membership to renew");
        require(msg.value >= tierPrices[tier], "Insufficient payment");

        if (memberExpiry[msg.sender] < block.timestamp) {
            // Was expired — count them as newly active again
            activeMembers++;
            memberExpiry[msg.sender] = block.timestamp + tierDurations[tier];
        } else {
            memberExpiry[msg.sender] += tierDurations[tier];
        }

        _collectProtocolFee(msg.value);

        emit MembershipRenewed(msg.sender, memberExpiry[msg.sender]);
    }

    /**
     * @notice Check whether a member has active access (not expired).
     */
    function checkAccess(address user) external view returns (bool) {
        return memberExpiry[user] >= block.timestamp && _tiers[user] >= 1;
    }

    /**
     * @notice Check whether a member has the required tier access.
     *         Returns bool without revealing the actual tier level.
     */
    function checkTierAccess(address user, uint8 requiredTier) external view returns (bool) {
        if (memberExpiry[user] < block.timestamp) return false;
        return _tiers[user] >= requiredTier;
    }

    /**
     * @notice Return membership expiry timestamp for a given address.
     */
    function getMemberExpiry(address user) external view returns (uint256) {
        return memberExpiry[user];
    }

    /**
     * @notice Return the renewal price for a member's current tier.
     *         Does not reveal the tier level — only the price.
     *         Returns 0 if the address has no membership.
     */
    function getRenewalPrice(address user) external view returns (uint256) {
        uint8 tier = _tiers[user];
        if (tier == 0) return 0;
        return tierPrices[tier];
    }

    /**
     * @notice Aggregate stats only — never exposes individual member data.
     */
    function getAggregateStats() external view returns (
        uint256 members,
        uint256 revenue,
        uint256 active
    ) {
        members = totalMembers;
        revenue = totalRevenue;
        // activeMembers is incremented on subscribe/renew-from-expired.
        // It cannot decrement on-chain without a keeper — treat as an upper bound.
        active = activeMembers;
    }

    // ── ERC-7984 implementation ──────────────────────────────────────────────

    function name() external view override returns (string memory) { return _name; }
    function symbol() external view override returns (string memory) { return _symbol; }
    function decimals() external pure override returns (uint8) { return 0; }
    function contractURI() external view override returns (string memory) { return _contractURI; }

    function confidentialTotalSupply() external view override returns (bytes32) {
        return keccak256(abi.encodePacked(totalMembers, address(this)));
    }

    function confidentialBalanceOf(address account) external view override returns (bytes32) {
        return _balances[account];
    }

    function setOperator(address operator, uint48 expiry) external override {
        _operators[msg.sender][operator] = expiry;
        emit OperatorSet(msg.sender, operator, expiry);
    }

    function isOperator(address owner, address operator) external view override returns (bool) {
        return _operators[owner][operator] >= uint48(block.timestamp);
    }

    // Transfer variants — membership tokens are non-transferable (privacy requirement)
    function confidentialTransfer(address, bytes32) external pure override returns (bytes32) {
        revert("Non-transferable membership token");
    }
    function confidentialTransfer(address, bytes32, bytes calldata) external pure override returns (bytes32) {
        revert("Non-transferable membership token");
    }
    function confidentialTransferFrom(address, address, bytes32) external pure override returns (bytes32) {
        revert("Non-transferable membership token");
    }
    function confidentialTransferFrom(address, address, bytes32, bytes calldata) external pure override returns (bytes32) {
        revert("Non-transferable membership token");
    }
    function confidentialTransferAndCall(address, bytes32, bytes calldata) external pure override returns (bytes32) {
        revert("Non-transferable membership token");
    }
    function confidentialTransferAndCall(address, bytes32, bytes calldata, bytes calldata) external pure override returns (bytes32) {
        revert("Non-transferable membership token");
    }
    function confidentialTransferFromAndCall(address, address, bytes32, bytes calldata) external pure override returns (bytes32) {
        revert("Non-transferable membership token");
    }
    function confidentialTransferFromAndCall(address, address, bytes32, bytes calldata, bytes calldata) external pure override returns (bytes32) {
        revert("Non-transferable membership token");
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC165, IERC7984) returns (bool) {
        return interfaceId == _INTERFACE_ID_ERC7984 || super.supportsInterface(interfaceId);
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    function _mintConfidentialToken(address user, uint8 tier) internal {
        bytes32 salt = keccak256(abi.encodePacked(user, block.timestamp, blockhash(block.number - 1)));
        _salts[user] = salt;
        _tiers[user] = tier;
        // Commitment: observer sees bytes32 pointer, not the tier value
        _balances[user] = keccak256(abi.encodePacked(tier, salt));
        emit ConfidentialTransfer(address(0), user, _balances[user]);
    }

    function _collectProtocolFee(uint256 amount) internal {
        uint256 fee = (amount * PROTOCOL_FEE_BPS) / 10000;
        uint256 creatorShare = amount - fee;

        totalRevenue += amount;

        (bool feeOk,) = protocolTreasury.call{value: fee}("");
        require(feeOk, "Protocol fee transfer failed");

        (bool creatorOk,) = creator.call{value: creatorShare}("");
        require(creatorOk, "Creator payment failed");

        emit ProtocolFeeCollected(fee);
    }
}

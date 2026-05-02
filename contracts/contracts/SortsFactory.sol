// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./SortsMembership.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title SortsFactory
 * @notice Deploys new SortsMembership contracts (one per community).
 *         The factory also acts as the protocol treasury receiver for 5% USDC fees.
 */
contract SortsFactory is Ownable {
    using SafeERC20 for IERC20;

    // ── State ────────────────────────────────────────────────────────────────
    IERC20 public immutable paymentToken;
    uint256 public communityCount;
    mapping(uint256 => address) public communities;
    mapping(address => address[]) public creatorCommunities;

    // Native ETH revenue tracking (kept for any direct treasury deposits)
    uint256 public totalProtocolRevenue;

    // ── Events ───────────────────────────────────────────────────────────────
    event CommunityCreated(
        uint256 indexed communityId,
        address indexed creator,
        address contractAddress,
        string name,
        string symbol
    );

    constructor(address initialOwner, address paymentToken_) Ownable(initialOwner) {
        require(paymentToken_ != address(0), "Payment token required");
        paymentToken = IERC20(paymentToken_);
    }

    // ── Factory ──────────────────────────────────────────────────────────────

    /**
     * @notice Deploy a new private community.
     * @param name_      Community display name
     * @param symbol_    Token symbol (max 5 chars)
     * @param tierIds    Tier IDs (1, 2, 3)
     * @param prices     Subscription price in USDC base units per tier
     * @param durations  Duration in seconds per tier
     */
    function createCommunity(
        string calldata name_,
        string calldata symbol_,
        uint8[] calldata tierIds,
        uint256[] calldata prices,
        uint64[] calldata durations
    ) external returns (uint256 communityId, address contractAddress) {
        require(bytes(name_).length > 0, "Name required");
        require(bytes(symbol_).length <= 5, "Symbol max 5 chars");
        require(tierIds.length > 0 && tierIds.length <= 3, "1-3 tiers required");

        communityId = communityCount++;

        SortsMembership membership = new SortsMembership(
            name_,
            symbol_,
            msg.sender,
            address(this),  // protocol treasury = this factory
            address(paymentToken),
            tierIds,
            prices,
            durations
        );

        contractAddress = address(membership);
        communities[communityId] = contractAddress;
        creatorCommunities[msg.sender].push(contractAddress);

        emit CommunityCreated(communityId, msg.sender, contractAddress, name_, symbol_);
    }

    function getCommunity(uint256 communityId) external view returns (address) {
        return communities[communityId];
    }

    function getCommunityCount() external view returns (uint256) {
        return communityCount;
    }

    function getCreatorCommunities(address creator) external view returns (address[] memory) {
        return creatorCommunities[creator];
    }

    // ── Protocol treasury ────────────────────────────────────────────────────

    receive() external payable {
        totalProtocolRevenue += msg.value;
    }

    function withdrawRevenue(address to, uint256 amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance");
        (bool ok,) = to.call{value: amount}("");
        require(ok, "Withdrawal failed");
    }

    function withdrawTokens(address to, uint256 amount) external onlyOwner {
        paymentToken.safeTransfer(to, amount);
    }
}

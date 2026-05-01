// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title IERC7984
 * @notice Full interface for the ERC-7984 Confidential Token standard.
 *         On Arbitrum Sepolia (no FHE), balances are stored as keccak256 commitments.
 *         The interface is fully implemented to satisfy hackathon requirements.
 */
interface IERC7984 {
    // ── Events ──────────────────────────────────────────────────────────────
    event ConfidentialTransfer(address indexed from, address indexed to, bytes32 encryptedAmount);
    event OperatorSet(address indexed owner, address indexed operator, uint48 expiry);
    event AmountDisclosed(address indexed account, bytes32 handle, uint256 amount);

    // ── Metadata ────────────────────────────────────────────────────────────
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function contractURI() external view returns (string memory);

    // ── Confidential supply / balance ────────────────────────────────────
    function confidentialTotalSupply() external view returns (bytes32);
    function confidentialBalanceOf(address account) external view returns (bytes32);

    // ── Operators ────────────────────────────────────────────────────────────
    function setOperator(address operator, uint48 expiry) external;
    function isOperator(address owner, address operator) external view returns (bool);

    // ── Transfer variants (8 total — all required by ERC-7984) ────────────
    function confidentialTransfer(address to, bytes32 encryptedAmount) external returns (bytes32);
    function confidentialTransfer(address to, bytes32 encryptedAmount, bytes calldata proof) external returns (bytes32);
    function confidentialTransferFrom(address from, address to, bytes32 encryptedAmount) external returns (bytes32);
    function confidentialTransferFrom(address from, address to, bytes32 encryptedAmount, bytes calldata proof) external returns (bytes32);
    function confidentialTransferAndCall(address to, bytes32 encryptedAmount, bytes calldata data) external returns (bytes32);
    function confidentialTransferAndCall(address to, bytes32 encryptedAmount, bytes calldata proof, bytes calldata data) external returns (bytes32);
    function confidentialTransferFromAndCall(address from, address to, bytes32 encryptedAmount, bytes calldata data) external returns (bytes32);
    function confidentialTransferFromAndCall(address from, address to, bytes32 encryptedAmount, bytes calldata proof, bytes calldata data) external returns (bytes32);

    // ── ERC-165 ──────────────────────────────────────────────────────────────
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

/**
 * @title IERC7984Receiver
 * @notice Callback interface for contracts that receive confidential token transfers.
 */
interface IERC7984Receiver {
    function onConfidentialTransferReceived(
        address operator,
        address from,
        bytes32 encryptedAmount,
        bytes calldata data
    ) external returns (bytes4);
}

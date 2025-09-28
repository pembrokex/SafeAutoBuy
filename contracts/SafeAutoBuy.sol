// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32, eaddress, externalEaddress, ebool} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title SafeAutoBuy - Confidential Token Purchase System
/// @notice Allows users to register encrypted token purchase requests with ETH deposits
contract SafeAutoBuy is SepoliaConfig {
    address public owner;
    uint256 public nextRequestId;
    uint256 public constant FIXED_TOKEN_PRICE = 1e15; // 0.001 ETH per token

    struct PurchaseRequest {
        address user;
        eaddress encryptedTokenAddress;  // Encrypted token address
        euint32 encryptedAmount;         // Encrypted amount to purchase
        uint256 ethDeposited;            // ETH deposited by user
        bool isActive;                   // Request status
        uint256 timestamp;               // When request was created
    }

    mapping(uint256 => PurchaseRequest) public purchaseRequests;
    mapping(address => uint256[]) public userRequests;
    uint256[] public activeRequestIds;

    // Decryption-related variables
    bool private isDecryptionPending;
    uint256 private latestRequestId;
    uint256 private currentProcessingRequestId;

    event PurchaseRequestCreated(
        uint256 indexed requestId,
        address indexed user,
        uint256 ethAmount,
        uint256 timestamp
    );

    event PurchaseExecuted(
        uint256 indexed requestId,
        address indexed user,
        address tokenAddress,
        uint256 tokenAmount,
        uint256 ethUsed
    );

    event DecryptionRequested(uint256 indexed requestId);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    modifier onlyDecryptionOracle() {
        require(msg.sender == address(0xb6E160B1ff80D67Bfe90A85eE06Ce0A2613607D1), "Unauthorized decryption oracle");
        _;
    }

    constructor() {
        owner = msg.sender;
        nextRequestId = 1;
    }

    /// @notice Create a new purchase request with encrypted token address and amount
    /// @param encryptedTokenAddress Encrypted token address to purchase
    /// @param encryptedAmount Encrypted amount of tokens to purchase
    /// @param inputProof Proof for the encrypted inputs
    function createPurchaseRequest(
        externalEaddress encryptedTokenAddress,
        externalEuint32 encryptedAmount,
        bytes calldata inputProof
    ) external payable {
        require(msg.value > 0, "Must deposit ETH");

        // Validate and convert external encrypted inputs
        eaddress tokenAddress = FHE.fromExternal(encryptedTokenAddress, inputProof);
        euint32 amount = FHE.fromExternal(encryptedAmount, inputProof);

        uint256 requestId = nextRequestId++;

        purchaseRequests[requestId] = PurchaseRequest({
            user: msg.sender,
            encryptedTokenAddress: tokenAddress,
            encryptedAmount: amount,
            ethDeposited: msg.value,
            isActive: true,
            timestamp: block.timestamp
        });

        userRequests[msg.sender].push(requestId);
        activeRequestIds.push(requestId);

        // Set ACL permissions
        FHE.allowThis(tokenAddress);
        FHE.allowThis(amount);
        FHE.allow(tokenAddress, msg.sender);
        FHE.allow(amount, msg.sender);

        emit PurchaseRequestCreated(requestId, msg.sender, msg.value, block.timestamp);
    }

    /// @notice Owner can select a random active request to process
    /// @param seed Random seed for selection
    function selectRandomRequest(uint256 seed) external onlyOwner {
        require(activeRequestIds.length > 0, "No active requests");
        require(!isDecryptionPending, "Decryption already in progress");

        uint256 randomIndex = uint256(keccak256(abi.encodePacked(seed, block.timestamp, block.prevrandao))) % activeRequestIds.length;
        uint256 selectedRequestId = activeRequestIds[randomIndex];

        currentProcessingRequestId = selectedRequestId;
        _requestDecryption(selectedRequestId);
    }

    /// @notice Internal function to request decryption of encrypted values
    function _requestDecryption(uint256 requestId) internal {
        require(purchaseRequests[requestId].isActive, "Request not active");

        PurchaseRequest storage request = purchaseRequests[requestId];

        // Prepare ciphertexts for decryption
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(request.encryptedTokenAddress);
        cts[1] = FHE.toBytes32(request.encryptedAmount);

        // Request decryption
        latestRequestId = FHE.requestDecryption(cts, this.decryptionCallback.selector);
        isDecryptionPending = true;

        emit DecryptionRequested(requestId);
    }

    /// @notice Callback function for decryption oracle
    function decryptionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public returns (bool) {
        require(requestId == latestRequestId, "Invalid requestId");
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        (address decryptedTokenAddress, uint256 decryptedAmount) = abi.decode(cleartexts, (address, uint256));

        // Execute the purchase
        _executePurchase(currentProcessingRequestId, decryptedTokenAddress, uint32(decryptedAmount));

        isDecryptionPending = false;
        return true;
    }

    /// @notice Execute the token purchase after decryption
    function _executePurchase(uint256 requestId, address tokenAddress, uint32 tokenAmount) internal {
        PurchaseRequest storage request = purchaseRequests[requestId];
        require(request.isActive, "Request not active");

        uint256 requiredEth = uint256(tokenAmount) * FIXED_TOKEN_PRICE;
        require(request.ethDeposited >= requiredEth, "Insufficient ETH deposited");

        // Mark request as inactive
        request.isActive = false;

        // Remove from active requests
        _removeFromActiveRequests(requestId);

        // Transfer tokens to user
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient token balance");
        require(token.transfer(request.user, tokenAmount), "Token transfer failed");

        // Refund excess ETH if any
        uint256 excessEth = request.ethDeposited - requiredEth;
        if (excessEth > 0) {
            payable(request.user).transfer(excessEth);
        }

        emit PurchaseExecuted(requestId, request.user, tokenAddress, tokenAmount, requiredEth);
    }

    /// @notice Remove request ID from active requests array
    function _removeFromActiveRequests(uint256 requestId) internal {
        for (uint256 i = 0; i < activeRequestIds.length; i++) {
            if (activeRequestIds[i] == requestId) {
                activeRequestIds[i] = activeRequestIds[activeRequestIds.length - 1];
                activeRequestIds.pop();
                break;
            }
        }
    }

    /// @notice Cancel an active purchase request (user can get refund)
    /// @param requestId The request to cancel
    function cancelRequest(uint256 requestId) external {
        PurchaseRequest storage request = purchaseRequests[requestId];
        require(request.user == msg.sender, "Not your request");
        require(request.isActive, "Request not active");
        require(currentProcessingRequestId != requestId, "Request being processed");

        request.isActive = false;
        _removeFromActiveRequests(requestId);

        // Refund ETH
        payable(msg.sender).transfer(request.ethDeposited);
    }

    /// @notice Get user's purchase requests
    /// @param user User address
    function getUserRequests(address user) external view returns (uint256[] memory) {
        return userRequests[user];
    }

    /// @notice Get encrypted token address for a request
    /// @param requestId Request ID
    function getEncryptedTokenAddress(uint256 requestId) external view returns (eaddress) {
        return purchaseRequests[requestId].encryptedTokenAddress;
    }

    /// @notice Get encrypted amount for a request
    /// @param requestId Request ID
    function getEncryptedAmount(uint256 requestId) external view returns (euint32) {
        return purchaseRequests[requestId].encryptedAmount;
    }

    /// @notice Get all active request IDs
    function getActiveRequestIds() external view returns (uint256[] memory) {
        return activeRequestIds;
    }

    /// @notice Get number of active requests
    function getActiveRequestCount() external view returns (uint256) {
        return activeRequestIds.length;
    }

    /// @notice Owner can deposit tokens for purchase
    /// @param tokenAddress Token contract address
    /// @param amount Amount to deposit
    function depositTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.transferFrom(msg.sender, address(this), amount), "Token transfer failed");
    }

    /// @notice Owner can withdraw tokens
    /// @param tokenAddress Token contract address
    /// @param amount Amount to withdraw
    function withdrawTokens(address tokenAddress, uint256 amount) external onlyOwner {
        IERC20 token = IERC20(tokenAddress);
        require(token.transfer(msg.sender, amount), "Token transfer failed");
    }

    /// @notice Owner can withdraw ETH
    /// @param amount Amount to withdraw
    function withdrawETH(uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        payable(owner).transfer(amount);
    }

    /// @notice Get contract's token balance
    /// @param tokenAddress Token contract address
    function getTokenBalance(address tokenAddress) external view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    /// @notice Get contract's ETH balance
    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, euint32, eaddress, externalEuint32, externalEaddress} from "@fhevm/solidity/lib/FHE.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title SafeAutoBuy
/// @notice Users register encrypted token wishes + amount with ETH deposit. Owner randomly selects a request,
///         decrypts on-chain via Zama oracle, and fulfills purchase at a fixed price (no AMM).
contract SafeAutoBuy is SepoliaConfig, Ownable {
    enum OrderStatus { Pending, Processing, Completed, Failed, Refunded, Canceled }

    struct Order {
        address user;          // user placing the order
        eaddress tokenEnc;     // encrypted token address
        euint32 amountEnc;     // encrypted token amount (token decimals as per ERC20)
        OrderStatus status;
        uint256 createdAt;
        // Decryption and process bookkeeping
        uint256 decryptRequestId;
    }

    // Fixed price per token (in wei) for each ERC20 token address
    mapping(address => uint256) public pricePerTokenWei;

    // User ETH balances (top-up and withdraw)
    mapping(address => uint256) private _ethBalances;

    // Orders storage
    Order[] private orders;
    uint256[] private pendingOrderIds;
    mapping(uint256 => uint256) private pendingIndex; // orderId -> index in pendingOrderIds + 1

    // Temporary store decryption context
    struct DecryptCtx {
        uint256 orderId;
        bool exists;
    }
    mapping(uint256 => DecryptCtx) private _decryptCtxByReqId;

    // Events
    event OrderSubmitted(uint256 indexed orderId, address indexed user);
    event PriceUpdated(address indexed token, uint256 pricePerTokenWei);
    event OrderPicked(uint256 indexed orderId, uint256 requestId);
    event OrderCompleted(uint256 indexed orderId, address indexed token, uint256 amount, uint256 costWei, uint256 refundWei);
    event OrderFailed(uint256 indexed orderId, string reason);
    event OrderRefunded(uint256 indexed orderId, uint256 amountWei);
    event EthDeposited(address indexed user, uint256 amountWei);
    event EthWithdrawn(address indexed user, uint256 amountWei);

    constructor(address initialOwner) Ownable(initialOwner) {}

    // ============ User API ============

    /// @notice Submit an order with encrypted token address and amount; attach ETH deposit
    /// @param tokenIn Encrypted token address input handle
    /// @param amountIn Encrypted token amount input handle (uint32)
    /// @param inputProof Zama input proof
    function submitOrder(
        externalEaddress tokenIn,
        externalEuint32 amountIn,
        bytes calldata inputProof
    ) external returns (uint256 orderId) {

        eaddress tokenEnc = FHE.fromExternal(tokenIn, inputProof);
        euint32 amountEnc = FHE.fromExternal(amountIn, inputProof);

        // Grant permissions for later processing (contract needs to decrypt)
        FHE.allowThis(tokenEnc);
        FHE.allowThis(amountEnc);

        Order memory o = Order({
            user: msg.sender,
            tokenEnc: tokenEnc,
            amountEnc: amountEnc,
            status: OrderStatus.Pending,
            createdAt: block.timestamp,
            decryptRequestId: 0
        });

        orders.push(o);
        orderId = orders.length - 1;

        // Track as pending
        pendingIndex[orderId] = pendingOrderIds.length + 1;
        pendingOrderIds.push(orderId);

        emit OrderSubmitted(orderId, msg.sender);
    }

    /// @notice Deposit ETH to your balance tracked by contract
    function depositETH() external payable {
        require(msg.value > 0, "Zero deposit");
        _ethBalances[msg.sender] += msg.value;
        emit EthDeposited(msg.sender, msg.value);
    }

    /// @notice Withdraw ETH from your balance
    function withdrawETH(uint256 amount) external {
        require(amount > 0, "Zero amount");
        uint256 bal = _ethBalances[msg.sender];
        require(bal >= amount, "Insufficient balance");
        _ethBalances[msg.sender] = bal - amount;
        (bool ok, ) = payable(msg.sender).call{value: amount}("");
        require(ok, "Withdraw failed");
        emit EthWithdrawn(msg.sender, amount);
    }

    /// @notice User may cancel a still-pending order
    function cancelOrder(uint256 orderId) external {
        Order storage o = orders[orderId];
        require(o.user == msg.sender, "Not your order");
        require(o.status == OrderStatus.Pending, "Not pending");

        o.status = OrderStatus.Canceled;
        _removeFromPending(orderId);
    }

    // ============ Owner API ============

    /// @notice Set fixed price per token (wei per token unit)
    function setPrice(address token, uint256 priceWeiPerToken) external onlyOwner {
        require(token != address(0), "Invalid token");
        pricePerTokenWei[token] = priceWeiPerToken;
        emit PriceUpdated(token, priceWeiPerToken);
    }

    /// @notice Owner randomly picks a pending order and requests decryption for processing
    function pickRandomAndRequestDecryption() external onlyOwner returns (uint256 orderId, uint256 requestId) {
        require(pendingOrderIds.length > 0, "No pending orders");
        // Pseudo-random selection based on block state (sufficient for admin selection)
        uint256 rnd = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, pendingOrderIds.length)));
        uint256 idx = rnd % pendingOrderIds.length;
        orderId = pendingOrderIds[idx];

        Order storage o = orders[orderId];
        require(o.status == OrderStatus.Pending, "Invalid status");
        o.status = OrderStatus.Processing;

        // Prepare ciphertexts for decryption: tokenEnc then amountEnc
        bytes32[] memory cts = new bytes32[](2);
        cts[0] = FHE.toBytes32(o.tokenEnc);
        cts[1] = FHE.toBytes32(o.amountEnc);

        requestId = FHE.requestDecryption(cts, this.decryptionCallback.selector);
        o.decryptRequestId = requestId;
        _decryptCtxByReqId[requestId] = DecryptCtx({orderId: orderId, exists: true});

        emit OrderPicked(orderId, requestId);
    }

    /// @notice Decryption callback invoked by Zama Oracle with cleartexts
    /// @dev Cleartexts are abi.encode(tokenAddress, amountUint32) in the same order as requested
    function decryptionCallback(
        uint256 requestId,
        bytes memory cleartexts,
        bytes memory decryptionProof
    ) public returns (bool) {
        DecryptCtx memory ctx = _decryptCtxByReqId[requestId];
        require(ctx.exists, "Unknown requestId");

        // Verify decryption oracle signatures
        FHE.checkSignatures(requestId, cleartexts, decryptionProof);

        (address token, uint32 amount) = abi.decode(cleartexts, (address, uint32));

        Order storage o = orders[ctx.orderId];
        if (o.status != OrderStatus.Processing) {
            // Defensive: ignore if status changed unexpectedly
            return false;
        }

        // Compute cost based on fixed price
        uint256 price = pricePerTokenWei[token];
        if (price == 0) {
            _fail(ctx.orderId, "Price not set");
            return true;
        }

        uint256 requiredWei = uint256(amount) * price;
        if (requiredWei == 0) {
            _fail(ctx.orderId, "Invalid amount");
            return true;
        }

        if (_ethBalances[o.user] < requiredWei) {
            _fail(ctx.orderId, "Insufficient balance");
            return true;
        }

        // Deduct user deposited ETH balance
        _ethBalances[o.user] -= requiredWei;

        // Fulfill from contract inventory: transfer tokens to user
        bool ok = IERC20(token).transfer(o.user, uint256(amount));
        if (!ok) {
            // revert deduction on failure
            _ethBalances[o.user] += requiredWei;
            _fail(ctx.orderId, "Token transfer failed");
            return true;
        }

        o.status = OrderStatus.Completed;
        _removeFromPending(ctx.orderId);

        emit OrderCompleted(ctx.orderId, token, uint256(amount), requiredWei, 0);
        // Ether retained in contract equal to requiredWei (owner can withdraw later if desired)
        delete _decryptCtxByReqId[requestId];
        return true;
    }

    // ============ Views ============

    function getOrdersCount() external view returns (uint256) {
        return orders.length;
    }

    function getPendingCount() external view returns (uint256) {
        return pendingOrderIds.length;
    }

    function getPendingIds() external view returns (uint256[] memory) {
        return pendingOrderIds;
    }

    function getEthBalance(address user) external view returns (uint256) {
        return _ethBalances[user];
    }

    function getOrder(uint256 orderId)
        external
        view
        returns (
            address user,
            bytes32 tokenCipher,
            bytes32 amountCipher,
            OrderStatus status,
            uint256 createdAt,
            uint256 decryptRequestId
        )
    {
        Order storage o = orders[orderId];
        user = o.user;
        tokenCipher = FHE.toBytes32(o.tokenEnc);
        amountCipher = FHE.toBytes32(o.amountEnc);
        status = o.status;
        createdAt = o.createdAt;
        decryptRequestId = o.decryptRequestId;
    }

    // ============ Internal helpers ============

    function _removeFromPending(uint256 orderId) internal {
        uint256 idxPlusOne = pendingIndex[orderId];
        if (idxPlusOne == 0) return;
        uint256 idx = idxPlusOne - 1;
        uint256 lastId = pendingOrderIds[pendingOrderIds.length - 1];
        pendingOrderIds[idx] = lastId;
        pendingIndex[lastId] = idx + 1;
        pendingOrderIds.pop();
        pendingIndex[orderId] = 0;
    }

    function _fail(uint256 orderId, string memory reason) internal {
        Order storage o = orders[orderId];
        o.status = OrderStatus.Failed;
        _removeFromPending(orderId);
        emit OrderFailed(orderId, reason);
    }

    // ============ Fallbacks ============
    receive() external payable {}
}

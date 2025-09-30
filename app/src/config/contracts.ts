// SafeAutoBuy contract configuration
// IMPORTANT: Replace CONTRACT_ADDRESS after deploying to Sepolia.
export const CONTRACT_ADDRESS = '0xd389298810a9C3C045FaBAC9D312d2bAc353713b';

// ABI copied from deployments (no JSON imports allowed in frontend)
export const CONTRACT_ABI = [
  { "inputs": [{"internalType":"address","name":"initialOwner","type":"address"}], "stateMutability":"nonpayable", "type":"constructor" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"}
    ], "name": "OrderSubmitted", "type": "event" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "pricePerTokenWei", "type": "uint256"}
    ], "name": "PriceUpdated", "type": "event" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "requestId", "type": "uint256"}
    ], "name": "OrderPicked", "type": "event" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256"},
      {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "costWei", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "refundWei", "type": "uint256"}
    ], "name": "OrderCompleted", "type": "event" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256"},
      {"indexed": false, "internalType": "string", "name": "reason", "type": "string"}
    ], "name": "OrderFailed", "type": "event" },
  { "anonymous": false, "inputs": [
      {"indexed": true, "internalType": "uint256", "name": "orderId", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "amountWei", "type": "uint256"}
    ], "name": "OrderRefunded", "type": "event" },
  { "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "priceWeiPerToken", "type": "uint256"}
    ], "name": "setPrice", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "depositETH", "outputs": [], "stateMutability": "payable", "type": "function" },
  { "inputs": [{"internalType":"uint256","name":"amount","type":"uint256"}], "name": "withdrawETH", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "pickRandomAndRequestDecryption", "outputs": [
      {"internalType":"uint256","name":"orderId","type":"uint256"},
      {"internalType":"uint256","name":"requestId","type":"uint256"}
    ], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [
      {"internalType":"externalEaddress","name":"tokenIn","type":"bytes32"},
      {"internalType":"externalEuint32","name":"amountIn","type":"bytes32"},
      {"internalType":"bytes","name":"inputProof","type":"bytes"}
    ], "name": "submitOrder", "outputs": [ {"internalType":"uint256","name":"orderId","type":"uint256"} ],
    "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [ {"internalType":"uint256","name":"orderId","type":"uint256"} ], "name": "cancelOrder", "outputs": [], "stateMutability": "nonpayable", "type": "function" },
  { "inputs": [], "name": "getOrdersCount", "outputs": [ {"internalType":"uint256","name":"","type":"uint256"} ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getPendingCount", "outputs": [ {"internalType":"uint256","name":"","type":"uint256"} ], "stateMutability": "view", "type": "function" },
  { "inputs": [], "name": "getPendingIds", "outputs": [ {"internalType":"uint256[]","name":"","type":"uint256[]"} ], "stateMutability": "view", "type": "function" },
  { "inputs": [{"internalType":"address","name":"user","type":"address"}], "name": "getEthBalance", "outputs": [ {"internalType":"uint256","name":"","type":"uint256"} ], "stateMutability": "view", "type": "function" },
  { "inputs": [ {"internalType":"uint256","name":"","type":"uint256"} ], "name": "pricePerTokenWei", "outputs": [ {"internalType":"uint256","name":"","type":"uint256"} ], "stateMutability": "view", "type": "function" },
  { "inputs": [ {"internalType":"uint256","name":"orderId","type":"uint256"} ], "name": "getOrder", "outputs": [
      {"internalType":"address","name":"user","type":"address"},
      {"internalType":"bytes32","name":"tokenCipher","type":"bytes32"},
      {"internalType":"bytes32","name":"amountCipher","type":"bytes32"},
      {"internalType":"uint8","name":"status","type":"uint8"},
      {"internalType":"uint256","name":"createdAt","type":"uint256"},
      {"internalType":"uint256","name":"decryptRequestId","type":"uint256"}
    ], "stateMutability": "view", "type": "function" }
] as const;

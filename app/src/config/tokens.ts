// Replace addresses after deployment to Sepolia
export const TOKENS = {
  TEST: { symbol: 'TEST', address: '0x8B4C295aB0845448220b315C4D03e3E268d6E398' },
  TEST2: { symbol: 'TEST2', address: '0xbfe14D768B67ab06330Eb519E759e774507a7C1d' },
} as const;

export const ERC20_ABI = [
  { "inputs": [{"internalType":"address","name":"account","type":"address"}], "name":"balanceOf", "outputs": [{"internalType":"uint256","name":"","type":"uint256"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name":"decimals", "outputs": [{"internalType":"uint8","name":"","type":"uint8"}], "stateMutability":"view", "type":"function" },
  { "inputs": [], "name":"symbol", "outputs": [{"internalType":"string","name":"","type":"string"}], "stateMutability":"view", "type":"function" }
] as const;


export function Instructions() {
  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>How To Use</h2>

      <div style={{ marginBottom: 16 }}>
        <h3>User: Buy Tokens</h3>
        <ol style={{ paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Open the Assets tab and deposit ETH using “Deposit”. This funds your on-contract balance.</li>
          <li>Go to Submit Order, choose a token (TEST or TEST2), enter the amount (uint32), then submit.</li>
          <li>Your order is encrypted (token address + amount) and added to the pending list.</li>
          <li>When the owner processes a random order, your encrypted values are decrypted via Zama oracle and the purchase is executed at the fixed price.</li>
          <li>The required ETH is deducted from your deposited balance, and tokens are transferred to your wallet from contract inventory.</li>
        </ol>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3>Owner: Manage Prices and Process Orders</h3>
        <ol style={{ paddingLeft: 18, lineHeight: 1.6 }}>
          <li>Ensure the SafeAutoBuy contract holds inventory for each token (transfer TEST/TEST2 to the contract address).</li>
          <li>Set fixed prices per token in the Owner Panel (ETH per token).</li>
          <li>Click “Pick Random Order” to request on-chain decryption and process one pending order.</li>
        </ol>
      </div>

      <div style={{ marginBottom: 16 }}>
        <h3>Notes</h3>
        <ul style={{ paddingLeft: 18, lineHeight: 1.6 }}>
          <li>All order fields (token address and amount) are submitted encrypted and decrypted on-chain using Zama FHE oracle.</li>
          <li>Prices are fixed; no AMM is used.</li>
          <li>Submit Order does not send ETH. Deposit ETH first in the Assets tab; purchases deduct from your deposited balance.</li>
          <li>The UI uses viem for reads and ethers for writes, and targets the Sepolia network.</li>
        </ul>
      </div>
    </div>
  );
}


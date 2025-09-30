import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { TOKENS } from '../config/tokens';
import { useZamaInstance } from '../hooks/useZamaInstance';

export function SubmitOrder() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const { instance, isLoading: zamaLoading } = useZamaInstance();

  const [token, setToken] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { data: pendingCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPendingCount',
    query: { refetchInterval: 6000 }
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !instance || !signerPromise) {
      alert('Connect wallet and wait for SDK');
      return;
    }
    if (!token || !amount) {
      alert('Fill all fields');
      return;
    }

    setSubmitting(true);
    setTxHash(null);
    try {
      const amt = parseInt(amount);
      if (!/^0x[0-9a-fA-F]{40}$/.test(token)) throw new Error('Invalid token address');
      if (!Number.isInteger(amt) || amt <= 0) throw new Error('Invalid amount');

      const enc = await instance
        .createEncryptedInput(CONTRACT_ADDRESS, address)
        .addAddress(token)
        .add32(amt)
        .encrypt();

      const signer = await signerPromise;
      if (!signer) throw new Error('Signer not available');

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.submitOrder(enc.handles[0], enc.handles[1], enc.inputProof);
      setTxHash(tx.hash);
      await tx.wait();
      alert('Order submitted');
      setAmount('');
      setToken('');
    } catch (err: any) {
      console.error(err);
      alert(err?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Submit Purchase Order</h2>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
        <label>
          <div>Token</div>
          <select value={token} onChange={(e) => setToken(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }}>
            <option value="">Select token</option>
            <option value={TOKENS.TEST.address}>TEST</option>
            <option value={TOKENS.TEST2.address}>TEST2</option>
          </select>
        </label>
        <label>
          <div>Amount (uint32)</div>
          <input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1000" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        </label>
        <button disabled={submitting || zamaLoading} style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #111827', background: '#111827', color: '#fff' }}>
          {zamaLoading ? 'Initializing...' : submitting ? 'Submitting...' : 'Submit Order'}
        </button>
      </form>
      <div style={{ marginTop: 16, fontSize: 14, color: '#555' }}>
        Pending orders: {typeof pendingCount === 'bigint' ? Number(pendingCount) : pendingCount ?? '-'}
      </div>
      {txHash && (
        <div style={{ marginTop: 8, fontSize: 12 }}>Tx: {txHash}</div>
      )}
    </div>
  );
}

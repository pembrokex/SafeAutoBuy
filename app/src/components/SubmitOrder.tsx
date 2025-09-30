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
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 28, fontWeight: 700, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 32 }}>📝</span>
        Submit Purchase Order
      </h2>

      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 20, maxWidth: 600 }}>
        <label style={{ display: 'block' }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: '#4a5568', fontSize: 14 }}>Token</div>
          <select
            value={token}
            onChange={(e) => setToken(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 15,
              backgroundColor: '#f7fafc',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          >
            <option value="">Select token</option>
            <option value={TOKENS.TEST.address}>TEST Token</option>
            <option value={TOKENS.TEST2.address}>TEST2 Token</option>
          </select>
        </label>

        <label style={{ display: 'block' }}>
          <div style={{ marginBottom: 8, fontWeight: 600, color: '#4a5568', fontSize: 14 }}>Amount (uint32)</div>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 1000"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 15,
              backgroundColor: '#f7fafc',
              transition: 'all 0.2s ease',
              outline: 'none'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
          />
        </label>

        <button
          disabled={submitting || zamaLoading}
          style={{
            padding: '14px 24px',
            borderRadius: 12,
            border: 'none',
            background: submitting || zamaLoading ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 16,
            cursor: submitting || zamaLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: submitting || zamaLoading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)',
            transform: submitting || zamaLoading ? 'none' : 'scale(1)'
          }}
          onMouseEnter={(e) => {
            if (!submitting && !zamaLoading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = submitting || zamaLoading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)';
          }}
        >
          {zamaLoading ? '⏳ Initializing...' : submitting ? '⏳ Submitting...' : '🚀 Submit Order'}
        </button>
      </form>

      <div style={{
        marginTop: 24,
        padding: 16,
        background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%)',
        borderRadius: 12,
        border: '2px solid #e2e8f0'
      }}>
        <div style={{ fontSize: 14, color: '#4a5568', fontWeight: 600 }}>
          📊 Pending orders: <span style={{ color: '#667eea', fontSize: 18, fontWeight: 700 }}>
            {typeof pendingCount === 'bigint' ? Number(pendingCount) : pendingCount ?? '-'}
          </span>
        </div>
      </div>

      {txHash && (
        <div style={{
          marginTop: 16,
          padding: 12,
          background: '#f0fff4',
          borderRadius: 12,
          border: '2px solid #9ae6b4',
          fontSize: 13,
          wordBreak: 'break-all',
          color: '#22543d'
        }}>
          ✅ Transaction: {txHash}
        </div>
      )}
    </div>
  );
}

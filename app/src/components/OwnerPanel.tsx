import { useState } from 'react';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { Contract } from 'ethers';

export function OwnerPanel() {
  const signerPromise = useEthersSigner();
  const [token, setToken] = useState('');
  const [price, setPrice] = useState('');
  const [setting, setSetting] = useState(false);
  const [picking, setPicking] = useState(false);

  const { data: pendingCount } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getPendingCount',
    query: { refetchInterval: 5000 }
  });

  const setFixedPrice = async () => {
    try {
      if (!/^0x[0-9a-fA-F]{40}$/.test(token)) throw new Error('Invalid token');
      const signer = await signerPromise;
      if (!signer) throw new Error('Connect wallet');
      setSetting(true);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.setPrice(token, BigInt(Math.floor(parseFloat(price) * 1e18)));
      await tx.wait();
      alert('Price set');
    } catch (e: any) {
      alert(e?.message || 'Failed');
    } finally {
      setSetting(false);
    }
  };

  const pickRandom = async () => {
    try {
      const signer = await signerPromise;
      if (!signer) throw new Error('Connect wallet');
      setPicking(true);
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const tx = await contract.pickRandomAndRequestDecryption();
      await tx.wait();
      alert('Requested decryption for a random order');
    } catch (e: any) {
      alert(e?.message || 'Failed');
    } finally {
      setPicking(false);
    }
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Owner Panel</h2>
      <div style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
        <div style={{ fontSize: 14, color: '#444' }}>Pending orders: {typeof pendingCount === 'bigint' ? Number(pendingCount) : pendingCount ?? '-'}</div>

        <label>
          <div>Token address</div>
          <input value={token} onChange={(e) => setToken(e.target.value)} placeholder="0x..." style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        </label>
        <label>
          <div>Price (ETH per token)</div>
          <input type="number" min={0} step="0.000000000000000001" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. 0.0001" style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ddd' }} />
        </label>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={setFixedPrice} disabled={setting} style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #111827', background: '#111827', color: '#fff' }}>
            {setting ? 'Setting...' : 'Set Price'}
          </button>
          <button onClick={pickRandom} disabled={picking} style={{ padding: '10px 14px', borderRadius: 6, border: '1px solid #111827', background: '#111827', color: '#fff' }}>
            {picking ? 'Processing...' : 'Pick Random Order'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#666' }}>Ensure the contract holds token inventory before picking orders. Transfer tokens directly to the contract address.</p>
      </div>
    </div>
  );
}


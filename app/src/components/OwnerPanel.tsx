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
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 28, fontWeight: 700, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 32 }}>⚙️</span>
        Owner Panel
      </h2>

      <div style={{ display: 'grid', gap: 20, maxWidth: 600 }}>
        {/* Stats Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%)',
          borderRadius: 16,
          padding: 20,
          border: '2px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 14, color: '#4a5568', fontWeight: 600 }}>
            📊 Pending orders: <span style={{ color: '#667eea', fontSize: 20, fontWeight: 700 }}>
              {typeof pendingCount === 'bigint' ? Number(pendingCount) : pendingCount ?? '-'}
            </span>
          </div>
        </div>

        {/* Set Price Section */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '2px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a202c', marginBottom: 16 }}>
            Set Token Price
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#4a5568', fontSize: 14 }}>Token Address</div>
              <input
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="0x..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  fontSize: 15,
                  backgroundColor: '#f7fafc',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  fontFamily: 'monospace'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </label>

            <label style={{ display: 'block' }}>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#4a5568', fontSize: 14 }}>Price (ETH per token)</div>
              <input
                type="number"
                min={0}
                step="0.000000000000000001"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 0.0001"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  fontSize: 15,
                  backgroundColor: '#f7fafc',
                  outline: 'none',
                  transition: 'all 0.2s ease'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </label>

            <button
              onClick={setFixedPrice}
              disabled={setting}
              style={{
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: setting ? '#cbd5e0' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 16,
                cursor: setting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: setting ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                if (!setting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = setting ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)';
              }}
            >
              {setting ? '⏳ Setting...' : '💎 Set Price'}
            </button>
          </div>
        </div>

        {/* Pick Random Order Section */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '2px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a202c', marginBottom: 12 }}>
            Process Orders
          </div>
          <p style={{ fontSize: 13, color: '#718096', marginBottom: 16, lineHeight: 1.6 }}>
            ⚠️ Ensure the contract holds token inventory before picking orders. Transfer tokens directly to the contract address.
          </p>
          <button
            onClick={pickRandom}
            disabled={picking}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: 12,
              border: 'none',
              background: picking ? '#cbd5e0' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              cursor: picking ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: picking ? 'none' : '0 4px 15px rgba(72, 187, 120, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!picking) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(72, 187, 120, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = picking ? 'none' : '0 4px 15px rgba(72, 187, 120, 0.4)';
            }}
          >
            {picking ? '⏳ Processing...' : '🎲 Pick Random Order'}
          </button>
        </div>
      </div>
    </div>
  );
}


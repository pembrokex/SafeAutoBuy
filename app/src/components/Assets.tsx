import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { Contract } from 'ethers';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { TOKENS, ERC20_ABI } from '../config/tokens';

export function Assets() {
  const { address } = useAccount();
  const signerPromise = useEthersSigner();
  const [depositing, setDepositing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [amount, setAmount] = useState('');

  const { data: ethDeposit } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEthBalance',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 6000 }
  });

  // Token balances for connected wallet
  const { data: balTEST } = useReadContract({
    address: TOKENS.TEST.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8000 }
  });
  const { data: balTEST2 } = useReadContract({
    address: TOKENS.TEST2.address,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 8000 }
  });

  const deposit = async () => {
    try {
      const signer = await signerPromise;
      if (!signer) throw new Error('Connect wallet');
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setDepositing(true);
      const wei = BigInt(Math.floor(parseFloat(amount || '0') * 1e18));
      if (wei <= 0n) throw new Error('Invalid amount');
      const tx = await contract.depositETH({ value: wei });
      await tx.wait();
      setAmount('');
      alert('Deposited');
    } catch (e: any) {
      alert(e?.message || 'Failed');
    } finally {
      setDepositing(false);
    }
  };

  const withdraw = async () => {
    try {
      const signer = await signerPromise;
      if (!signer) throw new Error('Connect wallet');
      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      setWithdrawing(true);
      const wei = BigInt(Math.floor(parseFloat(amount || '0') * 1e18));
      if (wei <= 0n) throw new Error('Invalid amount');
      const tx = await contract.withdrawETH(wei);
      await tx.wait();
      setAmount('');
      alert('Withdrawn');
    } catch (e: any) {
      alert(e?.message || 'Failed');
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 24, fontSize: 28, fontWeight: 700, color: '#1a202c', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 32 }}>💰</span>
        Assets
      </h2>

      <div style={{ display: 'grid', gap: 20 }}>
        {/* Deposited ETH Card */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 16,
          padding: 24,
          color: '#fff',
          boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ fontSize: 14, opacity: 0.9, marginBottom: 8 }}>Deposited ETH</div>
          <div style={{ fontSize: 36, fontWeight: 700 }}>
            {typeof ethDeposit === 'bigint' ? (Number(ethDeposit) / 1e18).toFixed(4) : '0.0000'} ETH
          </div>
        </div>

        {/* Token Balances Card */}
        <div style={{
          background: 'linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%)',
          borderRadius: 16,
          padding: 24,
          border: '2px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a202c', marginBottom: 16 }}>
            Wallet Token Balances
          </div>
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontWeight: 600, color: '#4a5568' }}>TEST</span>
              <span style={{ fontWeight: 700, color: '#667eea', fontSize: 18 }}>
                {typeof balTEST === 'bigint' ? (Number(balTEST) / 1e18).toFixed(4) : '-'}
              </span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              background: '#fff',
              borderRadius: 12,
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontWeight: 600, color: '#4a5568' }}>TEST2</span>
              <span style={{ fontWeight: 700, color: '#764ba2', fontSize: 18 }}>
                {typeof balTEST2 === 'bigint' ? (Number(balTEST2) / 1e18).toFixed(4) : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Deposit/Withdraw Section */}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          padding: 24,
          border: '2px solid #e2e8f0'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#1a202c', marginBottom: 16 }}>
            Manage Funds
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ marginBottom: 8, fontWeight: 600, color: '#4a5568', fontSize: 14 }}>Amount in ETH</div>
              <input
                placeholder="0.0000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                step="0.0001"
                min="0"
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
            </div>
            <button
              onClick={deposit}
              disabled={depositing}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: depositing ? '#cbd5e0' : 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: depositing ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: depositing ? 'none' : '0 4px 12px rgba(72, 187, 120, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!depositing) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(72, 187, 120, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = depositing ? 'none' : '0 4px 12px rgba(72, 187, 120, 0.3)';
              }}
            >
              {depositing ? '⏳ Depositing...' : '💵 Deposit'}
            </button>
            <button
              onClick={withdraw}
              disabled={withdrawing}
              style={{
                padding: '12px 24px',
                borderRadius: 12,
                border: 'none',
                background: withdrawing ? '#cbd5e0' : 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: 15,
                cursor: withdrawing ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: withdrawing ? 'none' : '0 4px 12px rgba(237, 137, 54, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!withdrawing) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(237, 137, 54, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = withdrawing ? 'none' : '0 4px 12px rgba(237, 137, 54, 0.3)';
              }}
            >
              {withdrawing ? '⏳ Withdrawing...' : '💸 Withdraw'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


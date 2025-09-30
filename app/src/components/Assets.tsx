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
    <div style={{ background: '#fff', border: '1px solid #eee', borderRadius: 8, padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>Assets</h2>
      <div style={{ display: 'grid', gap: 12 }}>
        <div>
          <div style={{ fontWeight: 600 }}>Deposited ETH</div>
          <div>{typeof ethDeposit === 'bigint' ? Number(ethDeposit) / 1e18 : 0} ETH</div>
        </div>
        <div>
          <div style={{ fontWeight: 600 }}>Wallet Token Balances</div>
          <div>TEST: {typeof balTEST === 'bigint' ? Number(balTEST) / 1e18 : '-'} </div>
          <div>TEST2: {typeof balTEST2 === 'bigint' ? Number(balTEST2) / 1e18 : '-'} </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            placeholder="Amount in ETH"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            step="0.0001"
            min="0"
            style={{ padding: 8, borderRadius: 6, border: '1px solid #ddd' }}
          />
          <button onClick={deposit} disabled={depositing} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #111827', background: '#111827', color: '#fff' }}>
            {depositing ? 'Depositing...' : 'Deposit'}
          </button>
          <button onClick={withdraw} disabled={withdrawing} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #111827', background: '#111827', color: '#fff' }}>
            {withdrawing ? 'Withdrawing...' : 'Withdraw'}
          </button>
        </div>
      </div>
    </div>
  );
}


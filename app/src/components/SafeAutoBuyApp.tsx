import { useState } from 'react';
import { Header } from './Header';
import { SubmitOrder } from './SubmitOrder';
import { Assets } from './Assets';
import { OwnerPanel } from './OwnerPanel';

export function SafeAutoBuyApp() {
  const [activeTab, setActiveTab] = useState<'order' | 'owner' | 'assets'>('order');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <Header />
      <main style={{ padding: '24px' }}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <button
            onClick={() => setActiveTab('order')}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: activeTab==='order' ? '#111827' : '#fff', color: activeTab==='order' ? '#fff' : '#111' }}
          >
            Submit Order
          </button>
          <button
            onClick={() => setActiveTab('owner')}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: activeTab==='owner' ? '#111827' : '#fff', color: activeTab==='owner' ? '#fff' : '#111' }}
          >
            Owner Panel
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: activeTab==='assets' ? '#111827' : '#fff', color: activeTab==='assets' ? '#fff' : '#111' }}
          >
            Assets
          </button>
        </div>

        {activeTab === 'order' ? <SubmitOrder /> : activeTab === 'owner' ? <OwnerPanel /> : <Assets />}
      </main>
    </div>
  );
}

import { useState } from 'react';
import { Header } from './Header';
import { SubmitOrder } from './SubmitOrder';
import { Assets } from './Assets';
import { OwnerPanel } from './OwnerPanel';
import { Instructions } from './Instructions';

export function SafeAutoBuyApp() {
  const [activeTab, setActiveTab] = useState<'order' | 'owner' | 'assets' | 'instructions'>('assets');

  const tabs = [
        { id: 'assets' as const, label: 'Assets', icon: '💰' },
    { id: 'order' as const, label: 'Submit Order', icon: '📝' },
    { id: 'owner' as const, label: 'Owner Panel', icon: '⚙️' },

    { id: 'instructions' as const, label: 'Instructions', icon: '📖' }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Header />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {/* Tab Navigation */}
        <div style={{
          display: 'flex',
          gap: 8,
          marginBottom: 32,
          background: 'rgba(255, 255, 255, 0.95)',
          padding: 8,
          borderRadius: 16,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: '12px 20px',
                borderRadius: 12,
                border: 'none',
                background: activeTab === tab.id
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#4a5568',
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(102, 126, 234, 0.4)' : 'none',
                transform: activeTab === tab.id ? 'translateY(-2px)' : 'translateY(0)'
              }}
            >
              <span style={{ marginRight: 8 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.98)',
          borderRadius: 24,
          padding: 32,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
          backdropFilter: 'blur(10px)',
          minHeight: 400
        }}>
          {activeTab === 'order' ? <SubmitOrder /> :
           activeTab === 'owner' ? <OwnerPanel /> :
           activeTab === 'assets' ? <Assets /> :
           <Instructions />}
        </div>
      </main>
    </div>
  );
}

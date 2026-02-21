import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { DetailTab } from '../../types';

const TABS: { key: DetailTab; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'metrics', label: 'Metrics' },
  { key: 'technicals', label: 'Technicals' },
  { key: 'activity', label: 'Activity' },
  { key: 'raw', label: 'API/Raw' },
];

export const DetailTabBar: React.FC = () => {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div style={styles.tabBar}>
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => setActiveTab(tab.key)}
          style={{
            ...styles.tab,
            color: activeTab === tab.key ? 'var(--accent)' : 'var(--text-secondary)',
            borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  tabBar: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
    paddingLeft: 12,
  },
  tab: {
    padding: '10px 16px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--transition)',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    whiteSpace: 'nowrap',
  },
};

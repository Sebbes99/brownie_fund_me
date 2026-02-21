import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { X, GitCompare } from 'lucide-react';
import { formatPrice, formatPercent } from '../../utils/indicators';

export const ComparePanel: React.FC = () => {
  const {
    compareMode, compareSubnets, removeCompareSubnet,
    subnets, metricsMap,
  } = useAppStore();

  if (!compareMode) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <GitCompare size={14} />
        <span style={styles.title}>Compare Mode</span>
        <span style={styles.count}>{compareSubnets.length}/5</span>
      </div>

      {compareSubnets.length === 0 ? (
        <div style={styles.empty}>
          Click subnets in the sidebar to add them to comparison (max 5)
        </div>
      ) : (
        <div style={styles.table}>
          <div style={styles.tableHeader}>
            <span>Subnet</span>
            <span>Price</span>
            <span>24h</span>
            <span>7d</span>
            <span>Vol</span>
            <span></span>
          </div>
          {compareSubnets.map(cs => {
            const subnet = subnets.find(s => s.subnetId === cs.subnetId);
            const metrics = metricsMap[cs.subnetId];
            return (
              <div key={cs.subnetId} style={styles.tableRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: cs.color,
                    flexShrink: 0,
                  }} />
                  <span style={{ fontWeight: 600, fontSize: 11 }}>
                    {subnet?.symbol || `SN${cs.subnetId}`}
                  </span>
                </div>
                <span className="mono" style={{ fontSize: 11 }}>
                  {metrics ? formatPrice(metrics.price) : '—'}
                </span>
                <span className="mono" style={{
                  fontSize: 11,
                  color: metrics && metrics.priceChange24h >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {metrics ? formatPercent(metrics.priceChange24h) : '—'}
                </span>
                <span className="mono" style={{
                  fontSize: 11,
                  color: metrics && metrics.returns7d >= 0 ? 'var(--green)' : 'var(--red)',
                }}>
                  {metrics ? formatPercent(metrics.returns7d) : '—'}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {metrics ? `${(metrics.volatility).toFixed(1)}%` : '—'}
                </span>
                <button
                  onClick={() => removeCompareSubnet(cs.subnetId)}
                  style={styles.removeBtn}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--accent)',
    fontSize: 12,
    fontWeight: 600,
  },
  title: {
    flex: 1,
  },
  count: {
    fontSize: 10,
    color: 'var(--text-muted)',
  },
  empty: {
    padding: '12px',
    fontSize: 11,
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  table: {
    padding: '0 12px 8px',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 24px',
    padding: '4px 0',
    fontSize: 9,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid var(--border)',
    gap: 8,
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr 24px',
    padding: '4px 0',
    alignItems: 'center',
    borderBottom: '1px solid var(--border)',
    gap: 8,
  },
  removeBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
};

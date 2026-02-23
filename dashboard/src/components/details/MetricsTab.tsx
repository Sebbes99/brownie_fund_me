import React from 'react';
import { SubnetMetrics } from '../../types';
import { formatNumber, formatPercent } from '../../utils/indicators';

interface MetricsTabProps {
  metrics: SubnetMetrics | null;
}

interface MetricRow {
  label: string;
  value: string;
  bar?: number; // 0-100 percentage for visual bar
  color?: string;
}

export const MetricsTab: React.FC<MetricsTabProps> = ({ metrics }) => {
  if (!metrics) return <div style={{ padding: 24, color: 'var(--text-muted)' }}>No metrics available</div>;

  const emissionMetrics: MetricRow[] = [
    { label: 'Emission Rate', value: metrics.emission.toFixed(4), bar: metrics.emission * 50 },
    { label: 'Total Stake (TAO)', value: formatNumber(metrics.totalStake), bar: Math.min(100, metrics.totalStake / 100000) },
    { label: 'Daily Reward (TAO)', value: formatNumber(metrics.dailyReward), bar: Math.min(100, metrics.dailyReward) },
    { label: 'Rank', value: `#${metrics.rank}`, bar: Math.max(0, 100 - metrics.rank * 0.78) },
  ];

  const networkMetrics: MetricRow[] = [
    { label: 'Validators', value: metrics.validatorCount.toString(), bar: Math.min(100, metrics.validatorCount / 2) },
    { label: 'Miners', value: metrics.minerCount.toString(), bar: Math.min(100, metrics.minerCount / 5) },
    { label: 'Tempo', value: `${metrics.tempo}s`, bar: Math.min(100, metrics.tempo / 3) },
  ];

  const performanceMetrics: MetricRow[] = [
    { label: '24h Return', value: formatPercent(metrics.returns24h), color: metrics.returns24h >= 0 ? 'var(--green)' : 'var(--red)', bar: Math.min(100, Math.abs(metrics.returns24h) * 5) },
    { label: '7d Return', value: formatPercent(metrics.returns7d), color: metrics.returns7d >= 0 ? 'var(--green)' : 'var(--red)', bar: Math.min(100, Math.abs(metrics.returns7d) * 2) },
    { label: '30d Return', value: formatPercent(metrics.returns30d), color: metrics.returns30d >= 0 ? 'var(--green)' : 'var(--red)', bar: Math.min(100, Math.abs(metrics.returns30d)) },
    { label: 'Volatility', value: `${metrics.volatility.toFixed(1)}%`, bar: Math.min(100, metrics.volatility * 2), color: 'var(--yellow)' },
    { label: 'Max Drawdown', value: `-${metrics.drawdown.toFixed(1)}%`, color: 'var(--red)', bar: metrics.drawdown },
    { label: 'Alpha', value: metrics.alpha.toFixed(2), color: metrics.alpha >= 0 ? 'var(--green)' : 'var(--red)', bar: Math.min(100, Math.abs(metrics.alpha)) },
  ];

  return (
    <div style={styles.container}>
      <MetricSection title="Emission & Rewards" rows={emissionMetrics} />
      <MetricSection title="Network" rows={networkMetrics} />
      <MetricSection title="Performance" rows={performanceMetrics} />
    </div>
  );
};

const MetricSection: React.FC<{ title: string; rows: MetricRow[] }> = ({ title, rows }) => (
  <div style={styles.section}>
    <div style={styles.sectionTitle}>{title}</div>
    {rows.map(row => (
      <div key={row.label} style={styles.row}>
        <div style={styles.rowLabel}>{row.label}</div>
        <div style={styles.rowBarWrap}>
          {row.bar !== undefined && (
            <div style={styles.barBg}>
              <div style={{
                ...styles.barFill,
                width: `${Math.min(100, Math.max(2, row.bar))}%`,
                background: row.color || 'var(--accent)',
              }} />
            </div>
          )}
        </div>
        <div className="mono" style={{ ...styles.rowValue, color: row.color || 'var(--text)' }}>
          {row.value}
        </div>
      </div>
    ))}
  </div>
);

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    overflow: 'auto',
    maxHeight: '100%',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '6px 0',
    borderBottom: '1px solid var(--border)',
  },
  rowLabel: {
    width: 110,
    fontSize: 12,
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  rowBarWrap: {
    flex: 1,
  },
  barBg: {
    height: 4,
    background: 'var(--bg-tertiary)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  rowValue: {
    width: 80,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: 600,
    flexShrink: 0,
  },
};

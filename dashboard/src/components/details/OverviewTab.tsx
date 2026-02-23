import React from 'react';
import { SubnetMeta, SubnetMetrics } from '../../types';
import { formatNumber, formatPercent, formatPrice } from '../../utils/indicators';

interface OverviewTabProps {
  subnet: SubnetMeta;
  metrics: SubnetMetrics | null;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ subnet, metrics }) => {
  if (!metrics) return <div style={{ padding: 24, color: 'var(--text-muted)' }}>Loading metrics...</div>;

  const stats: { label: string; value: string; color?: string }[] = [
    { label: 'Price (TAO)', value: formatPrice(metrics.price) },
    { label: '24h Change', value: formatPercent(metrics.priceChange24h), color: metrics.priceChange24h >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: '7d Return', value: formatPercent(metrics.returns7d), color: metrics.returns7d >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: '30d Return', value: formatPercent(metrics.returns30d), color: metrics.returns30d >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Market Cap (TAO)', value: formatNumber(metrics.marketCap) },
    { label: 'Volume 24h (TAO)', value: formatNumber(metrics.volume24h) },
    { label: 'Volatility', value: `${metrics.volatility.toFixed(1)}%` },
    { label: 'Max Drawdown', value: `-${metrics.drawdown.toFixed(1)}%`, color: 'var(--red)' },
    { label: 'Alpha', value: metrics.alpha.toFixed(2), color: metrics.alpha >= 0 ? 'var(--green)' : 'var(--red)' },
    { label: 'Rank', value: `#${metrics.rank}` },
  ];

  const networkStats = [
    { label: 'Emission', value: metrics.emission.toFixed(4) },
    { label: 'Total Stake (TAO)', value: formatNumber(metrics.totalStake) },
    { label: 'Validators', value: metrics.validatorCount.toString() },
    { label: 'Miners', value: metrics.minerCount.toString() },
    { label: 'Daily Reward (TAO)', value: formatNumber(metrics.dailyReward) },
    { label: 'Tempo', value: `${metrics.tempo}s` },
  ];

  return (
    <div style={styles.container}>
      {/* Subnet header */}
      <div style={styles.header}>
        <div>
          <div style={styles.subnetName}>{subnet.name}</div>
          <div style={styles.subnetMeta}>
            SN{subnet.subnetId} · {subnet.symbol}
            <span className={`badge badge-${subnet.status}`} style={{ marginLeft: 8 }}>
              {subnet.status}
            </span>
            {subnet.isNew && <span className="badge badge-new" style={{ marginLeft: 4 }}>NEW</span>}
          </div>
        </div>
        <div style={styles.priceBlock}>
          <div style={styles.bigPrice} className="mono">{formatPrice(metrics.price)}</div>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: metrics.priceChange24h >= 0 ? 'var(--green)' : 'var(--red)',
          }} className="mono">
            {formatPercent(metrics.priceChange24h)}
          </div>
        </div>
      </div>

      {/* Description */}
      <div style={styles.description}>{subnet.description}</div>

      {/* Tags */}
      <div style={styles.tags}>
        {subnet.tags.map(tag => (
          <span key={tag} style={styles.tag}>{tag}</span>
        ))}
      </div>

      {/* Key Metrics Grid */}
      <div style={styles.sectionTitle}>Key Metrics</div>
      <div style={styles.grid}>
        {stats.map(stat => (
          <div key={stat.label} style={styles.statCard}>
            <div style={styles.statLabel}>{stat.label}</div>
            <div className="mono" style={{ ...styles.statValue, color: stat.color || 'var(--text)' }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Network Stats */}
      <div style={styles.sectionTitle}>Network Stats</div>
      <div style={styles.grid}>
        {networkStats.map(stat => (
          <div key={stat.label} style={styles.statCard}>
            <div style={styles.statLabel}>{stat.label}</div>
            <div className="mono" style={styles.statValue}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Recent Changes */}
      <div style={styles.sectionTitle}>What Changed</div>
      <div style={styles.changesList}>
        {metrics.priceChange24h > 5 && (
          <div style={styles.changeItem}>
            <span style={{ ...styles.changeDot, background: 'var(--green)' }} />
            Strong price increase of {formatPercent(metrics.priceChange24h)} in the last 24 hours
          </div>
        )}
        {metrics.priceChange24h < -5 && (
          <div style={styles.changeItem}>
            <span style={{ ...styles.changeDot, background: 'var(--red)' }} />
            Significant price decline of {formatPercent(metrics.priceChange24h)} in the last 24 hours
          </div>
        )}
        {metrics.volatility > 50 && (
          <div style={styles.changeItem}>
            <span style={{ ...styles.changeDot, background: 'var(--yellow)' }} />
            High volatility detected at {metrics.volatility.toFixed(1)}%
          </div>
        )}
        <div style={styles.changeItem}>
          <span style={{ ...styles.changeDot, background: 'var(--accent)' }} />
          Currently ranked #{metrics.rank} by stake with {metrics.validatorCount} active validators
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflow: 'auto',
    maxHeight: '100%',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  subnetName: {
    fontSize: 20,
    fontWeight: 700,
  },
  subnetMeta: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    marginTop: 4,
    display: 'flex',
    alignItems: 'center',
  },
  priceBlock: {
    textAlign: 'right',
  },
  bigPrice: {
    fontSize: 24,
    fontWeight: 700,
  },
  description: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.6,
  },
  tags: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    padding: '2px 8px',
    fontSize: 10,
    borderRadius: 9999,
    background: 'var(--bg-tertiary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingTop: 4,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: 8,
  },
  statCard: {
    padding: '10px 12px',
    background: 'var(--bg-card)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
  },
  statLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 600,
  },
  changesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  changeItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  changeDot: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    flexShrink: 0,
  },
};

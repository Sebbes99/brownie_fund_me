import React from 'react';
import { SubnetMeta, SubnetMetrics, TimeSeriesPoint } from '../../types';

interface RawTabProps {
  subnet: SubnetMeta;
  metrics: SubnetMetrics | null;
  lastPoints: TimeSeriesPoint[];
}

export const RawTab: React.FC<RawTabProps> = ({ subnet, metrics, lastPoints }) => {
  const data = {
    subnetMeta: subnet,
    metrics,
    recentTimeSeries: lastPoints.slice(-5),
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>API / Raw Data</div>
      <div style={styles.subtitle}>
        Normalized data objects as they appear in the internal model.
        This mirrors what an API response would look like.
      </div>
      <pre style={styles.pre} className="mono">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 20px',
    overflow: 'auto',
    maxHeight: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: 'var(--text-muted)',
    marginBottom: 12,
  },
  pre: {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-lg)',
    padding: 16,
    fontSize: 11,
    lineHeight: 1.6,
    overflow: 'auto',
    maxHeight: 500,
    color: 'var(--text-secondary)',
  },
};

import React, { useMemo } from 'react';
import { useAppStore } from '../../stores/appStore';
import { TimeSeriesPoint } from '../../types';
import { calcRSI, calcMACD } from '../../utils/indicators';

interface IndicatorPanelProps {
  data: TimeSeriesPoint[];
}

export const IndicatorPanel: React.FC<IndicatorPanelProps> = ({ data }) => {
  const { indicators } = useAppStore();

  const rsiVisible = indicators.find(i => i.type === 'RSI')?.visible;
  const macdVisible = indicators.find(i => i.type === 'MACD')?.visible;

  const rsiData = useMemo(() => {
    if (!rsiVisible || data.length === 0) return [];
    return calcRSI(data, 14);
  }, [data, rsiVisible]);

  const macdData = useMemo(() => {
    if (!macdVisible || data.length === 0) return [];
    return calcMACD(data);
  }, [data, macdVisible]);

  if (!rsiVisible && !macdVisible) return null;

  const lastRSI = rsiData[rsiData.length - 1];
  const lastMACD = macdData[macdData.length - 1];

  return (
    <div style={styles.container}>
      {rsiVisible && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>RSI (14)</span>
            {lastRSI && (
              <span
                className="mono"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: lastRSI.value > 70 ? 'var(--red)' : lastRSI.value < 30 ? 'var(--green)' : 'var(--text)',
                }}
              >
                {lastRSI.value.toFixed(2)}
              </span>
            )}
          </div>
          <div style={styles.rsiBar}>
            <div style={styles.rsiZone}>
              <div style={{ ...styles.rsiLevel, background: 'rgba(255,23,68,0.2)', left: '70%', width: '30%' }} />
              <div style={{ ...styles.rsiLevel, background: 'rgba(0,200,83,0.2)', left: '0%', width: '30%' }} />
              {lastRSI && (
                <div style={{
                  ...styles.rsiMarker,
                  left: `${Math.min(100, Math.max(0, lastRSI.value))}%`,
                }} />
              )}
            </div>
            <div style={styles.rsiLabels}>
              <span>0</span><span>30</span><span>50</span><span>70</span><span>100</span>
            </div>
          </div>
        </div>
      )}

      {macdVisible && lastMACD && (
        <div style={styles.panel}>
          <div style={styles.panelHeader}>
            <span style={styles.panelTitle}>MACD (12,26,9)</span>
          </div>
          <div style={styles.macdRow}>
            <div style={styles.macdItem}>
              <span style={styles.macdLabel}>MACD</span>
              <span className="mono" style={{
                fontSize: 12,
                color: lastMACD.macd >= 0 ? 'var(--green)' : 'var(--red)',
              }}>
                {lastMACD.macd.toFixed(4)}
              </span>
            </div>
            <div style={styles.macdItem}>
              <span style={styles.macdLabel}>Signal</span>
              <span className="mono" style={{ fontSize: 12 }}>{lastMACD.signal.toFixed(4)}</span>
            </div>
            <div style={styles.macdItem}>
              <span style={styles.macdLabel}>Hist</span>
              <span className="mono" style={{
                fontSize: 12,
                color: lastMACD.histogram >= 0 ? 'var(--green)' : 'var(--red)',
              }}>
                {lastMACD.histogram.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Indicator toggle buttons
export const IndicatorButtons: React.FC = () => {
  const { indicators, toggleIndicator } = useAppStore();

  return (
    <div style={styles.indicatorBtns}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
        Indicators
      </span>
      {indicators.map(ind => (
        <button
          key={ind.type}
          onClick={() => toggleIndicator(ind.type)}
          style={{
            ...styles.indBtn,
            background: ind.visible ? `${ind.color}22` : 'transparent',
            borderColor: ind.visible ? ind.color : 'var(--border)',
            color: ind.visible ? ind.color : 'var(--text-muted)',
          }}
        >
          {ind.type}{ind.type !== 'RSI' && ind.type !== 'MACD' ? `(${ind.period})` : ''}
        </button>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
  },
  panel: {
    padding: '8px 12px',
    borderBottom: '1px solid var(--border)',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  panelTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
  },
  rsiBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  rsiZone: {
    position: 'relative',
    height: 12,
    background: 'var(--bg-tertiary)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  rsiLevel: {
    position: 'absolute',
    top: 0,
    height: '100%',
  },
  rsiMarker: {
    position: 'absolute',
    top: -2,
    width: 4,
    height: 16,
    background: 'var(--accent)',
    borderRadius: 2,
    transform: 'translateX(-50%)',
  },
  rsiLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 9,
    color: 'var(--text-muted)',
  },
  macdRow: {
    display: 'flex',
    gap: 24,
  },
  macdItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  macdLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
  },
  indicatorBtns: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
  },
  indBtn: {
    padding: '3px 10px',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    background: 'none',
  },
};

import React, { useMemo } from 'react';
import { TimeSeriesPoint } from '../../types';
import { calcSMA, calcEMA, calcRSI, calcMACD } from '../../utils/indicators';

interface TechnicalsTabProps {
  data: TimeSeriesPoint[];
}

type Signal = 'buy' | 'sell' | 'neutral';

interface IndicatorSignal {
  name: string;
  value: string;
  signal: Signal;
}

export const TechnicalsTab: React.FC<TechnicalsTabProps> = ({ data }) => {
  const signals = useMemo<IndicatorSignal[]>(() => {
    if (data.length < 30) return [];

    const lastPrice = data[data.length - 1].close;
    const sma20 = calcSMA(data, 20);
    const sma50 = calcSMA(data, 50);
    const ema20 = calcEMA(data, 20);
    const ema50 = calcEMA(data, 50);
    const rsi = calcRSI(data, 14);
    const macd = calcMACD(data);

    const lastSMA20 = sma20[sma20.length - 1]?.value;
    const lastSMA50 = sma50[sma50.length - 1]?.value;
    const lastEMA20 = ema20[ema20.length - 1]?.value;
    const lastEMA50 = ema50[ema50.length - 1]?.value;
    const lastRSI = rsi[rsi.length - 1]?.value;
    const lastMACD = macd[macd.length - 1];

    const result: IndicatorSignal[] = [];

    if (lastSMA20 !== undefined) {
      result.push({
        name: 'SMA (20)',
        value: lastSMA20.toFixed(4),
        signal: lastPrice > lastSMA20 ? 'buy' : 'sell',
      });
    }
    if (lastSMA50 !== undefined) {
      result.push({
        name: 'SMA (50)',
        value: lastSMA50.toFixed(4),
        signal: lastPrice > lastSMA50 ? 'buy' : 'sell',
      });
    }
    if (lastEMA20 !== undefined) {
      result.push({
        name: 'EMA (20)',
        value: lastEMA20.toFixed(4),
        signal: lastPrice > lastEMA20 ? 'buy' : 'sell',
      });
    }
    if (lastEMA50 !== undefined) {
      result.push({
        name: 'EMA (50)',
        value: lastEMA50.toFixed(4),
        signal: lastPrice > lastEMA50 ? 'buy' : 'sell',
      });
    }
    if (lastRSI !== undefined) {
      result.push({
        name: 'RSI (14)',
        value: lastRSI.toFixed(2),
        signal: lastRSI > 70 ? 'sell' : lastRSI < 30 ? 'buy' : 'neutral',
      });
    }
    if (lastMACD) {
      result.push({
        name: 'MACD',
        value: lastMACD.macd.toFixed(4),
        signal: lastMACD.histogram > 0 ? 'buy' : 'sell',
      });
    }

    // Patterns
    if (lastSMA20 !== undefined && lastSMA50 !== undefined) {
      const prevSMA20 = sma20[sma20.length - 2]?.value;
      const prevSMA50 = sma50[sma50.length - 2]?.value;
      if (prevSMA20 !== undefined && prevSMA50 !== undefined) {
        if (prevSMA20 < prevSMA50 && lastSMA20 > lastSMA50) {
          result.push({ name: 'Golden Cross', value: 'SMA 20/50', signal: 'buy' });
        }
        if (prevSMA20 > prevSMA50 && lastSMA20 < lastSMA50) {
          result.push({ name: 'Death Cross', value: 'SMA 20/50', signal: 'sell' });
        }
      }
    }

    return result;
  }, [data]);

  const buyCount = signals.filter(s => s.signal === 'buy').length;
  const sellCount = signals.filter(s => s.signal === 'sell').length;
  const neutralCount = signals.filter(s => s.signal === 'neutral').length;
  const totalSignal: Signal = buyCount > sellCount ? 'buy' : sellCount > buyCount ? 'sell' : 'neutral';

  return (
    <div style={styles.container}>
      {/* Summary */}
      <div style={styles.summary}>
        <div style={styles.summaryTitle}>Technical Summary</div>
        <div style={{
          ...styles.summaryBadge,
          background: totalSignal === 'buy' ? 'rgba(0,200,83,0.15)' : totalSignal === 'sell' ? 'rgba(255,23,68,0.15)' : 'var(--bg-tertiary)',
          color: totalSignal === 'buy' ? 'var(--green)' : totalSignal === 'sell' ? 'var(--red)' : 'var(--text-muted)',
        }}>
          {totalSignal.toUpperCase()}
        </div>
        <div style={styles.summaryBreakdown}>
          <span style={{ color: 'var(--green)' }}>{buyCount} Buy</span>
          <span style={{ color: 'var(--text-muted)' }}>{neutralCount} Neutral</span>
          <span style={{ color: 'var(--red)' }}>{sellCount} Sell</span>
        </div>
      </div>

      {/* Signal gauge */}
      <div style={styles.gaugeWrap}>
        <div style={styles.gauge}>
          <div style={{
            ...styles.gaugeFill,
            width: `${signals.length > 0 ? (buyCount / signals.length) * 100 : 50}%`,
            background: 'var(--green)',
          }} />
          <div style={{
            ...styles.gaugeFill,
            width: `${signals.length > 0 ? (neutralCount / signals.length) * 100 : 0}%`,
            background: 'var(--text-muted)',
          }} />
          <div style={{
            ...styles.gaugeFill,
            width: `${signals.length > 0 ? (sellCount / signals.length) * 100 : 50}%`,
            background: 'var(--red)',
          }} />
        </div>
      </div>

      {/* Indicators table */}
      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span>Indicator</span>
          <span>Value</span>
          <span style={{ textAlign: 'right' }}>Signal</span>
        </div>
        {signals.map(sig => (
          <div key={sig.name} style={styles.tableRow}>
            <span style={{ color: 'var(--text-secondary)' }}>{sig.name}</span>
            <span className="mono">{sig.value}</span>
            <span style={{
              textAlign: 'right',
              fontWeight: 600,
              color: sig.signal === 'buy' ? 'var(--green)' : sig.signal === 'sell' ? 'var(--red)' : 'var(--text-muted)',
            }}>
              {sig.signal.toUpperCase()}
            </span>
          </div>
        ))}
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
  summary: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: 700,
  },
  summaryBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius)',
    fontSize: 12,
    fontWeight: 700,
  },
  summaryBreakdown: {
    display: 'flex',
    gap: 12,
    fontSize: 12,
    marginLeft: 'auto',
  },
  gaugeWrap: {
    paddingTop: 4,
  },
  gauge: {
    height: 6,
    borderRadius: 3,
    display: 'flex',
    overflow: 'hidden',
    background: 'var(--bg-tertiary)',
  },
  gaugeFill: {
    height: '100%',
    transition: 'width 0.3s ease',
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 80px',
    padding: '8px 0',
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    borderBottom: '1px solid var(--border)',
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 80px',
    padding: '8px 0',
    fontSize: 12,
    borderBottom: '1px solid var(--border)',
  },
};

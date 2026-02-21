import { TimeSeriesPoint } from '../types';

export interface IndicatorPoint {
  t: number;
  value: number;
}

export interface MACDPoint {
  t: number;
  macd: number;
  signal: number;
  histogram: number;
}

export function calcSMA(data: TimeSeriesPoint[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (data.length < period) return result;

  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].close;

  result.push({ t: data[period - 1].t, value: sum / period });

  for (let i = period; i < data.length; i++) {
    sum += data[i].close - data[i - period].close;
    result.push({ t: data[i].t, value: sum / period });
  }

  return result;
}

export function calcEMA(data: TimeSeriesPoint[], period: number): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (data.length < period) return result;

  const multiplier = 2 / (period + 1);

  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].close;
  let ema = sum / period;
  result.push({ t: data[period - 1].t, value: ema });

  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    result.push({ t: data[i].t, value: ema });
  }

  return result;
}

export function calcRSI(data: TimeSeriesPoint[], period: number = 14): IndicatorPoint[] {
  const result: IndicatorPoint[] = [];
  if (data.length < period + 1) return result;

  let gainSum = 0;
  let lossSum = 0;

  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) gainSum += change;
    else lossSum += Math.abs(change);
  }

  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;

  const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  result.push({ t: data[period].t, value: rsi });

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rsiVal = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({ t: data[i].t, value: rsiVal });
  }

  return result;
}

export function calcMACD(
  data: TimeSeriesPoint[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACDPoint[] {
  const fastEMA = calcEMA(data, fastPeriod);
  const slowEMA = calcEMA(data, slowPeriod);

  if (fastEMA.length === 0 || slowEMA.length === 0) return [];

  // Align by timestamp
  const slowMap = new Map(slowEMA.map(p => [p.t, p.value]));
  const macdLine: IndicatorPoint[] = [];

  for (const fp of fastEMA) {
    const sv = slowMap.get(fp.t);
    if (sv !== undefined) {
      macdLine.push({ t: fp.t, value: fp.value - sv });
    }
  }

  if (macdLine.length < signalPeriod) return [];

  // Calculate signal line (EMA of MACD)
  const multiplier = 2 / (signalPeriod + 1);
  let signalSum = 0;
  for (let i = 0; i < signalPeriod; i++) signalSum += macdLine[i].value;
  let signal = signalSum / signalPeriod;

  const result: MACDPoint[] = [{
    t: macdLine[signalPeriod - 1].t,
    macd: macdLine[signalPeriod - 1].value,
    signal,
    histogram: macdLine[signalPeriod - 1].value - signal,
  }];

  for (let i = signalPeriod; i < macdLine.length; i++) {
    signal = (macdLine[i].value - signal) * multiplier + signal;
    result.push({
      t: macdLine[i].t,
      macd: macdLine[i].value,
      signal,
      histogram: macdLine[i].value - signal,
    });
  }

  return result;
}

export function formatNumber(n: number, decimals: number = 2): string {
  if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(decimals) + 'B';
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(decimals) + 'M';
  if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(decimals) + 'K';
  return n.toFixed(decimals);
}

export function formatPercent(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

export function formatPrice(n: number): string {
  if (n >= 1000) return n.toFixed(2);
  if (n >= 1) return n.toFixed(4);
  return n.toFixed(6);
}

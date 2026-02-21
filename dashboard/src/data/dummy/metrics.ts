import { SubnetMetrics } from '../../types';
import { dummySubnets } from './subnetRegistry';
import { getDummyTimeSeries } from './timeSeries';

function seededRand(subnetId: number, offset: number = 0): number {
  let seed = (subnetId + 1) * 7919 + offset * 104729;
  seed = (seed * 16807) % 2147483647;
  return (seed - 1) / 2147483646;
}

export function generateMetrics(subnetId: number): SubnetMetrics {
  const r = (offset: number) => seededRand(subnetId, offset);
  const series = getDummyTimeSeries(subnetId, '1M');
  const lastPoint = series[series.length - 1];
  const prevDay = series[Math.max(0, series.length - 7)];
  const prev7d = series[Math.max(0, series.length - 50)];
  const prev30d = series[0];

  const price = lastPoint?.close ?? 1;
  const priceChange24h = prevDay ? ((price - prevDay.close) / prevDay.close) * 100 : 0;
  const returns7d = prev7d ? ((price - prev7d.close) / prev7d.close) * 100 : 0;
  const returns30d = prev30d ? ((price - prev30d.close) / prev30d.close) * 100 : 0;

  const prices = series.map(p => p.close);
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((a, b) => a + (b - mean) ** 2, 0) / prices.length;
  const volatility = Math.sqrt(variance) / mean;

  let maxDrawdown = 0;
  let peak = prices[0];
  for (const p of prices) {
    if (p > peak) peak = p;
    const dd = (peak - p) / peak;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  return {
    subnetId,
    emission: r(1) * 2 + 0.01,
    stake: r(2) * 5000000 + 10000,
    rank: subnetId + 1,
    alpha: r(3) * 100 - 50,
    returns24h: priceChange24h,
    returns7d,
    returns30d,
    volatility: volatility * 100,
    drawdown: maxDrawdown * 100,
    marketCap: price * (r(4) * 10000000 + 100000),
    volume24h: (lastPoint?.volume ?? 0) * (0.8 + r(5) * 0.4),
    price,
    priceChange24h,
    validatorCount: Math.floor(r(6) * 200) + 10,
    minerCount: Math.floor(r(7) * 500) + 50,
    totalStake: r(8) * 10000000 + 50000,
    dailyReward: r(9) * 100 + 1,
    tempo: Math.floor(r(10) * 300) + 60,
  };
}

export function getAllDummyMetrics(): SubnetMetrics[] {
  return dummySubnets.map(s => generateMetrics(s.subnetId));
}

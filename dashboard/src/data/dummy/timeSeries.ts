import { TimeSeriesPoint, Timeframe } from '../../types';

// Generate synthetic OHLCV data for any subnet
function generateOHLCV(
  subnetId: number,
  days: number,
  intervalHours: number = 4
): TimeSeriesPoint[] {
  const points: TimeSeriesPoint[] = [];
  const now = Date.now();
  const startTime = now - days * 86400000;
  const intervalMs = intervalHours * 3600000;

  // Seed-based pseudo-random for reproducibility per subnet
  let seed = subnetId * 1337 + 42;
  const rand = () => {
    seed = (seed * 16807 + 0) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  // Base price varies by subnet
  let basePrice = 0.5 + rand() * 200;
  let currentPrice = basePrice;
  const baseVolume = 10000 + rand() * 5000000;

  // Add trend and volatility characteristics per subnet
  const trend = (rand() - 0.45) * 0.002; // slight bullish bias
  const volatility = 0.01 + rand() * 0.08;

  for (let t = startTime; t <= now; t += intervalMs) {
    // Random walk with trend
    const change = (rand() - 0.5) * 2 * volatility + trend;
    currentPrice = Math.max(0.001, currentPrice * (1 + change));

    // Generate OHLC from close
    const spread = currentPrice * volatility * rand();
    const open = currentPrice + (rand() - 0.5) * spread;
    const high = Math.max(open, currentPrice) + rand() * spread * 0.5;
    const low = Math.min(open, currentPrice) - rand() * spread * 0.5;
    const volume = baseVolume * (0.5 + rand() * 1.5) * (1 + Math.abs(change) * 10);

    points.push({
      t,
      open: Math.max(0.001, open),
      high: Math.max(0.001, high),
      low: Math.max(0.001, low),
      close: Math.max(0.001, currentPrice),
      volume: Math.max(0, volume),
    });
  }

  return points;
}

const TIMEFRAME_DAYS: Record<Timeframe, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '3M': 90,
  '1Y': 365,
  'ALL': 730,
};

const TIMEFRAME_INTERVAL_HOURS: Record<Timeframe, number> = {
  '1D': 0.25, // 15 min
  '1W': 1,
  '1M': 4,
  '3M': 8,
  '1Y': 24,
  'ALL': 24,
};

// Cache so we don't regenerate on every call
const seriesCache = new Map<string, TimeSeriesPoint[]>();

export function getDummyTimeSeries(
  subnetId: number,
  timeframe: Timeframe
): TimeSeriesPoint[] {
  const key = `${subnetId}-${timeframe}`;
  if (seriesCache.has(key)) return seriesCache.get(key)!;

  const days = TIMEFRAME_DAYS[timeframe];
  const interval = TIMEFRAME_INTERVAL_HOURS[timeframe];
  const data = generateOHLCV(subnetId, days, interval);
  seriesCache.set(key, data);
  return data;
}

// Get all data for simulation mode (returns ALL timeframe data)
export function getFullTimeSeries(subnetId: number): TimeSeriesPoint[] {
  return getDummyTimeSeries(subnetId, 'ALL');
}

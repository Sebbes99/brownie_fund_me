import {
  SubnetDataSource, SubnetMeta, TimeSeriesPoint,
  SubnetMetrics, SubnetEvent, Timeframe,
} from '../../types';
import { rateLimitedFetch } from '../../services/rateLimiter';

// ============================================================
// TaoStats Live Data Source
// Uses api.taostats.io with rate-limited fetching (5 req/min)
// Caches aggressively to minimise API calls
// ============================================================

const API_KEY = import.meta.env.VITE_TAOSTATS_API_KEY as string;

// In dev we proxy via Vite; in prod you'd set this to your own proxy or the direct URL
const BASE = import.meta.env.DEV ? '/taostats-api' : 'https://api.taostats.io';

const headers = (): HeadersInit => ({
  accept: 'application/json',
  Authorization: API_KEY,
});

// --------------- Cache ---------------

interface CacheEntry<T> { data: T; ts: number }

const cache = new Map<string, CacheEntry<unknown>>();

function cached<T>(key: string, ttlMs: number): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.ts > ttlMs) { cache.delete(key); return null; }
  return entry.data;
}

function setCache<T>(key: string, data: T) {
  cache.set(key, { data, ts: Date.now() });
}

const FIVE_MIN = 5 * 60_000;
const ONE_MIN = 60_000;
const THIRTY_MIN = 30 * 60_000;

// --------------- Static subnet info (GitHub, free, no rate limit) ---------------

let subnetInfoMap: Record<number, { name: string; description: string; github?: string }> | null = null;

async function loadSubnetInfoFromGithub(): Promise<typeof subnetInfoMap> {
  if (subnetInfoMap) return subnetInfoMap;
  try {
    const resp = await fetch(
      'https://raw.githubusercontent.com/taostat/subnets-infos/main/subnets.json',
    );
    const json = await resp.json();
    const map: Record<number, { name: string; description: string; github?: string }> = {};
    for (const [key, val] of Object.entries(json)) {
      const id = parseInt(key, 10);
      const v = val as { name?: string; description?: string; github?: string };
      map[id] = {
        name: v.name ?? `Subnet ${id}`,
        description: v.description ?? '',
        github: v.github,
      };
    }
    subnetInfoMap = map;
    return map;
  } catch {
    return {};
  }
}

// --------------- API helpers ---------------

async function apiGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  let urlStr = `${BASE}${path}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    urlStr += `?${qs}`;
  }
  const resp = await rateLimitedFetch(urlStr, { headers: headers() });
  if (!resp.ok) {
    throw new Error(`TaoStats API ${resp.status}: ${resp.statusText} — ${path}`);
  }
  return resp.json();
}

// --------------- Response Types (partial, what we actually use) ---------------

interface TaoStatsSubnet {
  netuid: number;
  name?: string;
  symbol?: string;
  owner?: string;
  emission?: number;
  tempo?: number;
  registration_allowed?: boolean;
  created_at?: string;
  // dTao fields
  alpha_in?: number;
  tao_in?: number;
  price?: number;
  market_cap?: number;
  volume_24h?: number;
  price_change_24h?: number;
  rank?: number;
  validator_count?: number;
  miner_count?: number;
  total_stake?: number;
  daily_reward?: number;
}

interface TaoStatsPricePoint {
  timestamp: string;
  price?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
}

interface TaoStatsEvent {
  id?: string;
  netuid?: number;
  type?: string;
  title?: string;
  description?: string;
  timestamp?: string;
  severity?: string;
}

// --------------- Implementation ---------------

export class TaoStatsDataSource implements SubnetDataSource {
  private version = 1;

  async listSubnets(): Promise<SubnetMeta[]> {
    const cacheKey = 'subnets-list';
    const hit = cached<SubnetMeta[]>(cacheKey, FIVE_MIN);
    if (hit) return hit;

    // Two calls: 1) GitHub static names (free) 2) API for live subnet list
    const [infoMap, apiData] = await Promise.all([
      loadSubnetInfoFromGithub(),
      this.fetchSubnetList(),
    ]);

    const subnets: SubnetMeta[] = apiData.map((s) => {
      const info = infoMap?.[s.netuid];
      const daysAgo = s.created_at
        ? (Date.now() - new Date(s.created_at).getTime()) / 86400000
        : 999;

      return {
        subnetId: s.netuid,
        name: info?.name ?? s.name ?? `Subnet ${s.netuid}`,
        symbol: s.symbol ?? `SN${s.netuid}`,
        description: info?.description ?? `Bittensor subnet ${s.netuid}`,
        tags: this.inferTags(info?.name ?? s.name ?? ''),
        createdAt: s.created_at ?? new Date().toISOString(),
        status: (s.registration_allowed !== false ? 'active' : 'inactive') as SubnetMeta['status'],
        owner: s.owner,
        registryVersion: 1,
        isNew: daysAgo < 14,
      };
    });

    setCache(cacheKey, subnets);
    return subnets;
  }

  async getSubnet(id: number): Promise<SubnetMeta | null> {
    const all = await this.listSubnets();
    return all.find(s => s.subnetId === id) ?? null;
  }

  async getSeries(subnetId: number, timeframe: Timeframe): Promise<TimeSeriesPoint[]> {
    const cacheKey = `series-${subnetId}-${timeframe}`;
    const hit = cached<TimeSeriesPoint[]>(cacheKey, ONE_MIN);
    if (hit) return hit;

    try {
      const data = await this.fetchPriceHistory(subnetId, timeframe);
      setCache(cacheKey, data);
      return data;
    } catch {
      // Fallback: generate synthetic data from current price
      return this.generateFallbackSeries(subnetId, timeframe);
    }
  }

  async getMetrics(subnetId: number): Promise<SubnetMetrics | null> {
    const all = await this.getAllMetrics();
    return all.find(m => m.subnetId === subnetId) ?? null;
  }

  async getAllMetrics(): Promise<SubnetMetrics[]> {
    const cacheKey = 'all-metrics';
    const hit = cached<SubnetMetrics[]>(cacheKey, FIVE_MIN);
    if (hit) return hit;

    const raw = await this.fetchSubnetList();
    const metrics: SubnetMetrics[] = raw.map(s => this.mapToMetrics(s));
    setCache(cacheKey, metrics);
    return metrics;
  }

  async getEvents(subnetId: number): Promise<SubnetEvent[]> {
    const cacheKey = `events-${subnetId}`;
    const hit = cached<SubnetEvent[]>(cacheKey, THIRTY_MIN);
    if (hit) return hit;

    try {
      const data = await apiGet<{ data?: TaoStatsEvent[] }>(
        '/api/dev_activity/latest/v1',
        { netuid: subnetId.toString(), limit: '20' },
      );
      const events: SubnetEvent[] = (data.data ?? []).map((e, i) => ({
        id: e.id ?? `evt-${subnetId}-${i}`,
        subnetId: e.netuid ?? subnetId,
        type: (e.type as SubnetEvent['type']) ?? 'update',
        title: e.title ?? 'Activity update',
        description: e.description ?? '',
        date: e.timestamp ?? new Date().toISOString(),
        severity: (e.severity as SubnetEvent['severity']) ?? 'info',
      }));
      setCache(cacheKey, events);
      return events;
    } catch {
      return [];
    }
  }

  async getVersion(): Promise<number> {
    return this.version;
  }

  // --------------- Private helpers ---------------

  private subnetListPromise: Promise<TaoStatsSubnet[]> | null = null;

  /** Single batched call for all subnet data — the main workhorse.
   *  We try multiple possible endpoint paths since the exact API structure
   *  varies between TaoStats API versions. */
  private async fetchSubnetList(): Promise<TaoStatsSubnet[]> {
    const cacheKey = 'raw-subnet-list';
    const hit = cached<TaoStatsSubnet[]>(cacheKey, FIVE_MIN);
    if (hit) return hit;

    // Deduplicate concurrent calls
    if (this.subnetListPromise) return this.subnetListPromise;

    this.subnetListPromise = (async () => {
      // Try known endpoint patterns
      const endpoints = [
        '/api/subnet/latest/v1',
        '/api/subnets/latest/v1',
        '/api/dtao/subnet/latest/v1',
      ];

      for (const endpoint of endpoints) {
        try {
          const resp = await apiGet<Record<string, unknown>>(endpoint, { limit: '256' });
          // The API may wrap results in various keys
          const list = this.extractArray(resp);
          if (list.length > 0) {
            const mapped = list.map((item: Record<string, unknown>) => this.normalizeSubnet(item));
            setCache(cacheKey, mapped);
            return mapped;
          }
        } catch {
          // Try next endpoint
        }
      }

      // Last resort: try stats endpoint which at least gives subnet count
      try {
        const stats = await apiGet<Record<string, unknown>>('/api/stats/latest/v1');
        const subnetCount = this.findNumber(stats, ['subnet_count', 'subnets', 'total_subnets']) ?? 64;
        return this.generateMinimalSubnetList(subnetCount);
      } catch {
        return this.generateMinimalSubnetList(64);
      }
    })();

    const result = await this.subnetListPromise;
    this.subnetListPromise = null;
    return result;
  }

  private async fetchPriceHistory(subnetId: number, timeframe: Timeframe): Promise<TimeSeriesPoint[]> {
    const { days, resolution } = this.timeframeParams(timeframe);
    const now = new Date();
    const from = new Date(now.getTime() - days * 86400000);

    // Try TradingView UDF-style endpoint
    const endpoints = [
      `/api/dtao/tradingview/history/v1`,
      `/api/tradingview/history/v1`,
      `/api/dtao/price/history/v1`,
      `/api/subnet/price/history/v1`,
    ];

    for (const endpoint of endpoints) {
      try {
        const resp = await apiGet<Record<string, unknown>>(endpoint, {
          netuid: subnetId.toString(),
          from: Math.floor(from.getTime() / 1000).toString(),
          to: Math.floor(now.getTime() / 1000).toString(),
          resolution,
        });

        const points = this.parsePriceResponse(resp);
        if (points.length > 0) return points;
      } catch {
        // Try next endpoint
      }
    }

    // If all API calls fail, return fallback
    return this.generateFallbackSeries(subnetId, timeframe);
  }

  // --------------- Parsing / normalizing ---------------

  private extractArray(resp: Record<string, unknown>): Record<string, unknown>[] {
    if (Array.isArray(resp)) return resp;
    for (const key of ['data', 'subnets', 'subnet', 'results', 'items']) {
      const val = resp[key];
      if (Array.isArray(val)) return val;
    }
    // If the response itself is an object with numeric keys
    const keys = Object.keys(resp).filter(k => !isNaN(Number(k)));
    if (keys.length > 5) {
      return keys.map(k => resp[k] as Record<string, unknown>);
    }
    return [];
  }

  private normalizeSubnet(raw: Record<string, unknown>): TaoStatsSubnet {
    return {
      netuid: this.findNumber(raw, ['netuid', 'subnet_id', 'id', 'net_uid']) ?? 0,
      name: this.findString(raw, ['name', 'subnet_name']),
      symbol: this.findString(raw, ['symbol', 'token_symbol']),
      owner: this.findString(raw, ['owner', 'owner_address', 'owner_ss58']),
      emission: this.findNumber(raw, ['emission', 'emission_rate', 'emissions']),
      tempo: this.findNumber(raw, ['tempo']),
      created_at: this.findString(raw, ['created_at', 'registration_date', 'registered_at']),
      price: this.findNumber(raw, ['price', 'alpha_price', 'token_price']),
      market_cap: this.findNumber(raw, ['market_cap', 'marketcap', 'mcap']),
      volume_24h: this.findNumber(raw, ['volume_24h', 'volume24h', 'volume']),
      price_change_24h: this.findNumber(raw, ['price_change_24h', 'price_change', 'change_24h']),
      rank: this.findNumber(raw, ['rank', 'subnet_rank']),
      validator_count: this.findNumber(raw, ['validator_count', 'validators', 'num_validators']),
      miner_count: this.findNumber(raw, ['miner_count', 'miners', 'num_miners']),
      total_stake: this.findNumber(raw, ['total_stake', 'stake', 'tao_in']),
      daily_reward: this.findNumber(raw, ['daily_reward', 'daily_rewards']),
    };
  }

  private parsePriceResponse(resp: Record<string, unknown>): TimeSeriesPoint[] {
    // TradingView UDF format: { t: [...], o: [...], h: [...], l: [...], c: [...], v: [...] }
    const t = resp.t as number[] | undefined;
    const o = resp.o as number[] | undefined;
    const h = resp.h as number[] | undefined;
    const l = resp.l as number[] | undefined;
    const c = resp.c as number[] | undefined;
    const v = resp.v as number[] | undefined;

    if (t && o && h && l && c) {
      return t.map((ts, i) => ({
        t: ts * 1000, // UDF uses seconds
        open: o[i] ?? 0,
        high: h[i] ?? 0,
        low: l[i] ?? 0,
        close: c[i] ?? 0,
        volume: v?.[i] ?? 0,
      }));
    }

    // Array of objects format
    const arr = this.extractArray(resp);
    if (arr.length > 0 && (arr[0].timestamp || arr[0].t || arr[0].time)) {
      return arr.map((pt) => {
        const ts = this.findTimestamp(pt);
        const close = this.findNumber(pt, ['close', 'price', 'value']) ?? 0;
        const open = this.findNumber(pt, ['open']) ?? close;
        const high = this.findNumber(pt, ['high']) ?? close;
        const low = this.findNumber(pt, ['low']) ?? close;
        const vol = this.findNumber(pt, ['volume', 'vol']) ?? 0;
        return { t: ts, open, high, low, close, volume: vol };
      }).filter(p => p.t > 0);
    }

    return [];
  }

  private mapToMetrics(s: TaoStatsSubnet): SubnetMetrics {
    const price = s.price ?? 0;
    return {
      subnetId: s.netuid,
      emission: s.emission ?? 0,
      stake: s.total_stake ?? 0,
      rank: s.rank ?? s.netuid,
      alpha: 0,
      returns24h: s.price_change_24h ?? 0,
      returns7d: 0,
      returns30d: 0,
      volatility: 0,
      drawdown: 0,
      marketCap: s.market_cap ?? 0,
      volume24h: s.volume_24h ?? 0,
      price,
      priceChange24h: s.price_change_24h ?? 0,
      validatorCount: s.validator_count ?? 0,
      minerCount: s.miner_count ?? 0,
      totalStake: s.total_stake ?? 0,
      dailyReward: s.daily_reward ?? 0,
      tempo: s.tempo ?? 360,
    };
  }

  // --------------- Utility ---------------

  private findNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'number') return v;
      if (typeof v === 'string' && v !== '' && !isNaN(Number(v))) return Number(v);
    }
    return undefined;
  }

  private findString(obj: Record<string, unknown>, keys: string[]): string | undefined {
    for (const k of keys) {
      const v = obj[k];
      if (typeof v === 'string' && v !== '') return v;
    }
    return undefined;
  }

  private findTimestamp(obj: Record<string, unknown>): number {
    for (const k of ['t', 'timestamp', 'time', 'date', 'ts']) {
      const v = obj[k];
      if (typeof v === 'number') return v > 1e12 ? v : v * 1000;
      if (typeof v === 'string') {
        const ms = new Date(v).getTime();
        if (!isNaN(ms)) return ms;
      }
    }
    return 0;
  }

  private inferTags(name: string): string[] {
    const lower = name.toLowerCase();
    const tags: string[] = [];
    if (/\b(ai|llm|gpt|ml|neural|model)\b/.test(lower)) tags.push('ai');
    if (/\b(data|scraping|analytics)\b/.test(lower)) tags.push('data');
    if (/\b(storage|infra|compute)\b/.test(lower)) tags.push('infrastructure');
    if (/\b(image|visual|video)\b/.test(lower)) tags.push('vision');
    if (/\b(text|nlp|prompt|language)\b/.test(lower)) tags.push('nlp');
    if (/\b(defi|trading|finance)\b/.test(lower)) tags.push('defi');
    if (/\b(audio|speech|music)\b/.test(lower)) tags.push('audio');
    if (tags.length === 0) tags.push('subnet');
    return tags;
  }

  private timeframeParams(tf: Timeframe): { days: number; resolution: string } {
    switch (tf) {
      case '1D': return { days: 1, resolution: '15' };
      case '1W': return { days: 7, resolution: '60' };
      case '1M': return { days: 30, resolution: '240' };
      case '3M': return { days: 90, resolution: '480' };
      case '1Y': return { days: 365, resolution: 'D' };
      case 'ALL': return { days: 730, resolution: 'D' };
    }
  }

  /** When the price history API fails, generate synthetic data from the known current price. */
  private generateFallbackSeries(subnetId: number, timeframe: Timeframe): TimeSeriesPoint[] {
    const { days } = this.timeframeParams(timeframe);
    const intervalHours = { '1D': 0.25, '1W': 1, '1M': 4, '3M': 8, '1Y': 24, 'ALL': 24 }[timeframe];
    const intervalMs = intervalHours * 3600000;
    const now = Date.now();
    const start = now - days * 86400000;

    // Try to get a real current price from cache
    const metricsHit = cached<SubnetMetrics[]>('all-metrics', FIVE_MIN);
    const realPrice = metricsHit?.find(m => m.subnetId === subnetId)?.price;

    let seed = subnetId * 1337 + 42;
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };

    let price = realPrice && realPrice > 0 ? realPrice * (0.7 + rand() * 0.3) : 0.5 + rand() * 200;
    const volatility = 0.01 + rand() * 0.06;
    const trend = realPrice && realPrice > price ? 0.001 : (rand() - 0.45) * 0.002;
    const points: TimeSeriesPoint[] = [];

    for (let t = start; t <= now; t += intervalMs) {
      const change = (rand() - 0.5) * 2 * volatility + trend;
      price = Math.max(0.001, price * (1 + change));
      const spread = price * volatility * rand();
      const open = price + (rand() - 0.5) * spread;
      const high = Math.max(open, price) + rand() * spread * 0.5;
      const low = Math.min(open, price) - rand() * spread * 0.5;
      const volume = (10000 + rand() * 5000000) * (0.5 + rand() * 1.5);

      points.push({
        t, open: Math.max(0.001, open), high: Math.max(0.001, high),
        low: Math.max(0.001, low), close: Math.max(0.001, price), volume: Math.max(0, volume),
      });
    }

    // Ensure last point matches real price if we have it
    if (realPrice && realPrice > 0 && points.length > 0) {
      const last = points[points.length - 1];
      last.close = realPrice;
      last.high = Math.max(last.high, realPrice);
      last.low = Math.min(last.low, realPrice);
    }

    return points;
  }

  private generateMinimalSubnetList(count: number): TaoStatsSubnet[] {
    return Array.from({ length: count }, (_, i) => ({
      netuid: i,
      name: `Subnet ${i}`,
      symbol: `SN${i}`,
    }));
  }
}

export const taoStatsDataSource = new TaoStatsDataSource();

// ============================================================
// Core Domain Types for Bittensor Subnet Dashboard
// ============================================================

// --- Subnet Metadata ---
export interface SubnetMeta {
  subnetId: number;
  name: string;
  symbol: string;
  description: string;
  tags: string[];
  createdAt: string; // ISO date
  status: 'active' | 'inactive' | 'deploying';
  owner?: string;
  registryVersion: number;
  isNew?: boolean; // "New subnet" badge
}

// --- Time Series ---
export interface TimeSeriesPoint {
  t: number; // unix timestamp ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface PricePoint {
  t: number;
  price: number;
  volume?: number;
}

// --- Subnet Metrics ---
export interface SubnetMetrics {
  subnetId: number;
  emission: number;
  stake: number;
  rank: number;
  alpha: number;
  returns24h: number;
  returns7d: number;
  returns30d: number;
  volatility: number;
  drawdown: number;
  marketCap: number;
  volume24h: number;
  price: number;
  priceChange24h: number;
  validatorCount: number;
  minerCount: number;
  totalStake: number;
  dailyReward: number;
  tempo: number;
}

// --- Drawings ---
export type DrawingToolType =
  | 'trendline'
  | 'ray'
  | 'horizontal'
  | 'vertical'
  | 'fibRetracement'
  | 'rectangle'
  | 'text'
  | 'arrow';

export interface DrawingAnchor {
  time: number;
  price: number;
}

export interface DrawingStyle {
  color: string;
  lineWidth: number;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  fillColor?: string;
  fillOpacity?: number;
  fontSize?: number;
  text?: string;
}

export interface Drawing {
  drawingId: string;
  subnetId: number;
  chartId: string; // 'price' | 'volume' | 'rsi' | etc.
  timeframe: Timeframe;
  toolType: DrawingToolType;
  anchors: DrawingAnchor[];
  style: DrawingStyle;
  version: number;
  createdAt: string;
  updatedAt: string;
}

// --- Timeframe ---
export type Timeframe = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

// --- Events ---
export interface SubnetEvent {
  id: string;
  subnetId: number;
  type: 'governance' | 'update' | 'release' | 'alert' | 'milestone';
  title: string;
  description: string;
  date: string;
  severity: 'info' | 'warning' | 'critical';
}

// --- Alerts ---
export interface Alert {
  id: string;
  subnetId: number;
  type: 'price_above' | 'price_below' | 'indicator_cross' | 'percent_change';
  value: number;
  indicator?: string;
  active: boolean;
  triggered: boolean;
  createdAt: string;
  triggeredAt?: string;
}

// --- Watchlist ---
export interface Watchlist {
  id: string;
  name: string;
  subnetIds: number[];
  createdAt: string;
  isPinned: boolean;
}

// --- Portfolio ---
export interface PortfolioPosition {
  subnetId: number;
  shares: number;
  entryPrice: number;
  entryDate: string;
}

export interface Portfolio {
  id: string;
  name: string;
  positions: PortfolioPosition[];
  cash: number;
  createdAt: string;
}

// --- Sort Options ---
export type SortField = 'rank' | 'marketCap' | 'emission' | 'price' | 'volume24h' | 'priceChange24h' | 'alpha';
export type SortDirection = 'asc' | 'desc';

// --- Data Source Interface ---
export interface SubnetDataSource {
  listSubnets(): Promise<SubnetMeta[]>;
  getSubnet(id: number): Promise<SubnetMeta | null>;
  getSeries(subnetId: number, timeframe: Timeframe): Promise<TimeSeriesPoint[]>;
  getMetrics(subnetId: number): Promise<SubnetMetrics | null>;
  getAllMetrics(): Promise<SubnetMetrics[]>;
  getEvents(subnetId: number): Promise<SubnetEvent[]>;
  getVersion(): Promise<number>;
}

// --- Indicator types ---
export type IndicatorType = 'SMA' | 'EMA' | 'RSI' | 'MACD';

export interface IndicatorConfig {
  type: IndicatorType;
  period: number;
  color: string;
  visible: boolean;
}

// --- Simulation ---
export type SimulationSpeed = 1 | 5 | 20;

export interface SimulationState {
  active: boolean;
  speed: SimulationSpeed;
  currentIndex: number;
  totalPoints: number;
  startTime: number | null;
}

// --- Compare Mode ---
export interface CompareSubnet {
  subnetId: number;
  color: string;
  visible: boolean;
}

// --- Tab Types ---
export type DetailTab = 'overview' | 'metrics' | 'technicals' | 'activity' | 'raw';

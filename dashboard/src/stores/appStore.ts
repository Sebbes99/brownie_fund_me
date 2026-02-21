import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SubnetMeta, SubnetMetrics, Timeframe, SortField, SortDirection,
  DetailTab, IndicatorConfig, SimulationSpeed, Alert, Watchlist,
  CompareSubnet, Drawing, DrawingToolType,
} from '../types';
import { v4 as uuid } from 'uuid';

// ============================================================
// Main Application Store (Zustand)
// ============================================================

interface AppState {
  // --- Subnet Data ---
  subnets: SubnetMeta[];
  metricsMap: Record<number, SubnetMetrics>;
  selectedSubnetId: number | null;
  setSubnets: (subnets: SubnetMeta[]) => void;
  setMetricsMap: (metrics: Record<number, SubnetMetrics>) => void;
  selectSubnet: (id: number) => void;

  // --- Sidebar ---
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  sidebarCollapsed: boolean;
  setSearchQuery: (q: string) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (dir: SortDirection) => void;
  toggleSidebar: () => void;

  // --- Chart ---
  timeframe: Timeframe;
  setTimeframe: (tf: Timeframe) => void;
  indicators: IndicatorConfig[];
  toggleIndicator: (type: IndicatorConfig['type']) => void;
  activeDrawingTool: DrawingToolType | null;
  setActiveDrawingTool: (tool: DrawingToolType | null) => void;

  // --- Detail Tabs ---
  activeTab: DetailTab;
  setActiveTab: (tab: DetailTab) => void;

  // --- Simulation ---
  simulationActive: boolean;
  simulationSpeed: SimulationSpeed;
  simulationIndex: number;
  simulationTotal: number;
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
  setSimulationIndex: (index: number) => void;
  setSimulationTotal: (total: number) => void;

  // --- Compare Mode ---
  compareMode: boolean;
  compareSubnets: CompareSubnet[];
  toggleCompareMode: () => void;
  addCompareSubnet: (subnetId: number) => void;
  removeCompareSubnet: (subnetId: number) => void;

  // --- Watchlists ---
  watchlists: Watchlist[];
  activeWatchlistId: string | null;
  createWatchlist: (name: string) => void;
  addToWatchlist: (watchlistId: string, subnetId: number) => void;
  removeFromWatchlist: (watchlistId: string, subnetId: number) => void;
  setActiveWatchlist: (id: string | null) => void;
  deleteWatchlist: (id: string) => void;
  togglePinWatchlist: (id: string) => void;

  // --- Alerts ---
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'triggered'>) => void;
  removeAlert: (id: string) => void;
  triggerAlert: (id: string) => void;

  // --- Drawings (in-memory mirror for current chart) ---
  currentDrawings: Drawing[];
  setCurrentDrawings: (drawings: Drawing[]) => void;
  addDrawing: (drawing: Drawing) => void;
  removeDrawing: (drawingId: string) => void;

  // --- Theme ---
  darkMode: boolean;
  toggleTheme: () => void;
}

const COMPARE_COLORS = ['#2962ff', '#ff6d00', '#00c853', '#d500f9', '#ffd600'];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // --- Subnet Data ---
      subnets: [],
      metricsMap: {},
      selectedSubnetId: null,
      setSubnets: (subnets) => set({ subnets }),
      setMetricsMap: (metrics) => {
        const map: Record<number, SubnetMetrics> = {};
        for (const m of Object.values(metrics)) map[m.subnetId] = m;
        set({ metricsMap: map });
      },
      selectSubnet: (id) => set({ selectedSubnetId: id }),

      // --- Sidebar ---
      searchQuery: '',
      sortField: 'rank',
      sortDirection: 'asc',
      sidebarCollapsed: false,
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSortField: (field) => set({ sortField: field }),
      setSortDirection: (dir) => set({ sortDirection: dir }),
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      // --- Chart ---
      timeframe: '1M',
      setTimeframe: (tf) => set({ timeframe: tf }),
      indicators: [
        { type: 'SMA', period: 20, color: '#2962ff', visible: true },
        { type: 'EMA', period: 50, color: '#ff6d00', visible: false },
        { type: 'RSI', period: 14, color: '#ab47bc', visible: false },
        { type: 'MACD', period: 12, color: '#26a69a', visible: false },
      ],
      toggleIndicator: (type) => set(s => ({
        indicators: s.indicators.map(ind =>
          ind.type === type ? { ...ind, visible: !ind.visible } : ind
        ),
      })),
      activeDrawingTool: null,
      setActiveDrawingTool: (tool) => set({ activeDrawingTool: tool }),

      // --- Detail Tabs ---
      activeTab: 'overview',
      setActiveTab: (tab) => set({ activeTab: tab }),

      // --- Simulation ---
      simulationActive: false,
      simulationSpeed: 1,
      simulationIndex: 0,
      simulationTotal: 0,
      toggleSimulation: () => set(s => ({ simulationActive: !s.simulationActive })),
      setSimulationSpeed: (speed) => set({ simulationSpeed: speed }),
      setSimulationIndex: (index) => set({ simulationIndex: index }),
      setSimulationTotal: (total) => set({ simulationTotal: total }),

      // --- Compare Mode ---
      compareMode: false,
      compareSubnets: [],
      toggleCompareMode: () => set(s => ({
        compareMode: !s.compareMode,
        compareSubnets: s.compareMode ? [] : s.compareSubnets,
      })),
      addCompareSubnet: (subnetId) => set(s => {
        if (s.compareSubnets.length >= 5) return s;
        if (s.compareSubnets.find(c => c.subnetId === subnetId)) return s;
        return {
          compareSubnets: [
            ...s.compareSubnets,
            {
              subnetId,
              color: COMPARE_COLORS[s.compareSubnets.length % COMPARE_COLORS.length],
              visible: true,
            },
          ],
        };
      }),
      removeCompareSubnet: (subnetId) => set(s => ({
        compareSubnets: s.compareSubnets.filter(c => c.subnetId !== subnetId),
      })),

      // --- Watchlists ---
      watchlists: [],
      activeWatchlistId: null,
      createWatchlist: (name) => set(s => ({
        watchlists: [...s.watchlists, {
          id: uuid(),
          name,
          subnetIds: [],
          createdAt: new Date().toISOString(),
          isPinned: false,
        }],
      })),
      addToWatchlist: (watchlistId, subnetId) => set(s => ({
        watchlists: s.watchlists.map(w =>
          w.id === watchlistId && !w.subnetIds.includes(subnetId)
            ? { ...w, subnetIds: [...w.subnetIds, subnetId] }
            : w
        ),
      })),
      removeFromWatchlist: (watchlistId, subnetId) => set(s => ({
        watchlists: s.watchlists.map(w =>
          w.id === watchlistId
            ? { ...w, subnetIds: w.subnetIds.filter(id => id !== subnetId) }
            : w
        ),
      })),
      setActiveWatchlist: (id) => set({ activeWatchlistId: id }),
      deleteWatchlist: (id) => set(s => ({
        watchlists: s.watchlists.filter(w => w.id !== id),
        activeWatchlistId: s.activeWatchlistId === id ? null : s.activeWatchlistId,
      })),
      togglePinWatchlist: (id) => set(s => ({
        watchlists: s.watchlists.map(w =>
          w.id === id ? { ...w, isPinned: !w.isPinned } : w
        ),
      })),

      // --- Alerts ---
      alerts: [],
      addAlert: (alert) => set(s => ({
        alerts: [...s.alerts, {
          ...alert,
          id: uuid(),
          createdAt: new Date().toISOString(),
          triggered: false,
        }],
      })),
      removeAlert: (id) => set(s => ({
        alerts: s.alerts.filter(a => a.id !== id),
      })),
      triggerAlert: (id) => set(s => ({
        alerts: s.alerts.map(a =>
          a.id === id ? { ...a, triggered: true, triggeredAt: new Date().toISOString() } : a
        ),
      })),

      // --- Drawings ---
      currentDrawings: [],
      setCurrentDrawings: (drawings) => set({ currentDrawings: drawings }),
      addDrawing: (drawing) => set(s => ({
        currentDrawings: [...s.currentDrawings, drawing],
      })),
      removeDrawing: (drawingId) => set(s => ({
        currentDrawings: s.currentDrawings.filter(d => d.drawingId !== drawingId),
      })),

      // --- Theme ---
      darkMode: true,
      toggleTheme: () => set(s => ({ darkMode: !s.darkMode })),
    }),
    {
      name: 'bittensor-dashboard',
      partialize: (state) => ({
        watchlists: state.watchlists,
        alerts: state.alerts,
        darkMode: state.darkMode,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
        indicators: state.indicators,
        activeWatchlistId: state.activeWatchlistId,
      }),
    }
  )
);

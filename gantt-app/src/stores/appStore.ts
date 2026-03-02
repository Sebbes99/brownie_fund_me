import { create } from 'zustand';
import type {
  Tender,
  FilterState,
  ZoomLevel,
  GroupBy,
  UpdateBatch,
  ChatMessageType,
  AIBriefing,
} from '@/types';
import { DEFAULT_FILTERS } from '@/types';

interface AppState {
  // Tenders
  tenders: Tender[];
  setTenders: (tenders: Tender[]) => void;
  selectedTender: Tender | null;
  setSelectedTender: (tender: Tender | null) => void;

  // Gantt viewport
  zoom: ZoomLevel;
  setZoom: (zoom: ZoomLevel) => void;
  viewportStart: Date;
  viewportEnd: Date;
  setViewport: (start: Date, end: Date) => void;
  groupBy: GroupBy;
  setGroupBy: (groupBy: GroupBy) => void;

  // Filters
  filters: FilterState;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;

  // Updates
  pendingBatch: UpdateBatch | null;
  setPendingBatch: (batch: UpdateBatch | null) => void;
  pendingCount: number;
  setPendingCount: (count: number) => void;

  // AI
  briefing: AIBriefing | null;
  setBriefing: (briefing: AIBriefing | null) => void;
  chatMessages: ChatMessageType[];
  addChatMessage: (msg: ChatMessageType) => void;
  clearChat: () => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  filterPanelOpen: boolean;
  setFilterPanelOpen: (open: boolean) => void;
  updateModalOpen: boolean;
  setUpdateModalOpen: (open: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const now = new Date();
const defaultStart = new Date(now.getTime() - 30 * 86400000);
const defaultEnd = new Date(now.getTime() + 60 * 86400000);

export const useAppStore = create<AppState>((set) => ({
  // Tenders
  tenders: [],
  setTenders: (tenders) => set({ tenders }),
  selectedTender: null,
  setSelectedTender: (selectedTender) => set({ selectedTender }),

  // Gantt viewport
  zoom: 'week',
  setZoom: (zoom) => set({ zoom }),
  viewportStart: defaultStart,
  viewportEnd: defaultEnd,
  setViewport: (viewportStart, viewportEnd) =>
    set({ viewportStart, viewportEnd }),
  groupBy: 'none',
  setGroupBy: (groupBy) =>
    set((state) => ({
      groupBy,
      filters: { ...state.filters, groupBy },
    })),

  // Filters
  filters: DEFAULT_FILTERS,
  setFilters: (partial) =>
    set((state) => ({
      filters: { ...state.filters, ...partial },
    })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),

  // Updates
  pendingBatch: null,
  setPendingBatch: (pendingBatch) => set({ pendingBatch }),
  pendingCount: 0,
  setPendingCount: (pendingCount) => set({ pendingCount }),

  // AI
  briefing: null,
  setBriefing: (briefing) => set({ briefing }),
  chatMessages: [],
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  clearChat: () => set({ chatMessages: [] }),
  chatOpen: false,
  setChatOpen: (chatOpen) => set({ chatOpen }),

  // UI
  sidebarOpen: true,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  filterPanelOpen: false,
  setFilterPanelOpen: (filterPanelOpen) => set({ filterPanelOpen }),
  updateModalOpen: false,
  setUpdateModalOpen: (updateModalOpen) => set({ updateModalOpen }),
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
}));

// ====== Tender Types ======

export type TenderCategory =
  | 'byggledning'
  | 'projektledning'
  | 'besiktning'
  | 'projektering'
  | 'kalkyl'
  | 'underhåll'
  | 'byggprojektledning'
  | 'kontrollansvarig'
  | 'teknisk_förvaltning'
  | 'fastighetsutveckling'
  | 'mark_exploatering'
  | 'entreprenadjuridik'
  | 'geoteknik'
  | 'byggkontroll'
  | 'rivning_sanering'
  | 'bim_samordning';

export type TenderStatus = 'ny' | 'uppdaterad' | 'stänger_snart' | 'stängd';

export type TenderSource = 'mercell' | 'visma_anbud' | 'ted_eu' | 'manual';

export interface Tender {
  id: string;
  externalId: string;
  title: string;
  description: string;
  category: TenderCategory;
  region: string;
  buyer: string;
  value: number | null;
  currency: string;
  publishedAt: string; // ISO date
  deadlineAt: string; // ISO date
  source: TenderSource;
  sourceUrl: string | null;
  status: TenderStatus;
  matchScore: number | null;
  matchReason: string | null;
  aiSummary: string | null;
  rawData: string | null;
  createdAt: string;
  updatedAt: string;
}

// ====== Gantt Types ======

export type ZoomLevel = 'day' | 'week' | 'month';

export type GroupBy = 'category' | 'region' | 'source' | 'none';

export interface GanttBar {
  tender: Tender;
  x: number;
  width: number;
  y: number;
  height: number;
  color: string;
  isPulsing: boolean; // deadline < 5 days
}

export interface GanttViewport {
  startDate: Date;
  endDate: Date;
  zoom: ZoomLevel;
  scrollX: number;
  scrollY: number;
}

// ====== Filter Types ======

export interface FilterState {
  categories: TenderCategory[];
  regions: string[];
  published: 'all' | 'today' | '7d' | '30d' | 'custom';
  publishedCustomStart?: string;
  publishedCustomEnd?: string;
  deadline: 'all' | '7d' | '14d' | '30d';
  matchScoreMin: number;
  sources: TenderSource[];
  statuses: TenderStatus[];
  searchQuery: string;
  groupBy: GroupBy;
}

export const DEFAULT_FILTERS: FilterState = {
  categories: [],
  regions: [],
  published: 'all',
  deadline: 'all',
  matchScoreMin: 0,
  sources: [],
  statuses: [],
  searchQuery: '',
  groupBy: 'none',
};

// ====== Update Types ======

export interface UpdateBatch {
  id: string;
  fetchedAt: string;
  newCount: number;
  updatedCount: number;
  closedCount: number;
  status: 'pending' | 'applied' | 'deferred';
  briefingText: string | null;
  appliedAt: string | null;
  entries: UpdateEntry[];
}

export interface UpdateEntry {
  id: string;
  batchId: string;
  tenderId: string;
  changeType: 'new' | 'updated' | 'closed';
  diff: string | null;
  tender?: Tender;
}

export type UpdateAction = 'apply' | 'view_diff' | 'defer';

// ====== AI Types ======

export interface AIBriefing {
  text: string;
  generatedAt: string;
  highlights: AIHighlight[];
}

export interface AIHighlight {
  tenderId: string;
  title: string;
  reason: string;
  matchScore: number;
  daysUntilDeadline: number;
}

export interface AISummary {
  core: string;
  risks: string;
  nextStep: string;
}

export interface ChatMessageType {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

// ====== Auth Types ======

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  profileConfig: ProfileConfig;
}

export interface ProfileConfig {
  keywords: string[];
  regions: string[];
  categories: TenderCategory[];
  minValue?: number;
  maxValue?: number;
}

// ====== Export Types ======

export type ExportFormat = 'png' | 'pdf' | 'excel';

// ====== Region Constants ======

export const SWEDISH_REGIONS = [
  'Stockholm',
  'Göteborg',
  'Malmö',
  'Uppsala',
  'Västerås',
  'Örebro',
  'Linköping',
  'Helsingborg',
  'Jönköping',
  'Norrköping',
  'Lund',
  'Umeå',
  'Gävle',
  'Sundsvall',
  'Karlstad',
  'Växjö',
  'Halmstad',
  'Luleå',
  'Kalmar',
  'Kristianstad',
  'Hela Sverige',
] as const;

export const CATEGORY_LABELS: Record<TenderCategory, string> = {
  byggledning: 'Byggledning',
  projektledning: 'Projektledning',
  besiktning: 'Besiktning',
  projektering: 'Projektering',
  kalkyl: 'Kalkyl',
  underhåll: 'Underhåll',
  byggprojektledning: 'Byggprojektledning',
  kontrollansvarig: 'Kontrollansvarig (KA)',
  teknisk_förvaltning: 'Teknisk förvaltning',
  fastighetsutveckling: 'Fastighetsutveckling',
  mark_exploatering: 'Mark och exploatering',
  entreprenadjuridik: 'Entreprenadjuridik',
  geoteknik: 'Geoteknik',
  byggkontroll: 'Byggkontroll',
  rivning_sanering: 'Rivning och sanering',
  bim_samordning: 'BIM-samordning',
};

export const STATUS_LABELS: Record<TenderStatus, string> = {
  ny: 'Ny',
  uppdaterad: 'Uppdaterad',
  stänger_snart: 'Stänger snart',
  stängd: 'Stängd',
};

export const SOURCE_LABELS: Record<TenderSource, string> = {
  mercell: 'Mercell',
  visma_anbud: 'Visma Anbud',
  ted_eu: 'TED EU',
  manual: 'Manuell',
};

'use client';

import { useAppStore } from '@/stores/appStore';
import {
  Filter,
  X,
  RotateCcw,
} from 'lucide-react';
import type { TenderCategory, TenderStatus, TenderSource } from '@/types';
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  SOURCE_LABELS,
  SWEDISH_REGIONS,
} from '@/types';

export function FilterPanel() {
  const { filters, setFilters, resetFilters, filterPanelOpen, setFilterPanelOpen } =
    useAppStore();

  if (!filterPanelOpen) return null;

  const toggleCategory = (cat: TenderCategory) => {
    const current = filters.categories;
    setFilters({
      categories: current.includes(cat)
        ? current.filter((c) => c !== cat)
        : [...current, cat],
    });
  };

  const toggleRegion = (region: string) => {
    const current = filters.regions;
    setFilters({
      regions: current.includes(region)
        ? current.filter((r) => r !== region)
        : [...current, region],
    });
  };

  const toggleStatus = (status: TenderStatus) => {
    const current = filters.statuses;
    setFilters({
      statuses: current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status],
    });
  };

  const toggleSource = (source: TenderSource) => {
    const current = filters.sources;
    setFilters({
      sources: current.includes(source)
        ? current.filter((s) => s !== source)
        : [...current, source],
    });
  };

  const activeFilterCount =
    filters.categories.length +
    filters.regions.length +
    filters.statuses.length +
    filters.sources.length +
    (filters.matchScoreMin > 0 ? 1 : 0) +
    (filters.deadline !== 'all' ? 1 : 0) +
    (filters.published !== 'all' ? 1 : 0);

  return (
    <div className="absolute right-0 top-0 z-30 w-80 h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-xl overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-brand-600" />
          <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
            Filter
            {activeFilterCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={resetFilters}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Återställ filter"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={() => setFilterPanelOpen(false)}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Search */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sök
          </label>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={(e) => setFilters({ searchQuery: e.target.value })}
            placeholder="Sök titel, beskrivning, beställare..."
            className="w-full px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
          />
        </div>

        {/* Match Score */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Min Match Score: {filters.matchScoreMin}%
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={filters.matchScoreMin}
            onChange={(e) => setFilters({ matchScoreMin: parseInt(e.target.value, 10) })}
            className="w-full accent-brand-600"
          />
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Published */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Publicerad
          </label>
          <div className="flex flex-wrap gap-1">
            {(['all', 'today', '7d', '30d'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilters({ published: opt })}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  filters.published === opt
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                }`}
              >
                {opt === 'all' ? 'Alla' : opt === 'today' ? 'Idag' : opt === '7d' ? '7 dagar' : '30 dagar'}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Deadline inom
          </label>
          <div className="flex flex-wrap gap-1">
            {(['all', '7d', '14d', '30d'] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setFilters({ deadline: opt })}
                className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                  filters.deadline === opt
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                }`}
              >
                {opt === 'all' ? 'Alla' : opt === '7d' ? '7 dagar' : opt === '14d' ? '14 dagar' : '30 dagar'}
              </button>
            ))}
          </div>
        </div>

        {/* Kategori */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Kategori
          </label>
          <div className="flex flex-wrap gap-1">
            {(Object.entries(CATEGORY_LABELS) as [TenderCategory, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  onClick={() => toggleCategory(value)}
                  className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors ${
                    filters.categories.includes(value)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-brand-300'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Region */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Region
          </label>
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {SWEDISH_REGIONS.map((region) => (
              <button
                key={region}
                onClick={() => toggleRegion(region)}
                className={`px-2 py-0.5 text-[11px] rounded-full border transition-colors ${
                  filters.regions.includes(region)
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-brand-300'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <div className="flex flex-wrap gap-1">
            {(Object.entries(STATUS_LABELS) as [TenderStatus, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  onClick={() => toggleStatus(value)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    filters.statuses.includes(value)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Källa */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Källa / API
          </label>
          <div className="flex flex-wrap gap-1">
            {(Object.entries(SOURCE_LABELS) as [TenderSource, string][]).map(
              ([value, label]) => (
                <button
                  key={value}
                  onClick={() => toggleSource(value)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                    filters.sources.includes(value)
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-brand-300'
                  }`}
                >
                  {label}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

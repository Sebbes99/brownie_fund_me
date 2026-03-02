'use client';

import { useAppStore } from '@/stores/appStore';
import { addDays, addMonths, subDays, subMonths } from 'date-fns';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Layers,
} from 'lucide-react';
import type { ZoomLevel, GroupBy } from '@/types';

const ZOOM_LEVELS: { value: ZoomLevel; label: string }[] = [
  { value: 'day', label: 'Dag' },
  { value: 'week', label: 'Vecka' },
  { value: 'month', label: 'Månad' },
];

const GROUP_OPTIONS: { value: GroupBy; label: string }[] = [
  { value: 'none', label: 'Ingen gruppering' },
  { value: 'category', label: 'Kategori' },
  { value: 'region', label: 'Region' },
  { value: 'source', label: 'Källa' },
];

export function GanttControls() {
  const {
    zoom,
    setZoom,
    viewportStart,
    viewportEnd,
    setViewport,
    groupBy,
    setGroupBy,
  } = useAppStore();

  const handleZoomIn = () => {
    const zoomOrder: ZoomLevel[] = ['month', 'week', 'day'];
    const currentIndex = zoomOrder.indexOf(zoom);
    if (currentIndex < zoomOrder.length - 1) {
      setZoom(zoomOrder[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const zoomOrder: ZoomLevel[] = ['month', 'week', 'day'];
    const currentIndex = zoomOrder.indexOf(zoom);
    if (currentIndex > 0) {
      setZoom(zoomOrder[currentIndex - 1]);
    }
  };

  const handleScrollLeft = () => {
    if (zoom === 'day') {
      setViewport(subDays(viewportStart, 7), subDays(viewportEnd, 7));
    } else if (zoom === 'week') {
      setViewport(subDays(viewportStart, 14), subDays(viewportEnd, 14));
    } else {
      setViewport(subMonths(viewportStart, 1), subMonths(viewportEnd, 1));
    }
  };

  const handleScrollRight = () => {
    if (zoom === 'day') {
      setViewport(addDays(viewportStart, 7), addDays(viewportEnd, 7));
    } else if (zoom === 'week') {
      setViewport(addDays(viewportStart, 14), addDays(viewportEnd, 14));
    } else {
      setViewport(addMonths(viewportStart, 1), addMonths(viewportEnd, 1));
    }
  };

  const handleToday = () => {
    const now = new Date();
    setViewport(subDays(now, 30), addDays(now, 60));
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        {/* Navigation */}
        <button
          onClick={handleScrollLeft}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          title="Föregående period"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={handleToday}
          className="px-3 py-1 text-xs font-medium rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-1"
          title="Gå till idag"
        >
          <CalendarDays size={14} />
          Idag
        </button>
        <button
          onClick={handleScrollRight}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          title="Nästa period"
        >
          <ChevronRight size={18} />
        </button>

        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* Zoom */}
        <button
          onClick={handleZoomOut}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          title="Zooma ut"
        >
          <ZoomOut size={18} />
        </button>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md">
          {ZOOM_LEVELS.map((level) => (
            <button
              key={level.value}
              onClick={() => setZoom(level.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                zoom === level.value
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {level.label}
            </button>
          ))}
        </div>
        <button
          onClick={handleZoomIn}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          title="Zooma in"
        >
          <ZoomIn size={18} />
        </button>
      </div>

      {/* Group by */}
      <div className="flex items-center gap-2">
        <Layers size={14} className="text-gray-500" />
        <select
          value={groupBy}
          onChange={(e) => setGroupBy(e.target.value as GroupBy)}
          className="text-xs bg-transparent border border-gray-200 dark:border-gray-700 rounded-md px-2 py-1 text-gray-700 dark:text-gray-300 focus:ring-1 focus:ring-brand-500"
        >
          {GROUP_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

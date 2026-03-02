'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { Header } from '@/components/layout/Header';
import { GanttChart } from '@/components/gantt/GanttChart';
import { GanttControls } from '@/components/gantt/GanttControls';
import { FilterPanel } from '@/components/filters/FilterPanel';
import { BriefingPanel } from '@/components/ai/BriefingPanel';
import { ChatPanel } from '@/components/ai/ChatPanel';
import { TenderDetail } from '@/components/ai/TenderDetail';
import { UpdateModal } from '@/components/updates/UpdateModal';
import type { Tender, FilterState } from '@/types';

function applyFilters(tenders: Tender[], filters: FilterState): Tender[] {
  return tenders.filter((t) => {
    if (filters.categories.length > 0 && !filters.categories.includes(t.category as typeof filters.categories[number])) {
      return false;
    }
    if (filters.regions.length > 0 && !filters.regions.includes(t.region)) {
      return false;
    }
    if (filters.statuses.length > 0 && !filters.statuses.includes(t.status as typeof filters.statuses[number])) {
      return false;
    }
    if (filters.sources.length > 0 && !filters.sources.includes(t.source as typeof filters.sources[number])) {
      return false;
    }
    if (filters.matchScoreMin > 0 && (t.matchScore || 0) < filters.matchScoreMin) {
      return false;
    }
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (
        !t.title.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q) &&
        !t.buyer.toLowerCase().includes(q) &&
        !t.region.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    if (filters.deadline !== 'all') {
      const days = parseInt(filters.deadline.replace('d', ''), 10);
      const deadlineLimit = new Date(Date.now() + days * 86400000);
      const deadlineDate = new Date(t.deadlineAt);
      if (deadlineDate > deadlineLimit || deadlineDate < new Date()) return false;
    }
    if (filters.published !== 'all' && filters.published !== 'custom') {
      const pubDays: Record<string, number> = { today: 1, '7d': 7, '30d': 30 };
      const days = pubDays[filters.published];
      if (days) {
        const pubLimit = new Date(Date.now() - days * 86400000);
        if (new Date(t.publishedAt) < pubLimit) return false;
      }
    }
    return true;
  });
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const {
    setTenders,
    filters,
    setPendingCount,
    setPendingBatch,
    setUpdateModalOpen,
    isLoading,
    setIsLoading,
  } = useAppStore();

  // Store a reference to all tenders (unfiltered) and the filtered set
  const allTenders = useAppStore((s) => s.tenders);
  const filteredTenders = useMemo(
    () => applyFilters(allTenders, filters),
    [allTenders, filters]
  );

  // Override the store's tenders with filtered ones for child components
  // We do this via a separate mechanism to keep the original list intact
  const storeSetTenders = useAppStore((s) => s.setTenders);

  const loadTenders = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tenders');
      const data = await res.json();
      storeSetTenders(data.tenders || []);
    } catch (err) {
      console.error('Failed to load tenders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [storeSetTenders, setIsLoading]);

  const checkUpdates = useCallback(async () => {
    try {
      const res = await fetch('/api/updates');
      const data = await res.json();
      if (data.batch) {
        setPendingBatch(data.batch);
        setPendingCount(data.pendingCount);
      }
    } catch {
      // Silent
    }
  }, [setPendingBatch, setPendingCount]);

  useEffect(() => {
    if (status === 'authenticated') {
      loadTenders();
      checkUpdates();
    }
  }, [status, loadTenders, checkUpdates]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="animate-pulse text-brand-600 font-semibold">Laddar...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/login');
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <Header />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* AI Briefing */}
        <div className="px-4 pt-3">
          <BriefingPanel />
        </div>

        {/* Gantt Controls */}
        <GanttControls />

        {/* Main Gantt area */}
        <div className="flex-1 px-4 pb-4 overflow-hidden relative">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-sm text-gray-500">Laddar anbud...</p>
              </div>
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center py-12">
                <p className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Inga anbud matchar dina filter
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Prova att ändra filter eller sök efter något annat
                </p>
              </div>
            </div>
          ) : (
            <GanttChartWithFilteredData tenders={filteredTenders} />
          )}

          {/* Filter Panel overlay */}
          <FilterPanel />
        </div>
      </div>

      {/* Overlays */}
      <TenderDetail />
      <UpdateModal />
      <ChatPanel />
    </div>
  );
}

// Wrapper that injects filtered tenders into the store for the chart
function GanttChartWithFilteredData({ tenders }: { tenders: Tender[] }) {
  const setTenders = useAppStore((s) => s.setTenders);
  const currentTenders = useAppStore((s) => s.tenders);

  // Only update if filtered count differs (avoid infinite loop)
  useEffect(() => {
    if (tenders.length !== currentTenders.length || tenders[0]?.id !== currentTenders[0]?.id) {
      // We don't override — the GanttChart reads from store directly
      // The filtering is done at the dashboard level
    }
  }, [tenders, currentTenders]);

  // Temporarily override the store for rendering
  useEffect(() => {
    setTenders(tenders);
  }, [tenders, setTenders]);

  return <GanttChart />;
}

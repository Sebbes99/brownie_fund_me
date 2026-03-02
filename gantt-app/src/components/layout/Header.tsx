'use client';

import { useAppStore } from '@/stores/appStore';
import {
  Filter,
  Bell,
  Download,
  LogOut,
  BarChart3,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

export function Header() {
  const {
    tenders,
    pendingCount,
    setUpdateModalOpen,
    filterPanelOpen,
    setFilterPanelOpen,
  } = useAppStore();
  const [exportOpen, setExportOpen] = useState(false);

  const handleExport = async (format: 'csv' | 'json') => {
    const res = await fetch(`/api/export?format=${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anbud-export.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  return (
    <header className="h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 flex items-center justify-between flex-shrink-0">
      {/* Left */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <BarChart3 size={22} className="text-brand-600" />
          <h1 className="font-bold text-lg text-gray-900 dark:text-gray-100">
            Gantt<span className="text-brand-600">Anbud</span>
          </h1>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
          {tenders.length} aktiva anbud
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Update notification */}
        <button
          onClick={() => setUpdateModalOpen(true)}
          className="relative p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          title="Väntande uppdateringar"
        >
          <Bell size={18} />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </button>

        {/* Filter toggle */}
        <button
          onClick={() => setFilterPanelOpen(!filterPanelOpen)}
          className={`p-2 rounded-md transition-colors ${
            filterPanelOpen
              ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600'
              : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
          title="Visa filter"
        >
          <Filter size={18} />
        </button>

        {/* Export */}
        <div className="relative">
          <button
            onClick={() => setExportOpen(!exportOpen)}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
            title="Exportera"
          >
            <Download size={18} />
          </button>
          {exportOpen && (
            <div className="absolute right-0 top-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 z-50 w-36">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Excel / CSV
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                JSON
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut()}
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
          title="Logga ut"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

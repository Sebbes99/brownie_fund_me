'use client';

import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { X, RefreshCw, Eye, Clock, Check, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export function UpdateModal() {
  const {
    pendingBatch,
    setPendingBatch,
    updateModalOpen,
    setUpdateModalOpen,
    setPendingCount,
  } = useAppStore();
  const [showDiff, setShowDiff] = useState(false);
  const [processing, setProcessing] = useState(false);

  if (!updateModalOpen || !pendingBatch) return null;

  const handleApply = async () => {
    setProcessing(true);
    try {
      await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: pendingBatch.id,
          action: 'apply',
        }),
      });
      setPendingBatch(null);
      setPendingCount(0);
      setUpdateModalOpen(false);
      // Reload tenders
      window.location.reload();
    } finally {
      setProcessing(false);
    }
  };

  const handleDefer = async () => {
    try {
      await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: pendingBatch.id,
          action: 'defer',
        }),
      });
      setUpdateModalOpen(false);
    } catch {
      // Silent fail
    }
  };

  const newEntries = pendingBatch.entries.filter((e) => e.changeType === 'new');
  const updatedEntries = pendingBatch.entries.filter((e) => e.changeType === 'updated');
  const closedEntries = pendingBatch.entries.filter((e) => e.changeType === 'closed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-[520px] max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-brand-600" />
            <h2 className="font-bold text-gray-900 dark:text-gray-100">Ny uppdatering</h2>
          </div>
          <button
            onClick={() => setUpdateModalOpen(false)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Summary */}
        <div className="px-5 py-4 space-y-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            Det finns <strong>{pendingBatch.newCount}</strong> nya anbudsförfrågningar
            och <strong>{pendingBatch.updatedCount}</strong> uppdateringar sedan senaste
            hämtningen. <strong>{pendingBatch.closedCount}</strong> anbud har stängts.
          </p>

          {/* Stats badges */}
          <div className="flex gap-3">
            {pendingBatch.newCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <Check size={14} className="text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  {pendingBatch.newCount} nya
                </span>
              </div>
            )}
            {pendingBatch.updatedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <RefreshCw size={14} className="text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {pendingBatch.updatedCount} uppdaterade
                </span>
              </div>
            )}
            {pendingBatch.closedCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <AlertCircle size={14} className="text-gray-500" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {pendingBatch.closedCount} stängda
                </span>
              </div>
            )}
          </div>

          {/* AI Briefing */}
          {pendingBatch.briefingText && (
            <div className="bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-3 text-sm text-gray-800 dark:text-gray-200">
              {pendingBatch.briefingText}
            </div>
          )}

          {/* Diff view */}
          {showDiff && (
            <div className="space-y-3">
              {newEntries.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1">
                    Nya anbud
                  </h4>
                  {newEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="px-3 py-2 bg-green-50 dark:bg-green-900/10 border-l-2 border-green-500 rounded-r text-sm mb-1"
                    >
                      {entry.tender?.title || entry.tenderId}
                    </div>
                  ))}
                </div>
              )}
              {updatedEntries.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">
                    Uppdaterade
                  </h4>
                  {updatedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="px-3 py-2 bg-blue-50 dark:bg-blue-900/10 border-l-2 border-blue-500 rounded-r text-sm mb-1"
                    >
                      <div>{entry.tender?.title || entry.tenderId}</div>
                      {entry.diff && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          {Object.entries(JSON.parse(entry.diff))
                            .filter(([, v]) => v !== undefined)
                            .map(([key, val]) => {
                              const v = val as { old: string; new: string };
                              return `${key}: ${v.old} → ${v.new}`;
                            })
                            .join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {closedEntries.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                    Stängda
                  </h4>
                  {closedEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border-l-2 border-gray-400 rounded-r text-sm mb-1 line-through text-gray-500"
                    >
                      {entry.tender?.title || entry.tenderId}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
          <button
            onClick={handleApply}
            disabled={processing}
            className="flex-1 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Check size={16} />
            Ja, uppdatera
          </button>
          <button
            onClick={() => setShowDiff(!showDiff)}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Eye size={16} />
            {showDiff ? 'Dölj diff' : 'Visa diff'}
          </button>
          <button
            onClick={handleDefer}
            className="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <Clock size={16} />
            Skjut upp
          </button>
        </div>
      </div>
    </div>
  );
}

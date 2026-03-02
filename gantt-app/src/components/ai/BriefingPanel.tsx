'use client';

import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function BriefingPanel() {
  const { briefing, setBriefing } = useAppStore();
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!briefing) {
      loadBriefing();
    }
  }, []);

  const loadBriefing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/briefing');
      const data = await res.json();
      setBriefing({
        text: data.text,
        generatedAt: data.generatedAt,
        highlights: data.highlights || [],
      });
    } catch {
      setBriefing({
        text: 'Kunde inte ladda daglig briefing.',
        generatedAt: new Date().toISOString(),
        highlights: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-900/20 dark:to-indigo-900/20 border border-brand-200 dark:border-brand-800 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-brand-100/50 dark:hover:bg-brand-900/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-brand-600 dark:text-brand-400" />
          <span className="font-semibold text-sm text-brand-900 dark:text-brand-200">
            Dagens Briefing
          </span>
          {loading && (
            <span className="text-xs text-brand-500 animate-pulse">Laddar...</span>
          )}
        </div>
        {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
      </button>

      {/* Content */}
      {!collapsed && briefing && (
        <div className="px-4 pb-3 space-y-3">
          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
            {briefing.text}
          </p>

          {briefing.highlights.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Prioriterade anbud
              </span>
              {briefing.highlights.slice(0, 3).map((h) => (
                <div
                  key={h.tenderId}
                  className="flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-md border border-gray-100 dark:border-gray-700"
                >
                  {h.daysUntilDeadline <= 5 ? (
                    <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
                  ) : (
                    <Clock size={14} className="text-gray-400 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
                      {h.title}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      {h.daysUntilDeadline}d till deadline · Match {h.matchScore}%
                    </div>
                  </div>
                  <div
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      h.matchScore >= 80
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : h.matchScore >= 60
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    }`}
                  >
                    {h.matchScore}%
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

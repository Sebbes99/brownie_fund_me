'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import {
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  MapPin,
  Building2,
  Calendar,
  Banknote,
  Tag,
  Globe,
} from 'lucide-react';
import { formatValue, getDaysUntilDeadline } from '@/lib/gantt-utils';
import { CATEGORY_LABELS, STATUS_LABELS, SOURCE_LABELS } from '@/types';
import type { AISummary } from '@/types';

export function TenderDetail() {
  const { selectedTender, setSelectedTender } = useAppStore();
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (selectedTender) {
      setSummary(null);
      loadSummary(selectedTender.id);
    }
  }, [selectedTender?.id]);

  const loadSummary = async (tenderId: string) => {
    setLoadingSummary(true);
    try {
      const res = await fetch('/api/ai/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId }),
      });
      const data = await res.json();
      setSummary(data);
    } catch {
      setSummary({
        core: 'Sammanfattning ej tillgänglig.',
        risks: '',
        nextStep: '',
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  if (!selectedTender) return null;

  const daysLeft = getDaysUntilDeadline(selectedTender);

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[420px] bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 z-10 px-5 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-bold text-base text-gray-900 dark:text-gray-100 leading-tight">
            {selectedTender.title}
          </h2>
          <button
            onClick={() => setSelectedTender(null)}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status + Score badges */}
        <div className="flex items-center gap-2 mt-2">
          <span
            className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              selectedTender.status === 'ny'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : selectedTender.status === 'stänger_snart'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  : selectedTender.status === 'uppdaterad'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
            }`}
          >
            {STATUS_LABELS[selectedTender.status as keyof typeof STATUS_LABELS]}
          </span>
          {selectedTender.matchScore !== null && (
            <span
              className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                selectedTender.matchScore >= 80
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : selectedTender.matchScore >= 60
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              }`}
            >
              Match: {selectedTender.matchScore}%
            </span>
          )}
          {daysLeft <= 5 && daysLeft >= 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse-deadline">
              {daysLeft}d kvar!
            </span>
          )}
        </div>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* AI Summary */}
        <div className="bg-gradient-to-r from-brand-50 to-indigo-50 dark:from-brand-900/20 dark:to-indigo-900/20 border border-brand-200 dark:border-brand-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles size={14} className="text-brand-600 dark:text-brand-400" />
            <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
              AI Executive Summary
            </span>
          </div>
          {loadingSummary ? (
            <div className="flex items-center gap-2 py-2">
              <Loader2 size={14} className="animate-spin text-brand-500" />
              <span className="text-xs text-brand-600 dark:text-brand-400">Genererar sammanfattning...</span>
            </div>
          ) : summary ? (
            <div className="space-y-2 text-sm text-gray-800 dark:text-gray-200">
              <div>
                <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">Uppdrag: </span>
                {summary.core}
              </div>
              {summary.risks && (
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">Risker/Möjligheter: </span>
                  {summary.risks}
                </div>
              )}
              {summary.nextStep && (
                <div>
                  <span className="font-medium text-gray-600 dark:text-gray-400 text-xs">Nästa steg: </span>
                  {summary.nextStep}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Match reason */}
        {selectedTender.matchReason && (
          <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md px-3 py-2">
            {selectedTender.matchReason}
          </div>
        )}

        {/* Details grid */}
        <div className="space-y-3">
          <DetailRow
            icon={<Building2 size={14} />}
            label="Beställare"
            value={selectedTender.buyer}
          />
          <DetailRow
            icon={<Tag size={14} />}
            label="Kategori"
            value={CATEGORY_LABELS[selectedTender.category as keyof typeof CATEGORY_LABELS] || selectedTender.category}
          />
          <DetailRow
            icon={<MapPin size={14} />}
            label="Region"
            value={selectedTender.region}
          />
          <DetailRow
            icon={<Banknote size={14} />}
            label="Uppskattat värde"
            value={formatValue(selectedTender.value)}
          />
          <DetailRow
            icon={<Calendar size={14} />}
            label="Publicerad"
            value={format(new Date(selectedTender.publishedAt), 'd MMMM yyyy', { locale: sv })}
          />
          <DetailRow
            icon={<Calendar size={14} />}
            label="Deadline"
            value={format(new Date(selectedTender.deadlineAt), 'd MMMM yyyy', { locale: sv })}
            highlight={daysLeft <= 5}
          />
          <DetailRow
            icon={<Globe size={14} />}
            label="Källa"
            value={SOURCE_LABELS[selectedTender.source as keyof typeof SOURCE_LABELS] || selectedTender.source}
          />
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Beskrivning
          </h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {selectedTender.description}
          </p>
        </div>

        {/* Source link */}
        {selectedTender.sourceUrl && (
          <a
            href={selectedTender.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ExternalLink size={14} />
            Öppna originalannons
          </a>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-gray-400 dark:text-gray-500 flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <div className="text-[11px] text-gray-500 dark:text-gray-400">{label}</div>
        <div
          className={`text-sm font-medium ${
            highlight
              ? 'text-red-600 dark:text-red-400'
              : 'text-gray-900 dark:text-gray-100'
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

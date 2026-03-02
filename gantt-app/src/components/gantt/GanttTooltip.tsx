'use client';

import { format } from 'date-fns';
import { sv } from 'date-fns/locale';
import type { Tender } from '@/types';
import { getDaysUntilDeadline, formatValue } from '@/lib/gantt-utils';
import { CATEGORY_LABELS, STATUS_LABELS, SOURCE_LABELS } from '@/types';

interface GanttTooltipProps {
  tender: Tender;
  x: number;
  y: number;
}

export function GanttTooltip({ tender, x, y }: GanttTooltipProps) {
  const daysLeft = getDaysUntilDeadline(tender);

  return (
    <div
      className="fixed z-50 pointer-events-none"
      style={{ left: x + 12, top: y - 10 }}
    >
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl p-3 max-w-sm">
        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-1">
          {tender.title}
        </div>

        <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
          <div className="flex justify-between">
            <span>Beställare:</span>
            <span className="font-medium text-gray-900 dark:text-gray-200">{tender.buyer}</span>
          </div>
          <div className="flex justify-between">
            <span>Kategori:</span>
            <span>{CATEGORY_LABELS[tender.category as keyof typeof CATEGORY_LABELS] || tender.category}</span>
          </div>
          <div className="flex justify-between">
            <span>Region:</span>
            <span>{tender.region}</span>
          </div>
          <div className="flex justify-between">
            <span>Värde:</span>
            <span className="font-medium">{formatValue(tender.value)}</span>
          </div>
          <div className="flex justify-between">
            <span>Publicerad:</span>
            <span>{format(new Date(tender.publishedAt), 'd MMM yyyy', { locale: sv })}</span>
          </div>
          <div className="flex justify-between">
            <span>Deadline:</span>
            <span className={daysLeft <= 5 ? 'text-red-500 font-bold' : ''}>
              {format(new Date(tender.deadlineAt), 'd MMM yyyy', { locale: sv })}
              {daysLeft >= 0 && ` (${daysLeft}d)`}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Status:</span>
            <span>{STATUS_LABELS[tender.status as keyof typeof STATUS_LABELS] || tender.status}</span>
          </div>
          <div className="flex justify-between">
            <span>Källa:</span>
            <span>{SOURCE_LABELS[tender.source as keyof typeof SOURCE_LABELS] || tender.source}</span>
          </div>

          {tender.matchScore !== null && (
            <div className="flex justify-between items-center pt-1 border-t border-gray-200 dark:border-gray-700">
              <span>Match Score:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      tender.matchScore >= 80
                        ? 'bg-green-500'
                        : tender.matchScore >= 60
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                    }`}
                    style={{ width: `${tender.matchScore}%` }}
                  />
                </div>
                <span className="font-bold">{tender.matchScore}%</span>
              </div>
            </div>
          )}

          {tender.matchReason && (
            <div className="pt-1 text-[11px] text-blue-600 dark:text-blue-400 italic">
              {tender.matchReason}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

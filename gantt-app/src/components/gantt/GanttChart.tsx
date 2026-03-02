'use client';

import { useRef, useMemo, useCallback, useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import type { Tender, GroupBy } from '@/types';
import {
  generateTimelineColumns,
  getBarPosition,
  getBarColor,
  getDaysUntilDeadline,
  getTodayOffset,
  getColumnWidth,
  formatValue,
} from '@/lib/gantt-utils';
import { GanttBar } from './GanttBar';
import { GanttTooltip } from './GanttTooltip';
import { CATEGORY_LABELS } from '@/types';

const ROW_HEIGHT = 44;
const HEADER_HEIGHT = 60;
const LABEL_WIDTH = 280;

export function GanttChart() {
  const {
    tenders,
    zoom,
    viewportStart,
    viewportEnd,
    filters,
    setSelectedTender,
  } = useAppStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoveredTender, setHoveredTender] = useState<Tender | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);

  // Group and sort tenders
  const groupedTenders = useMemo(() => {
    const groupBy = filters.groupBy;
    if (groupBy === 'none') {
      return [{ key: '', tenders: [...tenders].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)) }];
    }

    const groups: Record<string, Tender[]> = {};
    for (const tender of tenders) {
      let key: string;
      if (groupBy === 'category') {
        key = CATEGORY_LABELS[tender.category as keyof typeof CATEGORY_LABELS] || tender.category;
      } else {
        key = tender[groupBy as keyof Tender] as string || 'Övriga';
      }
      if (!groups[key]) groups[key] = [];
      groups[key].push(tender);
    }

    return Object.entries(groups)
      .map(([key, tenders]) => ({
        key,
        tenders: tenders.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0)),
      }))
      .sort((a, b) => a.key.localeCompare(b.key, 'sv'));
  }, [tenders, filters.groupBy]);

  // Generate timeline columns
  const columns = useMemo(
    () => generateTimelineColumns(viewportStart, viewportEnd, zoom),
    [viewportStart, viewportEnd, zoom]
  );

  const totalWidth = columns.reduce((sum, col) => sum + col.width, 0);

  // Today line offset
  const todayOffset = useMemo(
    () => getTodayOffset(viewportStart, zoom),
    [viewportStart, zoom]
  );

  // Total row count (tenders + group headers)
  const totalRows = groupedTenders.reduce(
    (sum, group) => sum + group.tenders.length + (group.key ? 1 : 0),
    0
  );

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart(e.clientX + (scrollRef.current?.scrollLeft || 0));
    }
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && dragStart !== null && scrollRef.current) {
        const newScrollLeft = dragStart - e.clientX;
        scrollRef.current.scrollLeft = newScrollLeft;
      }
    },
    [isDragging, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStart(null);
  }, []);

  const handleBarHover = useCallback(
    (tender: Tender, e: React.MouseEvent) => {
      setHoveredTender(tender);
      setTooltipPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  const handleBarLeave = useCallback(() => {
    setHoveredTender(null);
  }, []);

  let rowIndex = 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      {/* Gantt Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left labels column */}
        <div
          className="flex-shrink-0 border-r border-gray-200 dark:border-gray-700 overflow-hidden"
          style={{ width: LABEL_WIDTH }}
        >
          {/* Header */}
          <div
            className="flex items-center px-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm text-gray-700 dark:text-gray-300"
            style={{ height: HEADER_HEIGHT }}
          >
            Anbudsförfrågningar ({tenders.length})
          </div>
          {/* Row labels */}
          <div className="overflow-y-auto" style={{ maxHeight: `calc(100% - ${HEADER_HEIGHT}px)` }}>
            {groupedTenders.map((group) => (
              <div key={group.key || '__ungrouped'}>
                {group.key && (
                  <div
                    className="flex items-center px-4 bg-gray-100 dark:bg-gray-800 font-semibold text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                    style={{ height: ROW_HEIGHT }}
                  >
                    {group.key} ({group.tenders.length})
                  </div>
                )}
                {group.tenders.map((tender) => {
                  const daysLeft = getDaysUntilDeadline(tender);
                  return (
                    <div
                      key={tender.id}
                      className="flex items-center px-4 border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
                      style={{ height: ROW_HEIGHT }}
                      onClick={() => setSelectedTender(tender)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                          {tender.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{tender.region}</span>
                          <span>·</span>
                          <span>{formatValue(tender.value)}</span>
                          {daysLeft <= 5 && daysLeft >= 0 && (
                            <span className="text-red-500 font-semibold animate-pulse-deadline">
                              {daysLeft}d kvar
                            </span>
                          )}
                        </div>
                      </div>
                      {tender.matchScore !== null && (
                        <div
                          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                            tender.matchScore >= 80
                              ? 'bg-green-500'
                              : tender.matchScore >= 60
                                ? 'bg-blue-500'
                                : tender.matchScore >= 40
                                  ? 'bg-amber-500'
                                  : 'bg-gray-400'
                          }`}
                        >
                          {tender.matchScore}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right timeline area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <div style={{ width: totalWidth, minHeight: '100%', position: 'relative' }}>
            {/* Timeline header */}
            <div
              className="sticky top-0 z-10 flex bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
              style={{ height: HEADER_HEIGHT }}
            >
              {columns.map((col, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center justify-center border-r border-gray-200 dark:border-gray-700 text-xs ${
                    col.isToday
                      ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold'
                      : col.isWeekend
                        ? 'bg-gray-100 dark:bg-gray-750 text-gray-400 dark:text-gray-500'
                        : 'text-gray-600 dark:text-gray-400'
                  }`}
                  style={{ width: col.width, flexShrink: 0 }}
                >
                  <span className="font-semibold">{col.label}</span>
                  {col.subLabel && (
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{col.subLabel}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Grid and Bars */}
            <div className="relative" style={{ minHeight: totalRows * ROW_HEIGHT }}>
              {/* Grid lines */}
              {columns.map((col, i) => {
                let xOffset = 0;
                for (let j = 0; j < i; j++) xOffset += columns[j].width;
                return (
                  <div
                    key={`grid-${i}`}
                    className={`absolute top-0 bottom-0 border-r ${
                      col.isWeekend
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                        : 'border-gray-100 dark:border-gray-800'
                    }`}
                    style={{ left: xOffset, width: col.width }}
                  />
                );
              })}

              {/* Today line */}
              {todayOffset > 0 && todayOffset < totalWidth && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                  style={{ left: todayOffset }}
                >
                  <div className="absolute -top-1 -left-2.5 bg-red-500 text-white text-[9px] px-1 rounded font-bold">
                    Idag
                  </div>
                </div>
              )}

              {/* Tender bars */}
              {(() => {
                rowIndex = 0;
                return groupedTenders.map((group) => (
                  <div key={group.key || '__ungrouped'}>
                    {group.key && (() => {
                      const groupHeaderIndex = rowIndex;
                      rowIndex++;
                      return (
                        <div
                          className="absolute left-0 right-0 bg-gray-100/50 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700"
                          style={{
                            top: groupHeaderIndex * ROW_HEIGHT,
                            height: ROW_HEIGHT,
                          }}
                        />
                      );
                    })()}
                    {group.tenders.map((tender) => {
                      const currentRow = rowIndex;
                      rowIndex++;
                      const pos = getBarPosition(tender, viewportStart, zoom);
                      const color = getBarColor(tender);
                      const daysLeft = getDaysUntilDeadline(tender);

                      return (
                        <GanttBar
                          key={tender.id}
                          tender={tender}
                          top={currentRow * ROW_HEIGHT + 8}
                          left={pos.left}
                          width={pos.width}
                          height={ROW_HEIGHT - 16}
                          color={color}
                          isPulsing={daysLeft <= 5 && daysLeft >= 0}
                          onHover={handleBarHover}
                          onLeave={handleBarLeave}
                          onClick={() => setSelectedTender(tender)}
                        />
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hoveredTender && (
        <GanttTooltip
          tender={hoveredTender}
          x={tooltipPos.x}
          y={tooltipPos.y}
        />
      )}
    </div>
  );
}

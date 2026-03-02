import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
  differenceInDays,
  differenceInCalendarDays,
  format,
  isToday,
  isWeekend,
} from 'date-fns';
import { sv } from 'date-fns/locale';
import type { Tender, ZoomLevel, TenderStatus } from '@/types';

export interface TimelineColumn {
  date: Date;
  label: string;
  subLabel?: string;
  isToday: boolean;
  isWeekend: boolean;
  width: number; // px
}

export function getColumnWidth(zoom: ZoomLevel): number {
  switch (zoom) {
    case 'day':
      return 40;
    case 'week':
      return 120;
    case 'month':
      return 200;
  }
}

export function generateTimelineColumns(
  start: Date,
  end: Date,
  zoom: ZoomLevel
): TimelineColumn[] {
  const columns: TimelineColumn[] = [];
  const colWidth = getColumnWidth(zoom);

  if (zoom === 'day') {
    let current = startOfDay(start);
    const endDate = endOfDay(end);
    while (current <= endDate) {
      columns.push({
        date: current,
        label: format(current, 'd', { locale: sv }),
        subLabel: format(current, 'EEE', { locale: sv }),
        isToday: isToday(current),
        isWeekend: isWeekend(current),
        width: colWidth,
      });
      current = addDays(current, 1);
    }
  } else if (zoom === 'week') {
    let current = startOfWeek(start, { weekStartsOn: 1 });
    const endDate = endOfWeek(end, { weekStartsOn: 1 });
    while (current <= endDate) {
      const weekEnd = endOfWeek(current, { weekStartsOn: 1 });
      columns.push({
        date: current,
        label: `V${format(current, 'w', { locale: sv })}`,
        subLabel: `${format(current, 'd MMM', { locale: sv })} - ${format(weekEnd, 'd MMM', { locale: sv })}`,
        isToday: false,
        isWeekend: false,
        width: colWidth,
      });
      current = addWeeks(current, 1);
    }
  } else {
    let current = startOfMonth(start);
    const endDate = endOfMonth(end);
    while (current <= endDate) {
      columns.push({
        date: current,
        label: format(current, 'MMMM', { locale: sv }),
        subLabel: format(current, 'yyyy', { locale: sv }),
        isToday: false,
        isWeekend: false,
        width: colWidth,
      });
      current = addMonths(current, 1);
    }
  }

  return columns;
}

export function getBarPosition(
  tender: Tender,
  viewportStart: Date,
  zoom: ZoomLevel
): { left: number; width: number } {
  const colWidth = getColumnWidth(zoom);
  const pubDate = new Date(tender.publishedAt);
  const deadDate = new Date(tender.deadlineAt);

  let pixelsPerDay: number;
  if (zoom === 'day') {
    pixelsPerDay = colWidth;
  } else if (zoom === 'week') {
    pixelsPerDay = colWidth / 7;
  } else {
    pixelsPerDay = colWidth / 30;
  }

  const startOffset = differenceInCalendarDays(pubDate, viewportStart);
  const duration = Math.max(1, differenceInDays(deadDate, pubDate));

  return {
    left: startOffset * pixelsPerDay,
    width: Math.max(duration * pixelsPerDay, 20),
  };
}

export function getBarColor(tender: Tender): string {
  const score = tender.matchScore || 0;
  const status = tender.status as TenderStatus;

  if (status === 'stängd') return '#6b7280'; // gray
  if (status === 'stänger_snart') {
    if (score >= 80) return '#dc2626'; // red - urgent + high match
    return '#f97316'; // orange - urgent
  }
  if (score >= 80) return '#22c55e'; // green - high match
  if (score >= 60) return '#3b82f6'; // blue - medium match
  if (score >= 40) return '#f59e0b'; // amber - low match
  return '#94a3b8'; // slate - very low match
}

export function getDaysUntilDeadline(tender: Tender): number {
  return differenceInCalendarDays(
    new Date(tender.deadlineAt),
    new Date()
  );
}

export function formatValue(value: number | null): string {
  if (!value) return 'Ej angivet';
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} Mkr`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)} tkr`;
  return `${value} kr`;
}

export function getTodayOffset(
  viewportStart: Date,
  zoom: ZoomLevel
): number {
  const colWidth = getColumnWidth(zoom);
  let pixelsPerDay: number;
  if (zoom === 'day') {
    pixelsPerDay = colWidth;
  } else if (zoom === 'week') {
    pixelsPerDay = colWidth / 7;
  } else {
    pixelsPerDay = colWidth / 30;
  }

  return differenceInCalendarDays(new Date(), viewportStart) * pixelsPerDay;
}

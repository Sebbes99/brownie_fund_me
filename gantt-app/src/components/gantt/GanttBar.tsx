'use client';

import { memo } from 'react';
import type { Tender } from '@/types';

interface GanttBarProps {
  tender: Tender;
  top: number;
  left: number;
  width: number;
  height: number;
  color: string;
  isPulsing: boolean;
  onHover: (tender: Tender, e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: () => void;
}

export const GanttBar = memo(function GanttBar({
  tender,
  top,
  left,
  width,
  height,
  color,
  isPulsing,
  onHover,
  onLeave,
  onClick,
}: GanttBarProps) {
  return (
    <div
      className={`absolute rounded-md shadow-sm cursor-pointer transition-all hover:shadow-md hover:brightness-110 ${
        isPulsing ? 'animate-pulse-deadline' : ''
      }`}
      style={{
        top,
        left,
        width: Math.max(width, 20),
        height,
        backgroundColor: color,
        opacity: tender.status === 'stängd' ? 0.4 : 0.85,
        zIndex: 10,
      }}
      onMouseEnter={(e) => onHover(tender, e)}
      onMouseMove={(e) => onHover(tender, e)}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {width > 80 && (
        <div className="px-2 py-0.5 text-white text-[11px] font-medium truncate leading-tight">
          {tender.title}
        </div>
      )}
      {isPulsing && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900">
          <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
        </div>
      )}
    </div>
  );
});

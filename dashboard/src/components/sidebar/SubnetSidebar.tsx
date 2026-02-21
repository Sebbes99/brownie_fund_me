import React, { useMemo, useRef, useCallback, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useAppStore } from '../../stores/appStore';
import { SubnetMeta, SortField } from '../../types';
import { formatNumber, formatPercent, formatPrice } from '../../utils/indicators';
import { ListSkeleton } from '../common/Skeleton';
import { Search, ChevronDown, Star, List, PanelLeftClose, PanelLeft } from 'lucide-react';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'rank', label: 'Rank' },
  { value: 'marketCap', label: 'Market Cap' },
  { value: 'emission', label: 'Emission' },
  { value: 'price', label: 'Price' },
  { value: 'volume24h', label: 'Volume' },
  { value: 'priceChange24h', label: '24h Change' },
  { value: 'alpha', label: 'Alpha' },
];

const ROW_HEIGHT = 56;

export const SubnetSidebar: React.FC = () => {
  const {
    subnets, metricsMap, selectedSubnetId, selectSubnet,
    searchQuery, setSearchQuery, sortField, setSortField, sortDirection, setSortDirection,
    sidebarCollapsed, toggleSidebar,
    watchlists, activeWatchlistId, setActiveWatchlist,
    compareMode, addCompareSubnet,
  } = useAppStore();

  const [focusIndex, setFocusIndex] = useState(0);
  const parentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Filter and sort
  const filteredSubnets = useMemo(() => {
    let list = [...subnets];

    // Watchlist filter
    if (activeWatchlistId) {
      const wl = watchlists.find(w => w.id === activeWatchlistId);
      if (wl) list = list.filter(s => wl.subnetIds.includes(s.subnetId));
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.symbol.toLowerCase().includes(q) ||
        s.subnetId.toString().includes(q) ||
        s.tags.some(t => t.includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      const ma = metricsMap[a.subnetId];
      const mb = metricsMap[b.subnetId];
      if (!ma || !mb) return 0;

      let va = ma[sortField] ?? 0;
      let vb = mb[sortField] ?? 0;

      return sortDirection === 'asc' ? va - vb : vb - va;
    });

    return list;
  }, [subnets, metricsMap, searchQuery, sortField, sortDirection, activeWatchlistId, watchlists]);

  const virtualizer = useVirtualizer({
    count: filteredSubnets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 10,
  });

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusIndex(i => Math.min(i + 1, filteredSubnets.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && filteredSubnets[focusIndex]) {
        const subnet = filteredSubnets[focusIndex];
        if (compareMode) {
          addCompareSubnet(subnet.subnetId);
        } else {
          selectSubnet(subnet.subnetId);
        }
      } else if (e.key === '/' || (e.ctrlKey && e.key === 'k')) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIndex, filteredSubnets, compareMode, selectSubnet, addCompareSubnet]);

  // Scroll focused item into view
  useEffect(() => {
    virtualizer.scrollToIndex(focusIndex, { align: 'auto' });
  }, [focusIndex, virtualizer]);

  if (sidebarCollapsed) {
    return (
      <div style={sidebarStyles.collapsed}>
        <button onClick={toggleSidebar} style={sidebarStyles.collapseBtn}>
          <PanelLeft size={16} />
        </button>
      </div>
    );
  }

  return (
    <div style={sidebarStyles.container}>
      {/* Header */}
      <div style={sidebarStyles.header}>
        <div style={sidebarStyles.headerTitle}>
          <span style={{ fontWeight: 700, fontSize: 13 }}>Subnets</span>
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{filteredSubnets.length}</span>
        </div>
        <button onClick={toggleSidebar} style={sidebarStyles.collapseBtn}>
          <PanelLeftClose size={14} />
        </button>
      </div>

      {/* Search */}
      <div style={sidebarStyles.searchWrap}>
        <Search size={13} style={{ position: 'absolute', left: 20, color: 'var(--text-muted)' }} />
        <input
          ref={searchRef}
          style={sidebarStyles.searchInput}
          placeholder="Filter subnets... (/)"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Sort + Watchlist */}
      <div style={sidebarStyles.controls}>
        <select
          value={sortField}
          onChange={e => setSortField(e.target.value as SortField)}
          style={sidebarStyles.select}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <button
          onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          style={sidebarStyles.sortDirBtn}
        >
          {sortDirection === 'asc' ? '↑' : '↓'}
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => setActiveWatchlist(activeWatchlistId ? null : watchlists[0]?.id ?? null)}
          style={{
            ...sidebarStyles.iconBtn,
            color: activeWatchlistId ? 'var(--yellow)' : 'var(--text-muted)',
          }}
          data-tooltip="Watchlist"
        >
          <Star size={14} fill={activeWatchlistId ? 'var(--yellow)' : 'none'} />
        </button>
      </div>

      {/* Virtualized List */}
      <div ref={parentRef} style={sidebarStyles.listContainer}>
        {subnets.length === 0 ? (
          <ListSkeleton />
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
            {virtualizer.getVirtualItems().map(virtualRow => {
              const subnet = filteredSubnets[virtualRow.index];
              if (!subnet) return null;
              const metrics = metricsMap[subnet.subnetId];
              const isSelected = subnet.subnetId === selectedSubnetId;
              const isFocused = virtualRow.index === focusIndex;

              return (
                <div
                  key={subnet.subnetId}
                  style={{
                    ...sidebarStyles.row,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: ROW_HEIGHT,
                    transform: `translateY(${virtualRow.start}px)`,
                    background: isSelected
                      ? 'var(--bg-active)'
                      : isFocused
                        ? 'var(--bg-hover)'
                        : 'transparent',
                    borderLeft: isSelected ? '3px solid var(--accent)' : '3px solid transparent',
                  }}
                  onClick={() => {
                    if (compareMode) {
                      addCompareSubnet(subnet.subnetId);
                    } else {
                      selectSubnet(subnet.subnetId);
                      setFocusIndex(virtualRow.index);
                    }
                  }}
                >
                  {/* Rank badge */}
                  <div style={sidebarStyles.rankBadge}>
                    {metrics?.rank ?? subnet.subnetId}
                  </div>

                  {/* Name & symbol */}
                  <div style={sidebarStyles.nameCol}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 12 }} className="truncate">
                        {subnet.name}
                      </span>
                      {subnet.isNew && (
                        <span className="badge badge-new">NEW</span>
                      )}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      SN{subnet.subnetId} · {subnet.symbol}
                    </div>
                  </div>

                  {/* Metrics */}
                  <div style={sidebarStyles.metricsCol}>
                    <span className="mono" style={{ fontWeight: 600, fontSize: 12 }}>
                      {metrics ? formatPrice(metrics.price) : '—'}
                    </span>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        color: metrics && metrics.priceChange24h >= 0 ? 'var(--green)' : 'var(--red)',
                      }}
                    >
                      {metrics ? formatPercent(metrics.priceChange24h) : '—'}
                    </span>
                  </div>

                  {/* Status dot */}
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: subnet.status === 'active' ? 'var(--green)' : 'var(--red)',
                    flexShrink: 0,
                  }} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const sidebarStyles: Record<string, React.CSSProperties> = {
  container: {
    width: 'var(--sidebar-width)',
    minWidth: 280,
    maxWidth: 400,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    flexShrink: 0,
    transition: 'width var(--transition)',
  },
  collapsed: {
    width: 40,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 8,
    flexShrink: 0,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderBottom: '1px solid var(--border)',
  },
  headerTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  collapseBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  searchWrap: {
    position: 'relative',
    padding: '8px 12px 4px',
  },
  searchInput: {
    width: '100%',
    height: 30,
    paddingLeft: 28,
    fontSize: 12,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 12px 8px',
  },
  select: {
    height: 26,
    fontSize: 11,
    padding: '0 6px',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
  },
  sortDirBtn: {
    width: 26,
    height: 26,
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    fontWeight: 700,
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  listContainer: {
    flex: 1,
    overflow: 'auto',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: 8,
    cursor: 'pointer',
    transition: 'background var(--transition)',
    borderBottom: '1px solid var(--border)',
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    background: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-secondary)',
    flexShrink: 0,
  },
  nameCol: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  metricsCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 1,
    flexShrink: 0,
  },
};

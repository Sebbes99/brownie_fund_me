import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Timeframe } from '../../types';
import {
  Search, Moon, Sun, GitCompare, Bell, Download,
  Play, Pause, FastForward, ChevronRight, BarChart3,
} from 'lucide-react';

const TIMEFRAMES: Timeframe[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];

const styles = {
  topbar: {
    height: 'var(--topbar-height)',
    background: 'var(--bg-secondary)',
    borderBottom: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    padding: '0 12px',
    gap: 8,
    zIndex: 100,
    flexShrink: 0,
  } as React.CSSProperties,
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 700,
    fontSize: 14,
    color: 'var(--accent)',
    paddingRight: 12,
    borderRight: '1px solid var(--border)',
    marginRight: 4,
    whiteSpace: 'nowrap',
  } as React.CSSProperties,
  searchWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  } as React.CSSProperties,
  searchIcon: {
    position: 'absolute',
    left: 8,
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  } as React.CSSProperties,
  searchInput: {
    width: 200,
    paddingLeft: 30,
    height: 30,
    fontSize: 12,
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
  } as React.CSSProperties,
  tfGroup: {
    display: 'flex',
    gap: 2,
    padding: '2px',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius)',
  } as React.CSSProperties,
  tfBtn: (active: boolean) => ({
    padding: '4px 10px',
    fontSize: 11,
    fontWeight: 600,
    borderRadius: 4,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-secondary)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    border: 'none',
  }) as React.CSSProperties,
  simGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '3px 8px',
    background: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius)',
    border: '1px solid var(--border)',
  } as React.CSSProperties,
  simBtn: {
    padding: '2px 6px',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  } as React.CSSProperties,
  simSpeed: (active: boolean) => ({
    padding: '2px 6px',
    fontSize: 10,
    fontWeight: 600,
    borderRadius: 3,
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text-muted)',
    cursor: 'pointer',
    border: 'none',
  }) as React.CSSProperties,
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: '50%',
    background: 'var(--green)',
    animation: 'pulse 2s infinite',
  } as React.CSSProperties,
  iconBtn: (active?: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: 'var(--radius)',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
    background: active ? 'rgba(41, 98, 255, 0.1)' : 'transparent',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    border: 'none',
  }) as React.CSSProperties,
  spacer: { flex: 1 } as React.CSSProperties,
  divider: {
    width: 1,
    height: 24,
    background: 'var(--border)',
    margin: '0 4px',
  } as React.CSSProperties,
  simProgress: {
    fontSize: 10,
    color: 'var(--text-muted)',
    fontFamily: 'monospace',
    minWidth: 50,
    textAlign: 'center',
  } as React.CSSProperties,
};

export const TopBar: React.FC = () => {
  const {
    timeframe, setTimeframe,
    simulationActive, simulationSpeed, simulationIndex, simulationTotal,
    toggleSimulation, setSimulationSpeed,
    compareMode, toggleCompareMode,
    darkMode, toggleTheme,
    searchQuery, setSearchQuery,
  } = useAppStore();

  const [globalSearch, setGlobalSearch] = useState('');

  return (
    <div style={styles.topbar}>
      <div style={styles.logo}>
        <BarChart3 size={18} />
        <span>BitScan Pro</span>
      </div>

      {/* Global Search */}
      <div style={styles.searchWrap}>
        <Search size={14} style={styles.searchIcon as React.CSSProperties} />
        <input
          style={styles.searchInput}
          placeholder="Search subnets... (Ctrl+K)"
          value={globalSearch || searchQuery}
          onChange={(e) => {
            setGlobalSearch(e.target.value);
            setSearchQuery(e.target.value);
          }}
        />
      </div>

      <div style={styles.divider} />

      {/* Timeframe buttons */}
      <div style={styles.tfGroup}>
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            style={styles.tfBtn(timeframe === tf)}
            onClick={() => setTimeframe(tf)}
          >
            {tf}
          </button>
        ))}
      </div>

      <div style={styles.divider} />

      {/* Simulation Controls */}
      <div style={styles.simGroup}>
        {simulationActive && <div style={styles.liveIndicator} />}
        <button style={styles.simBtn} onClick={toggleSimulation} data-tooltip={simulationActive ? 'Pause' : 'Play simulation'}>
          {simulationActive ? <Pause size={14} /> : <Play size={14} />}
        </button>
        {([1, 5, 20] as const).map(speed => (
          <button
            key={speed}
            style={styles.simSpeed(simulationSpeed === speed)}
            onClick={() => setSimulationSpeed(speed)}
          >
            {speed}x
          </button>
        ))}
        {simulationActive && (
          <span style={styles.simProgress as React.CSSProperties}>
            {simulationIndex}/{simulationTotal}
          </span>
        )}
      </div>

      <div style={styles.spacer} />

      {/* Actions */}
      <button
        style={styles.iconBtn(compareMode)}
        onClick={toggleCompareMode}
        data-tooltip="Compare mode"
      >
        <GitCompare size={16} />
      </button>
      <button style={styles.iconBtn()} data-tooltip="Alerts">
        <Bell size={16} />
      </button>
      <button style={styles.iconBtn()} data-tooltip="Export">
        <Download size={16} />
      </button>
      <div style={styles.divider} />
      <button style={styles.iconBtn()} onClick={toggleTheme} data-tooltip={darkMode ? 'Light mode' : 'Dark mode'}>
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
};

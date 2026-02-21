import React from 'react';
import { useAppStore } from '../../stores/appStore';
import { DrawingToolType } from '../../types';
import {
  TrendingUp, ArrowRight, Minus, MoreVertical,
  Layers, Square, Type, ArrowUpRight, Trash2, Download, Upload,
} from 'lucide-react';
import { exportDrawings, importDrawings, deleteDrawing as deleteDrawingById } from '../../services/drawingPersistence';

interface DrawingTool {
  type: DrawingToolType;
  icon: React.ReactNode;
  label: string;
}

const DRAWING_TOOLS: DrawingTool[] = [
  { type: 'trendline', icon: <TrendingUp size={14} />, label: 'Trend Line' },
  { type: 'ray', icon: <ArrowUpRight size={14} />, label: 'Ray' },
  { type: 'horizontal', icon: <Minus size={14} />, label: 'Horizontal' },
  { type: 'vertical', icon: <MoreVertical size={14} />, label: 'Vertical' },
  { type: 'fibRetracement', icon: <Layers size={14} />, label: 'Fib Retracement' },
  { type: 'rectangle', icon: <Square size={14} />, label: 'Rectangle' },
  { type: 'text', icon: <Type size={14} />, label: 'Text' },
  { type: 'arrow', icon: <ArrowRight size={14} />, label: 'Arrow' },
];

export const DrawingToolbar: React.FC = () => {
  const {
    activeDrawingTool, setActiveDrawingTool,
    currentDrawings, setCurrentDrawings,
    selectedSubnetId,
  } = useAppStore();

  const handleExport = async () => {
    if (selectedSubnetId === null) return;
    const json = await exportDrawings(selectedSubnetId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drawings-sn${selectedSubnetId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      const result = await importDrawings(text);
      if (result.imported > 0) {
        // Reload drawings
        window.location.reload();
      }
    };
    input.click();
  };

  const handleClearAll = async () => {
    if (selectedSubnetId === null) return;
    for (const d of currentDrawings) {
      await deleteDrawingById(d.drawingId);
    }
    setCurrentDrawings([]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.label}>Draw</div>
      <div style={styles.toolGroup}>
        {DRAWING_TOOLS.map(tool => (
          <button
            key={tool.type}
            style={{
              ...styles.toolBtn,
              background: activeDrawingTool === tool.type ? 'var(--accent)' : 'transparent',
              color: activeDrawingTool === tool.type ? '#fff' : 'var(--text-secondary)',
            }}
            onClick={() => setActiveDrawingTool(
              activeDrawingTool === tool.type ? null : tool.type
            )}
            data-tooltip={tool.label}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      <div style={styles.separator} />

      {/* Drawing management */}
      <div style={styles.toolGroup}>
        <button style={styles.toolBtn} onClick={handleExport} data-tooltip="Export drawings">
          <Download size={13} />
        </button>
        <button style={styles.toolBtn} onClick={handleImport} data-tooltip="Import drawings">
          <Upload size={13} />
        </button>
        {currentDrawings.length > 0 && (
          <button
            style={{ ...styles.toolBtn, color: 'var(--red)' }}
            onClick={handleClearAll}
            data-tooltip="Clear all drawings"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>

      {currentDrawings.length > 0 && (
        <span style={styles.count}>{currentDrawings.length} drawings</span>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 12px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginRight: 4,
  },
  toolGroup: {
    display: 'flex',
    gap: 2,
  },
  toolBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    transition: 'all var(--transition)',
    border: 'none',
    color: 'var(--text-secondary)',
    background: 'none',
  },
  separator: {
    width: 1,
    height: 20,
    background: 'var(--border)',
    margin: '0 4px',
  },
  count: {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginLeft: 'auto',
  },
};

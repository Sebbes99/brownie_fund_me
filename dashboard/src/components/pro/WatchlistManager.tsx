import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Star, Plus, Trash2, Pin, Check, X } from 'lucide-react';

export const WatchlistManager: React.FC = () => {
  const {
    watchlists, activeWatchlistId,
    createWatchlist, deleteWatchlist, setActiveWatchlist, togglePinWatchlist,
    selectedSubnetId, addToWatchlist, removeFromWatchlist,
  } = useAppStore();

  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  const handleCreate = () => {
    if (!newName.trim()) return;
    createWatchlist(newName.trim());
    setNewName('');
    setShowCreate(false);
  };

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Star size={14} style={{ color: 'var(--yellow)' }} />
        <span style={styles.title}>Watchlists</span>
        <button onClick={() => setShowCreate(!showCreate)} style={styles.addBtn}>
          <Plus size={14} />
        </button>
      </div>

      {showCreate && (
        <div style={styles.form}>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Watchlist name"
            style={styles.formInput}
            onKeyDown={e => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
          <button onClick={handleCreate} style={styles.confirmBtn}>
            <Check size={12} />
          </button>
          <button onClick={() => setShowCreate(false)} style={styles.cancelBtn}>
            <X size={12} />
          </button>
        </div>
      )}

      <div style={styles.list}>
        {watchlists.length === 0 && (
          <div style={styles.empty}>
            No watchlists yet. Create one to start tracking subnets.
          </div>
        )}
        {watchlists
          .sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0))
          .map(wl => (
            <div
              key={wl.id}
              style={{
                ...styles.wlRow,
                background: activeWatchlistId === wl.id ? 'var(--bg-active)' : 'transparent',
              }}
              onClick={() => setActiveWatchlist(activeWatchlistId === wl.id ? null : wl.id)}
            >
              <div style={styles.wlInfo}>
                <div style={styles.wlName}>
                  {wl.isPinned && <Pin size={10} style={{ color: 'var(--yellow)', marginRight: 4 }} />}
                  {wl.name}
                </div>
                <div style={styles.wlCount}>{wl.subnetIds.length} subnets</div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); togglePinWatchlist(wl.id); }}
                style={styles.iconBtn}
                data-tooltip="Pin"
              >
                <Pin size={12} style={{ color: wl.isPinned ? 'var(--yellow)' : 'var(--text-muted)' }} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); deleteWatchlist(wl.id); }}
                style={styles.iconBtn}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
      </div>

      {/* Quick add to watchlist */}
      {selectedSubnetId !== null && watchlists.length > 0 && (
        <div style={styles.quickAdd}>
          <span style={styles.quickLabel}>Add SN{selectedSubnetId} to:</span>
          {watchlists.map(wl => {
            const inList = wl.subnetIds.includes(selectedSubnetId);
            return (
              <button
                key={wl.id}
                onClick={() =>
                  inList
                    ? removeFromWatchlist(wl.id, selectedSubnetId)
                    : addToWatchlist(wl.id, selectedSubnetId)
                }
                style={{
                  ...styles.quickBtn,
                  background: inList ? 'var(--accent)' : 'var(--bg-tertiary)',
                  color: inList ? '#fff' : 'var(--text-secondary)',
                }}
              >
                {wl.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    borderTop: '1px solid var(--border)',
    background: 'var(--bg-secondary)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-secondary)',
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    flex: 1,
  },
  addBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 'var(--radius)',
    color: 'var(--accent)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  form: {
    display: 'flex',
    gap: 4,
    padding: '6px 12px',
    borderBottom: '1px solid var(--border)',
  },
  formInput: {
    flex: 1,
    height: 26,
    fontSize: 11,
    padding: '0 8px',
  },
  confirmBtn: {
    width: 26,
    height: 26,
    borderRadius: 'var(--radius)',
    background: 'var(--accent)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
  },
  cancelBtn: {
    width: 26,
    height: 26,
    borderRadius: 'var(--radius)',
    background: 'var(--bg-tertiary)',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
  },
  list: {
    maxHeight: 160,
    overflow: 'auto',
  },
  empty: {
    padding: '12px',
    fontSize: 11,
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  wlRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    cursor: 'pointer',
    transition: 'background var(--transition)',
    borderBottom: '1px solid var(--border)',
  },
  wlInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  wlName: {
    fontSize: 12,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
  },
  wlCount: {
    fontSize: 10,
    color: 'var(--text-muted)',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: 'var(--radius)',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
  },
  quickAdd: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '6px 12px',
    borderTop: '1px solid var(--border)',
    flexWrap: 'wrap',
  },
  quickLabel: {
    fontSize: 10,
    color: 'var(--text-muted)',
    marginRight: 4,
  },
  quickBtn: {
    padding: '2px 8px',
    fontSize: 10,
    borderRadius: 9999,
    cursor: 'pointer',
    border: 'none',
    transition: 'all var(--transition)',
    fontWeight: 600,
  },
};

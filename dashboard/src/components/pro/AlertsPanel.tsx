import React, { useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { Bell, Plus, Trash2, Check } from 'lucide-react';

export const AlertsPanel: React.FC = () => {
  const { alerts, addAlert, removeAlert, selectedSubnetId, subnets } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [alertType, setAlertType] = useState<'price_above' | 'price_below'>('price_above');
  const [alertValue, setAlertValue] = useState('');

  const handleAdd = () => {
    if (!selectedSubnetId || !alertValue) return;
    addAlert({
      subnetId: selectedSubnetId,
      type: alertType,
      value: parseFloat(alertValue),
      active: true,
    });
    setAlertValue('');
    setShowForm(false);
  };

  const subnetAlerts = selectedSubnetId !== null
    ? alerts.filter(a => a.subnetId === selectedSubnetId)
    : alerts;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Bell size={14} />
        <span style={styles.title}>Alerts</span>
        <button onClick={() => setShowForm(!showForm)} style={styles.addBtn}>
          <Plus size={14} />
        </button>
      </div>

      {showForm && (
        <div style={styles.form}>
          <select
            value={alertType}
            onChange={e => setAlertType(e.target.value as typeof alertType)}
            style={styles.formSelect}
          >
            <option value="price_above">Price Above</option>
            <option value="price_below">Price Below</option>
            <option value="percent_change">% Change</option>
          </select>
          <input
            type="number"
            value={alertValue}
            onChange={e => setAlertValue(e.target.value)}
            placeholder="Value"
            style={styles.formInput}
          />
          <button onClick={handleAdd} style={styles.confirmBtn}>
            <Check size={12} />
          </button>
        </div>
      )}

      <div style={styles.list}>
        {subnetAlerts.length === 0 && (
          <div style={styles.empty}>No alerts set</div>
        )}
        {subnetAlerts.map(alert => {
          const subnet = subnets.find(s => s.subnetId === alert.subnetId);
          return (
            <div key={alert.id} style={{
              ...styles.alertRow,
              opacity: alert.triggered ? 0.5 : 1,
            }}>
              <div style={styles.alertInfo}>
                <span style={styles.alertSubnet}>SN{alert.subnetId} {subnet?.symbol}</span>
                <span style={styles.alertCondition}>
                  {alert.type.replace('_', ' ')} {alert.value}
                </span>
              </div>
              {alert.triggered && (
                <span style={styles.triggeredBadge}>Triggered</span>
              )}
              <button onClick={() => removeAlert(alert.id)} style={styles.deleteBtn}>
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
      </div>
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
  formSelect: {
    flex: 1,
    height: 26,
    fontSize: 11,
    padding: '0 4px',
  },
  formInput: {
    width: 80,
    height: 26,
    fontSize: 11,
    padding: '0 6px',
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
  list: {
    maxHeight: 200,
    overflow: 'auto',
  },
  empty: {
    padding: '12px',
    fontSize: 11,
    color: 'var(--text-muted)',
    textAlign: 'center',
  },
  alertRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    borderBottom: '1px solid var(--border)',
  },
  alertInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  alertSubnet: {
    fontSize: 11,
    fontWeight: 600,
  },
  alertCondition: {
    fontSize: 10,
    color: 'var(--text-muted)',
    textTransform: 'capitalize',
  },
  triggeredBadge: {
    fontSize: 9,
    fontWeight: 600,
    color: 'var(--green)',
    background: 'rgba(0,200,83,0.1)',
    padding: '1px 6px',
    borderRadius: 9999,
  },
  deleteBtn: {
    color: 'var(--text-muted)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
  },
};

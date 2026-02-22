import React, { useEffect, useState } from 'react';
import { onRateLimitChange } from '../../services/rateLimiter';
import { Clock } from 'lucide-react';

export const RateLimitNotice: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const unsub = onRateLimitChange(({ waiting, retryInMs }) => {
      setVisible(waiting);
      setCountdown(Math.ceil(retryInMs / 1000));
    });
    return unsub;
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!visible || countdown <= 0) return;
    const id = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { setVisible(false); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [visible, countdown]);

  if (!visible) return null;

  return (
    <div style={styles.container}>
      <Clock size={14} style={{ flexShrink: 0 }} />
      <span>
        API-gräns nådd (5 req/min). Vänta {countdown}s...
      </span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 16,
    right: 16,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: '#ffd600',
    background: 'rgba(20, 25, 40, 0.95)',
    border: '1px solid rgba(255, 214, 0, 0.3)',
    borderRadius: 8,
    backdropFilter: 'blur(8px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
  },
};

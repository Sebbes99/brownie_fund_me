import React from 'react';
import { SubnetEvent } from '../../types';
import { AlertTriangle, Info, Zap, Flag, Radio } from 'lucide-react';

interface ActivityTabProps {
  events: SubnetEvent[];
}

const typeIcons: Record<SubnetEvent['type'], React.ReactNode> = {
  governance: <Flag size={14} />,
  update: <Zap size={14} />,
  release: <Radio size={14} />,
  alert: <AlertTriangle size={14} />,
  milestone: <Info size={14} />,
};

const severityColors: Record<SubnetEvent['severity'], string> = {
  info: 'var(--accent)',
  warning: 'var(--yellow)',
  critical: 'var(--red)',
};

export const ActivityTab: React.FC<ActivityTabProps> = ({ events }) => {
  if (events.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--text-muted)', textAlign: 'center' }}>
        No recent events
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>Recent Activity & Events</div>
      <div style={styles.timeline}>
        {events.map((event, index) => (
          <div key={event.id} style={styles.eventRow}>
            {/* Timeline connector */}
            <div style={styles.timelineCol}>
              <div style={{
                ...styles.dot,
                background: severityColors[event.severity],
              }}>
                {typeIcons[event.type]}
              </div>
              {index < events.length - 1 && <div style={styles.line} />}
            </div>

            {/* Content */}
            <div style={styles.eventContent}>
              <div style={styles.eventHeader}>
                <span style={styles.eventType}>{event.type}</span>
                <span style={styles.eventDate}>
                  {new Date(event.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div style={styles.eventTitle}>{event.title}</div>
              <div style={styles.eventDesc}>{event.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '16px 20px',
    overflow: 'auto',
    maxHeight: '100%',
  },
  title: {
    fontSize: 14,
    fontWeight: 700,
    marginBottom: 16,
  },
  timeline: {
    display: 'flex',
    flexDirection: 'column',
  },
  eventRow: {
    display: 'flex',
    gap: 12,
  },
  timelineCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: 32,
    flexShrink: 0,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    flexShrink: 0,
  },
  line: {
    width: 2,
    flex: 1,
    background: 'var(--border)',
    minHeight: 20,
  },
  eventContent: {
    flex: 1,
    paddingBottom: 20,
  },
  eventHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  eventType: {
    fontSize: 10,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    letterSpacing: 0.5,
  },
  eventDate: {
    fontSize: 10,
    color: 'var(--text-muted)',
  },
  eventTitle: {
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 4,
  },
  eventDesc: {
    fontSize: 12,
    color: 'var(--text-secondary)',
    lineHeight: 1.5,
  },
};

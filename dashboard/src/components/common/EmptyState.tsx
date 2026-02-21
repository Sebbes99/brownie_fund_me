import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '48px 24px',
    color: 'var(--text-muted)',
    textAlign: 'center',
    gap: 12,
  }}>
    {icon && <div style={{ fontSize: 40, opacity: 0.5 }}>{icon}</div>}
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</div>
    {description && <div style={{ fontSize: 12, maxWidth: 280 }}>{description}</div>}
    {action && <div style={{ marginTop: 8 }}>{action}</div>}
  </div>
);

export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Something went wrong',
  onRetry,
}) => (
  <EmptyState
    title="Error"
    description={message}
    action={onRetry ? (
      <button
        onClick={onRetry}
        style={{
          background: 'var(--accent)',
          color: '#fff',
          padding: '6px 16px',
          borderRadius: 'var(--radius)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        Retry
      </button>
    ) : undefined}
  />
);

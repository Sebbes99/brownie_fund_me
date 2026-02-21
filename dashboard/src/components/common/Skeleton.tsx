import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius,
  style,
}) => (
  <div
    className="skeleton"
    style={{
      width,
      height,
      borderRadius,
      ...style,
    }}
  />
);

export const ChartSkeleton: React.FC = () => (
  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
    <Skeleton height={24} width="30%" />
    <Skeleton height={300} />
    <div style={{ display: 'flex', gap: 8 }}>
      <Skeleton height={32} width={60} />
      <Skeleton height={32} width={60} />
      <Skeleton height={32} width={60} />
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 10 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 12px', alignItems: 'center' }}>
        <Skeleton width={28} height={28} borderRadius="50%" />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Skeleton height={13} width="60%" />
          <Skeleton height={11} width="40%" />
        </div>
        <Skeleton height={13} width={50} />
      </div>
    ))}
  </div>
);

'use client';

import React from 'react';

function Line({ width = '100%', height = 14, style }: { width?: string | number; height?: number; style?: React.CSSProperties }) {
  return (
    <div className="o-loading-skeleton" style={{ width, height, borderRadius: 4, ...style }} />
  );
}

export function SkeletonKPI() {
  return (
    <div className="o-kpi-grid">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="o-kpi-card" style={{ padding: '16px 18px' }}>
          <Line width="60%" height={10} style={{ marginBottom: 12 }} />
          <Line width="40%" height={28} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonList({ rows = 6, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div style={{ background: '#fff' }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #E0E0E0', display: 'flex', gap: 20 }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Line key={i} width={`${100 / cols}%`} height={12} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid #F2F2F2', display: 'flex', gap: 20, alignItems: 'center' }}>
          {Array.from({ length: cols }).map((_, j) => (
            <Line key={j} width={`${100 / cols}%`} height={14} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="o-kanban" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="o-kanban-card" style={{ padding: 0 }}>
          <div className="o-loading-skeleton" style={{ height: 140, borderRadius: '6px 6px 0 0' }} />
          <div style={{ padding: 14 }}>
            <Line width="70%" height={16} style={{ marginBottom: 8 }} />
            <Line width="50%" height={12} style={{ marginBottom: 16 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Line width="30%" height={14} />
              <Line width="25%" height={20} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="o-chart-card">
      <Line width="40%" height={14} style={{ marginBottom: 16 }} />
      <div className="o-loading-skeleton" style={{ height: 200, borderRadius: 6 }} />
    </div>
  );
}

export function SkeletonForm() {
  return (
    <div style={{ background: '#fff', padding: 20 }}>
      <Line width="30%" height={16} style={{ marginBottom: 20 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i}>
            <Line width="40%" height={10} style={{ marginBottom: 8 }} />
            <Line width="100%" height={36} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div style={{ padding: 16 }}>
      <SkeletonKPI />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
        <SkeletonChart />
        <SkeletonChart />
      </div>
      <div style={{ marginTop: 14 }}>
        <SkeletonList />
      </div>
    </div>
  );
}

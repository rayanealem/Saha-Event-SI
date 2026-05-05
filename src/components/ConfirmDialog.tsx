'use client';

import { useEffect } from 'react';

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export default function ConfirmDialog({
  open, title, message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  onConfirm, onCancel,
  danger = true,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: 'rgba(0,0,0,.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'o-fade-in 0.2s ease',
    }} onClick={onCancel}>
      <div style={{
        background: '#fff', borderRadius: 12, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,.25)',
        animation: 'o-slide-in-up 0.3s cubic-bezier(0.4,0,0.2,1)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #eee' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#212529', margin: 0 }}>{title}</h3>
        </div>
        <div style={{ padding: '20px 24px' }}>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.7, margin: 0 }}>{message}</p>
        </div>
        <div style={{
          padding: '16px 24px', borderTop: '1px solid #eee',
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          background: '#FAFAFA', borderRadius: '0 0 12px 12px',
        }}>
          <button className="o-btn o-btn-secondary" onClick={onCancel}>{cancelLabel}</button>
          <button
            className={`o-btn ${danger ? '' : 'o-btn-primary'}`}
            onClick={onConfirm}
            style={danger ? { background: '#DC3545', color: '#fff', borderColor: '#DC3545' } : {}}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

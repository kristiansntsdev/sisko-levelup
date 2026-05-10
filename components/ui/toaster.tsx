'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import {
  type ToastData,
  type ToastVariant,
  removeToast,
  subscribe,
  getSnapshot,
  getServerSnapshot,
} from '@/hooks/use-toast';

const variantConfig: Record<
  ToastVariant,
  { borderColor: string; icon: string }
> = {
  success: { borderColor: 'var(--green)', icon: '✓' },
  error: { borderColor: 'var(--red)', icon: '✕' },
  warning: { borderColor: 'var(--amber)', icon: '⚠' },
  info: { borderColor: 'var(--accent)', icon: 'ℹ' },
};

function ToastItem({ toast }: { toast: ToastData }) {
  const [visible, setVisible] = useState(false);
  const dismissedRef = useRef(false);

  const variant = toast.variant ?? 'info';
  const { borderColor, icon } = variantConfig[variant];

  function dismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
    setTimeout(() => removeToast(toast.id), 200);
  }

  useEffect(() => {
    // Enter animation: trigger on next frame
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = setTimeout(dismiss, toast.duration ?? 4000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 14px',
        background: 'white',
        borderRadius: '12px',
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.2s ease, transform 0.2s ease',
        pointerEvents: 'all',
      }}
    >
      <span style={{ fontSize: '15px', lineHeight: 1, flexShrink: 0 }}>
        {icon}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fg)' }}>
          {toast.title}
        </div>
        {toast.description && (
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
            {toast.description}
          </div>
        )}
      </div>
      <button
        onClick={dismiss}
        aria-label="Tutup"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--subtle)',
          cursor: 'pointer',
          fontSize: '18px',
          lineHeight: 1,
          padding: '0 2px',
          flexShrink: 0,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '12px',
        right: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        pointerEvents: 'none',
        maxWidth: '420px',
        margin: '0 auto',
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

'use client';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  title: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type Listener = (toasts: ToastData[]) => void;

// Module-level singleton — no Provider needed
let toasts: ToastData[] = [];
const listeners = new Set<Listener>();

function notify() {
  const snapshot = [...toasts];
  listeners.forEach((l) => l(snapshot));
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): ToastData[] {
  return toasts;
}

export function addToast(data: Omit<ToastData, 'id'>): string {
  const id = Math.random().toString(36).slice(2, 9);
  toasts = [...toasts, { ...data, id }];
  notify();
  return id;
}

export function removeToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function useToast() {
  return {
    toast(data: Omit<ToastData, 'id'>) {
      return addToast(data);
    },
  };
}

const EMPTY_TOASTS: ToastData[] = [];

function getServerSnapshot(): ToastData[] {
  return EMPTY_TOASTS;
}

export { subscribe, getSnapshot, getServerSnapshot };

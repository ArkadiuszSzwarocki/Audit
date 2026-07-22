'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ConfirmModalData {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void | Promise<void>;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
  showConfirm: (data: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void | Promise<void>;
  }) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showConfirm = useCallback((data: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDanger?: boolean;
    onConfirm: () => void | Promise<void>;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: data.title,
      message: data.message,
      confirmText: data.confirmText || 'Potwierdź',
      cancelText: data.cancelText || 'Anuluj',
      isDanger: data.isDanger !== undefined ? data.isDanger : true,
      onConfirm: data.onConfirm,
    });
  }, []);

  const handleConfirmAction = async () => {
    const action = confirmModal.onConfirm;
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
    try {
      await action();
    } catch (error: any) {
      showToast(error.message || 'Błąd podczas wykonywania akcji', 'error');
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Kontener Powiadomień Popup (Toast Notifications) */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none print:hidden">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md flex items-center justify-between gap-3 animate-in slide-in-from-top-5 duration-300 ${
              toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100'
                : toast.type === 'error'
                ? 'bg-red-950/90 border-red-500/40 text-red-100'
                : 'bg-slate-900/90 border-slate-700/60 text-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              {toast.type === 'success' && (
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {toast.type === 'error' && (
                <div className="w-8 h-8 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {toast.type === 'info' && (
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              )}
              <p className="text-xs font-semibold leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Aplikacyjny Modal Potwierdzenia (Replaces window.confirm) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 print:hidden animate-in fade-in duration-200">
          <div className="glass-card max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-200 border-slate-700/60 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                confirmModal.isDanger ? 'bg-red-500/20 text-red-400' : 'bg-brand-500/20 text-brand-400'
              }`}>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{confirmModal.title}</h3>
              </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmModal.message}
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition-all"
              >
                {confirmModal.cancelText}
              </button>
              <button
                onClick={handleConfirmAction}
                className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all ${
                  confirmModal.isDanger
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20'
                    : 'bg-brand-600 hover:bg-brand-500 shadow-brand-500/20'
                }`}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

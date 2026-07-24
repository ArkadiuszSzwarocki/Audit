'use client';

import { useState, useEffect } from 'react';

interface PromptEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  title?: string;
  onConfirm: (email: string) => void;
}

export function PromptEmailModal({
  isOpen,
  onClose,
  defaultEmail = '',
  title = '📧 Powiadomienie E-mail',
  onConfirm,
}: PromptEmailModalProps) {
  const [email, setEmail] = useState(defaultEmail);

  useEffect(() => {
    setEmail(defaultEmail);
  }, [defaultEmail, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    onConfirm(email.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Adres E-mail Odbiorców *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="np. kierownik.zmiany@zaklad.pl"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer transition-colors"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={!email.trim()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md disabled:opacity-50 cursor-pointer transition-all flex items-center gap-1.5"
            >
              📧 Pobierz Powiadomienie (.eml)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

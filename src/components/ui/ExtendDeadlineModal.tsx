'use client';

import { useState } from 'react';

interface ExtendDeadlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDueDate?: string | Date | null;
  onExtend: (newDueDate: string, reason: string) => Promise<void>;
}

export function ExtendDeadlineModal({ isOpen, onClose, currentDueDate, onExtend }: ExtendDeadlineModalProps) {
  const [newDueDate, setNewDueDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDueDate || !reason.trim()) return;
    setIsSubmitting(true);
    try {
      await onExtend(newDueDate, reason.trim());
      setNewDueDate('');
      setReason('');
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          📅 Przedłużenie terminu zadania
        </h3>

        {currentDueDate && (
          <p className="text-xs text-slate-500 font-medium">
            Obecny termin: <span className="font-bold text-slate-700 dark:text-slate-300">{new Date(currentDueDate).toLocaleDateString('pl-PL')}</span>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Nowy termin rozwiązania *
            </label>
            <input
              required
              type="date"
              value={newDueDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setNewDueDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Powód przedłużenia (wymagane) *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="np. Brak części w magazynie - zamówiono uszczelkę, oczekiwana dostawa w czwartek"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 outline-none text-sm focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !newDueDate || !reason.trim()}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-md disabled:opacity-50"
            >
              {isSubmitting ? 'Zapisywanie...' : 'Zatwierdź przedłużenie'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

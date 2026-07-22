'use client';

import { useState } from 'react';
import { useToast } from '@/context/ToastContext';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { showToast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast('Wypełnij wszystkie pola formularza', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('Nowe hasła nie są identyczne', 'error');
      return;
    }

    if (newPassword.length < 4) {
      showToast('Nowe hasło musi mieć co najmniej 4 znaki', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/user-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd zmiany hasła');

      showToast('🔑 Hasło zostało pomyślnie zmienione!', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
        <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔒</span>
            <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
              Zmiana Hasła Konta
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Obecne Hasło *
            </label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Wpisz swoje obecne hasło"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Nowe Hasło *
            </label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Wpisz nowe bezpieczne hasło"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Powtórz Nowe Hasło *
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Wpisz ponownie nowe hasło"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Zapisywanie...' : 'Zmień Hasło'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

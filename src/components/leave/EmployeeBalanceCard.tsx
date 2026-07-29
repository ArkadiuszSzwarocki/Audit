'use client';

import React, { useState } from 'react';

interface EmployeeBalanceCardProps {
  balance: any;
  onAdjust?: (adjustment: number) => void;
  onSetTotal?: (newTotal: number) => void;
  onSetOverdue?: (newOverdue: number) => void;
  loading?: boolean;
}

export function EmployeeBalanceCard({
  balance,
  onAdjust,
  onSetTotal,
  onSetOverdue,
  loading = false,
}: EmployeeBalanceCardProps) {
  const [showOverdueForm, setShowOverdueForm] = useState(false);
  const [showTotalForm, setShowTotalForm] = useState(false);

  const [overdueInput, setOverdueInput] = useState(balance.overdueDays || 0);
  const [totalInput, setTotalInput] = useState(balance.totalDays || 26);

  const remainingOverdue = Math.max(0, (balance.overdueDays || 0) - (balance.usedOverdueDays || 0));
  const remainingCurrent = Math.max(0, (balance.totalDays || 26) - (balance.usedDays || 0));
  const totalAvailable = remainingOverdue + remainingCurrent;

  const handleSaveOverdue = () => {
    onSetOverdue?.(Number(overdueInput) || 0);
    setShowOverdueForm(false);
  };

  const handleSaveTotal = () => {
    onSetTotal?.(Number(totalInput) || 0);
    setShowTotalForm(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-md hover:shadow-xl transition-all space-y-5">
      {/* Nagłówek Pracownika */}
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>👤</span> {balance.user.name}
          </h3>
          <p className="text-xs font-semibold text-slate-400">
            Login: {balance.user.login} {balance.user.role ? `• Rola: ${balance.user.role}` : ''}
          </p>
          {balance.user.department && (
            <p className="text-xs font-bold text-brand-600 dark:text-brand-400 mt-0.5">
              🏢 Dział: {balance.user.department.name}
            </p>
          )}
        </div>

        <div className="text-right">
          <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Łącznie Dostępne</span>
          <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{totalAvailable} <span className="text-xs font-bold">dni</span></span>
        </div>
      </div>

      {/* Grid: Urlop Zaległy 2025 vs Urlop Bieżący 2026 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        
        {/* KARTA 1: URLOP ZALEGŁY Z 2025 R. */}
        <div className="p-4 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
              <span>📋</span> Zaległy (2025 r.)
            </span>
            <button
              onClick={() => setShowOverdueForm(!showOverdueForm)}
              disabled={loading}
              className="text-[11px] font-extrabold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
            >
              ✏️ Zmień Zaległy
            </button>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-amber-900 dark:text-amber-200">
                {remainingOverdue} <span className="text-xs font-bold">zostało</span>
              </span>
              <div className="text-[10px] text-amber-700/80 dark:text-amber-400 font-medium">
                Przyznane: {balance.overdueDays || 0} dn. | Użyte: {balance.usedOverdueDays || 0} dn.
              </div>
            </div>
          </div>

          {showOverdueForm && (
            <div className="pt-2 border-t border-amber-200 dark:border-amber-800/60 space-y-2 animate-in fade-in">
              <label className="block text-[11px] font-bold text-amber-900 dark:text-amber-200">
                Wpisz wymiar zaległego urlopu 2025 (dni):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={overdueInput}
                  onChange={e => setOverdueInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-amber-300 dark:border-amber-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-xs"
                />
                <button
                  onClick={handleSaveOverdue}
                  disabled={loading}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Zapisz
                </button>
              </div>
            </div>
          )}
        </div>

        {/* KARTA 2: URLOP BIEŻĄCY 2026 R. */}
        <div className="p-4 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-wider flex items-center gap-1">
              <span>🌴</span> Bieżący (2026 r.)
            </span>
            <button
              onClick={() => setShowTotalForm(!showTotalForm)}
              disabled={loading}
              className="text-[11px] font-extrabold text-blue-700 dark:text-blue-300 hover:underline cursor-pointer"
            >
              ✏️ Zmień Pulę
            </button>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <span className="text-2xl font-black text-blue-900 dark:text-blue-200">
                {remainingCurrent} <span className="text-xs font-bold">zostało</span>
              </span>
              <div className="text-[10px] text-blue-700/80 dark:text-blue-400 font-medium">
                Pula: {balance.totalDays || 26} dn. | Użyte: {balance.usedDays || 0} dn.
              </div>
            </div>
          </div>

          {showTotalForm && (
            <div className="pt-2 border-t border-blue-200 dark:border-blue-800/60 space-y-2 animate-in fade-in">
              <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-200">
                Wpisz wymiar puli bieżącej (dni):
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  value={totalInput}
                  onChange={e => setTotalInput(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-950 border border-blue-300 dark:border-blue-700 rounded-xl font-bold text-slate-800 dark:text-slate-100 text-xs"
                />
                <button
                  onClick={handleSaveTotal}
                  disabled={loading}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Zapisz
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* INFORMACJA O PIERWSZEŃSTWIE ODILICZANIA */}
      <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-semibold">
        <span className="text-lg flex-shrink-0">⚡</span>
        <div>
          <strong>Zasada rozliczania:</strong> Składany wniosek urlopowy schodzi w pierwszej kolejności z <strong>Urlopu Zaległego 2025 r.</strong>, a po jego wyczerpaniu z puli bieżącej.
        </div>
      </div>
    </div>
  );
}

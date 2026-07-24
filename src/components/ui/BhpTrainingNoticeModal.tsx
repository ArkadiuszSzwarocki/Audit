'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { shouldShowBhpNotice } from '@/utils/bhpDateUtils';

export function BhpTrainingNoticeModal() {
  const { showToast } = useToast();
  const [noticeData, setNoticeData] = useState<{
    show: boolean;
    dueDate: string | null;
    remainingBusinessDays: number;
    activeThreshold: number | null;
  }>({
    show: false,
    dueDate: null,
    remainingBusinessDays: 9999,
    activeThreshold: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/user-profile');
      if (res.ok) {
        const data = await res.json();
        if (data.bhpTrainingDueDate) {
          const check = shouldShowBhpNotice(data.bhpTrainingDueDate, data.dismissedBhpNoticeThreshold);
          setNoticeData({
            show: check.show,
            dueDate: data.bhpTrainingDueDate,
            remainingBusinessDays: check.remainingBusinessDays,
            activeThreshold: check.activeThreshold,
          });
        }
      }
    } catch (err) {
      console.error('Błąd pobierania danych BHP użytkownika:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    if (noticeData.activeThreshold === null) return;
    try {
      const res = await fetch('/api/user-profile/bhp-dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: noticeData.activeThreshold }),
      });

      if (res.ok) {
        setNoticeData((prev) => ({ ...prev, show: false }));
        showToast('Potwierdzono zapoznanie się z terminem BHP. Powiadomienie zostało ukryte.', 'success');
      }
    } catch (err) {
      console.error('Błąd odrzucenia powiadomienia BHP:', err);
    }
  };

  if (loading || !noticeData.show || !noticeData.dueDate) return null;

  const formattedDueDate = new Date(noticeData.dueDate).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const isExpired = noticeData.remainingBusinessDays <= 0;
  const isUrgent = noticeData.remainingBusinessDays <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-amber-500 dark:border-amber-600 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`p-5 text-white flex items-center gap-4.5 ${
            isExpired
              ? 'bg-gradient-to-r from-red-600 to-rose-700'
              : isUrgent
              ? 'bg-gradient-to-r from-orange-600 to-red-600'
              : 'bg-gradient-to-r from-amber-600 to-orange-600'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0">
            {isExpired ? '🚨' : '🦺'}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-200 tracking-wider">
              SYSTEM BEZPIECZEŃSTWA I HIGIENY PRACY (BHP)
            </div>
            <h2 className="text-lg font-black tracking-tight leading-snug">
              {isExpired ? 'Wygasły Termin Szkolenia BHP!' : 'Przypomnienie o Szkoleniu BHP'}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm text-slate-800 dark:text-slate-200">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                Data Ważności Szkolenia:
              </span>
              <span className="font-mono text-base font-black text-amber-900 dark:text-amber-200">
                {formattedDueDate}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-amber-200/60 dark:border-amber-800/60 pt-2">
              <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                Pozostało dni (z sobotami i niedzielami):
              </span>
              <span
                className={`font-black text-base px-2.5 py-0.5 rounded-lg ${
                  isExpired
                    ? 'bg-red-600 text-white'
                    : isUrgent
                    ? 'bg-orange-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isExpired
                  ? `Przekroczono! (${Math.abs(noticeData.remainingBusinessDays)} dni)`
                  : `${noticeData.remainingBusinessDays} dni`}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isExpired ? (
              <>
                Twoje okresowe szkolenie BHP <strong>wygasło</strong>. Prosimy o natychmiastowy kontakt z Inspektorem BHP w celu wyznaczenia nowego terminu.
              </>
            ) : (
              <>
                Zbliża się termin ważności Twojego okresowego szkolenia BHP. Prosimy o powiadomienie przełożonego oraz Działu BHP w celu odbycia odnowienia szkolenia przed upływem wyznaczonej daty.
              </>
            )}
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleDismiss}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✅</span> Tak, pamiętam — nie pokazuj ponownie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

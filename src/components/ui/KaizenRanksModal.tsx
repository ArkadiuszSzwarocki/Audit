'use client';

import { useEffect } from 'react';

interface KaizenRanksModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPoints?: number;
  currentRank?: string;
}

const RANKS = [
  { minPoints: 0, maxPoints: 0, title: '🌱 Początkujący Innowator', desc: 'Poziom startowy po zarejestrowaniu w systemie.' },
  { minPoints: 1, maxPoints: 49, title: '🥉 Brązowy Udoskonalacz', desc: 'Pierwsze zatwierdzone pomysły usprawniające pracę.' },
  { minPoints: 50, maxPoints: 149, title: '🥈 Srebrny Udoskonalacz', desc: 'Aktywny udział w eliminacji marnotrawstw (Muda).' },
  { minPoints: 150, maxPoints: 299, title: '🥇 Złoty Udoskonalacz', desc: 'Znaczące oszczędności czasu, surowców i poprawa ergonomii.' },
  { minPoints: 300, maxPoints: '∞', title: '🏆 Mistrz Kaizen & Lean', desc: 'Lider kultury ciągłego doskonalenia na produkcji.' },
];

export function KaizenRanksModal({ isOpen, onClose, currentPoints = 0, currentRank }: KaizenRanksModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handler);
    }
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
        >
          ✕
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⭐</span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              System Rang i Punktacji Kaizen
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Ranga odzwierciedla Twoją aktywność w zgłaszaniu pomysłów usprawniających na produkcji. Punkty są przyznawane przez komisję po zatwierdzeniu Kaizena.
          </p>
        </div>

        {/* Current status pill */}
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
              Twój Aktualny Wynik
            </span>
            <span className="text-sm font-black text-amber-900 dark:text-amber-100">
              {currentRank || '🌱 Początkujący Innowator'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
              Suma Punktów
            </span>
            <span className="text-base font-black text-amber-900 dark:text-amber-200">
              ⭐ {currentPoints} pkt
            </span>
          </div>
        </div>

        {/* Ranks list */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {RANKS.map((r, idx) => {
            const isCurrent = currentPoints >= (typeof r.minPoints === 'number' ? r.minPoints : 0) &&
              (r.maxPoints === '∞' || currentPoints <= (r.maxPoints as number));

            return (
              <div
                key={idx}
                className={`p-3 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-amber-100/70 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 shadow-sm ring-2 ring-amber-500/20'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-slate-800 dark:text-slate-100">
                    {r.title}
                  </span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 px-2.5 py-0.5 bg-white dark:bg-slate-900 rounded-lg border border-amber-200 dark:border-amber-800">
                    {r.minPoints} - {r.maxPoints} pkt
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {r.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>💡 Im więcej wartościowych zgłoszeń, tym wyższa ranga!</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Zamknij
          </button>
        </div>

      </div>
    </div>
  );
}

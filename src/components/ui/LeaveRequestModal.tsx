'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLeaves } from '@/hooks/useLeaves';
import { useAuth } from '@/hooks/useAuth';

interface LeaveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  startDate?: Date;
  endDate?: Date;
  onLeaveRequestCreated?: () => void;
}

export const LEAVE_TYPES = [
  // 1. Urlopy Wypoczynkowe i na żądanie
  { value: 'VACATION', label: '🏖️ Urlop Wypoczynkowy (art. 152 KP)', color: '#10b981', category: 'Pula roczna (20 lub 26 dni)' },
  { value: 'ON_DEMAND', label: '📋 Urlop na Żądanie (art. 167² KP)', color: '#8b5cf6', category: 'Max 4 dni w roku kalendarzowym', requiredDoc: 'Limit 4 dni w roku jest automatycznie kontrolowany przez system.' },
  { value: 'UNPAID', label: '⚠️ Urlop Bezpłatny (art. 174 KP)', color: '#f59e0b', category: 'Bez prawa do wynagrodzenia' },

  // 2. Zdrowie i niezdolność do pracy
  { value: 'SICK_LEAVE', label: '🏥 Zwolnienie Lekarskie (L4)', color: '#ef4444', category: 'Zasiłek / Wynagrodzenie chorobowe ZUS', requiredDoc: 'Wymagane elektroniczne zaświadczenie e-ZLA z ZUS lub przedłożenie zaświadczenia lekarskiego w Dziale HR.' },

  // 3. Uprawnienia rodzicielskie i opiekuńcze
  { value: 'MATERNITY', label: '👶 Urlop Macierzyński (art. 180 KP)', color: '#ec4899', category: '20 - 37 tygodni po urodzeniu', requiredDoc: 'Wymagane przedłożenie skróconego odpisu aktu urodzenia dziecka w Dziale Kadrowo-Płacowym (HR).' },
  { value: 'PARENTAL', label: '🍼 Urlop Rodzicielski (art. 182¹a KP)', color: '#f43f5e', category: 'Do 41 lub 43 tygodni', requiredDoc: 'Wymagane przedłożenie odpisu aktu urodzenia dziecka oraz oświadczenia drugiego rodzica w Dziale HR.' },
  { value: 'PATERNITY', label: '👨‍🍼 Urlop Ojcowski (art. 182³ KP)', color: '#3b82f6', category: '2 tygodnie dla ojca dziecka', requiredDoc: 'Wymagane przedłożenie skróconego odpisu aktu urodzenia dziecka oraz oświadczenia w Dziale HR.' },
  { value: 'CHILD_CARE', label: '🧸 Urlop Wychowawczy (art. 186 KP)', color: '#a855f7', category: 'Do 36 miesięcy na opiekę nad dzieckiem', requiredDoc: 'Wymagane przedłożenie aktu urodzenia dziecka oraz wniosku z oświadczeniem drugiego rodzica w Dziale HR.' },
  { value: 'CHILD_CARE_ART188', label: '👧 Opieka nad Dzieckiem (art. 188 KP)', color: '#06b6d4', category: '2 dni lub 16h w roku (płatne 100%)', requiredDoc: 'Wymagane złożenie corocznego oświadczenia rodzica o korzystaniu z prawa do opieki nad dzieckiem do lat 14 w Dziale HR.' },
  { value: 'FORCE_MAJEURE', label: '🚨 Siła Wyższa (art. 148¹ KP)', color: '#eab308', category: '2 dni lub 16h (płatne 50%) - pilne sprawy rodzinne', requiredDoc: 'Wymagane pisemne uzasadnienie nagłej nieobecności spowodowanej wypadkiem lub chorobą członka rodziny w Dziale HR.' },
  { value: 'CARER_LEAVE', label: '🧑‍🦽 Urlop Opiekuńczy (art. 173¹ KP)', color: '#6366f1', category: '5 dni niepłatnych na opiekę z przyczyn medycznych', requiredDoc: 'Wymagane podanie we wniosku przyczyn medycznych opieki oraz stopnia pokrewieństwa / adresu zamieszkania w Dziale HR.' },

  // 4. Okolicznościowe, szkoleniowe i specjalne
  { value: 'SPECIAL', label: '💍 Urlop Okolicznościowy (Ślub, Pogrzeb, Narodziny)', color: '#14b8a6', category: '1 lub 2 dni zwolnienia na zdarzenie rodzinne', requiredDoc: 'Wymagane przedłożenie odpowiedniego aktu (akt małżeństwa, akt urodzenia dziecka lub akt zgonu) w Dziale HR.' },
  { value: 'TRAINING', label: '🎓 Urlop Szkoleniowy (art. 103² KP)', color: '#0284c7', category: '6 lub 21 dni na egzaminy / pracę dyplomową', requiredDoc: 'Wymagane przedłożenie zaświadczenia z uczelni/szkoły o terminach egzaminów lub obrony pracy w Dziale HR.' },
  { value: 'BLOOD_DONOR', label: '🩸 Oddanie Krwi / Szpiku', color: '#dc2626', category: '2 dni wolnego za honorowe oddanie krwi', requiredDoc: 'Wymagane przedłożenie imiennego zaświadczenia ze Stacji Krwiodawstwa i Krwiolecznictwa (RCKiK) w Dziale HR.' },
  { value: 'REHABILITATION', label: '♿ Urlop Rehabilitacyjny', color: '#059669', category: 'Dodatkowe 10 dni dla niepełnosprawnych', requiredDoc: 'Wymagane przedłożenie orzeczenia o niepełnosprawności oraz zaświadczenia lekarskiego / skierowania w Dziale HR.' },
];

export function LeaveRequestModal({
  isOpen,
  onClose,
  startDate,
  endDate,
  onLeaveRequestCreated
}: LeaveRequestModalProps) {
  const { user } = useAuth();
  const { createLeaveRequest, loading, error } = useLeaves();

  const [mounted, setMounted] = useState(false);
  const [leaveType, setLeaveType] = useState<string>('VACATION');
  const [reason, setReason] = useState('');
  const [managerId, setManagerId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (!isOpen) return null;

  const selectedTypeMeta = LEAVE_TYPES.find(t => t.value === leaveType) || LEAVE_TYPES[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      setToastMessage({ text: 'Wybierz daty', type: 'error' });
      return;
    }

    setIsSubmitting(true);

    try {
      await createLeaveRequest({
        startDate,
        endDate,
        type: leaveType as any,
        reason: reason || undefined,
        managerId: managerId || undefined
      });

      setToastMessage({ text: 'Wniosek urlopowy został złożony!', type: 'success' });
      setLeaveType('VACATION');
      setReason('');
      setManagerId('');

      if (onLeaveRequestCreated) {
        setTimeout(() => {
          onLeaveRequestCreated();
          onClose();
        }, 1500);
      } else {
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Błąd przy tworzeniu wniosku';
      setToastMessage({ text: errorMessage, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setToastMessage(null);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
        {/* Nagłówek */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-brand-600 to-indigo-700 text-white px-6 py-4 flex justify-between items-center shadow-md">
          <div>
            <h2 className="text-xl font-black flex items-center gap-2">
              <span>📅</span> Nowy Wniosek Urlopowy
            </h2>
            <p className="text-xs text-brand-100 font-medium">Zgodnie z wymogami polskiego Kodeksu Pracy</p>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-white hover:bg-white/20 p-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Zawartość */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-slate-800 dark:text-slate-100">
          {/* Wybrane daty */}
          <div className="bg-blue-50/80 dark:bg-slate-800 border border-blue-200 dark:border-slate-700 rounded-2xl p-4">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-1.5">
              <span>📆</span> Wybrany Okres Wniosku
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Data początkowa</label>
                <input
                  type="text"
                  value={startDate?.toLocaleDateString('pl-PL') || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Data końcowa</label>
                <input
                  type="text"
                  value={endDate?.toLocaleDateString('pl-PL') || ''}
                  readOnly
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-xs"
                />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-700 dark:text-slate-300 font-medium">
              <strong>Liczba dni roboczych:</strong>{' '}
              <span className="font-black text-brand-600 dark:text-brand-400">
                {startDate && endDate
                  ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
                  : 0} dni
              </span>
            </div>
          </div>

          {/* Typ urlopu */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Wybierz Rodzaj Urlopu (Kodeks Pracy)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[260px] overflow-y-auto pr-1">
              {LEAVE_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setLeaveType(type.value)}
                  className={`p-3 rounded-2xl border-2 transition-all text-left cursor-pointer flex flex-col justify-between ${
                    leaveType === type.value
                      ? 'border-brand-600 bg-brand-50/60 dark:bg-brand-950/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{type.label}</div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">{type.category}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Ramka informacyjna o wybranym typie i wymogach HR */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs space-y-2">
            <div className="font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <span>📌</span> {selectedTypeMeta.label}
            </div>
            <div className="text-slate-600 dark:text-slate-300 text-[11px]">
              {selectedTypeMeta.category}
            </div>

            {selectedTypeMeta.requiredDoc ? (
              <div className="mt-2 pt-2 border-t border-amber-200 dark:border-amber-900/60 bg-amber-50/90 dark:bg-amber-950/50 p-3 rounded-xl text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-black flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-800 dark:text-amber-300">
                  <span>📄</span> Obowiązek przedłożenia dokumentacji do Działu HR:
                </div>
                <p className="text-[11px] font-semibold leading-relaxed">
                  {selectedTypeMeta.requiredDoc}
                </p>
              </div>
            ) : (
              <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 font-medium">
                ℹ️ Dla tego typu urlopu wniosek w systemie jest wystarczający (nie wymaga składania dokumentów papierowych).
              </div>
            )}
          </div>

          {/* Powód */}
          <div>
            <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
              📝 Uwagi / Powód (opcjonalnie)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Wpisz uzasadnienie wniosku..."
              className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={2}
            />
          </div>

          {/* Komunikat powiadomienia */}
          {toastMessage && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold text-center ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              {toastMessage.text}
            </div>
          )}

          {/* Przyciski */}
          <div className="flex gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl text-xs transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Zapisywanie...' : '✉️ Złóż Wniosek Urlopowy'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

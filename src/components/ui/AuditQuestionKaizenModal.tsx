'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

interface AuditQuestionKaizenModalProps {
  isOpen: boolean;
  questionId: string;
  questionText: string;
  questionCode?: string | null;
  chapterName?: string;
  guidance?: string | null;
  comment?: string;
  photoUrl?: string | null;
  areaId?: string | null;
  machineId?: string | null;
  onClose: () => void;
  onSubmitSuccess: () => void;
}

export function AuditQuestionKaizenModal({
  isOpen,
  questionId,
  questionText,
  questionCode,
  chapterName,
  guidance,
  comment,
  photoUrl,
  areaId,
  machineId,
  onClose,
  onSubmitSuccess,
}: AuditQuestionKaizenModalProps) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [submittedBy, setSubmittedBy] = useState('');
  const [benefits, setBenefits] = useState('');
  const [description, setDescription] = useState('');
  const [usersList, setUsersList] = useState<{ id: string; name: string; login: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultUser = user?.name || user?.login || '';
      setSubmittedBy(defaultUser);
      setBenefits('');
      
      const fullDesc = `Punkt Audytowy [${chapterName || 'Audyt'}]: ${questionText}${guidance ? `\nWymóg IFS: ${guidance}` : ''}${comment ? `\nUwagi audytora: ${comment}` : ''}`;
      setDescription(fullDesc);

      fetch('/api/users')
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) setUsersList(data);
        })
        .catch(console.error);
    }
  }, [isOpen, user, questionText, guidance, comment, chapterName]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittedBy.trim()) {
      showToast('Podaj lub wybierz osobę zgłaszającą Kaizen!', 'error');
      return;
    }
    if (!benefits.trim()) {
      showToast('Wpisz oczekiwane korzyści z udoskonalenia!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const titleText = `[Audyt] ${questionCode ? questionCode + ': ' : ''}${questionText}`;
      const finalTitle = titleText.length > 80 ? `${titleText.slice(0, 80)}...` : titleText;

      const res = await fetch('/api/kaizen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: finalTitle,
          description,
          benefits: benefits.trim(),
          submittedBy: submittedBy.trim(),
          areaId: areaId || undefined,
          machineId: machineId || undefined,
          photoUrl: photoUrl || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Błąd tworzenia wniosku Kaizen');

      showToast('💡 Pomyślnie zgłoszono wniosek Kaizen z pytania audytowego!', 'success');
      onSubmitSuccess();
      onClose();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="font-extrabold text-base leading-snug">Zgłoś Wniosek Kaizen z Audytu</h3>
              <p className="text-xs text-amber-100 opacity-90">Przepisz ten punkt audytowy bezpośrednio do rejestru udoskonalenia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Question Summary */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-xl space-y-1 text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-300">
              📌 {questionCode ? `${questionCode} — ` : ''}{chapterName}
            </div>
            <div className="text-slate-700 dark:text-slate-300 font-medium">
              {questionText}
            </div>
          </div>

          {/* Submitted By Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              👤 Kto zgłasza / Odpowiedzialny <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={submittedBy}
                onChange={(e) => setSubmittedBy(e.target.value)}
                placeholder="Imię i Nazwisko pracownika"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none"
              />
              {usersList.length > 0 && (
                <select
                  onChange={(e) => {
                    if (e.target.value) setSubmittedBy(e.target.value);
                  }}
                  value=""
                  className="px-2.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="" disabled>Wybierz z listy</option>
                  {usersList.map((u) => (
                    <option key={u.id} value={u.name || u.login}>
                      {u.name} ({u.login})
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Benefits Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              🚀 Oczekiwane Korzyści i Efekt <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={benefits}
              onChange={(e) => setBenefits(e.target.value)}
              placeholder="np. Oszczędność czasu 15 minut na zmianę, usprawnienie ergonomii stanowiska i wyeliminowanie ryzyka zanieczyszczenia."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Description Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              📝 Opis i Wytyczne Udoskonalenia
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              Anuluj
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Zgłaszanie...' : '💡 Utwórz Wniosek Kaizen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

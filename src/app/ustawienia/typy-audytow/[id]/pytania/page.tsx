'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/ToastContext';

interface Question {
  id: string;
  chapter: string;
  code: string | null;
  questionText: string;
  guidance: string | null;
  isKnockOut: boolean;
  sortOrder: number;
}

export default function AuditTypeQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const { showToast, showConfirm } = useToast();

  const isAuditorOrAdmin = isAdmin || user?.role === 'AUDITOR' || user?.role === 'ADMIN';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [auditTypeName, setAuditTypeName] = useState('');
  const [loading, setLoading] = useState(true);

  // New Question Form State
  const [isAdding, setIsAdding] = useState(false);
  const [chapter, setChapter] = useState('1. Kierownictwo i ciągłe doskonalenie');
  const [code, setCode] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [guidance, setGuidance] = useState('');
  const [isKnockOut, setIsKnockOut] = useState(false);

  // Editing Question State
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editChapter, setEditChapter] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editGuidance, setEditGuidance] = useState('');
  const [editIsKnockOut, setEditIsKnockOut] = useState(false);

  useEffect(() => {
    fetchAuditTypeAndQuestions();
  }, [resolvedParams.id]);

  const fetchAuditTypeAndQuestions = async () => {
    setLoading(true);
    try {
      const resType = await fetch(`/api/audit-types`);
      if (resType.ok) {
        const types = await resType.json();
        const current = types.find((t: any) => t.id === resolvedParams.id);
        if (current) setAuditTypeName(current.name);
      }

      const resQ = await fetch(`/api/audit-types/${resolvedParams.id}/questions`);
      if (resQ.ok) {
        const qData = await resQ.json();
        setQuestions(Array.isArray(qData) ? qData : []);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      showToast('Treść pytania jest wymagana', 'error');
      return;
    }

    if (code.trim()) {
      const isDup = questions.some(q => q.code?.trim().toLowerCase() === code.trim().toLowerCase());
      if (isDup) {
        showToast(`Pytanie o numerze "${code.trim()}" już istnieje w tej formatce! Wybierz inny numer.`, 'error');
        return;
      }
    }

    try {
      const res = await fetch(`/api/audit-types/${resolvedParams.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: chapter.trim(),
          code: code.trim() || null,
          questionText: questionText.trim(),
          guidance: guidance.trim() || null,
          isKnockOut,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }

      showToast('Pytanie dodane do formatki!', 'success');
      setQuestionText('');
      setCode('');
      setGuidance('');
      setIsKnockOut(false);
      setIsAdding(false);
      fetchAuditTypeAndQuestions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const startEditing = (q: Question) => {
    setEditingQuestionId(q.id);
    setEditChapter(q.chapter);
    setEditCode(q.code || '');
    setEditQuestionText(q.questionText);
    setEditGuidance(q.guidance || '');
    setEditIsKnockOut(q.isKnockOut);
  };

  const cancelEditing = () => {
    setEditingQuestionId(null);
  };

  const handleUpdateQuestion = async (e: React.FormEvent, questionId: string) => {
    e.preventDefault();
    if (!editQuestionText.trim()) {
      showToast('Treść pytania jest wymagana', 'error');
      return;
    }

    if (editCode.trim()) {
      const isDup = questions.some(
        q => q.id !== questionId && q.code?.trim().toLowerCase() === editCode.trim().toLowerCase()
      );
      if (isDup) {
        showToast(`Pytanie o numerze "${editCode.trim()}" już istnieje w tej formatce! Wybierz inny numer.`, 'error');
        return;
      }
    }

    try {
      const res = await fetch(`/api/audit-types/${resolvedParams.id}/questions/${questionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter: editChapter.trim(),
          code: editCode.trim() || null,
          questionText: editQuestionText.trim(),
          guidance: editGuidance.trim() || null,
          isKnockOut: editIsKnockOut,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Błąd aktualizacji pytania');
      }

      showToast('✏️ Pytanie zostało zaktualizowane!', 'success');
      setEditingQuestionId(null);
      fetchAuditTypeAndQuestions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteQuestion = (questionId: string, textSnippet: string) => {
    showConfirm({
      title: 'Usuwanie Pytania z Formatki',
      message: `Czy na pewno chcesz usunąć to pytanie z formatki audytowej?\n"${textSnippet.slice(0, 60)}..."`,
      confirmText: 'Usuń pytanie',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/audit-types/${resolvedParams.id}/questions/${questionId}`, {
            method: 'DELETE',
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Błąd usuwania pytania');
          }

          showToast('🗑️ Pytanie zostało usunięte z formatki', 'success');
          fetchAuditTypeAndQuestions();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  if (!isAuditorOrAdmin) {
    return (
      <div className="p-8 text-center glass-card max-w-xl mx-auto my-12">
        <h2 className="text-xl font-bold text-red-600">Brak Uprawnień</h2>
        <p className="text-sm text-slate-500 mt-2">
          Tylko rola <strong>Audytor</strong> oraz <strong>Administrator</strong> tworzy i edytuje formatkę z pytaniami.
        </p>
      </div>
    );
  }

  const chapters = Array.from(new Set(questions.map(q => q.chapter)));

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <button
            onClick={() => router.push('/ustawienia/typy-audytow')}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 mb-2 cursor-pointer font-bold"
          >
            ← Wróć do typów audytów
          </button>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            📋 Formatka Pytań: {auditTypeName || 'Audyt'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Dodawaj, edytuj treść i zmieniaj wytyczne pytań kontrolnych dla tego typu audytu.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl shadow-md font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
        >
          {isAdding ? 'Zamknij formularz' : '+ Dodaj Nowe Pytanie'}
        </button>
      </div>

      {/* New Question Form */}
      {isAdding && (
        <form onSubmit={handleCreateQuestion} className="glass-card p-6 border-2 border-brand-500 space-y-4 animate-in slide-in-from-top duration-300">
          <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            ➕ Dodaj Nowe Pytanie do Formatki
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Rozdział / Sekcja *
              </label>
              <input
                type="text"
                required
                value={chapter}
                onChange={e => setChapter(e.target.value)}
                placeholder="np. 1. Kierownictwo i ciągłe doskonalenie"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Kod / Numer punktu
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="np. 1.2.1"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isKnockOut}
                  onChange={e => setIsKnockOut(e.target.checked)}
                  className="w-5 h-5 accent-red-600 rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                  🔴 Wymóg KO (Knock-Out)
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Treść Pytania / Wymagania *
            </label>
            <textarea
              required
              rows={2}
              value={questionText}
              onChange={e => setQuestionText(e.target.value)}
              placeholder="np. Czy kadra kierownicza sformułowała politykę jakości i kulturę bezpieczeństwa żywności?"
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Wytyczne / Standard IFS / Sposób weryfikacji
            </label>
            <input
              type="text"
              value={guidance}
              onChange={e => setGuidance(e.target.value)}
              placeholder="np. Wyjaśnij dowody audytowe, wymagane dokumenty lub wskaźniki KPI..."
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Anuluj
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors cursor-pointer"
            >
              Zapisz Pytanie do Formatki
            </button>
          </div>
        </form>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="text-center p-8 animate-pulse text-slate-400">Ładowanie pytań formatki...</div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12 glass-card font-bold text-slate-500">
          Brak pytań w tej formatce. Kliknij "+ Dodaj Nowe Pytanie" aby stworzyć pierwszy punkt.
        </div>
      ) : (
        <div className="space-y-6">
          {chapters.map((ch, idx) => {
            const chQuestions = questions.filter(q => q.chapter === ch);
            return (
              <div key={idx} className="space-y-3">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-xs">
                  <span>{ch}</span>
                  <span className="text-xs font-bold text-slate-500 bg-white dark:bg-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    {chQuestions.length} pytań
                  </span>
                </h3>

                <div className="space-y-3">
                  {chQuestions.map(q => {
                    const isEditingThis = editingQuestionId === q.id;

                    if (isEditingThis) {
                      return (
                        <form
                          key={q.id}
                          onSubmit={e => handleUpdateQuestion(e, q.id)}
                          className="glass-card p-5 border-2 border-amber-500 space-y-4 animate-in fade-in"
                        >
                          <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-2">
                            <h4 className="font-extrabold text-amber-800 dark:text-amber-300 text-sm flex items-center gap-2">
                              ✏️ Edytuj Treść Pytania [{q.code || 'Brak kodu'}]
                            </h4>
                            <span className="text-xs text-slate-400 font-mono">ID: {q.id.slice(0, 8)}...</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Rozdział / Sekcja *
                              </label>
                              <input
                                type="text"
                                required
                                value={editChapter}
                                onChange={e => setEditChapter(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                                Kod / Numer punktu
                              </label>
                              <input
                                type="text"
                                value={editCode}
                                onChange={e => setEditCode(e.target.value)}
                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                              />
                            </div>

                            <div className="flex items-center pt-5">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editIsKnockOut}
                                  onChange={e => setEditIsKnockOut(e.target.checked)}
                                  className="w-4 h-4 accent-red-600 rounded cursor-pointer"
                                />
                                <span className="text-xs font-bold text-red-600 uppercase tracking-wider">
                                  🔴 Wymóg KO (Knock-Out)
                                </span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                              Treść Pytania / Wymagania *
                            </label>
                            <textarea
                              required
                              rows={2}
                              value={editQuestionText}
                              onChange={e => setEditQuestionText(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                              Wytyczne / Standard IFS / Sposób weryfikacji
                            </label>
                            <input
                              type="text"
                              value={editGuidance}
                              onChange={e => setEditGuidance(e.target.value)}
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                            >
                              Anuluj
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow transition-all cursor-pointer"
                            >
                              💾 Zapisz Zmiany Pytania
                            </button>
                          </div>
                        </form>
                      );
                    }

                    return (
                      <div
                        key={q.id}
                        className="glass-card p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {q.code && (
                              <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-bold text-xs shrink-0">
                                {q.code}
                              </span>
                            )}
                            {q.isKnockOut && (
                              <span className="px-2 py-0.5 rounded-md bg-red-600 text-white font-extrabold text-[10px] uppercase tracking-wider shrink-0 animate-pulse">
                                🔴 KO (KNOCK-OUT)
                              </span>
                            )}
                            <span className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                              {q.questionText}
                            </span>
                          </div>

                          {q.guidance && (
                            <div className="text-xs text-slate-600 dark:text-slate-400 pl-2.5 border-l-2 border-amber-400 dark:border-amber-500 font-medium">
                              <strong>Wytyczne:</strong> {q.guidance}
                            </div>
                          )}
                        </div>

                        {/* Action Buttons: Edit & Delete */}
                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                          <button
                            type="button"
                            onClick={() => startEditing(q)}
                            className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/80 dark:hover:bg-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            title="Edytuj treść pytania, wytyczne i kod"
                          >
                            ✏️ Edytuj
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(q.id, q.questionText)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 dark:bg-red-950/50 dark:hover:bg-red-900/80 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                            title="Usuń to pytanie z formatki"
                          >
                            🗑️ Usuń
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

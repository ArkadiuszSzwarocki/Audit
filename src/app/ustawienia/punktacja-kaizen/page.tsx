'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

interface ScoringCategory {
  id?: string;
  name: string;
  description: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
}

interface KaizenGoal {
  id?: string;
  title: string;
  targetPoints: number;
  period: string;
  rewardInfo: string;
  isScoringEnabled?: boolean;
}

export default function KaizenScoringSettingsPage() {
  const { isAdmin } = useAuth();
  const { showToast, showConfirm } = useToast();

  const [categories, setCategories] = useState<ScoringCategory[]>([]);
  const [goal, setGoal] = useState<KaizenGoal>({
    title: 'Miesięczny Cel Kaizen Zespołu',
    targetPoints: 500,
    period: 'MONTHLY',
    rewardInfo: 'Wyróżnienie Pomysłodawcy Miesiąca i premia zespołowa',
  });
  const [loading, setLoading] = useState(true);

  // Category Modal / Form State
  const [editingCategory, setEditingCategory] = useState<ScoringCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  useEffect(() => {
    fetchScoringData();
  }, []);

  const fetchScoringData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kaizen-scoring');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
        if (data.goal) setGoal(data.goal);
      }
    } catch (err: any) {
      showToast('Błąd pobierania punktacji Kaizen', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/kaizen-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_goal', goal }),
      });
      if (res.ok) {
        showToast('Cel i target punktowy został zapisany!', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Błąd zapisu celu', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      const res = await fetch('/api/kaizen-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_category', category: editingCategory }),
      });

      if (res.ok) {
        showToast('Kategoria i widełki punktowe zostały zapisane', 'success');
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
        fetchScoringData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Błąd zapisu kategorii', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDeleteCategory = (cat: ScoringCategory) => {
    if (!cat.id) return;
    showConfirm({
      title: 'Usuwanie Kategorii Punktowej',
      message: `Czy na pewno chcesz usunąć kategorię "${cat.name}"?`,
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/kaizen-scoring?id=${cat.id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Kategoria została usunięta', 'success');
          fetchScoringData();
        } else {
          showToast('Błąd usuwania', 'error');
        }
      },
    });
  };

  const handleToggleScoring = async () => {
    const nextState = !goal.isScoringEnabled;
    try {
      const res = await fetch('/api/kaizen-scoring', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_scoring', isScoringEnabled: nextState }),
      });
      if (res.ok) {
        setGoal(prev => ({ ...prev, isScoringEnabled: nextState }));
        showToast(
          nextState
            ? 'Moduł punktacji i rang Kaizen został WŁĄCZONY!'
            : 'Moduł punktacji został WYŁĄCZONY (punkty nie są przydzielane).',
          'success'
        );
      } else {
        const json = await res.json();
        showToast(json.error || 'Błąd zmiany stanu punktacji', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            ⭐ Reguły Punktacji i Cele Kaizen
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Konfiguruj parametry przyznawania punktów (widełki za czas, oszczędności, 5S, HACCP) oraz miesięczny cel zespołu.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingCategory({
                name: '',
                description: '',
                minPoints: 10,
                maxPoints: 50,
                icon: '⚡',
                color: 'amber',
              });
              setIsCategoryModalOpen(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl shadow-md font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            + Nowa Kategoria Punktowa
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-bold animate-pulse">Ładowanie reguł punktacji...</div>
      ) : (
        <div className="space-y-8">
          {/* Master Toggle Banner */}
          <section className={`p-6 rounded-3xl border transition-all ${
            goal.isScoringEnabled
              ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
              : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
          }`}>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{goal.isScoringEnabled ? '🟢' : '⏸️'}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                      System Przydzielania Punktów Kaizen
                    </h2>
                    <span className={`px-2.5 py-0.5 text-xs font-black rounded-md uppercase tracking-wider ${
                      goal.isScoringEnabled
                        ? 'bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200'
                        : 'bg-amber-200 text-amber-900 dark:bg-amber-900 dark:text-amber-200'
                    }`}>
                      {goal.isScoringEnabled ? 'AKTYWNY' : 'WYŁĄCZONY (OCZEKUJE NA REGULAMIN)'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed max-w-2xl">
                    {goal.isScoringEnabled
                      ? 'System punktowy jest aktywny. Przy zatwierdzaniu Kaizena przydzielane są punkty, a w profilu wyświetlają się rangi innowatorów.'
                      : 'Punkty są obecnie wyłączone. Wnioski Kaizen są rejestrowane i akceptowane bez naliczania punktacji. Gdy zarząd uchwali regulamin, włącz ten moduł jednym kliknięciem.'}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleToggleScoring}
                  className={`px-5 py-3 rounded-2xl font-black text-xs shadow-lg transition-all cursor-pointer whitespace-nowrap ${
                    goal.isScoringEnabled
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  }`}
                >
                  {goal.isScoringEnabled ? '⏹️ Wyłącz Moduł Punktacji' : '⚡ Włącz Moduł Punktacji (1-Klik)'}
                </button>
              )}
            </div>
          </section>
          {/* Section 1: Team Goal Settings */}
          <section className="glass-card p-6 bg-amber-500/10 border-amber-300 dark:border-amber-800/80 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              <div>
                <h2 className="text-xl font-extrabold text-amber-900 dark:text-amber-200">
                  Target i Cel Punktowy Zespołu
                </h2>
                <p className="text-xs text-amber-800 dark:text-amber-300/80">
                  Miesięczna norma punktowa dla całego zakładu. Postęp w realizacji wyświetla się na głównej liście wniosków Kaizen.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveGoal} className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Tytuł Celu
                </label>
                <input
                  type="text"
                  required
                  value={goal.title}
                  onChange={e => setGoal(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Docelowa Liczba Punktów (Target)
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  step={50}
                  value={goal.targetPoints}
                  onChange={e => setGoal(prev => ({ ...prev, targetPoints: Number(e.target.value) || 0 }))}
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Opis Nagrody / Premii
                </label>
                <input
                  type="text"
                  value={goal.rewardInfo}
                  onChange={e => setGoal(prev => ({ ...prev, rewardInfo: e.target.value }))}
                  placeholder="np. Bonus finansowy / Pomysłodawca Miesiąca"
                  className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {isAdmin && (
                <div className="md:col-span-3 flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-all"
                  >
                    💾 Zapisz Cel Punktowy
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* Section 2: Point Ranges & Scoring Categories */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                📊 Kategorie i Widełki Punktowe
              </h2>
              <span className="text-xs font-bold text-slate-500">
                Liczba zdefiniowanych zasad: {categories.length}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(cat => (
                <div
                  key={cat.id || cat.name}
                  className="glass-card p-5 border border-slate-200 dark:border-slate-800 space-y-3 hover:border-amber-400 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl p-2 bg-amber-100 dark:bg-amber-950/60 rounded-xl">
                        {cat.icon || '⚡'}
                      </span>
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-snug">
                          {cat.name}
                        </h3>
                        <span className="inline-block px-2.5 py-0.5 mt-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-black text-xs rounded-lg border border-amber-200 dark:border-amber-800/60">
                          Widełki: {cat.minPoints} – {cat.maxPoints} pkt
                        </span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsCategoryModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 rounded-lg transition-colors cursor-pointer"
                          title="Edytuj widełki"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                          title="Usuń kategorię"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {cat.description || 'Brak opisu szczegółowego.'}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Category Edit/Create Modal */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                {editingCategory.id ? 'Edytuj Kategorię i Widełki' : 'Nowa Kategoria Punktowa'}
              </h3>
              <button
                onClick={() => {
                  setIsCategoryModalOpen(false);
                  setEditingCategory(null);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Nazwa Kategorii (z emoji) *
                </label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={e => setEditingCategory(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="np. ⚡ Skrócenie czasu pracy"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Opis i Kryteria Przyznawania
                </label>
                <textarea
                  rows={3}
                  value={editingCategory.description}
                  onChange={e => setEditingCategory(prev => prev ? { ...prev, description: e.target.value } : null)}
                  placeholder="np. Gdy wniosek redukuje czynność długą w krótką lub przynosi udokumentowaną oszczędność..."
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Punkty Min (od)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingCategory.minPoints}
                    onChange={e => setEditingCategory(prev => prev ? { ...prev, minPoints: Number(e.target.value) || 0 } : null)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-extrabold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                    Punkty Max (do)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={editingCategory.maxPoints}
                    onChange={e => setEditingCategory(prev => prev ? { ...prev, maxPoints: Number(e.target.value) || 0 } : null)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-extrabold outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsCategoryModalOpen(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-extrabold shadow-md cursor-pointer"
                >
                  Zapisz Kategorię
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

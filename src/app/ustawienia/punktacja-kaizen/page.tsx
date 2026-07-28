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
}

export default function KaizenScoringSettingsPage() {
  const { isAdmin, isKaizenCommittee, user } = useAuth();
  const { showToast, showConfirm } = useToast();

  const canManage = isAdmin || isKaizenCommittee || (user?.role && ['KOMISJA KAIZEN', 'KOMISJA_KAIZEN', 'KAIZEN_COMMITTEE'].includes(user.role.toUpperCase()));

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



  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
            ⭐ Reguły Punktacji Kaizen
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Konfiguruj parametry przyznawania punktów (widełki za czas, oszczędności, 5S, HACCP).
          </p>
        </div>

        {canManage && (
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
          {/* Section: Point Ranges & Scoring Categories */}
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

                    {canManage && (
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

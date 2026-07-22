'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

interface ObservationSeverity {
  id: string;
  name: string;
  color: string;
  isPositive: boolean;
}

export default function SeveritiesManagementPage() {
  const { isAdmin } = useAuth();
  const { showToast, showConfirm } = useToast();

  const [severities, setSeverities] = useState<ObservationSeverity[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('red');
  const [isPositive, setIsPositive] = useState(false);

  useEffect(() => {
    fetchSeverities();
  }, []);

  const fetchSeverities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/observation-severities');
      if (res.ok) {
        const data = await res.json();
        setSeverities(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const res = await fetch('/api/observation-severities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color, isPositive }),
      });

      if (res.ok) {
        showToast('Nowa waga / kategoria zdarzeń została dodana', 'success');
        setName('');
        setColor('red');
        setIsPositive(false);
        setIsAdding(false);
        fetchSeverities();
      } else {
        const data = await res.json();
        showToast(data.error || 'Błąd podczas dodawania', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd połączenia', 'error');
    }
  };

  const handleDelete = (id: string, name: string) => {
    showConfirm({
      title: 'Usuwanie Kategorii Zdarzenia',
      message: `Czy na pewno chcesz usunąć kategorię "${name}"?`,
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/observation-severities/${id}`, { method: 'DELETE' });
        if (res.ok) {
          showToast('Kategoria została usunięta', 'success');
          fetchSeverities();
        } else {
          showToast('Błąd podczas usuwania', 'error');
        }
      }
    });
  };

  const getColorBadge = (colorStr: string) => {
    switch (colorStr) {
      case 'green':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300';
      case 'orange':
        return 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300';
      case 'yellow':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300';
      case 'blue':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300';
      case 'purple':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300';
      case 'red':
      default:
        return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-300';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Wagi i Kategorie Spostrzeżeń
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            Definiuj własne nazwy wag zdarzeń audytowych (np. Krytyczna Niezgodność, Dobra Praktyka, Propozycja Udoskonalenia).
          </p>
        </div>

        {isAdmin && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md font-bold text-sm transition-all flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Dodaj nową wagę / kategorię
          </button>
        )}
      </div>

      {isAdding && (
        <section className="glass-card bg-brand-50/50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800 space-y-4 animate-in slide-in-from-top-2">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Nowa Waga / Kategoria Spostrzeżenia</h2>
          <form onSubmit={handleAdd} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Nazwa kategorii (z emoji / symbolem)</label>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="np. 🌟 Dobra Praktyka / 🛠 Szybka poprawka"
                className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kolor wyróżnienia</label>
                <select
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none"
                >
                  <option value="red">🔴 Czerwony (Krytyczny)</option>
                  <option value="orange">🟠 Pomarańczowy (Umiarkowany)</option>
                  <option value="yellow">🟡 Żółty (Ostrzeżenie)</option>
                  <option value="green">🟢 Zielony (Pozytywny / Dobra Praktyka)</option>
                  <option value="blue">🔵 Niebieski (Informacyjny)</option>
                  <option value="purple">💜 Fioletowy (Kaizen / Innowacja)</option>
                </select>
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPositive}
                    onChange={e => setIsPositive(e.target.checked)}
                    className="w-5 h-5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Dobra Praktyka (Pozytyw) – nie wymaga naprawy operatora
                  </span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold"
              >
                Anuluj
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md text-xs font-bold"
              >
                Zapisz kategorię
              </button>
            </div>
          </form>
        </section>
      )}

      {loading ? (
        <div className="text-center py-8">Wczytywanie wag i kategorii...</div>
      ) : (
        <div className="grid gap-3">
          {severities.map(sev => (
            <div key={sev.id} className="glass-card flex items-center justify-between p-4 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getColorBadge(sev.color)}`}>
                  {sev.name}
                </span>
                {sev.isPositive && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Pozytyw (Auto-Zatwierdzane)
                  </span>
                )}
              </div>

              {isAdmin && (
                <button
                  onClick={() => handleDelete(sev.id, sev.name)}
                  className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                  title="Usuń wagę"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { useObservations } from '@/hooks/useObservations';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';

const SEVERITY_LABELS: Record<string, { label: string; cls: string; icon: string }> = {
  MINOR: { label: 'Mało istotna', cls: 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300', icon: '🟢' },
  MODERATE: { label: 'Umiarkowana', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300', icon: '🟡' },
  CRITICAL: { label: 'Krytyczna', cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300', icon: '🔴' },
};

export default function ObservationsPage() {
  const { pendingObservations, loading, error: hookError, fetchPendingObservations } = useObservations();
  const { showToast } = useToast();
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterFixed, setFilterFixed] = useState('unfixed');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadObservations = async () => {
      try {
        setError(null);
        await fetchPendingObservations(true);
      } catch (err: any) {
        const errorMsg = err.message || 'Błąd podczas ładowania spostrzeżeń';
        setError(errorMsg);
        showToast(errorMsg, 'error');
      }
    };
    loadObservations();
  }, [fetchPendingObservations, showToast]);

  // Użyj error z hooka jeśli nie ma lokalnego errora
  const displayError = error || hookError;

  const filteredObservations = pendingObservations.filter(obs => {
    if (filterSeverity && obs.severity !== filterSeverity) return false;
    if (filterFixed === 'fixed' && !obs.isFixed) return false;
    if (filterFixed === 'unfixed' && obs.isFixed) return false;
    return true;
  });

  const openCount = pendingObservations.filter(o => !o.isFixed).length;
  const fixedCount = pendingObservations.filter(o => o.isFixed).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Ładowanie spostrzeżeń...</div>
      </div>
    );
  }

  if (displayError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p className="text-lg font-semibold mb-2">Błąd ładowania spostrzeżeń</p>
          <p className="text-sm">{displayError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="container mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Spostrzeżenia z Audytów</h1>
            <span className="text-3xl">👁️</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Zaobserwowane problemy i niezgodności znalezione podczas audytów. Tutaj można je śledzić, przypisać i zamykać.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow">
            <div className="text-slate-600 dark:text-slate-400 text-sm font-semibold">Razem</div>
            <div className="text-3xl font-bold text-slate-900 dark:text-white">{pendingObservations.length}</div>
          </div>
          <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-4 shadow">
            <div className="text-red-600 dark:text-red-400 text-sm font-semibold">Otwarte</div>
            <div className="text-3xl font-bold text-red-700 dark:text-red-300">{openCount}</div>
          </div>
          <div className="bg-green-50 dark:bg-green-950/30 rounded-lg p-4 shadow">
            <div className="text-green-600 dark:text-green-400 text-sm font-semibold">Zamknięte</div>
            <div className="text-3xl font-bold text-green-700 dark:text-green-300">{fixedCount}</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 shadow">
            <div className="text-blue-600 dark:text-blue-400 text-sm font-semibold">Wskaźnik</div>
            <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
              {pendingObservations.length > 0 ? Math.round((fixedCount / pendingObservations.length) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-900 rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Filtry</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status
              </label>
              <select
                value={filterFixed}
                onChange={(e) => setFilterFixed(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="unfixed">Otwarte</option>
                <option value="fixed">Zamknięte</option>
                <option value="">Wszystkie</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Waga
              </label>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="">Wszystkie</option>
                <option value="MINOR">🟢 Mało istotna</option>
                <option value="MODERATE">🟡 Umiarkowana</option>
                <option value="CRITICAL">🔴 Krytyczna</option>
              </select>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredObservations.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-lg p-12 text-center shadow">
              <div className="text-5xl mb-4">✅</div>
              <p className="text-slate-600 dark:text-slate-400 text-lg font-medium">
                Nie ma spostrzeżeń do wyświetlenia
              </p>
            </div>
          ) : (
            filteredObservations.map(observation => (
              <div
                key={observation.id}
                className="bg-white dark:bg-slate-900 rounded-lg shadow hover:shadow-lg transition-shadow p-6 border-l-4"
                style={{
                  borderColor:
                    observation.severity === 'CRITICAL'
                      ? '#dc2626'
                      : observation.severity === 'MODERATE'
                      ? '#f59e0b'
                      : '#10b981',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {observation.auditId && (
                      <Link
                        href={`/audyty/${observation.auditId}`}
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        Audyt ID: {observation.auditId.substring(0, 8)}...
                      </Link>
                    )}
                  </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-lg mb-2">
                      {observation.description}
                    </h3>

                    {observation.aiSuggestion && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded p-3 mb-3">
                        <p className="text-sm text-blue-900 dark:text-blue-300">
                          <strong>💡 Sugestia AI:</strong> {observation.aiSuggestion}
                        </p>
                      </div>
                    )}

                    {observation.operatorComment && (
                      <div className="bg-slate-100 dark:bg-slate-800 rounded p-3 mb-3">
                        <p className="text-sm text-slate-700 dark:text-slate-300">
                          <strong>Notatka operatora:</strong> {observation.operatorComment}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${SEVERITY_LABELS[observation.severity as string]?.cls || 'bg-slate-100'}`}>
                        {SEVERITY_LABELS[observation.severity as string]?.icon} {SEVERITY_LABELS[observation.severity as string]?.label}
                      </span>
                      {observation.dueDate && (
                        <span className="text-xs text-slate-600 dark:text-slate-400">
                          Termin: {new Date(observation.dueDate).toLocaleDateString('pl-PL')}
                        </span>
                      )}
                      {observation.assignedTo && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                          Przypisane: {observation.assignedTo.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        observation.isFixed
                          ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                          : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {observation.isFixed ? '✅ Zamknięte' : '🔓 Otwarte'}
                    </span>
                    {observation.isFixed && observation.fixedAt && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(observation.fixedAt).toLocaleDateString('pl-PL')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

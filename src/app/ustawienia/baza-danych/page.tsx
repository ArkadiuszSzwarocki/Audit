'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';

export default function DatabaseAdminPage() {
  const { isAdmin } = useAuth();
  const { showToast } = useToast();

  const [activeTable, setActiveTable] = useState('audit');
  const [tableData, setTableData] = useState<any[]>([]);
  const [recordCount, setRecordCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'json'>('table');

  const tables = [
    { id: 'audit', label: 'Audyty (Audit)', icon: '📋' },
    { id: 'observation', label: 'Spostrzeżenia (Observation)', icon: '⚠️' },
    { id: 'extension', label: 'Przedłużenia Terminu (Extension)', icon: '⏳' },
    { id: 'user', label: 'Użytkownicy (User)', icon: '👤' },
    { id: 'area', label: 'Obszary Zakładu (Area)', icon: '🏭' },
    { id: 'auditType', label: 'Typy Audytów (AuditType)', icon: '🏷️' },
    { id: 'kaizen', label: 'Wnioski Kaizen (Kaizen)', icon: '💡' },
  ];

  const fetchTableData = async (tableId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/database/tables?table=${tableId}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      setTableData(result.data || []);
      setRecordCount(result.count || 0);
    } catch (err: any) {
      showToast(err.message || 'Błąd pobierania danych tabeli', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchTableData(activeTable);
    }
  }, [activeTable, isAdmin]);

  const filteredData = tableData.filter((row) => {
    if (!searchFilter.trim()) return true;
    return JSON.stringify(row).toLowerCase().includes(searchFilter.toLowerCase());
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center glass-card max-w-xl mx-auto my-12">
        <h2 className="text-xl font-bold text-red-600">Brak Uprawnień</h2>
        <p className="text-sm text-slate-500 mt-2">Dostęp do przeglądarki bazy danych SQL wymaga uprawnień Administratora.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            🗄️ Baza Danych SQL (Prisma Studio)
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            Podgląd, eksport i zarządzenie rekordami SQLite w czasie rzeczywistym.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="http://localhost:5555"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-md text-sm font-bold transition-all flex items-center gap-2"
          >
            <span>🚀 Otwórz Prisma Studio (Port 5555)</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          <a
            href="/api/admin/database/export"
            download
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl shadow-md text-sm font-bold transition-all flex items-center gap-2"
          >
            <span>📥 Pobierz Kopię Bazy (.db)</span>
          </a>
        </div>
      </div>

      {/* Database File Status Box */}
      <div className="glass-card p-5 border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/5 dark:bg-slate-800/40">
        <div className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
            Lokalizacja Bazy SQL na serwerze
          </p>
          <code className="text-sm font-mono font-bold text-slate-800 dark:text-slate-200 bg-slate-200/80 dark:bg-slate-900 px-3 py-1 rounded-md block">
            C:\Users\arkad\Documents\github\Audit\prisma\dev.db
          </code>
        </div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300">
            Silnik: SQLite3 + Prisma ORM 7.9.0
          </span>
        </div>
      </div>

      {/* Table Selector & Search */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          {tables.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTable(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTable === t.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Search & View Mode Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="w-full sm:w-80">
            <input
              type="text"
              placeholder="Filtruj wpisy w tabeli..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="text-slate-500">Liczba rekordów: {recordCount}</span>
            <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'table' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                Tabela
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'json' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-sm' : 'text-slate-500'
                }`}
              >
                JSON Raw
              </button>
            </div>
          </div>
        </div>

        {/* Data Display */}
        {loading ? (
          <div className="glass-card p-12 text-center text-slate-500 animate-pulse">Ładowanie tabeli...</div>
        ) : filteredData.length === 0 ? (
          <div className="glass-card p-12 text-center text-slate-500">Brak rekordów do wyświetlenia w tabeli.</div>
        ) : viewMode === 'json' ? (
          <pre className="p-4 bg-slate-900 text-emerald-400 rounded-2xl overflow-x-auto text-xs font-mono max-h-[600px]">
            {JSON.stringify(filteredData, null, 2)}
          </pre>
        ) : (
          <div className="glass-card overflow-x-auto p-0 border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  {Object.keys(filteredData[0] || {}).map((col) => (
                    <th key={col} className="px-4 py-3 border-r border-slate-200 dark:border-slate-700/60 whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    {Object.entries(row).map(([k, val], i) => (
                      <td key={i} className="px-4 py-2.5 max-w-xs truncate border-r border-slate-100 dark:border-slate-800/60 font-mono text-[11px]">
                        {typeof val === 'object' && val !== null ? (
                          <span className="text-brand-600 dark:text-brand-400 font-semibold">{JSON.stringify(val)}</span>
                        ) : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

interface AccessLog {
  id: string;
  userLogin: string;
  userName: string;
  entityType: string;
  entityId: string;
  entityTitle: string;
  openedAt: string;
  closedAt: string | null;
  durationSec: number;
  ipAddress: string | null;
}

export default function AccessHistoryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterLogin, setFilterLogin] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterLogin, filterType]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterLogin.trim()) params.append('userLogin', filterLogin.trim());
      if (filterType.trim()) params.append('entityType', filterType.trim());

      const res = await fetch(`/api/access-logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignore errors
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '< 5 sek';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} sek`;
    return `${m} min ${s} sek`;
  };

  const getEntityLabel = (type: string) => {
    switch (type) {
      case 'AUDIT':
        return { label: '📋 Audyt', color: 'bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300' };
      case 'TASK':
        return { label: '🛠️ Zadanie Produkcyjne', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'KAIZEN':
        return { label: '💡 Kaizen', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'FAULT':
        return { label: '🔧 Usterka', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 dark:border-slate-800 pb-4 gap-4">
        <div>
          <button
            onClick={() => router.back()}
            className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 mb-2 font-bold"
          >
            ← Wróć do poprzedniej strony
          </button>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            📜 Historia Dostępów i Zapoznania się z Dokumentami
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Rejestr zdarzeń otwarcia dokumentów (Audyty, Zadania, Usterki, Kaizeny) z czasem wglądu i kwalifikowanym podpisem cyfrowym loginu.
          </p>
        </div>
      </div>

      {/* Clause Banner */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-md border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <span>✒️ KLAUZULA PODPISU ELEKTRONICZNEGO</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Zgodnie z regulaminem systemu, otworzenie i zapoznanie się z formularzem przez zidentyfikowany login użytkownika stanowi prawnie wiążące potwierdzenie zapoznania się z treścią dokumentu. Wszystkie operacje są rejestrowane wraz z czasem otwarcia, czasem wglądu oraz adresem IP.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Filtruj po Loginie / Użytkowniku
            </label>
            <input
              type="text"
              value={filterLogin}
              onChange={e => setFilterLogin(e.target.value)}
              placeholder="Wpisz login lub nazwisko..."
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 w-full md:w-64"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Typ Formularza
            </label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              <option value="">Wszystkie formularze</option>
              <option value="AUDIT">📋 Audyty</option>
              <option value="TASK">🛠️ Zadania Produkcji</option>
              <option value="FAULT">🔧 Usterki</option>
              <option value="KAIZEN">💡 Kaizen</option>
            </select>
          </div>
        </div>

        <div className="text-xs font-bold text-slate-500">
          Łącznie wpisów w historii: <strong>{logs.length}</strong>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center p-8 text-slate-400 animate-pulse">Ładowanie historii dostępów...</div>
      ) : logs.length === 0 ? (
        <div className="text-center p-12 glass-card text-slate-500 font-bold">
          Brak zarejestrowanych zdarzeń otwarcia dokumentów spełniających kryteria.
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-extrabold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">#</th>
                  <th className="p-3">Użytkownik / Login</th>
                  <th className="p-3">Formularz / Dokument</th>
                  <th className="p-3">Data i Czas Wejścia</th>
                  <th className="p-3 text-center">Czas Otwarcia</th>
                  <th className="p-3 text-center">Podpis Elektroniczny</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {logs.map((log, idx) => {
                  const ent = getEntityLabel(log.entityType);

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 text-xs text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{log.userName}</div>
                        <div className="text-xs font-mono text-slate-400">@{log.userLogin}</div>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${ent.color} mr-2`}>
                          {ent.label}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-slate-100">{log.entityTitle}</span>
                      </td>
                      <td className="p-3 text-xs text-slate-600 dark:text-slate-300">
                        {new Date(log.openedAt).toLocaleString('pl-PL')}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-xs rounded-lg border border-slate-300 dark:border-slate-700">
                          ⏱️ {formatDuration(log.durationSec)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-black text-[11px] rounded-lg border border-emerald-300 dark:border-emerald-800">
                          ✒️ Podpis Cyfrowy @{log.userLogin}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

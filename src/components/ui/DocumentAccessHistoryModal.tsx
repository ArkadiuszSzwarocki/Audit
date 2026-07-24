'use client';

import { useEffect, useState } from 'react';

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

interface DocumentAccessHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'AUDIT' | 'TASK' | 'KAIZEN' | 'FAULT' | 'BHP' | 'QUALITY';
  entityId: string;
  entityTitle: string;
}

export function DocumentAccessHistoryModal({
  isOpen,
  onClose,
  entityType,
  entityId,
  entityTitle,
}: DocumentAccessHistoryModalProps) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !entityId) return;

    const fetchHistory = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/access-logs?entityType=${entityType}&entityId=${entityId}`);
        if (res.ok) {
          const data = await res.json();
          setLogs(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Błąd pobierania historii zapoznań:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [isOpen, entityType, entityId]);

  if (!isOpen) return null;

  const formatDuration = (sec: number) => {
    if (!sec || sec <= 0) return '< 5 sek';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s} sek`;
    return `${m} min ${s} sek`;
  };

  const getEntityTypeName = (type: string) => {
    switch (type) {
      case 'AUDIT': return 'Audytu';
      case 'TASK': return 'Zlecenia Produkcji';
      case 'KAIZEN': return 'Wniosku Kaizen';
      case 'FAULT': return 'Zgłoszenia Usterki';
      case 'BHP': return 'Zgłoszenia BHP';
      default: return 'Dokumentu';
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
              Rejestr Zapoznania się z Dokumentem
            </span>
            <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              👥 Historia Wglądu {getEntityTypeName(entityType)}: <span className="text-brand-600 dark:text-brand-400">{entityTitle}</span>
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Legal Disclaimer Banner */}
        <div className="p-4 mx-6 mt-4 bg-slate-900 text-white rounded-xl shadow-inner border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <span>✒️ KLAUZULA PODPISU ELEKTRONICZNEGO</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Zgodnie z procedurami zakładowymi, użytkownicy korzystają z indywidualnych kont w systemie. Otwarcie formularza oraz zapoznanie się z jego treścią jest rejestrowane w bazie danych i prawnie uznawane za złożenie elektronicznego podpisu oraz potwierdzenie zapoznania się z dokumentem.
          </p>
        </div>

        {/* Content Table */}
        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-semibold animate-pulse">
              Ładowanie rejestru z bazy danych...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 font-semibold bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
              Brak zarejestrowanych zdarzeń wglądu w ten dokument.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px] font-extrabold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Osoba / Login</th>
                    <th className="p-3">Data i Czas Otwarcia</th>
                    <th className="p-3 text-center">Czas Wglądu</th>
                    <th className="p-3 text-center">Status Podpisu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                  {logs.map((log, idx) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3 text-slate-400 font-bold">{idx + 1}</td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 dark:text-slate-100">{log.userName}</div>
                        <div className="text-[11px] font-mono text-slate-400">@{log.userLogin}</div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">
                        {new Date(log.openedAt).toLocaleString('pl-PL')}
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold text-[11px] rounded border border-slate-300 dark:border-slate-700">
                          ⏱️ {formatDuration(log.durationSec)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-extrabold text-[11px] rounded-lg border border-emerald-300 dark:border-emerald-800 inline-flex items-center gap-1">
                          ✒️ Podpis Cyfrowy @{log.userLogin}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="text-xs text-slate-500 font-bold">
            Łącznie otwarć: <strong>{logs.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
          >
            Zamknij
          </button>
        </div>

      </div>
    </div>
  );
}

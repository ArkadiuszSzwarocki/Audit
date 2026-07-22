'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFaultReports, FaultReport } from '@/hooks/useFaultReports';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { ImageModal } from '@/components/ui/ImageModal';
import { downloadFaultReportEml } from '@/utils/faultReportEmailBuilder';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';

const SEVERITY_LABELS: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: '🔴 Krytyczna',    cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  MODERATE: { label: '🟡 Umiarkowana',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  MINOR:    { label: '🟢 Mało istotna', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  OPEN:        { label: '🔓 Otwarte',      cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  IN_PROGRESS: { label: '⚙️ W trakcie',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  RESOLVED:    { label: '✅ Naprawione',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  CLOSED:      { label: '🔒 Zamknięte',   cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700' },
};

export default function UsterkiPage() {
  const router = useRouter();
  const { reports, loading, fetchReports, resolveReport, deleteReport } = useFaultReports();
  const { isAdmin } = useAuth();
  const { showToast, showConfirm } = useToast();

  useAccessTracker({
    entityType: 'FAULT',
    entityId: 'USTERKI_REJESTR',
    entityTitle: 'Rejestr Usterek i Awarii Produkcyjnych',
  });

  const [filterStatus, setFilterStatus] = useState('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; title: string } | null>(null);

  const handleSendEmail = (r: FaultReport) => {
    const targetEmail = r.notifyEmails || r.assignedTo?.email || '';
    const emailToUse = prompt('Podaj adres e-mail odbiorcy powiadomienia:', targetEmail);
    if (emailToUse && emailToUse.trim()) {
      const baseUrl = window.location.origin;
      downloadFaultReportEml(
        {
          id: r.id,
          title: r.title,
          description: r.description,
          severity: r.severity,
          reportedBy: r.reportedBy,
          dueDate: r.dueDate,
          areaName: r.area?.name,
          machineName: r.machine?.name,
          assignedToName: r.assignedTo?.name,
          photoUrl: r.photoUrl,
        },
        emailToUse.trim(),
        baseUrl
      );
      showToast('Pobrano plik .eml z powiadomieniem!', 'success');
    }
  };

  useEffect(() => {
    fetchReports(filterStatus ? { status: filterStatus } : undefined, reports.length === 0);
  }, [fetchReports, filterStatus, reports.length]);

  const openCount = reports.filter(r => ['OPEN', 'IN_PROGRESS'].includes(r.status)).length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;
  const criticalCount = reports.filter(r => r.severity === 'CRITICAL' && r.status !== 'RESOLVED').length;

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Usuń Zgłoszenie',
      message: 'Czy na pewno chcesz usunąć to zgłoszenie?',
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteReport(id);
          showToast('Zgłoszenie usunięte', 'success');
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            🔧 Rejestr Awarii i Usterek Produkcyjnych
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Ewidencja i śledzenie wszystkich zgłoszeń technicznych i awarii w zakładowym systemie audytowym.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryTarget({ id: 'USTERKI_REJESTR', title: 'Rejestr Usterek i Awarii Produkcyjnych' })}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Zobacz osoby, które otworzyły i zapoznały się z rejestrem usterek"
          >
            👥 Zapoznania z Rejestrem
          </button>
          <button
            onClick={() => fetchReports(filterStatus ? { status: filterStatus } : undefined, false)}
            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            ↻ Odśwież
          </button>
          <Link
            href="/usterki/nowe"
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            + Nowe Zgłoszenie
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
              <span className="text-2xl">🔓</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{openCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Otwarte Awaria</div>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-200 dark:bg-red-900/60 flex items-center justify-center shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400 leading-none">{criticalCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mt-1">Krytyczne Awaria</div>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{resolvedCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-1">Naprawione</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          ['', 'Wszystkie Zgłoszenia'],
          ['OPEN', '🔓 Otwarte'],
          ['IN_PROGRESS', '⚙️ W trakcie'],
          ['RESOLVED', '✅ Naprawione'],
          ['CLOSED', '🔒 Zamknięte']
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              filterStatus === val
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto text-xs font-bold text-slate-500 pr-2">
          Łącznie: <strong>{reports.length}</strong>
        </div>
      </div>

      {/* Table List View */}
      {loading ? (
        <div className="text-center p-12 animate-pulse text-slate-400 font-bold">Ładowanie rejestru awarii...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 glass-card font-bold text-emerald-600 dark:text-emerald-400 text-xl border border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl">
          🎉 Brak zgłoszeń awarii spełniających kryteria!
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-black border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">Ważność / Status</th>
                  <th className="p-3">Tytuł Zgłoszenia i Opis Awarii</th>
                  <th className="p-3">Obszar / Maszyna</th>
                  <th className="p-3">Zgłaszający / Przypisany</th>
                  <th className="p-3 whitespace-nowrap">Data / Termin</th>
                  <th className="p-3 text-center min-w-[200px]">Akcje i Zapoznanie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {reports.map((r: FaultReport, idx: number) => {
                  const sev = SEVERITY_LABELS[r.severity] ?? { label: r.severity, cls: 'bg-slate-100 text-slate-700' };
                  const st = STATUS_LABELS[r.status] ?? { label: r.status, cls: 'bg-slate-100 text-slate-700' };
                  const isOpen = ['OPEN', 'IN_PROGRESS'].includes(r.status);

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        r.severity === 'CRITICAL' && isOpen ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                      }`}
                    >
                      {/* # Index */}
                      <td className="p-3 text-center font-bold text-xs text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Badges */}
                      <td className="p-3 space-y-1.5 whitespace-nowrap">
                        <div>
                          <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${sev.cls}`}>
                            {sev.label}
                          </span>
                        </div>
                        <div>
                          <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                      </td>

                      {/* Title & Description */}
                      <td className="p-3 max-w-md">
                        <div className="flex items-start gap-3">
                          {r.photoUrl && (
                            <button
                              onClick={() => setModalImage(r.photoUrl!)}
                              className="shrink-0 cursor-pointer group relative"
                              title="Kliknij, aby powiększyć zdjęcie"
                            >
                              <img
                                src={r.photoUrl}
                                alt="Miniatura"
                                className="w-12 h-12 object-cover rounded-xl border border-slate-300 dark:border-slate-700 group-hover:scale-105 transition-transform"
                              />
                            </button>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                              {r.title}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {r.description}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Area & Machine */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          📍 {r.area?.name || 'Cały zakład'}
                        </div>
                        {r.machine && (
                          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            ⚙️ {r.machine.name}
                          </div>
                        )}
                      </td>

                      {/* People */}
                      <td className="p-3 whitespace-nowrap text-xs">
                        <div>
                          <span className="text-slate-400">Zgłosił:</span>{' '}
                          <strong className="text-slate-800 dark:text-slate-200">{r.reportedBy}</strong>
                        </div>
                        {r.assignedTo ? (
                          <div className="mt-0.5">
                            <span className="text-slate-400">Przypisany:</span>{' '}
                            <strong className="text-brand-600 dark:text-brand-400">{r.assignedTo.name}</strong>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 italic mt-0.5">Brak przypisania</div>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="p-3 whitespace-nowrap text-xs">
                        <div className="text-slate-500">
                          {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                        </div>
                        {r.dueDate && (
                          <div className="mt-1">
                            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-[10px] rounded border border-red-200 dark:border-red-800">
                              📅 {new Date(r.dueDate).toLocaleDateString('pl-PL')}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-3">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            onClick={() => setHistoryTarget({ id: r.id, title: r.title })}
                            className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-amber-200 dark:border-amber-800/60"
                            title="Zobacz kto zapoznał się z tą usterką"
                          >
                            <span>👥</span> Zapoznania
                          </button>

                          <button
                            onClick={() => handleSendEmail(r)}
                            className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-indigo-200 dark:border-indigo-800/60"
                            title="Pobierz powiadomienie e-mail w formacie .eml"
                          >
                            <span>📧</span> .EML
                          </button>

                          <button
                            onClick={() => router.push(`/kaizen/nowy?title=${encodeURIComponent('Kaizen: ' + r.title)}&description=${encodeURIComponent(r.description)}`)}
                            className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border border-emerald-200 dark:border-emerald-800/60"
                            title="Przekształć zgłoszenie awarii w wniosek Kaizen"
                          >
                            <span>💡</span> Kaizen
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(r.id)}
                              className="p-1.5 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-all cursor-pointer border border-red-200 dark:border-red-800/60"
                              title="Usuń zgłoszenie"
                            >
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalImage && <ImageModal isOpen={!!modalImage} imageUrl={modalImage} onClose={() => setModalImage(null)} />}
      
      {historyTarget && (
        <DocumentAccessHistoryModal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          entityType="FAULT"
          entityId={historyTarget.id}
          entityTitle={historyTarget.title}
        />
      )}
    </div>
  );
}

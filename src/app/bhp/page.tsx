'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBhpHazardReports, BhpHazardReport } from '@/hooks/useBhpHazardReports';
import { BhpHazardDrawer, CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '@/components/ui/BhpHazardDrawer';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { useAccessTracker } from '@/hooks/useAccessTracker';

export default function BhpHazardPage() {
  const router = useRouter();
  const { reports, loading, fetchReports, resolveReport, deleteReport } = useBhpHazardReports();
  const { isAdmin } = useAuth();
  const { showToast, showConfirm } = useToast();

  useAccessTracker({
    entityType: 'BHP',
    entityId: 'BHP_REJESTR',
    entityTitle: 'Rejestr Zagrożeń BHP i Near Miss',
  });

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedReport, setSelectedReport] = useState<BhpHazardReport | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetchReports(
      {
        ...(filterStatus ? { status: filterStatus } : {}),
        ...(filterCategory ? { category: filterCategory } : {}),
      },
      reports.length === 0
    );
  }, [fetchReports, filterStatus, filterCategory, reports.length]);

  const openCount = reports.filter((r) => ['OPEN', 'IN_PROGRESS'].includes(r.status)).length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;
  const criticalCount = reports.filter((r) => r.severity === 'CRITICAL' && r.status !== 'RESOLVED').length;

  const handleUpdateStatus = async (id: string, status: string, actionTaken?: string) => {
    try {
      if (status === 'RESOLVED') {
        await resolveReport(id, undefined, actionTaken);
      } else {
        const res = await fetch(`/api/bhp/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Błąd zmiany statusu BHP');
      }
      showToast('Status zagrożenia BHP został zaktualizowany!', 'success');
      fetchReports(undefined, false);
      if (selectedReport?.id === id) {
        setSelectedReport((prev) => (prev ? { ...prev, status } : null));
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Usuń Zgłoszenie BHP',
      message: 'Czy na pewno chcesz usunąć to zgłoszenie zagrożenia BHP?',
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteReport(id);
          showToast('Zgłoszenie BHP zostało usunięte', 'success');
          setSelectedReport(null);
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  const handleNavigateKaizen = (report: BhpHazardReport) => {
    router.push(`/kaizen/nowy?title=${encodeURIComponent(`Udoskonalenie BHP: ${report.title}`)}&description=${encodeURIComponent(report.description)}`);
  };

  const filteredReports = reports.filter((r) => {
    if (filterStatus && r.status !== filterStatus) return false;
    if (filterCategory && r.category !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border border-orange-300 dark:border-orange-800 uppercase tracking-wider">
              EHS / BHP
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              🛡️ Zagrożenia BHP & Near Miss
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Rejestr niebezpiecznych warunków pracy, zdarzeń potencjalnie wypadkowych i zgłoszeń BHP.
          </p>
        </div>

        <Link
          href="/bhp/nowy"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-extrabold text-sm shadow-md transition-all cursor-pointer"
        >
          <span>➕</span> Zgłoś Zagrożenie BHP
        </Link>
      </div>

      {/* Stats Widget Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 text-2xl font-black shrink-0">
            🔓
          </div>
          <div>
            <div className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{openCount}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              Aktywne Zagrożenia
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-200 dark:bg-red-900/60 flex items-center justify-center text-red-600 dark:text-red-400 text-2xl font-black shrink-0">
            🔴
          </div>
          <div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400 leading-none">{criticalCount}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mt-1">
              Wysokie Ryzyko BHP
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 p-4 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 text-2xl font-black shrink-0">
            🛡️
          </div>
          <div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{resolvedCount}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-1">
              Wyeliminowane
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          ['', 'Wszystkie Zgłoszenia'],
          ['OPEN', '🔓 Otwarte'],
          ['IN_PROGRESS', '⚙️ W trakcie'],
          ['RESOLVED', '🛡️ Wyeliminowane'],
          ['CLOSED', '🔒 Zamknięte'],
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              filterStatus === val
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto text-xs font-bold text-slate-500 pr-2">
          Łącznie: <strong>{filteredReports.length}</strong>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center p-12 animate-pulse text-slate-400 font-bold">Ładowanie rejestru zagrożeń BHP...</div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 glass-card font-bold text-emerald-600 dark:text-emerald-400 text-xl border border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl">
          🎉 Brak zagrożeń BHP spełniających kryteria! Safe work space.
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-black border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3 w-48">Kategoria / Ryzyko</th>
                  <th className="p-3">Tytuł Zgłoszenia BHP</th>
                  <th className="p-3 whitespace-nowrap w-32">Status</th>
                  <th className="p-3 whitespace-nowrap w-32">Data</th>
                  <th className="p-3 text-center w-10">ℹ️</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredReports.map((r: BhpHazardReport, idx: number) => {
                  const cat = CATEGORY_LABELS[r.category] ?? { label: r.category, icon: '🛡️' };
                  const sev = SEVERITY_LABELS[r.severity] ?? { label: r.severity, cls: 'bg-slate-100 text-slate-700' };
                  const st = STATUS_LABELS[r.status] ?? { label: r.status, cls: 'bg-slate-100 text-slate-700' };
                  const isOpen = ['OPEN', 'IN_PROGRESS'].includes(r.status);

                  return (
                    <tr
                      key={r.id}
                      onClick={() => router.push(`/bhp/${r.id}`)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        r.severity === 'CRITICAL' && isOpen ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center font-bold text-xs text-slate-400">{idx + 1}</td>

                      <td className="p-3 space-y-1 whitespace-nowrap">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {cat.icon} {cat.label}
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${sev.cls}`}>
                            {sev.label}
                          </span>
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                          {r.title}
                        </div>
                        {r.area && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            📍 {r.area.name}{r.machine ? ` · ⚙️ ${r.machine.name}` : ''}
                          </div>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg border ${st.cls}`}>
                          {st.label}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                      </td>

                      <td className="p-3 text-center text-slate-300 dark:text-slate-700 text-xs">›</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bhp Hazard Drawer */}
      <BhpHazardDrawer
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onViewHistory={(r) => {
          setHistoryTarget({ id: r.id, title: r.title });
        }}
        isAdmin={isAdmin}
        onDelete={handleDelete}
        onNavigateKaizen={handleNavigateKaizen}
        onUpdateStatus={handleUpdateStatus}
      />

      {historyTarget && (
        <DocumentAccessHistoryModal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          entityType="BHP"
          entityId={historyTarget.id}
          entityTitle={historyTarget.title}
        />
      )}
    </div>
  );
}

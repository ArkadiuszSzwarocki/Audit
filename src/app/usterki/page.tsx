'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFaultReports, FaultReport } from '@/hooks/useFaultReports';
import { useStructure } from '@/hooks/useStructure';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { FaultReportDrawer } from '@/components/ui/FaultReportDrawer';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';
import { useAccessTracker } from '@/hooks/useAccessTracker';

const SEVERITY_LABELS: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: '🔴 Krytyczna',    cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  MODERATE: { label: '🟡 Umiarkowana',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  MINOR:    { label: '🟢 Mało istotna', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  OPEN:        { label: '🔓 Otwarte',      cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  IN_PROGRESS: { label: '⚙️ W trakcie',   cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  HOLD:        { label: '⏸️ Zawieszone',   cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  RESOLVED:    { label: '✅ Naprawione',   cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  CLOSED:      { label: '🔒 Zamknięte',   cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700' },
};

export default function UsterkiPage() {
  const router = useRouter();
  const { reports, loading, fetchReports, resolveReport, deleteReport } = useFaultReports();
  const { areas, machines } = useStructure();
  const { isAdmin } = useAuth();
  const { showToast, showConfirm } = useToast();

  // Track overall register access (not individual records)
  useAccessTracker({
    entityType: 'FAULT',
    entityId: 'USTERKI_REJESTR',
    entityTitle: 'Rejestr Usterek i Awarii Produkcyjnych',
  });

  const [filterStatus, setFilterStatus] = useState('');
  const [filterAreaId, setFilterAreaId] = useState('');
  const [filterMachineId, setFilterMachineId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAreaCounters, setShowAreaCounters] = useState(false);

  const [selectedReport, setSelectedReport] = useState<FaultReport | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    fetchReports(filterStatus ? { status: filterStatus } : undefined, reports.length === 0);
  }, [fetchReports, filterStatus, reports.length]);

  const openCount = reports.filter(r => ['OPEN', 'IN_PROGRESS', 'HOLD'].includes(r.status)).length;
  const resolvedCount = reports.filter(r => r.status === 'RESOLVED').length;
  const criticalCount = reports.filter(r => r.severity === 'CRITICAL' && r.status !== 'RESOLVED').length;

  const handleUpdateStatus = async (id: string, status: string, comment?: string) => {
    try {
      if (status === 'RESOLVED') {
        await resolveReport(id, undefined, comment);
      } else {
        const res = await fetch(`/api/fault-reports/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) throw new Error('Błąd zmiany statusu');
      }
      showToast('Status usterki został zaktualizowany!', 'success');
      fetchReports(undefined, false);
      if (selectedReport?.id === id) {
        setSelectedReport(prev => prev ? { ...prev, status } : null);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleHoldAndExtend = async (id: string, newDueDate: string, reason: string) => {
    try {
      const res = await fetch(`/api/fault-reports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'hold_and_extend',
          newDueDate,
          reason,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error ?? 'Błąd zawieszania usterki');
      }
      showToast('Zgłoszenie usterki zostało zawieszone z nowym terminem!', 'success');
      fetchReports(undefined, false);
      if (selectedReport?.id === id) {
        const updatedReport = await res.json();
        setSelectedReport(updatedReport);
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

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

  const handleNavigateKaizen = (r: FaultReport) => {
    router.push(`/kaizen/nowy?title=${encodeURIComponent('Kaizen: ' + r.title)}&description=${encodeURIComponent(r.description)}`);
  };

  const filteredReports = reports.filter(r => {
    if (filterStatus && r.status !== filterStatus) return false;
    const rAreaId = r.area?.id || r.areaId;
    const rMachineId = r.machine?.id || r.machineId;
    if (filterAreaId && rAreaId !== filterAreaId) return false;
    if (filterMachineId && rMachineId !== filterMachineId) return false;

    if (startDate) {
      const rDate = new Date(r.createdAt).setHours(0, 0, 0, 0);
      const sDate = new Date(startDate).setHours(0, 0, 0, 0);
      if (rDate < sDate) return false;
    }
    if (endDate) {
      const rDate = new Date(r.createdAt).setHours(0, 0, 0, 0);
      const eDate = new Date(endDate).setHours(23, 59, 59, 999);
      if (rDate > eDate) return false;
    }
    return true;
  });

  // Calculate breakdown of fault reports per area for the counter panel
  const areaCounts = areas.map(area => {
    const areaReports = reports.filter(r => (r.area?.id || r.areaId) === area.id);
    const openCount = areaReports.filter(r => ['OPEN', 'IN_PROGRESS', 'HOLD'].includes(r.status)).length;
    const totalCount = areaReports.length;
    return { area, openCount, totalCount };
  });

  const availableMachines = filterAreaId
    ? machines.filter(m => m.areaId === filterAreaId)
    : machines;

  const hasActiveFilters = filterStatus || filterAreaId || filterMachineId || startDate || endDate;

  const handleResetFilters = () => {
    setFilterStatus('');
    setFilterAreaId('');
    setFilterMachineId('');
    setStartDate('');
    setEndDate('');
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
            Ewidencja i śledzenie wszystkich zgłoszeń technicznych i awarii. Kliknij wiersz, aby otworzyć szczegóły.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowAreaCounters(!showAreaCounters)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer border ${
              showAreaCounters
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
            }`}
            title="Kliknij, aby rozwinąć/zwinąć podsumowanie usterek według poszczególnych rejonów"
          >
            <span>📊 Licznik Usterek wg Rejonów</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-white/20 font-black">
              {showAreaCounters ? '▲ Ukryj' : '▼ Pokaż'}
            </span>
          </button>
          <button
            onClick={() => setHistoryTarget({ id: 'USTERKI_REJESTR', title: 'Rejestr Usterek i Awarii Produkcyjnych' })}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Zobacz osoby, które otworzyły i zapoznały się z rejestrem usterek"
          >
            👥 Zapoznania z Rejestrem
          </button>
          <button
            onClick={() => fetchReports(undefined, false)}
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
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Otwarte Awarie</div>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-200 dark:bg-red-900/60 flex items-center justify-center shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400 leading-none">{criticalCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mt-1">Krytyczne Awarie</div>
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

      {/* Collapsible Area Counter Panel ("Ukryty licznik") */}
      {showAreaCounters && (
        <div className="p-5 bg-slate-900 text-white rounded-3xl border border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-300 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">📊</span>
              <h2 className="font-extrabold text-base text-slate-100">
                Licznik Usterek według Rejonów Produkcyjnych
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">
              Kliknij rejon, aby zfiltrować listę
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {areaCounts.map(({ area, openCount, totalCount }) => {
              const isSelected = filterAreaId === area.id;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => setFilterAreaId(isSelected ? '' : area.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-amber-500 text-white border-amber-400 ring-2 ring-amber-400/40 shadow-lg'
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-amber-500/50'
                  }`}
                >
                  <div className="font-extrabold text-xs truncate mb-2">
                    📍 {area.name}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] opacity-80">Łącznie: <strong>{totalCount}</strong></span>
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black ${
                      openCount > 0
                        ? isSelected ? 'bg-red-900 text-red-100' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : isSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-500/20 text-emerald-400'
                    }`}>
                      {openCount > 0 ? `🔓 Otwarte: ${openCount}` : '✅ 0 otwartych'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Advanced Filters Bar (Rejon, Maszyna, Data Od / Do) */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Filter Area */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              📍 Rejon / Obszar
            </label>
            <select
              value={filterAreaId}
              onChange={e => { setFilterAreaId(e.target.value); setFilterMachineId(''); }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Wszystkie rejony</option>
              {areas.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>

          {/* Filter Machine */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              ⚙️ Maszyna / Linia
            </label>
            <select
              value={filterMachineId}
              onChange={e => setFilterMachineId(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="">Wszystkie maszyny</option>
              {availableMachines.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              📅 Data zgłoszenia od
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              📅 Data zgłoszenia do
            </label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        {/* Reset button if active */}
        {hasActiveFilters && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              ✕ Wyczyść Filtry
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          ['', 'Wszystkie Zgłoszenia'],
          ['OPEN', '🔓 Otwarte'],
          ['IN_PROGRESS', '⚙️ W trakcie'],
          ['HOLD', '⏸️ Zawieszone'],
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
          Łącznie: <strong>{filteredReports.length}</strong>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center p-12 animate-pulse text-slate-400 font-bold">Ładowanie rejestru awarii...</div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 glass-card font-bold text-emerald-600 dark:text-emerald-400 text-xl border border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl">
          🎉 Brak zgłoszeń awarii spełniających kryteria!
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-black border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3 w-40">Ważność / Status</th>
                  <th className="p-3">Tytuł Zgłoszenia</th>
                  <th className="p-3 whitespace-nowrap w-32">Data</th>
                  <th className="p-3 text-center w-10">
                    <span title="Kliknij wiersz, aby otworzyć szczegóły">ℹ️</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredReports.map((r: FaultReport, idx: number) => {
                  const sev = SEVERITY_LABELS[r.severity] ?? { label: r.severity, cls: 'bg-slate-100 text-slate-700' };
                  const st = STATUS_LABELS[r.status] ?? { label: r.status, cls: 'bg-slate-100 text-slate-700' };
                  const isOpen = ['OPEN', 'IN_PROGRESS', 'HOLD'].includes(r.status);

                  return (
                    <tr
                      key={r.id}
                      onClick={() => router.push(`/usterki/${r.id}`)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        r.severity === 'CRITICAL' && isOpen ? 'bg-red-50/40 dark:bg-red-950/20' : ''
                      }`}
                    >
                      {/* # Index */}
                      <td className="p-3 text-center font-bold text-xs text-slate-400">{idx + 1}</td>

                      {/* Badges */}
                      <td className="p-3 space-y-1.5 whitespace-nowrap">
                        <div>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${sev.cls}`}>
                            {sev.label}
                          </span>
                        </div>
                        <div>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                      </td>

                      {/* Title */}
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

                      {/* Date */}
                      <td className="p-3 whitespace-nowrap text-xs text-slate-500">
                        {new Date(r.createdAt).toLocaleDateString('pl-PL')}
                      </td>

                      {/* Open indicator */}
                      <td className="p-3 text-center text-slate-300 dark:text-slate-700 text-xs">›</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fault Report Drawer */}
      <FaultReportDrawer
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
        onViewHistory={(r) => {
          setHistoryTarget({ id: r.id, title: r.title });
        }}
        isAdmin={isAdmin}
        onDelete={handleDelete}
        onNavigateKaizen={handleNavigateKaizen}
        onUpdateStatus={handleUpdateStatus}
        onHoldAndExtend={handleHoldAndExtend}
      />

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

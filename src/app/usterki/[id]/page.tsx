'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useFaultReports, FaultReport } from '@/hooks/useFaultReports';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { ImageModal } from '@/components/ui/ImageModal';
import { ExtendDeadlineModal } from '@/components/ui/ExtendDeadlineModal';
import { ResolveFaultModal } from '@/components/ui/ResolveFaultModal';
import { PromptEmailModal } from '@/components/ui/PromptEmailModal';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';
import { downloadFaultReportEml } from '@/utils/faultReportEmailBuilder';
import { printFaultReport } from '@/utils/faultReportPrintBuilder';

const SEVERITY_LABELS: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: '🔴 Krytyczna',    cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  MODERATE: { label: '🟡 Umiarkowana',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  MINOR:    { label: '🟢 Mało istotna', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  OPEN:        { label: '🔓 Otwarte',    cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  IN_PROGRESS: { label: '⚙️ W trakcie', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  HOLD:        { label: '⏸️ Zawieszone', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  RESOLVED:    { label: '✅ Naprawione', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  CLOSED:      { label: '🔒 Zamknięte', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700' },
};

export default function FaultReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const { isAdmin } = useAuth();
  const { deleteReport } = useFaultReports();

  const [report, setReport] = useState<FaultReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useAccessTracker({
    entityType: 'FAULT',
    entityId: resolvedParams.id,
    entityTitle: report?.title || 'Zgłoszenie Usterki',
  });

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/fault-reports/${resolvedParams.id}`);
      if (!res.ok) throw new Error('Nie znaleziono zgłoszenia usterki');
      const data = await res.json();
      setReport(data);
    } catch (err: any) {
      showToast(err.message || 'Nie znaleziono zgłoszenia usterki', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string, comment?: string) => {
    try {
      const res = await fetch(`/api/fault-reports/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, operatorComment: comment }),
      });
      if (!res.ok) throw new Error('Błąd zmiany statusu');
      showToast('Status usterki został zaktualizowany!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd aktualizacji statusu', 'error');
    }
  };

  const handleHoldAndExtend = async (newDueDate: string, reason: string) => {
    try {
      const res = await fetch(`/api/fault-reports/${resolvedParams.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'HOLD', dueDate: newDueDate, operatorComment: reason }),
      });
      if (!res.ok) throw new Error('Błąd wydłużania terminu');
      showToast('Usterka została zawieszona i wydłużono termin!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd wydłużania terminu', 'error');
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Usuń Zgłoszenie Usterki',
      message: 'Czy na pewno chcesz usunąć to zgłoszenie awarii? Operacja jest nieodwracalna.',
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteReport(resolvedParams.id);
          showToast('Zgłoszenie usterki zostało usunięte', 'success');
          router.push('/usterki');
        } catch (err: any) {
          showToast(err.message || 'Błąd usuwania', 'error');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold animate-pulse">
        Ładowanie pełnej strony usterki...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-bold">Nie znaleziono zgłoszenia usterki.</p>
        <Link href="/usterki" className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs inline-block">
          ← Powrót do rejestru usterek
        </Link>
      </div>
    );
  }

  const sev = SEVERITY_LABELS[report.severity] || { label: report.severity, cls: 'bg-slate-100 text-slate-700' };
  const st = STATUS_LABELS[report.status] || { label: report.status, cls: 'bg-slate-100 text-slate-700' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/usterki"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs transition-colors"
          >
            ← Powrót do Usterek
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>🚨</span> Usterka: {report.title}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              ID: {report.id} | Utworzono: {new Date(report.createdAt).toLocaleString('pl-PL')}
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-300 dark:border-slate-700"
          >
            👥 Historia Zapoznań
          </button>
          <button
            type="button"
            onClick={() => setIsEmailModalOpen(true)}
            className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold transition-all border border-amber-300 dark:border-amber-800"
          >
            📧 E-mail (.EML)
          </button>
          <button
            type="button"
            onClick={() => printFaultReport(report)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold shadow-md transition-all"
          >
            🖨️ Drukuj / PDF
          </button>
          {isAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-3.5 py-2 bg-red-100 hover:bg-red-200 dark:bg-red-950/60 text-red-700 dark:text-red-300 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800"
            >
              🗑️ Usuń
            </button>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details & Photos */}
        <div className="md:col-span-2 space-y-6">
          {/* Status & Priority Badges */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 text-xs font-black rounded-xl border ${st.cls}`}>
                  {st.label}
                </span>
                <span className={`px-3 py-1 text-xs font-black rounded-xl border ${sev.cls}`}>
                  {sev.label}
                </span>
              </div>

              {report.dueDate && (
                <div className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  📅 Termin naprawy: <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold">{new Date(report.dueDate).toLocaleDateString('pl-PL')}</span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-1">Opis Awarii / Usterki</h2>
              <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                {report.description || '(Brak szczegółowego opisu)'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 font-bold block">📍 Obszar / Rejon</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.area?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">⚙️ Maszyna / Linia</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.machine?.name || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">👤 Zgłaszający</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.reportedBy || '—'}</span>
              </div>
            </div>
          </div>

          {/* Photos Section */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Dokumentacja Fotograficzna</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photo Before */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 block">Zdjęcie zgłoszonej usterki:</span>
                {report.photoUrl ? (
                  <button
                    type="button"
                    onClick={() => setSelectedImage(report.photoUrl!)}
                    className="block relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group cursor-pointer"
                  >
                    <img src={report.photoUrl} alt="Zdjęcie usterki" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                      🔍 Powiększ
                    </div>
                  </button>
                ) : (
                  <div className="w-full h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">
                    Brak zdjęcia zgłoszenia
                  </div>
                )}
              </div>

              {/* Photo After Fix */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">Zdjęcie po usunięciu awarii:</span>
                {report.fixPhotoUrl ? (
                  <button
                    type="button"
                    onClick={() => setSelectedImage(report.fixPhotoUrl!)}
                    className="block relative w-full h-48 rounded-2xl overflow-hidden border border-emerald-300 dark:border-emerald-800 group cursor-pointer"
                  >
                    <img src={report.fixPhotoUrl} alt="Zdjęcie po naprawie" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                      🔍 Powiększ
                    </div>
                  </button>
                ) : (
                  <div className="w-full h-48 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">
                    Brak zdjęcia po naprawie
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Actions & Workflow Controls */}
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Zarządzanie Statusem Usterki</h3>

            <div className="space-y-2">
              {report.status !== 'RESOLVED' && report.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={() => setIsResolveModalOpen(true)}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>✅</span> Oznacz jako Naprawione
                </button>
              )}

              {report.status === 'OPEN' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  ⚙️ Rozpocznij Naprawę (W trakcie)
                </button>
              )}

              {report.status !== 'HOLD' && report.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={() => setIsExtendModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  ⏸️ Zawieś i Wydłuż Termin
                </button>
              )}

              {report.status === 'RESOLVED' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('CLOSED')}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  🔒 Ostatecznie Zamknij Zgłoszenie
                </button>
              )}
            </div>
          </div>

          {/* Quick Kaizen Navigation */}
          <div className="p-5 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-300/80 dark:border-amber-800/80 rounded-3xl space-y-2">
            <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
              💡 Pomysł Udoskonalenia Kaizen
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Chcesz zgłosić usprawnienie zapobiegające powstawaniu tej awarii w przyszłości?
            </p>
            <Link
              href={`/kaizen/nowy?title=${encodeURIComponent(`Kaizen ws. usterki: ${report.title}`)}&areaId=${report.areaId || ''}&machineId=${report.machineId || ''}`}
              className="inline-block w-full py-2.5 text-center bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
            >
              + Utwórz Wniosek Kaizen z Usterki
            </Link>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ImageModal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} imageUrl={selectedImage} />
      <ExtendDeadlineModal isOpen={isExtendModalOpen} onClose={() => setIsExtendModalOpen(false)} currentDueDate={report.dueDate} onExtend={handleHoldAndExtend} />
      <ResolveFaultModal isOpen={isResolveModalOpen} onClose={() => setIsResolveModalOpen(false)} onConfirm={(comment) => handleUpdateStatus('RESOLVED', comment)} />
      <PromptEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Wysyłanie powiadomienia o usterce" defaultEmail="utrzymanieruchu@zaklad.pl" onConfirm={(email) => downloadFaultReportEml(report, email, window.location.origin)} />
      <DocumentAccessHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} entityType="FAULT" entityId={report.id} entityTitle={report.title} />
    </div>
  );
}

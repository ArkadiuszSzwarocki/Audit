'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQualityReports, QualityReport } from '@/hooks/useQualityReports';
import { QUALITY_CATEGORY_LABELS, QUALITY_SEVERITY_LABELS, QUALITY_STATUS_LABELS } from '@/components/ui/QualityReportDrawer';
import { ImageModal } from '@/components/ui/ImageModal';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';
import { PromptEmailModal } from '@/components/ui/PromptEmailModal';
import { downloadQualityEml } from '@/utils/qualityEmailBuilder';
import { printQualityReport } from '@/utils/qualityPrintBuilder';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

export default function QualityReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const { isAdmin } = useAuth();
  const { resolveReport, setDueDate, deleteReport } = useQualityReports();

  const [report, setReport] = useState<QualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  
  const [actionTakenInput, setActionTakenInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');

  useAccessTracker({
    entityType: 'QUALITY',
    entityId: resolvedParams.id,
    entityTitle: report?.title || 'Niezgodność Jakościowa',
  });

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jakosc/${resolvedParams.id}`);
      if (!res.ok) throw new Error('Nie znaleziono zgłoszenia jakościowego');
      const data = await res.json();
      setReport(data);
      if (data.actionTaken) setActionTakenInput(data.actionTaken);
    } catch (err: any) {
      showToast(err.message || 'Błąd ładowania zgłoszenia', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async () => {
    try {
      await resolveReport(resolvedParams.id, 'Kontroler Jakości', actionTakenInput);
      showToast('Zgłoszenie jakościowe zostało rozwiązane (CAPA)!', 'success');
      setIsResolving(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd zapisu', 'error');
    }
  };

  const handleSetDueDate = async () => {
    if (!newDueDate) return;
    try {
      await setDueDate(resolvedParams.id, newDueDate);
      showToast('Termin CAPA został zaktualizowany!', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd aktualizacji terminu', 'error');
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Usuń Niezgodność Jakościową',
      message: 'Czy na pewno chcesz usunąć to zgłoszenie jakościowe?',
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteReport(resolvedParams.id);
          showToast('Zgłoszenie jakościowe usunięte', 'success');
          router.push('/jakosc');
        } catch (err: any) {
          showToast(err.message || 'Błąd usuwania', 'error');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold animate-pulse">
        Ładowanie niezgodności jakościowej...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-bold">Nie znaleziono zgłoszenia jakościowego.</p>
        <Link href="/jakosc" className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs inline-block">
          ← Powrót do rejestru jakości
        </Link>
      </div>
    );
  }

  const cat = QUALITY_CATEGORY_LABELS[report.category] || { label: report.category, icon: '📦' };
  const sev = QUALITY_SEVERITY_LABELS[report.severity] || { label: report.severity, cls: 'bg-slate-100 text-slate-700' };
  const st = QUALITY_STATUS_LABELS[report.status] || { label: report.status, cls: 'bg-slate-100 text-slate-700' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/jakosc"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs transition-colors"
          >
            ← Powrót do Jakości
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{cat.icon}</span> {report.title}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Kategoria: <strong>{cat.label}</strong> | Nr Partii: <strong>{report.batchNumber || '—'}</strong> | Utworzono: {new Date(report.createdAt).toLocaleString('pl-PL')}
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
            onClick={() => printQualityReport(report)}
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
        <div className="md:col-span-2 space-y-6">
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
                  📅 Termin CAPA: <span className="font-mono text-slate-900 dark:text-slate-100 font-extrabold">{new Date(report.dueDate).toLocaleDateString('pl-PL')}</span>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-1">Opis Niezgodności Jakościowej</h2>
              <p className="text-slate-800 dark:text-slate-200 font-medium whitespace-pre-wrap leading-relaxed">
                {report.description || '(Brak opisu)'}
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
                <span className="text-slate-400 font-bold block">📦 Nr Partii / Zlecenia</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200 font-mono">{report.batchNumber || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">👤 Inspektor / Kontroler</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.reportedBy || '—'}</span>
              </div>
            </div>
          </div>

          {/* Photo documentation */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Dokumentacja Fotograficzna Wad</h3>
            {report.photoUrl ? (
              <button
                type="button"
                onClick={() => setSelectedImage(report.photoUrl!)}
                className="block relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group cursor-pointer"
              >
                <img src={report.photoUrl} alt="Zdjęcie wady jakościowej" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                  🔍 Powiększ Zdjęcie
                </div>
              </button>
            ) : (
              <div className="w-full h-32 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">
                Brak zdjęcia wady jakościowej
              </div>
            )}
          </div>
        </div>

        {/* Actions panel */}
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Działania Korygujące (CAPA)</h3>

            {report.actionTaken && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block mb-1">
                  Wdrożone akcje CAPA:
                </span>
                <p className="text-xs text-emerald-900 dark:text-emerald-100 font-medium whitespace-pre-wrap">
                  {report.actionTaken}
                </p>
              </div>
            )}

            <div className="space-y-3">
              {report.status !== 'RESOLVED' && (
                <>
                  {!isResolving ? (
                    <button
                      type="button"
                      onClick={() => setIsResolving(true)}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>✅</span> Zatwierdź Działania CAPA (Zakończ)
                    </button>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Opisz wdrożone działania korygujące / zapobiegawcze:
                      </label>
                      <textarea
                        rows={3}
                        value={actionTakenInput}
                        onChange={(e) => setActionTakenInput(e.target.value)}
                        placeholder="np. Skorygowano nastawę maszyny, odrzucono wadliwą partię surowca..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleResolve}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Zapisz i Zakończ
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsResolving(false)}
                          className="py-2 px-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Anuluj
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Set Due Date */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  Ustaw / Wyznacz Termin CAPA:
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSetDueDate}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer shrink-0"
                  >
                    Zapisz
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ImageModal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} imageUrl={selectedImage} />
      <PromptEmailModal isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)} title="Wysyłanie powiadomienia o wylosowanej wadze jakości" defaultEmail="jakosc@zaklad.pl" onConfirm={(email) => downloadQualityEml(report, email, window.location.origin)} />
      <DocumentAccessHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} entityType="QUALITY" entityId={report.id} entityTitle={report.title} />
    </div>
  );
}

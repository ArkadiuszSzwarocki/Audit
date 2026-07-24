'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useBhpHazardReports, BhpHazardReport } from '@/hooks/useBhpHazardReports';
import { CATEGORY_LABELS, SEVERITY_LABELS, STATUS_LABELS } from '@/components/ui/BhpHazardDrawer';
import { ImageModal } from '@/components/ui/ImageModal';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

export default function BhpHazardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const { isAdmin } = useAuth();
  const { fetchReports, resolveReport, deleteReport } = useBhpHazardReports();

  const [report, setReport] = useState<BhpHazardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [actionTakenInput, setActionTakenInput] = useState('');
  const [isResolving, setIsResolving] = useState(false);

  useAccessTracker({
    entityType: 'BHP',
    entityId: resolvedParams.id,
    entityTitle: report?.title || 'Zgłoszenie BHP',
  });

  useEffect(() => {
    loadData();
  }, [resolvedParams.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bhp/${resolvedParams.id}`);
      if (!res.ok) throw new Error('Nie znaleziono zgłoszenia BHP');
      const data = await res.json();
      setReport(data);
      if (data.actionTaken) setActionTakenInput(data.actionTaken);
    } catch (err: any) {
      showToast(err.message || 'Błąd ładowania zgłoszenia BHP', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      if (newStatus === 'RESOLVED') {
        await resolveReport(resolvedParams.id, undefined, actionTakenInput);
      } else {
        const res = await fetch(`/api/bhp/${resolvedParams.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        if (!res.ok) throw new Error('Błąd zmiany statusu BHP');
      }
      showToast('Status zagrożenia BHP został zaktualizowany!', 'success');
      setIsResolving(false);
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Błąd zapisu', 'error');
    }
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Usuń Zgłoszenie BHP',
      message: 'Czy na pewno chcesz usunąć to zgłoszenie zagrożenia BHP?',
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteReport(resolvedParams.id);
          showToast('Zgłoszenie BHP usunięte', 'success');
          router.push('/bhp');
        } catch (err: any) {
          showToast(err.message || 'Błąd usuwania', 'error');
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-bold animate-pulse">
        Ładowanie zgłoszenia BHP...
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-red-500 font-bold">Nie znaleziono zgłoszenia BHP.</p>
        <Link href="/bhp" className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-bold text-xs inline-block">
          ← Powrót do rejestru BHP
        </Link>
      </div>
    );
  }

  const cat = CATEGORY_LABELS[report.category] || { label: report.category, icon: '🛡️' };
  const sev = SEVERITY_LABELS[report.severity] || { label: report.severity, cls: 'bg-slate-100 text-slate-700' };
  const st = STATUS_LABELS[report.status] || { label: report.status, cls: 'bg-slate-100 text-slate-700' };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/bhp"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs transition-colors"
          >
            ← Powrót do BHP
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>{cat.icon}</span> {report.title}
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Kategoria: <strong>{cat.label}</strong> | Utworzono: {new Date(report.createdAt).toLocaleString('pl-PL')}
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
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-black rounded-xl border ${st.cls}`}>
                {st.label}
              </span>
              <span className={`px-3 py-1 text-xs font-black rounded-xl border ${sev.cls}`}>
                {sev.label}
              </span>
            </div>

            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 mb-1">Opis Zagrożenia / Zgłoszenia Near Miss</h2>
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
                <span className="text-slate-400 font-bold block">👤 Zgłaszający</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-200">{report.reportedBy || '—'}</span>
              </div>
            </div>
          </div>

          {/* Photo documentation */}
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Zdjęcie Zgłoszenia</h3>
            {report.photoUrl ? (
              <button
                type="button"
                onClick={() => setSelectedImage(report.photoUrl!)}
                className="block relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 group cursor-pointer"
              >
                <img src={report.photoUrl} alt="Zdjęcie zagrożenia BHP" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs">
                  🔍 Powiększ Zdjęcie
                </div>
              </button>
            ) : (
              <div className="w-full h-32 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-xs font-medium">
                Brak zdjęcia do tego zgłoszenia BHP
              </div>
            )}
          </div>
        </div>

        {/* Actions panel */}
        <div className="space-y-6">
          <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Działania Zaradcze BHP</h3>

            {report.actionTaken && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 block mb-1">
                  Wykonane działania:
                </span>
                <p className="text-xs text-emerald-900 dark:text-emerald-100 font-medium whitespace-pre-wrap">
                  {report.actionTaken}
                </p>
              </div>
            )}

            <div className="space-y-2">
              {report.status !== 'RESOLVED' && (
                <>
                  {!isResolving ? (
                    <button
                      type="button"
                      onClick={() => setIsResolving(true)}
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>✅</span> Wyeliminuj Zagrożenie (Zakończ)
                    </button>
                  ) : (
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Opisz wykonane działania korekcyjne:
                      </label>
                      <textarea
                        rows={3}
                        value={actionTakenInput}
                        onChange={(e) => setActionTakenInput(e.target.value)}
                        placeholder="np. Zabezpieczono odsłoniętą osłonę, wymieniono taśmę ostrzegawczą..."
                        className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus('RESOLVED')}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                        >
                          Zapisz i Wyeliminuj
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

              {report.status === 'OPEN' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus('IN_PROGRESS')}
                  className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-2xl shadow-sm transition-all cursor-pointer"
                >
                  ⚙️ Rozpocznij Analizę (W trakcie)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ImageModal isOpen={!!selectedImage} onClose={() => setSelectedImage(null)} imageUrl={selectedImage} />
      <DocumentAccessHistoryModal isOpen={isHistoryModalOpen} onClose={() => setIsHistoryModalOpen(false)} entityType="BHP" entityId={report.id} entityTitle={report.title} />
    </div>
  );
}

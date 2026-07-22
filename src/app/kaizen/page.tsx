'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useKaizen, Kaizen } from '@/hooks/useKaizen';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { ImageModal } from '@/components/ui/ImageModal';
import { downloadKaizenEml } from '@/utils/kaizenEmailBuilder';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: '💡 Oczekujący',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  APPROVED: { label: '✅ Zatwierdzony', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  REJECTED: { label: '❌ Odrzucony',   cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
};

interface KaizenGoal {
  title: string;
  targetPoints: number;
  period: string;
  rewardInfo: string;
}

export default function KaizenListPage() {
  const router = useRouter();
  const { kaizens, loading, fetchKaizens, deleteKaizen } = useKaizen();
  const { isAdmin } = useAuth();
  const { showToast, showConfirm } = useToast();

  useAccessTracker({
    entityType: 'KAIZEN',
    entityId: 'KAIZEN_LISTA',
    entityTitle: 'Rejestr Wniosków Kaizen',
  });

  const [filterStatus, setFilterStatus] = useState('');
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; title: string } | null>(null);
  const [teamGoal, setTeamGoal] = useState<KaizenGoal>({
    title: 'Miesięczny Cel Kaizen Zespołu',
    targetPoints: 500,
    period: 'MONTHLY',
    rewardInfo: 'Wyróżnienie Pomysłodawcy Miesiąca i premia zespołowa',
  });

  useEffect(() => {
    fetchKaizens(kaizens.length === 0);
    fetchGoal();
  }, [fetchKaizens, kaizens.length]);

  const fetchGoal = async () => {
    try {
      const res = await fetch('/api/kaizen-scoring');
      if (res.ok) {
        const data = await res.json();
        if (data.goal) setTeamGoal(data.goal);
      }
    } catch {
      // Ignore goal fetch errors
    }
  };

  const handleDownloadEml = (r: Kaizen) => {
    const emailToUse = prompt('Podaj adres e-mail odbiorcy powiadomienia (np. komisja kaizen, kierownik):', 'komisja.kaizen@zaklad.pl');
    if (emailToUse && emailToUse.trim()) {
      const baseUrl = window.location.origin;
      downloadKaizenEml(
        {
          id: r.id,
          title: r.title,
          description: r.description,
          benefits: r.benefits,
          submittedBy: r.submittedBy,
          areaName: r.area?.name,
          machineName: r.machine?.name,
          photoUrl: r.photoUrl,
        },
        emailToUse.trim(),
        baseUrl
      );
      showToast('Pobrano plik .eml z powiadomieniem Kaizen!', 'success');
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Usuń Pomysł Kaizen',
      message: 'Czy na pewno chcesz usunąć ten wniosek Kaizen?',
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteKaizen(id);
          showToast('Wniosek Kaizen usunięty', 'success');
        } catch (err: any) {
          showToast(err.message || 'Błąd podczas usuwania', 'error');
        }
      },
    });
  };

  const pendingCount = kaizens.filter(k => k.status === 'PENDING').length;
  const approvedCount = kaizens.filter(k => k.status === 'APPROVED').length;
  const rejectedCount = kaizens.filter(k => k.status === 'REJECTED').length;

  const totalPointsAwarded = kaizens
    .filter(k => k.status === 'APPROVED')
    .reduce((sum, k) => sum + (k.pointsAwarded || 0), 0);

  const goalPercentage = Math.min(100, Math.round((totalPointsAwarded / (teamGoal.targetPoints || 500)) * 100));

  const filteredKaizens = filterStatus
    ? kaizens.filter(k => k.status === filterStatus)
    : kaizens;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            💡 Rejestr Pomysłów Kaizen
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Ewidencja i śledzenie wniosków ciągłego doskonalenia zgłoszonych przez zespół.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryTarget({ id: 'KAIZEN_LISTA', title: 'Rejestr Wniosków Kaizen' })}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Zobacz osoby, które otworzyły i zapoznały się z rejestrem wniosków Kaizen"
          >
            👥 Zapoznania z Rejestrem
          </button>
          <button
            onClick={() => fetchKaizens(false)}
            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-sm font-bold transition-colors cursor-pointer"
          >
            ↻ Odśwież
          </button>
          <Link
            href="/kaizen/nowy"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            + Zgłoś Pomysł
          </Link>
        </div>
      </div>

      {/* Team Points Goal Progress Widget */}
      {!loading && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-300/80 dark:border-amber-800/80 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-sm space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="text-3xl p-2 bg-amber-500 text-white rounded-xl shadow-sm">🎯</span>
              <div>
                <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  {teamGoal.title}
                  <span className="px-2.5 py-0.5 bg-amber-500 text-white font-black text-xs rounded-full">
                    {totalPointsAwarded} / {teamGoal.targetPoints} pkt ({goalPercentage}%)
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                  {teamGoal.rewardInfo || 'Kaizen to wspólne korzyści dla całego zakładu!'}
                </p>
              </div>
            </div>

            {isAdmin && (
              <Link
                href="/ustawienia/punktacja-kaizen"
                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold transition-all border border-amber-300 dark:border-amber-800 shrink-0"
              >
                ⚙️ Ustawienia Punktacji
              </Link>
            )}
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
              style={{ width: `${goalPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
              <span className="text-2xl">💡</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{pendingCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mt-1">Oczekujące na ocenę</div>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
              <span className="text-2xl">✅</span>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{approvedCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-1">Zatwierdzone</div>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/60 flex items-center justify-center shrink-0">
              <span className="text-2xl">❌</span>
            </div>
            <div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400 leading-none">{rejectedCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mt-1">Odrzucone</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center bg-slate-100 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
        {[
          ['', 'Wszystkie Pomysły'],
          ['PENDING', '💡 Oczekujące'],
          ['APPROVED', '✅ Zatwierdzone'],
          ['REJECTED', '❌ Odrzucone']
        ].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilterStatus(val)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              filterStatus === val
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm border border-slate-200 dark:border-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-auto text-xs font-bold text-slate-500 pr-2">
          Łącznie: <strong>{filteredKaizens.length}</strong>
        </div>
      </div>

      {/* Table List View */}
      {loading ? (
        <div className="text-center p-12 animate-pulse text-slate-400 font-bold">Ładowanie bazy pomysłów Kaizen...</div>
      ) : filteredKaizens.length === 0 ? (
        <div className="text-center py-16 glass-card font-bold text-amber-600 dark:text-amber-400 text-xl border border-dashed border-amber-300 dark:border-amber-800 rounded-2xl">
          💡 Brak wniosków Kaizen spełniających kryteria!
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-black border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">Status i Punkty</th>
                  <th className="p-3">Tytuł Pomysłu, Opis i Korzyści</th>
                  <th className="p-3">Obszar / Maszyna</th>
                  <th className="p-3">Zgłaszający</th>
                  <th className="p-3 whitespace-nowrap">Data Zgłoszenia</th>
                  <th className="p-3 text-center w-36">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredKaizens.map((k: Kaizen, idx: number) => {
                  const st = STATUS_LABELS[k.status] ?? { label: k.status, cls: 'bg-slate-100 text-slate-700' };

                  return (
                    <tr
                      key={k.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* # Index */}
                      <td className="p-3 text-center font-bold text-xs text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Status Badge & Points */}
                      <td className="p-3 whitespace-nowrap space-y-1.5">
                        <div>
                          <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                        {k.status === 'APPROVED' && Boolean(k.pointsAwarded) && (
                          <div>
                            <span className="px-2 py-0.5 bg-amber-500 text-white font-black text-[10px] rounded-lg shadow-xs">
                              ⭐ +{k.pointsAwarded} pkt
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Title, Description & Benefits */}
                      <td className="p-3 max-w-md">
                        <div className="flex items-start gap-3">
                          {k.photoUrl && (
                            <button
                              onClick={() => setModalImage(k.photoUrl!)}
                              className="shrink-0 cursor-pointer group relative"
                              title="Kliknij, aby powiększyć zdjęcie"
                            >
                              <img
                                src={k.photoUrl}
                                alt="Miniatura"
                                className="w-12 h-12 object-cover rounded-xl border border-slate-300 dark:border-slate-700 group-hover:scale-105 transition-transform"
                              />
                            </button>
                          )}
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                              {k.title}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                              {k.description}
                            </p>
                            {k.benefits && (
                              <div className="mt-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                💡 Korzyść: <span className="line-clamp-1 italic">{k.benefits}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Area & Machine */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          📍 {k.area?.name || 'Cały zakład'}
                        </div>
                        {k.machine && (
                          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            ⚙️ {k.machine.name}
                          </div>
                        )}
                      </td>

                      {/* Submitter */}
                      <td className="p-3 whitespace-nowrap text-xs">
                        <strong className="text-slate-800 dark:text-slate-200">{k.submittedBy}</strong>
                      </td>

                      {/* Dates */}
                      <td className="p-3 whitespace-nowrap text-xs text-slate-500">
                        {new Date(k.createdAt).toLocaleDateString('pl-PL')}
                      </td>

                      {/* Action Icon Buttons */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setHistoryTarget({ id: k.id, title: k.title })}
                            className="p-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer"
                            title="Zobacz osoby, które zapoznały się z tym wniskiem Kaizen"
                          >
                            👥
                          </button>

                          <button
                            onClick={() => handleDownloadEml(k)}
                            className="p-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800/60 cursor-pointer"
                            title="Pobierz powiadomienie e-mail w formacie .eml"
                          >
                            📧
                          </button>

                          <button
                            onClick={() => router.push(`/kaizen/${k.id}`)}
                            className="p-2 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-bold transition-all border border-brand-200 dark:border-brand-800/60 cursor-pointer"
                            title="Otwórz szczegóły wniosku i decyzję komisji"
                          >
                            🔍
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(k.id)}
                              className="p-2 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800/60 cursor-pointer"
                              title="Usuń wniosek Kaizen"
                            >
                              🗑️
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
          entityType="KAIZEN"
          entityId={historyTarget.id}
          entityTitle={historyTarget.title}
        />
      )}
    </div>
  );
}

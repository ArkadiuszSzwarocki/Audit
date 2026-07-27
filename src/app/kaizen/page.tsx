'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useKaizen, Kaizen } from '@/hooks/useKaizen';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';
import { KaizenDrawer } from '@/components/ui/KaizenDrawer';
import { KaizenRewardPayoutModal } from '@/components/ui/KaizenRewardPayoutModal';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: '💡 Oczekujący',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  APPROVED: { label: '✅ Zatwierdzony', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  REJECTED: { label: '❌ Odrzucony',   cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  HOLD:     { label: '⏸️ Wstrzymany',   cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
};

export default function KaizenListPage() {
  const router = useRouter();
  const { kaizens, loading, fetchKaizens, deleteKaizen } = useKaizen();
  const { user, isAdmin, isKaizenCommittee } = useAuth();
  const { showToast, showConfirm } = useToast();
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);

  const canManage = isAdmin || isKaizenCommittee || (user?.role && ['KOMISJA KAIZEN', 'KOMISJA_KAIZEN', 'KAIZEN_COMMITTEE'].includes(user.role.toUpperCase()));

  useAccessTracker({
    entityType: 'KAIZEN',
    entityId: 'KAIZEN_LISTA',
    entityTitle: 'Rejestr Wniosków Kaizen',
  });

  const [filterStatus, setFilterStatus] = useState('');
  const [selectedKaizen, setSelectedKaizen] = useState<Kaizen | null>(null);
  const [historyTarget, setHistoryTarget] = useState<{ id: string; title: string } | null>(null);
  const [isScoringEnabled, setIsScoringEnabled] = useState(false);

  useEffect(() => {
    fetchKaizens(true);
    fetchScoringStatus();
  }, [fetchKaizens]);

  const fetchScoringStatus = async () => {
    try {
      const res = await fetch('/api/kaizen-scoring');
      if (res.ok) {
        const data = await res.json();
        if (data.goal?.isScoringEnabled !== undefined) {
          setIsScoringEnabled(data.goal.isScoringEnabled);
        }
      }
    } catch {
      // Ignore error
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

  const safeKaizens = Array.isArray(kaizens) ? kaizens.filter((k): k is Kaizen => Boolean(k && k.id)) : [];

  const pendingCount = safeKaizens.filter(k => k.status === 'PENDING').length;
  const approvedCount = safeKaizens.filter(k => k.status === 'APPROVED').length;
  const rejectedCount = safeKaizens.filter(k => k.status === 'REJECTED').length;

  const totalPointsAwarded = safeKaizens
    .filter(k => k.status === 'APPROVED')
    .reduce((sum, k) => sum + (k.pointsAwarded || 0), 0);

  const filteredKaizens = filterStatus
    ? safeKaizens.filter(k => k.status === filterStatus)
    : safeKaizens;

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
        <div className="flex flex-wrap items-center gap-3">
          {canManage && (
            <Link
              href="/kaizen/raporty-komisji"
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              📊 Raporty Komisji
            </Link>
          )}
          {canManage && (
            <Link
              href="/kaizen/wyplaty"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
            >
              💳 Wypłaty Nagród Kaizen
            </Link>
          )}
          {canManage && (
            <Link
              href="/ustawienia/punktacja-kaizen"
              className="px-3.5 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center gap-2"
            >
              ⚙️ Ustawienia Punktacji
            </Link>
          )}
          <button
            onClick={() => setHistoryTarget({ id: 'KAIZEN_LISTA', title: 'Rejestr Wniosków Kaizen' })}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Zobacz osoby, które otworzyły i zapoznały się z rejestrem wniosków Kaizen"
          >
            👥 Zapoznania z Rejestrem
          </button>
          <Link
            href="/dokumentacja"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm shadow-xs transition-all flex items-center gap-2"
          >
            📜 Regulamin Kaizen (Dokumentacja)
          </Link>
          <Link
            href="/kaizen/nowy"
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold text-sm shadow-md transition-all flex items-center gap-2"
          >
            + Zgłoś Pomysł
          </Link>
        </div>
      </div>

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
          ['REJECTED', '❌ Odrzucone'],
          ['HOLD', '⏸️ Wstrzymane']
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
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3 w-36">Status</th>
                  <th className="p-3">Tytuł Pomysłu</th>
                  <th className="p-3 whitespace-nowrap w-32">Data Zgłoszenia</th>
                  <th className="p-3 text-center w-10">
                    <span title="Kliknij wiersz, aby otworzyć szczegóły">ℹ️</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredKaizens.map((k: Kaizen, idx: number) => {
                  const st = STATUS_LABELS[k.status] ?? { label: k.status, cls: 'bg-slate-100 text-slate-700' };

                  return (
                    <tr
                      key={k.id}
                      onClick={() => router.push(`/kaizen/${k.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <td className="p-3 text-center font-bold text-xs text-slate-400">{idx + 1}</td>

                      <td className="p-3 whitespace-nowrap space-y-1">
                        <div>
                          <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${st.cls}`}>
                            {st.label}
                          </span>
                        </div>
                        {k.status === 'APPROVED' && Boolean(isScoringEnabled) && Boolean(k.pointsAwarded) && (
                          <div>
                            <span className="px-2 py-0.5 bg-amber-500 text-white font-black text-[10px] rounded-md">
                              ⭐ +{k.pointsAwarded} pkt
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                          {k.title}
                        </div>
                        {k.area && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            📍 {k.area.name}{k.machine ? ` · ⚙️ ${k.machine.name}` : ''}
                          </div>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap text-xs text-slate-500">
                        {new Date(k.createdAt).toLocaleDateString('pl-PL')}
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

      {/* Kaizen Drawer */}
      <KaizenDrawer
        kaizen={selectedKaizen}
        onClose={() => setSelectedKaizen(null)}
        onViewHistory={(k) => {
          setHistoryTarget({ id: k.id, title: k.title });
        }}
        isAdmin={isAdmin}
        onDelete={handleDelete}
      />

      {historyTarget && (
        <DocumentAccessHistoryModal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          entityType="KAIZEN"
          entityId={historyTarget.id}
          entityTitle={historyTarget.title}
        />
      )}

      {user && (
        <KaizenRewardPayoutModal
          isOpen={isPayoutModalOpen}
          onClose={() => setIsPayoutModalOpen(false)}
          user={user}
          userPoints={totalPointsAwarded}
          submittedKaizensCount={kaizens.length}
          isScoringEnabled={isScoringEnabled}
        />
      )}
    </div>
  );
}

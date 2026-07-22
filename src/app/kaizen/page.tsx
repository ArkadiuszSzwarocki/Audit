'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useKaizen } from '@/hooks/useKaizen';
import { useToast } from '@/context/ToastContext';
import { downloadKaizenEml } from '@/utils/kaizenEmailBuilder';
import { useAccessTracker } from '@/hooks/useAccessTracker';

export default function KaizenListPage() {
  const { kaizens, loading, fetchKaizens } = useKaizen();
  const { showToast } = useToast();

  useAccessTracker({
    entityType: 'KAIZEN',
    entityId: 'KAIZEN_LISTA',
    entityTitle: 'Rejestr Wniosków Kaizen',
  });

  useEffect(() => {
    fetchKaizens(kaizens.length === 0);
  }, [fetchKaizens, kaizens.length]);

  const handleDownloadEml = (e: React.MouseEvent, k: any) => {
    e.preventDefault();
    e.stopPropagation();
    const emailToUse = prompt('Podaj adres e-mail odbiorcy powiadomienia (np. komisja kaizen, kierownik):', 'komisja.kaizen@zaklad.pl');
    if (emailToUse && emailToUse.trim()) {
      const baseUrl = window.location.origin;
      downloadKaizenEml(
        {
          id: k.id,
          title: k.title,
          description: k.description,
          benefits: k.benefits,
          submittedBy: k.submittedBy,
          areaName: k.area?.name,
          machineName: k.machine?.name,
          photoUrl: k.photoUrl,
        },
        emailToUse.trim(),
        baseUrl
      );
      showToast('Pobrano plik .eml z powiadomieniem Kaizen!', 'success');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto">
      <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            System Kaizen
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm">
            Lista pomysłów ciągłego doskonalenia zgłoszonych przez zespół.
          </p>
        </div>
        <Link 
          href="/kaizen/nowy"
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl shadow-md transition-all font-bold text-sm flex items-center gap-2 cursor-pointer"
        >
          + Zgłoś Pomysł
        </Link>
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-400 animate-pulse">Ładowanie bazy pomysłów...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kaizens.length === 0 ? (
            <div className="col-span-full text-center text-slate-500 py-12 glass-card">
              Nie ma jeszcze żadnych zgłoszonych pomysłów. Bądź pierwszy!
            </div>
          ) : (
            kaizens.map(k => (
              <div
                key={k.id}
                className="group flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500 transition-all justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${
                      k.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300' :
                      k.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      k.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {k.status === 'PENDING' ? '💡 Oczekujący' :
                       k.status === 'APPROVED' ? '✅ Zatwierdzony' :
                       k.status === 'REJECTED' ? '❌ Odrzucony' : '⏸️ Wstrzymany'}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(k.createdAt).toLocaleDateString('pl-PL')}
                    </span>
                  </div>

                  <Link href={`/kaizen/${k.id}`}>
                    <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors leading-snug">
                      {k.title}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                      {k.description}
                    </p>
                  </Link>
                </div>

                <div>
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
                    <span className="font-medium">👷 Zgłosił(a): <strong>{k.submittedBy}</strong></span>
                    {k.photoUrl && <span title="Zawiera załącznik graficzny">📷</span>}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex justify-between items-center">
                    <button
                      onClick={(e) => handleDownloadEml(e, k)}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Pobierz powiadomienie e-mail w formacie .eml do wysłania w Outlooku"
                    >
                      📧 Pobierz .EML
                    </button>
                    <Link
                      href={`/kaizen/${k.id}`}
                      className="text-xs font-bold text-slate-500 hover:text-amber-600 transition-colors"
                    >
                      Szczegóły →
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

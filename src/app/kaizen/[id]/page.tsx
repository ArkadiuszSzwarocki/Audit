'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useKaizen, Kaizen } from '@/hooks/useKaizen';
import { useAuth } from '@/hooks/useAuth';
import { ImageModal } from '@/components/ui/ImageModal';
import { useToast } from '@/context/ToastContext';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';

interface ScoringCategory {
  id: string;
  name: string;
  description: string;
  minPoints: number;
  maxPoints: number;
  icon: string;
  color: string;
}

const DEFAULT_CATEGORIES: ScoringCategory[] = [
  { id: 'cat-1', name: '🛡️ Kryterium 1: Wpływ na Bezpieczeństwo i Jakość (w tym Jakość Żywności)', description: '0 pkt - Brak wpływu | 1 pkt - Estetyka/5S | 3 pkt - Usprawnienie procesów/zmniejszenie ryzyka | 5 pkt - Eliminacja krytycznego ryzyka/ciała obcego', minPoints: 0, maxPoints: 5, icon: '🛡️', color: 'purple' },
  { id: 'cat-2', name: '⛑️ Kryterium 2: Wpływ na BHP i Ergonomię', description: '0 pkt - Brak wpływu | 1 pkt - Komfort pracy | 3 pkt - Wyraźna poprawa ergonomii | 5 pkt - Eliminacja zagrożenia wypadkiem/chorobą', minPoints: 0, maxPoints: 5, icon: '⛑️', color: 'red' },
  { id: 'cat-3', name: '⚡ Kryterium 3: Efektywność, Oszczędność i Redukcja Marnotrawstwa (Muda)', description: '0 pkt - Brak oszczędności | 1 pkt - Drobne oszczędności materiałowe | 3 pkt - Skrócenie przezbrojenia/automatyzacja | 5 pkt - Duża redukcja kosztów/wydajność', minPoints: 0, maxPoints: 5, icon: '⚡', color: 'emerald' },
  { id: 'cat-4', name: '🛠️ Kryterium 4: Łatwość i Koszt Wdrożenia', description: '0 pkt - Bardzo drogie/zewnętrzne | 1 pkt - Czas i zakupy | 3 pkt - Niskie koszty/wewnętrzne UR | 5 pkt - Bezkosztowe od ręki', minPoints: 0, maxPoints: 5, icon: '🛠️', color: 'blue' },
];

export default function KaizenReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { fetchKaizenById, updateKaizenStatus } = useKaizen();
  const { isAdmin, user } = useAuth();
  const { showToast, showConfirm } = useToast();
  
  const [kaizen, setKaizen] = useState<Kaizen | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [status, setStatus] = useState<string>('PENDING');
  const [committeeNote, setCommitteeNote] = useState('');
  const [pointsAwarded, setPointsAwarded] = useState<number>(0);
  const [pointsCategory, setPointsCategory] = useState<string>('');
  const [scoringCategories, setScoringCategories] = useState<ScoringCategory[]>(DEFAULT_CATEGORIES);
  const [isScoringEnabled, setIsScoringEnabled] = useState<boolean>(false);
  
  // 4 Criteria Scores (Załącznik nr 2)
  const [c1, setC1] = useState<number>(0);
  const [c2, setC2] = useState<number>(0);
  const [c3, setC3] = useState<number>(0);
  const [c4, setC4] = useState<number>(0);
  const [isLocked, setIsLocked] = useState<boolean>(false);

  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const parseCategoryScores = (catStr?: string | null) => {
    if (!catStr) return { k1: 0, k2: 0, k3: 0, k4: 0 };
    const m1 = catStr.match(/K1=(\d+)/);
    const m2 = catStr.match(/K2=(\d+)/);
    const m3 = catStr.match(/K3=(\d+)/);
    const m4 = catStr.match(/K4=(\d+)/);
    return {
      k1: m1 ? parseInt(m1[1], 10) : 0,
      k2: m2 ? parseInt(m2[1], 10) : 0,
      k3: m3 ? parseInt(m3[1], 10) : 0,
      k4: m4 ? parseInt(m4[1], 10) : 0,
    };
  };

  const handleSelectCriterion = (catIndex: 1 | 2 | 3 | 4, val: number) => {
    if (isLocked) return;
    let n1 = c1, n2 = c2, n3 = c3, n4 = c4;
    if (catIndex === 1) { n1 = val; setC1(val); }
    if (catIndex === 2) { n2 = val; setC2(val); }
    if (catIndex === 3) { n3 = val; setC3(val); }
    if (catIndex === 4) { n4 = val; setC4(val); }

    const total = n1 + n2 + n3 + n4;
    setPointsAwarded(total);
    setPointsCategory(`Karta Oceny: K1=${n1}p, K2=${n2}p, K3=${n3}p, K4=${n4}p`);
  };

  const getRewardTierInfo = (pts: number) => {
    if (pts === 0) return { label: 'Odrzucony / Brak nagrody', reward: '0 zł', cls: 'bg-red-100/90 text-red-900 border-red-300 dark:bg-red-950/70 dark:text-red-200 dark:border-red-800' };
    if (pts <= 5) return { label: 'Nagroda IV Stopnia', reward: '10 zł netto', cls: 'bg-blue-100/90 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800' };
    if (pts <= 10) return { label: 'Nagroda III Stopnia', reward: '50 zł netto', cls: 'bg-amber-100/90 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-200 dark:border-amber-800' };
    if (pts <= 15) return { label: 'Nagroda II Stopnia', reward: '100 zł netto', cls: 'bg-emerald-100/90 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800' };
    return { label: 'Nagroda I Stopnia', reward: '150 zł netto', cls: 'bg-purple-100/90 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-200 dark:border-purple-800' };
  };

  useAccessTracker({
    entityType: 'KAIZEN',
    entityId: resolvedParams.id,
    entityTitle: kaizen?.title || 'Wniosek Kaizen',
  });

  useEffect(() => {
    loadKaizen();
    fetchScoringCategories();
  }, [resolvedParams.id]);

  const fetchScoringCategories = async () => {
    try {
      const res = await fetch('/api/kaizen-scoring');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories) && data.categories.length > 0) {
          setScoringCategories(data.categories);
        }
        setIsScoringEnabled(Boolean(data.goal?.isScoringEnabled));
      }
    } catch (err) {
      console.error('Błąd pobierania kategorii punktacji:', err);
    }
  };

  const loadKaizen = async () => {
    setLoading(true);
    try {
      const data = await fetchKaizenById(resolvedParams.id);
      setKaizen(data);
      setStatus(data.status);
      setCommitteeNote(data.committeeNote || '');
      const pts = data.pointsAwarded || 0;
      setPointsAwarded(pts);
      setPointsCategory(data.pointsCategory || '');

      const parsed = parseCategoryScores(data.pointsCategory);
      setC1(parsed.k1);
      setC2(parsed.k2);
      setC3(parsed.k3);
      setC4(parsed.k4);

      if (data.status === 'APPROVED' || data.status === 'REJECTED') {
        setIsLocked(true);
      } else {
        setIsLocked(false);
      }
    } catch (err: any) {
      showToast(err.message || 'Nie znaleziono wniosku', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    let finalStatus = status;
    if (finalStatus !== 'HOLD') {
      finalStatus = pointsAwarded > 0 ? 'APPROVED' : 'REJECTED';
    }
    setIsUpdating(true);
    try {
      await updateKaizenStatus(
        resolvedParams.id,
        finalStatus,
        committeeNote,
        finalStatus === 'APPROVED' ? pointsAwarded : 0,
        finalStatus === 'APPROVED' ? pointsCategory : undefined
      );
      setIsLocked(finalStatus === 'APPROVED' || finalStatus === 'REJECTED');
      showToast(
        finalStatus === 'APPROVED' 
          ? `Wniosek został ZATWIERDZONY! Przyznano ${pointsAwarded} pkt.` 
          : finalStatus === 'REJECTED'
          ? 'Wniosek został ODRZUCONY (0 pkt).'
          : 'Wniosek został WSTRZYMANY.',
        'success'
      );
      router.push('/kaizen');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRevertToPending = async () => {
    showConfirm({
      title: 'Cofnięcie Decyzji i Punktacji Kaizen',
      message: 'Czy na pewno chcesz cofnąć zatwierdzenie i przyznane punkty? Wniosek wróci do statusu OCZEKUJĄCY.',
      confirmText: 'Cofnij zatwierdzenie',
      isDanger: true,
      onConfirm: async () => {
        setIsUpdating(true);
        try {
          await updateKaizenStatus(
            resolvedParams.id,
            'PENDING',
            '',
            0,
            ''
          );
          setStatus('PENDING');
          setPointsAwarded(0);
          setPointsCategory('');
          setC1(0);
          setC2(0);
          setC3(0);
          setC4(0);
          setIsLocked(false);
          setCommitteeNote('');
          showToast('Decyzja i punkty zostały cofnięte! Wniosek wrócił do statusu Oczekujący.', 'success');
          loadKaizen();
        } catch (err: any) {
          showToast(err.message, 'error');
        } finally {
          setIsUpdating(false);
        }
      }
    });
  };

  const handleDelete = () => {
    showConfirm({
      title: 'Usuwanie Wniosku Kaizen',
      message: 'Czy na pewno chcesz bezpowrotnie usunąć ten wniosek Kaizen?',
      confirmText: 'Usuń wniosek',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/kaizen/${resolvedParams.id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Błąd podczas usuwania');
        showToast('Wniosek został usunięty', 'success');
        router.push('/kaizen');
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="p-8 text-center animate-pulse print:hidden font-bold text-slate-400">Ładowanie wniosku...</div>;
  if (!kaizen) return <div className="p-8 text-center text-red-500 print:hidden font-bold">Błąd ładowania wniosku.</div>;

  return (
    <>
      {/* 1. Ekranowy Widok Aplikacji (Ukrywany podczas drukowania) */}
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500 space-y-8 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
          <div>
            <span className="text-brand-600 dark:text-brand-400 font-bold text-sm">Wniosek Kaizen</span>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
                {kaizen.title}
              </h1>
              {isAdmin && (
                <button 
                  onClick={handleDelete}
                  className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors cursor-pointer"
                  title="Usuń wniosek"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              Zgłoszony przez: <span className="font-semibold">{kaizen.submittedBy}</span> w dniu {new Date(kaizen.createdAt).toLocaleDateString()}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsHistoryModalOpen(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl shadow-md font-bold transition-all text-sm flex items-center gap-2 cursor-pointer"
              title="Zobacz osoby, które otworzyły i zapoznały się z wniesionym Kaizenem"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              👥 Kto zapoznał się z wnioskiem
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-md font-bold transition-all text-sm flex items-center gap-2 cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Drukuj Formularz
            </button>

            <span className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 ${
              kaizen.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
              kaizen.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
              kaizen.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {kaizen.status === 'PENDING' ? 'Oczekujący na decyzję' :
               kaizen.status === 'APPROVED' ? 'Zatwierdzony' :
               kaizen.status === 'REJECTED' ? 'Odrzucony' : 'Wstrzymany'}

              {kaizen.status === 'APPROVED' && Boolean(kaizen.pointsAwarded) && (
                <span className="px-2 py-0.5 bg-amber-500 text-white font-black text-xs rounded-full shadow-xs">
                  ⭐ +{kaizen.pointsAwarded} pkt
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-3">Opis pomysłu</h3>
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{kaizen.description}</p>
            </div>

            <div className="glass-card p-6 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800">
              <h3 className="text-lg font-bold text-emerald-800 dark:text-emerald-400 mb-3">Przewidywane korzyści</h3>
              <p className="text-emerald-700 dark:text-emerald-300 whitespace-pre-wrap">{kaizen.benefits || 'Brak opisu korzyści.'}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="glass-card p-6 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Lokalizacja</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400">Rejon</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{kaizen.area?.name || 'Cały zakład'}</p>
                </div>
                {kaizen.machine && (
                  <div>
                    <p className="text-xs text-slate-400">Maszyna</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">{kaizen.machine.name}</p>
                  </div>
                )}
              </div>
            </div>

            {kaizen.photoUrl && (() => {
              const photos = kaizen.photoUrl.split(',').map(s => s.trim()).filter(Boolean);
              if (photos.length === 0) return null;
              return (
                <div className="glass-card p-6 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 space-y-3">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    Załączniki ({photos.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {photos.map((url, idx) => (
                      <div 
                        key={`${url}-${idx}`}
                        className="relative aspect-square w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group bg-slate-900"
                        onClick={() => setSelectedImage(url)}
                      >
                        <img src={url} alt={`Załącznik ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-xs">🔍 Powiększ</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {isAdmin ? (
          <div className="glass-card p-6 md:p-8 bg-brand-50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-brand-200 dark:border-brand-800 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-brand-800 dark:text-brand-400">Decyzja Komisji Kaizen</h2>
                {isLocked && (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <span>🔒</span> Wniosek został zatwierdzony i zablokowany przed przypadkową zmianą punktów.
                  </p>
                )}
              </div>

              {/* Przyciski Odblokowania i Cofnięcia dla Admina */}
              {isLocked && (
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsLocked(false)}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="Odblokuj formularz oceny punktowej do edycji"
                  >
                    🔓 Odblokuj do Edycji
                  </button>
                  <button
                    type="button"
                    onClick={handleRevertToPending}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    title="Cofnij decyzję i usuń przyznane punkty"
                  >
                    ↩️ Cofnij Zatwierdzenie
                  </button>
                </div>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Mode Selection: Ocena Punktowa vs Wstrzymaj */}
              {!isLocked && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                    Tryb Decyzji Komisji
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const total = c1 + c2 + c3 + c4;
                        setStatus(total > 0 ? 'APPROVED' : 'REJECTED');
                      }}
                      className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all border cursor-pointer flex items-center gap-2 ${
                        status !== 'HOLD'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-amber-400'
                      }`}
                    >
                      ⭐ Ocena Punktami (Wybierz Kryteria K1-K4)
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus('HOLD')}
                      className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition-all border cursor-pointer flex items-center gap-2 ${
                        status === 'HOLD'
                          ? 'bg-amber-700 text-white border-amber-700 shadow-md'
                          : 'bg-white dark:bg-slate-800 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:border-amber-500'
                      }`}
                    >
                      ⏸️ Wstrzymaj Wniosek (HOLD)
                    </button>
                  </div>
                </div>
              )}

              {/* Status "Wstrzymany" - Wymagany Powód Wstrzymania */}
              {status === 'HOLD' ? (
                <div className="p-5 bg-amber-100/70 dark:bg-amber-950/60 border-2 border-amber-400 dark:border-amber-700 rounded-3xl space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-sm">
                    <span className="text-xl">⏸️</span>
                    <span>Status: Wniosek Wstrzymany</span>
                  </div>
                  <label className="block text-xs font-bold text-amber-900 dark:text-amber-200">
                    Podaj Powód / Uzasadnienie Wstrzymania Wniosku *
                  </label>
                  <textarea 
                    rows={3}
                    disabled={isLocked}
                    value={committeeNote}
                    onChange={e => setCommitteeNote(e.target.value)}
                    placeholder="np. Wniosek wymaga dodatkowej analizy z Działem Utrzymania Ruchu / Oczekiwanie na wycenę części..."
                    className="w-full px-4 py-3 rounded-2xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                  />
                </div>
              ) : (
                /* Karta Oceny Punktowej - Wyznacza status APPROVED / REJECTED na podstawie sumy punktów */
                <div className="p-5 bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-700/80 rounded-3xl space-y-5 animate-in fade-in shadow-xs">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-amber-200 dark:border-amber-800/60 pb-3">
                    <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-extrabold text-base">
                      <span className="text-2xl">⭐</span>
                      <div>
                        <span>Karta Oceny Komisji Kaizen (Załącznik nr 2)</span>
                        <p className="text-xs text-amber-800/80 dark:text-amber-300/80 font-normal">
                          {isLocked 
                            ? 'Ocena punktowa została zatwierdzona. Przyciski są zablokowane.'
                            : 'Liczba punktów automatycznie decyduje o zatwierdzeniu (1-20 pkt) lub odrzuceniu (0 pkt) wniosku.'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="px-3.5 py-1.5 bg-amber-500 text-white rounded-xl font-black text-sm shadow-xs shrink-0">
                      ⭐ {pointsAwarded} / 20 pkt
                    </div>
                  </div>

                  {/* 4 Kryteria Grid */}
                  <div className="space-y-4 text-xs">
                    {/* Kryterium 1 */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">
                        🛡️ 1. Wpływ na Bezpieczeństwo i Jakość (w tym Jakość Żywności)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { val: 0, label: '0 pkt (Brak wpływu)' },
                          { val: 1, label: '1 pkt (Estetyka / 5S)' },
                          { val: 3, label: '3 pkt (Lepsze procesy)' },
                          { val: 5, label: '5 pkt (Eliminacja ryzyka)' },
                        ].map(opt => (
                          <button
                            type="button"
                            key={opt.val}
                            disabled={isLocked}
                            onClick={() => handleSelectCriterion(1, opt.val)}
                            className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-left ${
                              isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${
                              c1 === opt.val
                                ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-400'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kryterium 2 */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">
                        ⛑️ 2. Wpływ na BHP i Ergonomię
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { val: 0, label: '0 pkt (Brak wpływu)' },
                          { val: 1, label: '1 pkt (Komfort pracy)' },
                          { val: 3, label: '3 pkt (Poprawa ergonomii)' },
                          { val: 5, label: '5 pkt (Eliminacja zagrożenia)' },
                        ].map(opt => (
                          <button
                            type="button"
                            key={opt.val}
                            disabled={isLocked}
                            onClick={() => handleSelectCriterion(2, opt.val)}
                            className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-left ${
                              isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${
                              c2 === opt.val
                                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-red-400'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kryterium 3 */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">
                        ⚡ 3. Efektywność, Oszczędność i Redukcja Marnotrawstwa (Muda)
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { val: 0, label: '0 pkt (Brak oszczędności)' },
                          { val: 1, label: '1 pkt (Drobne oszczędności)' },
                          { val: 3, label: '3 pkt (Skrócenie czasu)' },
                          { val: 5, label: '5 pkt (Duża oszczędność)' },
                        ].map(opt => (
                          <button
                            type="button"
                            key={opt.val}
                            disabled={isLocked}
                            onClick={() => handleSelectCriterion(3, opt.val)}
                            className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-left ${
                              isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${
                              c3 === opt.val
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kryterium 4 */}
                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                      <span className="font-extrabold text-slate-900 dark:text-slate-100 block text-xs">
                        🛠️ 4. Łatwość i Koszt Wdrożenia
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { val: 0, label: '0 pkt (Bardzo drogie)' },
                          { val: 1, label: '1 pkt (Wymaga zakupów)' },
                          { val: 3, label: '3 pkt (Niskie koszty UR)' },
                          { val: 5, label: '5 pkt (Bezkosztowe od ręki)' },
                        ].map(opt => (
                          <button
                            type="button"
                            key={opt.val}
                            disabled={isLocked}
                            onClick={() => handleSelectCriterion(4, opt.val)}
                            className={`p-2 rounded-xl text-[11px] font-bold border transition-all text-left ${
                              isLocked ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'
                            } ${
                              c4 === opt.val
                                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Wynik i Wyliczona Nagroda według Załącznika nr 2 */}
                  {(() => {
                    const tier = getRewardTierInfo(pointsAwarded);
                    return (
                      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${tier.cls}`}>
                        <div className="space-y-0.5 text-center sm:text-left">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-wider block opacity-90">
                              Wynik Oceny: {pointsAwarded === 0 ? '❌ ODRZUCONY' : '✅ ZATWIERDZONY'}
                            </span>
                          </div>
                          <span className="text-sm font-black">
                            {tier.label}: {tier.reward}
                          </span>
                        </div>
                        <div className="text-xs font-black px-3.5 py-1.5 bg-white/90 dark:bg-slate-900/90 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700">
                          ⭐ Suma: {pointsAwarded} pkt
                        </div>
                      </div>
                    );
                  })()}

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                      Komentarz / Uzasadnienie Oceniającego (Opcjonalnie)
                    </label>
                    <textarea 
                      rows={2}
                      disabled={isLocked}
                      value={committeeNote}
                      onChange={e => setCommitteeNote(e.target.value)}
                      placeholder="Dodatkowe uwagi dla pomysłodawcy..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                    />
                  </div>
                </div>
              )}

              {/* Submit Decision Button or Locked State Banner */}
              {isLocked ? (
                <div className="p-4 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-center sm:text-left">
                    <span>🔒 Decyzja jest zatwierdzona i zablokowana.</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevertToPending}
                    className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                  >
                    ↩️ Cofnij Zatwierdzenie
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className={`w-full py-3.5 rounded-2xl font-black text-xs shadow-lg transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 ${
                    status === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : status === 'REJECTED'
                      ? 'bg-red-600 hover:bg-red-500 text-white'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {isUpdating ? (
                    'Zapisywanie...'
                  ) : status === 'HOLD' ? (
                    '⏸️ Zapisz Wstrzymanie Wniosku'
                  ) : pointsAwarded > 0 ? (
                    `✅ Zatwierdź i Przydziel ${pointsAwarded} pkt Pomysłodawcy`
                  ) : (
                    '❌ Odrzuć Wniosek (0 pkt)'
                  )}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Decyzja Komisji Kaizen</h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Obecny status</p>
                  <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${
                    kaizen.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                    kaizen.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                    kaizen.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                    'bg-slate-200 text-slate-700'
                  }`}>
                    {kaizen.status === 'PENDING' ? 'Oczekujący na decyzję' :
                     kaizen.status === 'APPROVED' ? 'Zatwierdzenie' :
                     kaizen.status === 'REJECTED' ? 'Odrzucony' : 'Wstrzymany'}
                  </span>
                </div>

                {kaizen.status === 'APPROVED' && isScoringEnabled && Boolean(kaizen.pointsAwarded) && (
                  <div>
                    <p className="text-sm text-slate-500 font-medium mb-1">Przyznane punkty</p>
                    <span className="inline-block px-3 py-1 bg-amber-500 text-white font-black text-sm rounded-lg shadow-xs">
                      ⭐ {kaizen.pointsAwarded} pkt {kaizen.pointsCategory ? `(${kaizen.pointsCategory})` : ''}
                    </span>
                  </div>
                )}
              </div>
              
              {kaizen.committeeNote && (
                <div>
                  <p className="text-sm text-slate-500 font-medium mb-1">Komentarz komisji</p>
                  <div className="p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{kaizen.committeeNote}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <ImageModal 
          isOpen={!!selectedImage}
          imageUrl={selectedImage || ''}
          onClose={() => setSelectedImage(null)}
        />
      </div>

      {/* 2. Dedykowany Formularz Drukarski (Widoczny wyłącznie na wydruku / PDF) */}
      <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto space-y-6">
        {/* Nagłówek Formularza */}
        <div className="flex justify-between items-center border-b-2 border-black pb-4">
          <div>
            <h1 className="text-2xl font-black uppercase tracking-wider">Karta Wniosku Kaizen</h1>
            <p className="text-xs text-gray-600 font-medium mt-1">System Ciągłego Doskonalenia i Ulepszeń</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold">ID: #{kaizen.id.substring(0, 8).toUpperCase()}</p>
            <p className="text-xs text-gray-600">Data: {new Date(kaizen.createdAt).toLocaleDateString('pl-PL')}</p>
          </div>
        </div>

        {/* Tabela Informacji Osobistych i Lokalizacji */}
        <table className="w-full border-collapse border border-black text-sm">
          <tbody>
            <tr>
              <td className="border border-black p-2.5 font-bold bg-gray-100 w-1/4">Pomysłodawca:</td>
              <td className="border border-black p-2.5 font-semibold w-1/4">{kaizen.submittedBy}</td>
              <td className="border border-black p-2.5 font-bold bg-gray-100 w-1/4">Data Zgłoszenia:</td>
              <td className="border border-black p-2.5 w-1/4">{new Date(kaizen.createdAt).toLocaleDateString('pl-PL')}</td>
            </tr>
            <tr>
              <td className="border border-black p-2.5 font-bold bg-gray-100">Rejon Zakładu:</td>
              <td className="border border-black p-2.5">{kaizen.area?.name || 'Cały zakład'}</td>
              <td className="border border-black p-2.5 font-bold bg-gray-100">Maszyna / Stanowisko:</td>
              <td className="border border-black p-2.5">{kaizen.machine?.name || 'Brak'}</td>
            </tr>
          </tbody>
        </table>

        {/* Tytuł Wniosku */}
        <div className="border border-black p-3 bg-gray-50">
          <p className="text-xs font-bold uppercase text-gray-600">Tytuł Udoskonalenia:</p>
          <p className="text-lg font-bold mt-1">{kaizen.title}</p>
        </div>

        {/* Opis Problemu i Rozwiązania */}
        <div className="border border-black p-4 space-y-2">
          <p className="text-xs font-bold uppercase text-gray-600">Opis Problemu oraz Proponowane Rozwiązanie:</p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{kaizen.description}</p>
        </div>

        {/* Oczekiwane Korzyści */}
        <div className="border border-black p-4 space-y-2 bg-gray-50">
          <p className="text-xs font-bold uppercase text-gray-600">Przewidywane Korzyści (Jakość / BHP / Czas / Koszty):</p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{kaizen.benefits || 'Brak opisu korzyści.'}</p>
        </div>

        {/* Załącznik graficzny jeśli istnieje */}
        {kaizen.photoUrl && (
          <div className="border border-black p-4 space-y-2">
            <p className="text-xs font-bold uppercase text-gray-600">Załączona Fotografia / Ilustracja:</p>
            <div className="flex justify-center py-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={kaizen.photoUrl} alt="Foto Kaizen" className="max-h-64 object-contain border border-gray-400" />
            </div>
          </div>
        )}

        {/* Decyzja Komisji Kaizen */}
        {kaizen.status === 'PENDING' ? (
          <div className="border-2 border-black p-4 space-y-4">
            <p className="text-sm font-black uppercase border-b border-gray-300 pb-2">Ocena i Decyzja Komisji Kaizen (Do wypełnienia przez Komisję)</p>
            
            <div className="flex justify-around items-center py-2 text-sm font-bold">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-black flex items-center justify-center"></div>
                <span>ZATWIERDZONE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-black flex items-center justify-center"></div>
                <span>ODRZUCONE</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-black flex items-center justify-center"></div>
                <span>WSTRZYMANE</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 uppercase mb-2">Uzasadnienie / Uwagi Komisji oraz Przyznane Punkty:</p>
              <div className="border-b border-gray-400 h-6 mb-2"></div>
              <div className="border-b border-gray-400 h-6 mb-2"></div>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-black p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-300 pb-2">
              <p className="text-sm font-black uppercase">Ocena i Decyzja Komisji Kaizen</p>
              <div className="text-sm font-black px-3 py-1 border-2 border-black bg-gray-100 uppercase flex items-center gap-2">
                <span>
                  {kaizen.status === 'APPROVED' && '[✓] ZATWIERDZONE'}
                  {kaizen.status === 'REJECTED' && '[✗] ODRZUCONE'}
                  {kaizen.status === 'HOLD' && '[!] WSTRZYMANE'}
                </span>
                {kaizen.status === 'APPROVED' && isScoringEnabled && Boolean(kaizen.pointsAwarded) && (
                  <span className="border-l border-black pl-2 font-black text-black">
                    ⭐ {kaizen.pointsAwarded} PKT
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 uppercase">Uzasadnienie / Uwagi Komisji:</p>
              <p className="text-sm font-medium mt-1 min-h-[40px] whitespace-pre-wrap">
                {kaizen.committeeNote || '(Brak uwag komisji)'}
              </p>
            </div>
          </div>
        )}

        {/* Sekcja Podpisów */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="border-t border-black pt-2">
            <p className="font-bold">Podpis Pomysłodawcy</p>
            <p className="text-gray-500 mt-1">{kaizen.submittedBy}</p>
          </div>
          <div className="border-t border-black pt-2">
            <p className="font-bold">Podpis Przewodniczącego Komisji Kaizen</p>
            <p className="text-gray-500 mt-1">Podpis i data zatwierdzenia</p>
          </div>
        </div>

        {/* Sekcja Podpisu Elektronicznego */}
        <div className="pt-6 space-y-2 border-t-2 border-black break-inside-avoid">
          <div className="border border-black p-3 bg-gray-50 space-y-1">
            <div className="font-bold text-xs uppercase tracking-wider flex justify-between">
              <span>✒️ KLAUZULA PODPISU ELEKTRONICZNEGO I ZGŁOSZENIA CYFROWEGO</span>
              <span>SYSTEM CYFROWY KAIZEN</span>
            </div>
            <p className="text-[11px] text-gray-800 leading-snug font-medium">
              Zgodnie z Regulaminem Programu Kaizen, zidentyfikowany profil pracownika <strong>{kaizen.submittedBy}</strong> składający ten wniosek Kaizen elektronicznie w aplikacji <strong>Auditapp</strong> stanowi prawnie wiążący podpis cyfrowy potwierdzający jego autorstwo, treść oraz zgłoszenie.
            </p>
          </div>
        </div>
      </div>

      {kaizen && (
        <DocumentAccessHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          entityType="KAIZEN"
          entityId={kaizen.id}
          entityTitle={kaizen.title}
        />
      )}
    </>
  );
}

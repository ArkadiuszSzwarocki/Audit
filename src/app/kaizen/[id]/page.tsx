'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useKaizen, Kaizen } from '@/hooks/useKaizen';
import { useAuth } from '@/hooks/useAuth';
import { ImageModal } from '@/components/ui/ImageModal';
import { useToast } from '@/context/ToastContext';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useAccessTracker({
    entityType: 'KAIZEN',
    entityId: resolvedParams.id,
    entityTitle: kaizen?.title || 'Wniosek Kaizen',
  });

  useEffect(() => {
    loadKaizen();
  }, [resolvedParams.id]);

  const loadKaizen = async () => {
    setLoading(true);
    try {
      const data = await fetchKaizenById(resolvedParams.id);
      setKaizen(data);
      setStatus(data.status);
      setCommitteeNote(data.committeeNote || '');
    } catch (err: any) {
      showToast(err.message || 'Nie znaleziono wniosku', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!status) return;
    setIsUpdating(true);
    try {
      await updateKaizenStatus(resolvedParams.id, status, committeeNote);
      showToast('Decyzja komisji została zapisana!', 'success');
      router.push('/kaizen');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUpdating(false);
    }
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

  if (loading) return <div className="p-8 text-center animate-pulse print:hidden">Ładowanie wniosku...</div>;
  if (!kaizen) return <div className="p-8 text-center text-red-500 print:hidden">Błąd ładowania wniosku.</div>;

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
                  className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
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
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl shadow-md font-bold transition-all text-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              Drukuj Formularz
            </button>

            <span className={`px-4 py-2 rounded-lg text-sm font-bold ${
              kaizen.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
              kaizen.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
              kaizen.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
              'bg-slate-100 text-slate-700'
            }`}>
              {kaizen.status === 'PENDING' ? 'Oczekujący na decyzję' :
               kaizen.status === 'APPROVED' ? 'Zatwierdzony' :
               kaizen.status === 'REJECTED' ? 'Odrzucony' : 'Wstrzymany'}
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

            {kaizen.photoUrl && (
              <div className="glass-card p-6 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Załącznik</h3>
                <div 
                  className="relative h-48 w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group"
                  onClick={() => setSelectedImage(kaizen.photoUrl!)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={kaizen.photoUrl} alt="Załącznik do Kaizen" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium bg-black/50 px-3 py-1 rounded-md backdrop-blur-sm">Kliknij, aby powiększyć</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {isAdmin ? (
          <div className="glass-card p-6 md:p-8 bg-brand-50 dark:bg-brand-900/10 border-brand-200 dark:border-brand-800">
            <h2 className="text-2xl font-bold text-brand-800 dark:text-brand-400 mb-6">Decyzja Komisji Kaizen</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-900 dark:text-brand-300 mb-2">Zmiana Statusu</label>
                <div className="flex flex-wrap gap-3">
                  {['PENDING', 'APPROVED', 'REJECTED', 'HOLD'].map(s => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                        status === s 
                          ? 'bg-brand-600 text-white border-brand-600 shadow-md' 
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:border-brand-400'
                      }`}
                    >
                      {s === 'PENDING' ? 'Oczekujący' :
                       s === 'APPROVED' ? 'Zatwierdź' :
                       s === 'REJECTED' ? 'Odrzuć' : 'Wstrzymaj'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-900 dark:text-brand-300 mb-2">Komentarz / Uzasadnienie (Opcjonalnie)</label>
                <textarea 
                  value={committeeNote}
                  onChange={e => setCommitteeNote(e.target.value)}
                  placeholder={status === 'HOLD' ? 'Podaj przewidywany czas wstrzymania...' : 'Dlaczego zatwierdzono/odrzucono?'}
                  className="w-full px-4 py-3 rounded-lg border border-brand-200 dark:border-brand-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-brand-500 outline-none min-h-[100px]"
                />
              </div>

              <button 
                onClick={handleUpdate}
                disabled={isUpdating || status === kaizen.status && committeeNote === (kaizen.committeeNote || '')}
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-xl font-bold shadow-md transition-colors disabled:opacity-50"
              >
                {isUpdating ? 'Zapisywanie...' : 'Zapisz decyzję'}
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 md:p-8 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Decyzja Komisji Kaizen</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 font-medium mb-1">Obecny status</p>
                <span className={`inline-block px-3 py-1 rounded-lg font-bold text-sm ${
                  kaizen.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                  kaizen.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                  kaizen.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                  'bg-slate-200 text-slate-700'
                }`}>
                  {kaizen.status === 'PENDING' ? 'Oczekujący na decyzję' :
                   kaizen.status === 'APPROVED' ? 'Zatwierdzony' :
                   kaizen.status === 'REJECTED' ? 'Odrzucony' : 'Wstrzymany'}
                </span>
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
      <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto space-y-6 border-2 border-black">
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
              <p className="text-xs font-bold text-gray-600 uppercase mb-2">Uzasadnienie / Uwagi Komisji (do wypełnienia ręcznego):</p>
              <div className="border-b border-gray-400 h-6 mb-2"></div>
              <div className="border-b border-gray-400 h-6 mb-2"></div>
              <div className="border-b border-gray-400 h-6"></div>
            </div>
          </div>
        ) : (
          <div className="border-2 border-black p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-gray-300 pb-2">
              <p className="text-sm font-black uppercase">Ocena i Decyzja Komisji Kaizen</p>
              <div className="text-sm font-black px-3 py-1 border-2 border-black bg-gray-100 uppercase">
                {kaizen.status === 'APPROVED' && '[✓] ZATWIERDZONE'}
                {kaizen.status === 'REJECTED' && '[✗] ODRZUCONE'}
                {kaizen.status === 'HOLD' && '[!] WSTRZYMANE'}
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
              <span>✒️ KLAUZULA PODPISU ELEKTRONICZNEGO I WGLĄDU DO DOKUMENTU</span>
              <span>SYSTEM CYFROWY KAIZEN</span>
            </div>
            <p className="text-[11px] text-gray-800 leading-snug font-medium">
              Zgodnie z regulaminem zakładu, zidentyfikowany login użytkownika <strong>{user?.name || user?.login || 'Użytkownik Systemu'}</strong> (@{user?.login || 'login'}) otwierający ten wniosek Kaizen stanowi prawnie wiążący podpis cyfrowy potwierdzający zapoznanie się z jego treścią i statusem.
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

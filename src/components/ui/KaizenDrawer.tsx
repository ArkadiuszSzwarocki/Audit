'use client';

import { useEffect, useState } from 'react';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { Kaizen } from '@/hooks/useKaizen';
import { ImageModal } from '@/components/ui/ImageModal';
import { PromptEmailModal } from '@/components/ui/PromptEmailModal';
import { downloadKaizenEml } from '@/utils/kaizenEmailBuilder';
import { printKaizenReport } from '@/utils/kaizenPrintBuilder';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  PENDING:  { label: '💡 Oczekujący',   cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  APPROVED: { label: '✅ Zatwierdzony', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  REJECTED: { label: '❌ Odrzucony',   cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
};

interface KaizenDrawerProps {
  kaizen: Kaizen | null;
  onClose: () => void;
  onViewHistory: (k: Kaizen) => void;
  isAdmin: boolean;
  onDelete: (id: string) => void;
}

function AccessTrackerForKaizen({ kaizen }: { kaizen: Kaizen }) {
  useAccessTracker({ entityType: 'KAIZEN', entityId: kaizen.id, entityTitle: kaizen.title });
  return null;
}

export function KaizenDrawer({ kaizen, onClose, onViewHistory, isAdmin, onDelete }: KaizenDrawerProps) {
  const { showToast } = useToast();
  const router = useRouter();
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (kaizen) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [kaizen]);

  const handleConfirmEmail = (emailToUse: string) => {
    if (!kaizen) return;
    downloadKaizenEml(
      { id: kaizen.id, title: kaizen.title, description: kaizen.description, benefits: kaizen.benefits, submittedBy: kaizen.submittedBy, areaName: kaizen.area?.name, machineName: kaizen.machine?.name, photoUrl: kaizen.photoUrl },
      emailToUse,
      window.location.origin
    );
    showToast('Pobrano plik .eml!', 'success');
  };

  if (!kaizen) return null;

  const photos = kaizen.photoUrl
    ? kaizen.photoUrl.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const st = STATUS_LABELS[kaizen.status] ?? { label: kaizen.status, cls: '' };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col animate-in zoom-in-95 fade-in duration-200">
          <AccessTrackerForKaizen kaizen={kaizen} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-t-3xl shrink-0">
            <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${st.cls}`}>{st.label}</span>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-lg font-bold">✕</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">💡 {kaizen.title}</h2>
              <p className="text-xs text-slate-400 mt-1">Zgłoszono: {new Date(kaizen.createdAt).toLocaleString('pl-PL')}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Opis Udoskonalenia</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{kaizen.description}</p>
            </div>

            {kaizen.benefits && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/60">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-2">🚀 Oczekiwane Korzyści</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{kaizen.benefits}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {kaizen.area && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Obszar / Rejon</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">📍 {kaizen.area.name}</div>
                </div>
              )}
              {kaizen.machine && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Maszyna / Linia</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">⚙️ {kaizen.machine.name}</div>
                </div>
              )}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Pomysłodawca</div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">👤 {kaizen.submittedBy}</div>
              </div>
              {Boolean(kaizen.pointsAwarded && kaizen.pointsAwarded > 0) && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Przyznane Punkty</div>
                  <div className="font-black text-sm text-amber-700 dark:text-amber-300">⭐ {kaizen.pointsAwarded} pkt</div>
                </div>
              )}
            </div>

            {kaizen.committeeNote && (
              <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-1">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">📝 Decyzja Komisji Kaizen</div>
                <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{kaizen.committeeNote}"</p>
              </div>
            )}

            {photos.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Załączone Zdjęcia ({photos.length})</div>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group bg-slate-900" onClick={() => setModalImage(url)}>
                      <img src={url} alt={`Zdjęcie ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-lg">🔍</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-b-3xl flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => onViewHistory(kaizen)} className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer">
                👥 Historia Wglądu
              </button>
              <button onClick={() => setIsEmailModalOpen(true)} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800/60 cursor-pointer">
                📧 Powiadom
              </button>
              <button
                onClick={() => printKaizenReport({
                  id: kaizen.id,
                  title: kaizen.title,
                  description: kaizen.description,
                  benefits: kaizen.benefits,
                  submittedBy: kaizen.submittedBy,
                  status: kaizen.status,
                  pointsAwarded: kaizen.pointsAwarded,
                  committeeNote: kaizen.committeeNote,
                  areaName: kaizen.area?.name ?? null,
                  machineName: kaizen.machine?.name ?? null,
                  photoUrl: kaizen.photoUrl,
                  createdAt: kaizen.createdAt,
                }, window.location.origin)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                🖨️ Drukuj
              </button>
              {isAdmin && (
                <button onClick={() => { onClose(); router.push(`/kaizen/${kaizen.id}`); }} className="px-3 py-2 bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 text-brand-700 dark:text-brand-300 rounded-xl text-xs font-bold transition-all border border-brand-200 dark:border-brand-800/60 cursor-pointer">
                  ✏️ Pełna Strona
                </button>
              )}
            </div>
            {isAdmin && (
              <button onClick={() => { onDelete(kaizen.id); onClose(); }} className="px-3 py-2 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800/60 cursor-pointer">
                🗑️ Usuń
              </button>
            )}
          </div>
        </div>
      </div>

      {modalImage && <ImageModal isOpen={!!modalImage} imageUrl={modalImage} onClose={() => setModalImage(null)} />}

      {isEmailModalOpen && (
        <PromptEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          defaultEmail="komisja.kaizen@zaklad.pl"
          title="📧 Wyślij Powiadomienie Kaizen"
          onConfirm={handleConfirmEmail}
        />
      )}
    </>
  );
}

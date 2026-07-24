'use client';

import { useEffect } from 'react';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { Observation } from '@/hooks/useAudits';
import { ImageModal } from '@/components/ui/ImageModal';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/hooks/useAuth';

const getNormalizedSeverity = (sev?: string | null): 'CRITICAL' | 'MODERATE' | 'MINOR' => {
  if (!sev) return 'MINOR';
  const s = sev.toUpperCase();
  if (s === 'CRITICAL' || s.includes('KRYTYCZ') || s.includes('KO')) return 'CRITICAL';
  if (s === 'MODERATE' || s.includes('UMIARK')) return 'MODERATE';
  return 'MINOR';
};

const SEVERITY_STYLES: Record<string, { icon: string; cls: string }> = {
  CRITICAL: { icon: '🔴', cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  MODERATE: { icon: '🟡', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  MINOR:    { icon: '🟢', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
};

interface TaskDetailModalProps {
  task: Observation | null;
  onClose: () => void;
  onViewHistory?: (t: Observation) => void;
  onStartFix?: (id: string) => void;
  onExtend?: (t: Observation) => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onConvertKaizen?: (t: Observation) => void;
}

function AccessTrackerForTask({ task }: { task: Observation }) {
  useAccessTracker({
    entityType: 'TASK',
    entityId: task.id,
    entityTitle: (task as any).aiSuggestion || task.description,
  });
  return null;
}

export function TaskDetailModal({
  task,
  onClose,
  onViewHistory,
  onStartFix,
  onExtend,
  isAdmin,
  onDelete,
  onConvertKaizen,
}: TaskDetailModalProps) {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (task) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [task]);

  if (!task) return null;

  const obs = task as any;
  const canExtendDeadline = isAdmin || (
    Boolean(currentUser) && Boolean(obs?.assignedTo) && (
      currentUser?.id === obs?.assignedTo?.id ||
      (currentUser?.name && obs?.assignedTo?.name && currentUser.name.trim().toLowerCase() === obs.assignedTo.name.trim().toLowerCase()) ||
      (currentUser?.login && obs?.assignedTo?.name && currentUser.login.trim().toLowerCase() === obs.assignedTo.name.trim().toLowerCase())
    )
  );
  const normSev = getNormalizedSeverity(obs.severity);
  const sevStyle = SEVERITY_STYLES[normSev];
  const displayLabel = obs.severity || normSev;
  const isOverdue = obs.dueDate && new Date(obs.dueDate) < new Date();
  const photos = obs.photoUrl ? obs.photoUrl.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
  const fixPhotos = obs.fixPhotoUrl ? obs.fixPhotoUrl.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col animate-in zoom-in-95 fade-in duration-200">
          <AccessTrackerForTask task={task} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-t-3xl shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${sevStyle.cls}`}>
                {sevStyle.icon} {displayLabel}
              </span>
              {isOverdue && (
                <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg border bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse">
                  ⚠️ TERMIN PRZEKROCZONY
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-lg font-bold">✕</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* Task title */}
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">
                ⚙️ {obs.aiSuggestion || obs.description}
              </h2>
              {obs.aiSuggestion && obs.description !== obs.aiSuggestion && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Opis: {obs.description}</p>
              )}
            </div>

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              {obs.audit?.area && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Obszar / Rejon</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">📍 {obs.audit.area.name}</div>
                </div>
              )}
              {obs.audit?.machine && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Maszyna / Linia</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">⚙️ {obs.audit.machine.name}</div>
                </div>
              )}
              {obs.assignedTo && (
                <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-brand-500 mb-1">Przypisano do</div>
                  <div className="font-bold text-sm text-brand-700 dark:text-brand-300">👤 {obs.assignedTo.name}</div>
                </div>
              )}
              {obs.dueDate && (
                <div className={`p-3 rounded-xl border ${isOverdue ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' : 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isOverdue ? 'text-red-500' : 'text-indigo-500'}`}>Termin Wykonania</div>
                  <div className={`font-bold text-sm ${isOverdue ? 'text-red-700 dark:text-red-300' : 'text-indigo-700 dark:text-indigo-300'}`}>
                    📅 {new Date(obs.dueDate).toLocaleDateString('pl-PL')}
                  </div>
                </div>
              )}
            </div>

            {/* Photos from audit */}
            {photos.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Zdjęcia z audytu ({photos.length})</div>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((url: string, idx: number) => (
                    <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group bg-slate-900" onClick={() => setModalImage(url)}>
                      <img src={url} alt={`Zdjęcie ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extensions history */}
            {obs.extensions && obs.extensions.length > 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-3">
                  📜 Historia Przedłużeń ({obs.extensions.length})
                </div>
                <div className="space-y-2">
                  {obs.extensions.map((ext: any) => (
                    <div key={ext.id} className="p-2 bg-amber-100/60 dark:bg-amber-900/30 rounded-lg border border-amber-200/60 dark:border-amber-800/60">
                      <div className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        {new Date(ext.newDueDate).toLocaleDateString('pl-PL')} — {ext.requestedBy}
                      </div>
                      <div className="text-[11px] italic text-slate-600 dark:text-slate-400 mt-0.5">"{ext.reason}"</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fix info if already fixed */}
            {(obs.fixedBy || obs.operatorComment || fixPhotos.length > 0) && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">✅ Informacje o Naprawie</div>
                {obs.fixedBy && <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Wykonał: {obs.fixedBy}</p>}
                {obs.fixedAt && <p className="text-xs text-slate-500">Data: {new Date(obs.fixedAt).toLocaleString('pl-PL')}</p>}
                {obs.operatorComment && <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{obs.operatorComment}"</p>}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-b-3xl flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { onStartFix?.(task.id); onClose(); }}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                ✅ Realizuj Zadanie
              </button>
              {/* Only assigned user or admin can extend deadline */}
              {canExtendDeadline && (
                <button
                  onClick={() => onExtend?.(task)}
                  className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer"
                >
                  ⏳ Przedłuż Termin
                </button>
              )}
              <button onClick={() => onViewHistory?.(task)} className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer">
                👥 Historia Wglądu
              </button>
              <button onClick={() => onConvertKaizen?.(task)} className="px-3 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer">
                💡 Kaizen
              </button>
            </div>
            {isAdmin && (
              <button onClick={() => { onDelete?.(task.id); onClose(); }} className="px-3 py-2 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800/60 cursor-pointer">
                🗑️ Usuń
              </button>
            )}
          </div>
        </div>
      </div>

      {modalImage && <ImageModal isOpen={!!modalImage} imageUrl={modalImage} onClose={() => setModalImage(null)} />}
    </>
  );
}

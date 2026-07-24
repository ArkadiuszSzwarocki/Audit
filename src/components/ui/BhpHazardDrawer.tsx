'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { BhpHazardReport } from '@/hooks/useBhpHazardReports';
import { ImageModal } from '@/components/ui/ImageModal';
import { ResolveBhpHazardModal } from '@/components/ui/ResolveBhpHazardModal';
import { PromptEmailModal } from '@/components/ui/PromptEmailModal';
import { downloadBhpEml } from '@/utils/bhpEmailBuilder';
import { printBhpReport } from '@/utils/bhpPrintBuilder';
import { useToast } from '@/context/ToastContext';

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  NEAR_MISS:       { label: 'Zdarzenie Potencjalnie Wypadkowe (Near Miss)', icon: '⚠️' },
  UNSAFE_COND:     { label: 'Niebezpieczne Warunki Pracy', icon: '🛠️' },
  UNSAFE_BEHAVIOR: { label: 'Niebezpieczne Zachowanie', icon: '🚷' },
  FIRE_HAZARD:     { label: 'Zagrożenie Pożarowe', icon: '🔥' },
  PPE:             { label: 'Brak lub Uszkodzenie ŚOI', icon: '🥽' },
};

export const SEVERITY_LABELS: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: '🔴 Wysokie Ryzyko (Krytyczne)', cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  MODERATE: { label: '🟡 Średnie Ryzyko',            cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  LOW:      { label: '🟢 Niskie Ryzyko',             cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
};

export const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  OPEN:        { label: '🔓 Zgłoszone',    cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  IN_PROGRESS: { label: '⚙️ W eliminacji', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  RESOLVED:    { label: '🛡️ Wyeliminowane', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  CLOSED:      { label: '🔒 Zamknięte',    cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700' },
};

interface BhpHazardDrawerProps {
  report: BhpHazardReport | null;
  onClose: () => void;
  onViewHistory: (r: BhpHazardReport) => void;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onNavigateKaizen: (r: BhpHazardReport) => void;
  onUpdateStatus?: (id: string, status: string, actionTaken?: string) => Promise<void>;
}

function AccessTrackerForReport({ report }: { report: BhpHazardReport }) {
  useAccessTracker({
    entityType: 'BHP',
    entityId: report.id,
    entityTitle: report.title,
  });
  return null;
}

export function BhpHazardDrawer({
  report,
  onClose,
  onViewHistory,
  isAdmin,
  onDelete,
  onNavigateKaizen,
  onUpdateStatus,
}: BhpHazardDrawerProps) {
  const { showToast } = useToast();
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (report) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [report]);

  const handleConfirmResolve = async (actionTaken?: string) => {
    if (!report || !onUpdateStatus) return;
    await onUpdateStatus(report.id, 'RESOLVED', actionTaken);
  };

  const handleConfirmSendEmail = (emailToUse: string) => {
    if (!report) return;
    downloadBhpEml(
      {
        id: report.id,
        title: report.title,
        description: report.description,
        category: report.category,
        severity: report.severity,
        reportedBy: report.reportedBy,
        areaName: report.area?.name,
        machineName: report.machine?.name,
        assignedToName: report.assignedTo?.name,
        dueDate: report.dueDate,
        photoUrl: report.photoUrl,
      },
      emailToUse,
      window.location.origin
    );
    showToast('Pobrano plik .eml z powiadomieniem!', 'success');
  };

  const handleStatusChangeClick = async (newStatus: string) => {
    if (!report || !onUpdateStatus) return;
    await onUpdateStatus(report.id, newStatus);
  };

  if (!report) return null;

  const photos = report.photoUrl
    ? report.photoUrl.split(',').map(s => s.trim()).filter(Boolean)
    : [];
  const fixPhotos = report.fixPhotoUrl
    ? report.fixPhotoUrl.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const sev = SEVERITY_LABELS[report.severity] ?? { label: report.severity, cls: '' };
  const st = STATUS_LABELS[report.status] ?? { label: report.status, cls: '' };
  const cat = CATEGORY_LABELS[report.category] ?? { label: report.category, icon: '🛡️' };
  const targetEmail = report.notifyEmails || report.assignedTo?.email || '';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Centered Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col animate-in zoom-in-95 fade-in duration-200">
          {report && <AccessTrackerForReport report={report} />}

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-t-3xl shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                {cat.icon} {cat.label}
              </span>
              <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${sev.cls}`}>{sev.label}</span>
              <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${st.cls}`}>{st.label}</span>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-lg font-bold">
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">🛡️ {report.title}</h2>
              <p className="text-xs text-slate-400 mt-1">Zgłoszono zdarzenie BHP: {new Date(report.createdAt).toLocaleString('pl-PL')}</p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Opis Zagrożenia / Zdarzenia BHP</div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{report.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {report.area && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Obszar / Rejon</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">📍 {report.area.name}</div>
                </div>
              )}
              {report.machine && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Maszyna / Stanowisko</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">⚙️ {report.machine.name}</div>
                </div>
              )}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Zgłaszający</div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">👤 {report.reportedBy}</div>
              </div>
              {report.assignedTo && (
                <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-brand-500 mb-1">Inspektor BHP / Przypisany</div>
                  <div className="font-bold text-sm text-brand-700 dark:text-brand-300">🛡️ {report.assignedTo.name}</div>
                </div>
              )}
              {report.dueDate && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Termin Eliminacji</div>
                  <div className="font-bold text-sm text-amber-800 dark:text-amber-300">📅 {new Date(report.dueDate).toLocaleDateString('pl-PL')}</div>
                </div>
              )}
            </div>

            {photos.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Zdjęcia Zagrożenia ({photos.length})</div>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group bg-slate-900" onClick={() => setModalImage(url)}>
                      <img src={url} alt={`Zagrożenie ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-lg">🔍</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(report.fixedBy || report.actionTaken || fixPhotos.length > 0) && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">🛡️ Działania Korygujące i Eliminacja Zagrożenia</div>
                {report.fixedBy && <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Osoba odpowiedzialna: {report.fixedBy}</p>}
                {report.fixedAt && <p className="text-xs text-slate-500">Data eliminacji: {new Date(report.fixedAt).toLocaleString('pl-PL')}</p>}
                {report.actionTaken && <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap italic">"{report.actionTaken}"</p>}
                {fixPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {fixPhotos.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-700 cursor-pointer bg-slate-900" onClick={() => setModalImage(url)}>
                        <img src={url} alt={`Eliminacja ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-b-3xl flex flex-wrap gap-2 justify-between items-center">
            <div className="flex gap-2 flex-wrap items-center">
              {onUpdateStatus && (report.status === 'OPEN' || report.status === 'IN_PROGRESS') && (
                <button 
                  onClick={() => setIsResolveModalOpen(true)} 
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  🛡️ Wyeliminuj Zagrożenie
                </button>
              )}

              {onUpdateStatus && report.status === 'RESOLVED' && (
                <button 
                  onClick={() => handleStatusChangeClick('CLOSED')} 
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  🔒 Zamknij Sprawę BHP
                </button>
              )}

              <button onClick={() => onViewHistory(report)} className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer flex items-center gap-1">
                👥 Historia Wglądu
              </button>
              <button onClick={() => setIsEmailModalOpen(true)} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800/60 cursor-pointer">
                📧 Powiadom E-mail
              </button>
              <button
                onClick={() => printBhpReport({
                  id: report.id,
                  title: report.title,
                  description: report.description,
                  category: report.category,
                  severity: report.severity,
                  status: report.status,
                  reportedBy: report.reportedBy,
                  assignedToName: report.assignedTo?.name,
                  dueDate: report.dueDate,
                  areaName: report.area?.name,
                  machineName: report.machine?.name,
                  actionTaken: report.actionTaken,
                  fixedBy: report.fixedBy,
                  fixedAt: report.fixedAt,
                  photoUrl: report.photoUrl,
                  createdAt: report.createdAt,
                }, window.location.origin)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              >
                🖨️ Drukuj
              </button>
              <button onClick={() => onNavigateKaizen(report)} className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer">
                💡 Pomysł Kaizen
              </button>
            </div>
            {isAdmin && (
              <button onClick={() => { onDelete(report.id); onClose(); }} className="px-3 py-2 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800/60 cursor-pointer">
                🗑️ Usuń
              </button>
            )}
          </div>
        </div>
      </div>

      {modalImage && <ImageModal isOpen={!!modalImage} imageUrl={modalImage} onClose={() => setModalImage(null)} />}

      {isResolveModalOpen && (
        <ResolveBhpHazardModal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          onConfirm={handleConfirmResolve}
        />
      )}

      {isEmailModalOpen && (
        <PromptEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          defaultEmail={targetEmail || 'inspektor.bhp@zaklad.pl'}
          title="📧 Powiadomienie o Zdarzeniu BHP"
          onConfirm={handleConfirmSendEmail}
        />
      )}
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { FaultReport } from '@/hooks/useFaultReports';
import { ImageModal } from '@/components/ui/ImageModal';
import { ExtendDeadlineModal } from '@/components/ui/ExtendDeadlineModal';
import { ResolveFaultModal } from '@/components/ui/ResolveFaultModal';
import { PromptEmailModal } from '@/components/ui/PromptEmailModal';
import { downloadFaultReportEml } from '@/utils/faultReportEmailBuilder';
import { printFaultReport } from '@/utils/faultReportPrintBuilder';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

const SEVERITY_LABELS: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: '🔴 Krytyczna',    cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  MODERATE: { label: '🟡 Umiarkowana',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  MINOR:    { label: '🟢 Mało istotna', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
};

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  OPEN:        { label: '🔓 Otwarte',    cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  IN_PROGRESS: { label: '⚙️ W trakcie', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800' },
  HOLD:        { label: '⏸️ Zawieszone', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  RESOLVED:    { label: '✅ Naprawione', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  CLOSED:      { label: '🔒 Zamknięte', cls: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700' },
};

interface FaultReportDrawerProps {
  report: FaultReport | null;
  onClose: () => void;
  onViewHistory: (r: FaultReport) => void;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onNavigateKaizen: (r: FaultReport) => void;
  onUpdateStatus?: (id: string, status: string, comment?: string) => Promise<void>;
  onHoldAndExtend?: (id: string, newDueDate: string, reason: string) => Promise<void>;
}

function AccessTrackerForReport({ report }: { report: FaultReport }) {
  useAccessTracker({
    entityType: 'FAULT',
    entityId: report.id,
    entityTitle: report.title,
  });
  return null;
}

export function FaultReportDrawer({
  report,
  onClose,
  onViewHistory,
  isAdmin,
  onDelete,
  onNavigateKaizen,
  onUpdateStatus,
  onHoldAndExtend,
}: FaultReportDrawerProps) {
  const { showToast } = useToast();
  const { user, isAdmin: isAdminUser } = useAuth();
  const isEffectiveAdmin = isAdmin || isAdminUser;

  const canSetOrExtend = isEffectiveAdmin || (
    Boolean(user) && Boolean(report?.assignedTo) && (
      user?.id === report?.assignedTo?.id ||
      (user?.name && report?.assignedTo?.name && user.name.trim().toLowerCase() === report.assignedTo.name.trim().toLowerCase()) ||
      (user?.login && report?.assignedTo?.name && user.login.trim().toLowerCase() === report.assignedTo.name.trim().toLowerCase())
    )
  );

  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
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

  const handleConfirmSendEmail = (emailToUse: string) => {
    if (!report) return;
    downloadFaultReportEml(
      { id: report.id, title: report.title, description: report.description, severity: report.severity, reportedBy: report.reportedBy, dueDate: report.dueDate, areaName: report.area?.name, machineName: report.machine?.name, assignedToName: report.assignedTo?.name, photoUrl: report.photoUrl },
      emailToUse,
      window.location.origin
    );
    showToast('Pobrano plik .eml z powiadomieniem!', 'success');
  };

  const handleConfirmResolve = async (operatorComment?: string) => {
    if (!report || !onUpdateStatus) return;
    await onUpdateStatus(report.id, 'RESOLVED', operatorComment);
  };

  const handleStatusChangeClick = async (newStatus: string) => {
    if (!report || !onUpdateStatus) return;
    await onUpdateStatus(report.id, newStatus);
  };

  const handleExtendSubmit = async (newDueDate: string, reason: string) => {
    if (!report || !onHoldAndExtend) return;
    await onHoldAndExtend(report.id, newDueDate, reason);
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
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">🔧 {report.title}</h2>
              <p className="text-xs text-slate-400 mt-1">Zgłoszono: {new Date(report.createdAt).toLocaleString('pl-PL')}</p>
            </div>

            {report.status === 'HOLD' && (
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl flex items-start gap-2 text-amber-900 dark:text-amber-200 text-xs font-bold">
                <span className="text-base">⏸️</span>
                <div>
                  <p className="font-extrabold text-sm">Zgłoszenie w stanie Zawieszenia (HOLD)</p>
                  <p className="text-[11px] font-medium mt-0.5 opacity-90">
                    Termin realizacji został przedłużony ze względu na oczekiwanie na części lub wstrzymanie prac. Nowy termin: <strong>{report.dueDate ? new Date(report.dueDate).toLocaleDateString('pl-PL') : 'Nie określono'}</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Opis Usterki</div>
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
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Maszyna / Linia</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">⚙️ {report.machine.name}</div>
                </div>
              )}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Zgłaszający</div>
                <div className="font-bold text-sm text-slate-800 dark:text-slate-200">👤 {report.reportedBy}</div>
              </div>
              {report.assignedTo && (
                <div className="p-3 bg-brand-50 dark:bg-brand-950/40 rounded-xl border border-brand-200 dark:border-brand-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-brand-500 mb-1">Przypisano do</div>
                  <div className="font-bold text-sm text-brand-700 dark:text-brand-300">🔧 {report.assignedTo.name}</div>
                </div>
              )}
              {report.dueDate && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">Termin Realizacji</div>
                  <div className="font-bold text-sm text-amber-800 dark:text-amber-300">📅 {new Date(report.dueDate).toLocaleDateString('pl-PL')}</div>
                </div>
              )}
            </div>

            {photos.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Zdjęcia Usterki ({photos.length})</div>
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

            {(report.fixedBy || report.operatorComment || fixPhotos.length > 0) && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">✅ Informacje o Naprawie i Historii Statusów</div>
                {report.fixedBy && <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Naprawił: {report.fixedBy}</p>}
                {report.fixedAt && <p className="text-xs text-slate-500">Data naprawy: {new Date(report.fixedAt).toLocaleString('pl-PL')}</p>}
                {report.operatorComment && <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap italic">"{report.operatorComment}"</p>}
                {fixPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {fixPhotos.map((url, idx) => (
                      <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-emerald-300 dark:border-emerald-700 cursor-pointer bg-slate-900" onClick={() => setModalImage(url)}>
                        <img src={url} alt={`Naprawa ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
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
              {onUpdateStatus && (report.status === 'OPEN' || report.status === 'IN_PROGRESS' || report.status === 'HOLD') && (
                <button 
                  onClick={() => setIsResolveModalOpen(true)} 
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  ✅ Oznacz jako Naprawione
                </button>
              )}

              {canSetOrExtend && onHoldAndExtend && report.status !== 'RESOLVED' && report.status !== 'CLOSED' && (
                <button
                  onClick={() => setIsExtendModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-1.5 font-sans"
                  title="Zawieś usterkę i przedłuż termin w przypadku oczekiwania na części"
                >
                  ⏳ Zawieś (Brak części)
                </button>
              )}

              {onUpdateStatus && report.status === 'RESOLVED' && (
                <button 
                  onClick={() => handleStatusChangeClick('CLOSED')} 
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  🔒 Zamknij Zgłoszenie
                </button>
              )}

              <button onClick={() => onViewHistory(report)} className="px-3 py-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer flex items-center gap-1">
                👥 Historia Wglądu
              </button>
              <button onClick={() => setIsEmailModalOpen(true)} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800/60 cursor-pointer">
                📧 Powiadom
              </button>
              <button
                onClick={() => printFaultReport({
                  id: report.id,
                  title: report.title,
                  description: report.description,
                  severity: report.severity,
                  status: report.status,
                  reportedBy: report.reportedBy,
                  assignedToName: report.assignedTo?.name,
                  dueDate: report.dueDate,
                  areaName: report.area?.name,
                  machineName: report.machine?.name,
                  operatorComment: report.operatorComment,
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
                💡 Kaizen
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
        <ResolveFaultModal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          onConfirm={handleConfirmResolve}
        />
      )}

      {isEmailModalOpen && (
        <PromptEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          defaultEmail={targetEmail}
          title="📧 Wyślij Powiadomienie o Usterce"
          onConfirm={handleConfirmSendEmail}
        />
      )}

      {isExtendModalOpen && (
        <ExtendDeadlineModal
          isOpen={isExtendModalOpen}
          onClose={() => setIsExtendModalOpen(false)}
          currentDueDate={report.dueDate}
          onExtend={handleExtendSubmit}
        />
      )}
    </>
  );
}

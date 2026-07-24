'use client';

import { useState } from 'react';
import { QualityReport } from '@/hooks/useQualityReports';
import { ResolveQualityReportModal } from '@/components/ui/ResolveQualityReportModal';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { PromptEmailModal } from '@/components/ui/PromptEmailModal';
import { downloadQualityEml } from '@/utils/qualityEmailBuilder';
import { printQualityReport } from '@/utils/qualityPrintBuilder';
import { useToast } from '@/context/ToastContext';

export const QUALITY_CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  PRODUCT_DEFECT: { label: 'Wada Produktu', icon: '📦' },
  RAW_MATERIAL: { label: 'Niezgodność Surowca / Materiału', icon: '🧪' },
  PROCESS_DEVIATION: { label: 'Odchylenie Procesowe', icon: '⚙️' },
  PACKAGING: { label: 'Wada Opakowania', icon: '🏷️' },
  CUSTOMER_COMPLAINT: { label: 'Reklamacja Klienta', icon: '🗣️' },
  OTHER: { label: 'Inne Niezgodności / Niestandardowa', icon: '❓' },
};

export const QUALITY_SEVERITY_LABELS: Record<string, { label: string; cls: string }> = {
  CRITICAL: { label: '🔴 Krytyczna (Blokada Wysyłki)', cls: 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300 border-red-300' },
  MODERATE: { label: '🟡 Średnia Niezgodność', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300' },
  MINOR: { label: '🟢 Drobne Odchylenie', cls: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300' },
};

export const QUALITY_STATUS_LABELS: Record<string, { label: string; cls: string }> = {
  OPEN: { label: '🔓 Zgłoszona', cls: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300' },
  IN_PROGRESS: { label: '⚙️ W trakcie CAPA', cls: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300' },
  RESOLVED: { label: '✅ Skorygowana', cls: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300' },
  CLOSED: { label: '🔒 Zamknięta', cls: 'bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-400' },
};

import { useAuth } from '@/hooks/useAuth';

interface QualityReportDrawerProps {
  report: QualityReport | null;
  onClose: () => void;
  onViewHistory?: (report: QualityReport) => void;
  isAdmin?: boolean;
  onDelete?: (id: string) => void;
  onUpdateStatus?: (id: string, status: string, actionTaken?: string) => Promise<void>;
  onSetDueDate?: (id: string, dueDate: string) => Promise<void>;
}

function AccessTrackerForQuality({ report }: { report: QualityReport }) {
  useAccessTracker({
    entityType: 'QUALITY',
    entityId: report.id,
    entityTitle: report.title,
  });
  return null;
}

export function QualityReportDrawer({
  report,
  onClose,
  onViewHistory,
  isAdmin,
  onDelete,
  onUpdateStatus,
  onSetDueDate,
}: QualityReportDrawerProps) {
  const { user, isAdmin: isAdminUser } = useAuth();
  const { showToast } = useToast();
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDueDateInput, setShowDueDateInput] = useState(false);
  const [newDueDate, setNewDueDate] = useState('');
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const isEffectiveAdmin = isAdmin || isAdminUser;

  const canSetOrExtend = isEffectiveAdmin || (
    Boolean(user) && Boolean(report?.assignedTo) && (
      user?.id === report?.assignedTo?.id ||
      (user?.name && report?.assignedTo?.name && user.name.trim().toLowerCase() === report.assignedTo.name.trim().toLowerCase()) ||
      (user?.login && report?.assignedTo?.name && user.login.trim().toLowerCase() === report.assignedTo.name.trim().toLowerCase())
    )
  );

  if (!report) return null;

  const cat = QUALITY_CATEGORY_LABELS[report.category] ?? { label: report.category, icon: '📦' };
  const sev = QUALITY_SEVERITY_LABELS[report.severity] ?? { label: report.severity, cls: 'bg-slate-100 text-slate-700' };
  const st = QUALITY_STATUS_LABELS[report.status] ?? { label: report.status, cls: 'bg-slate-100 text-slate-700' };

  const photos = report.photoUrl ? report.photoUrl.split(',').filter(Boolean) : [];
  const fixPhotos = report.fixPhotoUrl ? report.fixPhotoUrl.split(',').filter(Boolean) : [];

  const handleSaveDueDate = async () => {
    if (!newDueDate) return;
    if (onSetDueDate) {
      await onSetDueDate(report.id, newDueDate);
      setShowDueDateInput(false);
    }
  };

  const handleConfirmSendEmail = (emailToUse: string) => {
    if (!report) return;
    downloadQualityEml(
      {
        id: report.id,
        title: report.title,
        description: report.description,
        category: report.category,
        severity: report.severity,
        reportedBy: report.reportedBy,
        batchNumber: report.batchNumber,
        quantityAffected: report.quantityAffected,
        areaName: report.area?.name,
        machineName: report.machine?.name,
        assignedToName: report.assignedTo?.name,
        photoUrl: report.photoUrl,
      },
      emailToUse,
      window.location.origin
    );
    showToast('Pobrano plik .eml z powiadomieniem!', 'success');
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col animate-in zoom-in-95 fade-in duration-200">
          <AccessTrackerForQuality report={report} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-t-3xl shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-300">
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
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">📦 {report.title}</h2>
              <p className="text-xs text-slate-400 mt-1">Zgłoszono: {new Date(report.createdAt).toLocaleString('pl-PL')}</p>
            </div>

            {/* Batch & Quantity Banner */}
            {(report.batchNumber || report.quantityAffected) && (
              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-xl flex items-center justify-between gap-4">
                {report.batchNumber && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">Nr Partii / Zlecenia</span>
                    <span className="font-extrabold text-sm text-purple-900 dark:text-purple-200">🏷️ {report.batchNumber}</span>
                  </div>
                )}
                {report.quantityAffected && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">Ilość Zakwestionowana</span>
                    <span className="font-extrabold text-sm text-purple-900 dark:text-purple-200">⚖️ {report.quantityAffected}</span>
                  </div>
                )}
              </div>
            )}

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Opis Niezgodności / Wady</div>
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
                <div className="p-3 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-600 mb-1">Osoba Odpowiedzialna</div>
                  <div className="font-bold text-sm text-purple-800 dark:text-purple-300">🔬 {report.assignedTo.name}</div>
                </div>
              )}
            </div>

            {/* Due Date block - Assigned user can set deadline */}
            <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl flex items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
                  Termin Wykonania Akcji CAPA
                </span>
                <span className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                  {report.dueDate ? `📅 ${new Date(report.dueDate).toLocaleDateString('pl-PL')}` : '⏳ Nie wyznaczono (Czeka na osobiście przypisanego technologa)'}
                </span>
              </div>
              {canSetOrExtend && onSetDueDate && !showDueDateInput && (
                <button
                  onClick={() => setShowDueDateInput(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  📅 Wyznacz / Zmień Termin
                </button>
              )}
            </div>

            {showDueDateInput && (
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                />
                <button onClick={handleSaveDueDate} className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer">
                  Zapisz
                </button>
                <button onClick={() => setShowDueDateInput(false)} className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 cursor-pointer">
                  Anuluj
                </button>
              </div>
            )}

            {photos.length > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Zdjęcia Wady / Próbek ({photos.length})</div>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((url, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group bg-slate-900" onClick={() => setModalImage(url)}>
                      <img src={url} alt={`Wada ${idx + 1}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(report.fixedBy || report.actionTaken || fixPhotos.length > 0) && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">✅ Podjęte Działania Korygujące CAPA</div>
                {report.fixedBy && <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Osoba rozliczająca: {report.fixedBy}</p>}
                {report.fixedAt && <p className="text-xs text-slate-500">Data rozliczenia: {new Date(report.fixedAt).toLocaleString('pl-PL')}</p>}
                {report.actionTaken && <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap italic">"{report.actionTaken}"</p>}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-b-3xl shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              {onViewHistory && (
                <button onClick={() => onViewHistory(report)} className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-xs transition-colors cursor-pointer border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                  👥 Rejestr Wglądu
                </button>
              )}
              <button onClick={() => setIsEmailModalOpen(true)} className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition-colors cursor-pointer border border-indigo-200 dark:border-indigo-800/60">
                📧 Powiadom E-mail
              </button>
              <button
                onClick={() => printQualityReport({
                  id: report.id,
                  title: report.title,
                  description: report.description,
                  category: report.category,
                  severity: report.severity,
                  status: report.status,
                  reportedBy: report.reportedBy,
                  batchNumber: report.batchNumber,
                  quantityAffected: report.quantityAffected,
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
                className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                🖨️ Drukuj
              </button>
              {isAdmin && onDelete && (
                <button onClick={() => onDelete(report.id)} className="px-3 py-2 rounded-xl bg-red-100 dark:bg-red-950/60 hover:bg-red-200 text-red-700 dark:text-red-300 font-bold text-xs transition-colors cursor-pointer">
                  🗑️ Usuń
                </button>
              )}
            </div>

            {report.status !== 'RESOLVED' && report.status !== 'CLOSED' && onUpdateStatus && (
              <button
                onClick={() => setShowResolveModal(true)}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>✅</span> Rozlicz Działania CAPA
              </button>
            )}
          </div>
        </div>
      </div>

      <ResolveQualityReportModal
        isOpen={showResolveModal}
        onClose={() => setShowResolveModal(false)}
        title={report.title}
        onConfirm={async (actionTaken, fixPhotoUrl) => {
          if (onUpdateStatus) {
            await onUpdateStatus(report.id, 'RESOLVED', actionTaken);
          }
        }}
      />

      {isEmailModalOpen && (
        <PromptEmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          defaultEmail={report.assignedTo?.email || 'dział.jakości@zaklad.pl'}
          title="📧 Wyślij Powiadomienie Jakościowe"
          onConfirm={handleConfirmSendEmail}
        />
      )}

      {modalImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setModalImage(null)}>
          <img src={modalImage} alt="Powiększone" className="max-w-full max-h-full rounded-2xl shadow-2xl" />
        </div>
      )}
    </>
  );
}

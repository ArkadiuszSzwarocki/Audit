'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { Audit } from '@/hooks/useAudits';

interface AuditDrawerProps {
  audit: Audit | null;
  onClose: () => void;
  onSendEmail?: (a: Audit) => void;
  canSendEmail?: boolean;
}

function AccessTrackerForAudit({ audit }: { audit: Audit }) {
  useAccessTracker({ entityType: 'AUDIT', entityId: audit.id, entityTitle: audit.title });
  return null;
}

export function AuditDrawer({ audit, onClose, onSendEmail, canSendEmail = true }: AuditDrawerProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    if (audit) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [audit]);

  if (!audit) return null;

  const pendingCount = audit.observations?.filter(o => !o.isFixed && o.severity !== 'POSITIVE' && !o.severity?.includes('Dobra Praktyka')).length ?? 0;
  const fixedCount = audit.observations?.filter(o => o.isFixed && o.severity !== 'POSITIVE' && !o.severity?.includes('Dobra Praktyka')).length ?? 0;
  const positiveCount = audit.observations?.filter(o => o.severity === 'POSITIVE' || o.severity?.includes('Dobra Praktyka')).length ?? 0;
  const totalObs = audit.observations?.length ?? 0;

  const statusCls =
    audit.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' :
    audit.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' :
    'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
  const statusLabel =
    audit.status === 'COMPLETED' ? '✅ Zakończony' :
    audit.status === 'IN_PROGRESS' ? '⚙️ W trakcie' : '📝 Draft';

  return (
    <>
      <div className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col animate-in zoom-in-95 fade-in duration-200">
          <AccessTrackerForAudit audit={audit} />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-t-3xl shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${statusCls}`}>{statusLabel}</span>
              {audit.auditType && (
                <span className="text-xs bg-brand-600 text-white px-2.5 py-0.5 rounded-lg uppercase tracking-wide font-black border border-brand-400">
                  {audit.auditType.name}
                </span>
              )}
            </div>
            <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-lg font-bold">✕</button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div>
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 leading-tight">📋 {audit.title}</h2>
              <p className="text-xs text-slate-400 mt-1">Utworzono: {new Date(audit.createdAt).toLocaleString('pl-PL')}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {audit.area && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Rejon / Obszar</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">📍 {audit.area.name}</div>
                </div>
              )}
              {audit.machine && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Maszyna / Linia</div>
                  <div className="font-bold text-sm text-slate-800 dark:text-slate-200">⚙️ {audit.machine.name}</div>
                </div>
              )}
            </div>

            {totalObs > 0 && (
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Podsumowanie punktów ({totalObs} łącznie)</div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 text-center">
                    <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{pendingCount}</div>
                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mt-1">Do naprawy</div>
                  </div>
                  <div className="p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 text-center">
                    <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{fixedCount}</div>
                    <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mt-1">Naprawione</div>
                  </div>
                  {positiveCount > 0 && (
                    <div className="p-3 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 text-center">
                      <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{positiveCount}</div>
                      <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase mt-1">🌟 Pozytywy</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* List of Observations in Audit Preview */}
            {totalObs > 0 && (
              <div className="space-y-4">
                {/* Fixed Points (Punkty Naprawione) */}
                {fixedCount > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                      <span>✅ Punkty Naprawione ({fixedCount})</span>
                    </div>
                    <div className="space-y-2">
                      {audit.observations?.filter(o => o.isFixed && o.severity !== 'POSITIVE' && !o.severity?.includes('Dobra Praktyka')).slice(0, 5).map(o => (
                        <div key={o.id} className="p-3 bg-emerald-50/90 dark:bg-emerald-950/20 rounded-xl border border-emerald-300 dark:border-emerald-800/80">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{o.description}</p>
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-black bg-emerald-200 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 flex items-center gap-1">
                              ✅ NAPRAWIONO
                            </span>
                          </div>
                          <div className="mt-1.5 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                            <span>Naprawił: <strong>{o.fixedBy || 'Operator / Pracownik'}</strong></span>
                            {o.fixedAt && <span className="ml-2">({new Date(o.fixedAt).toLocaleDateString('pl-PL')})</span>}
                          </div>
                          {o.operatorComment && (
                            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 italic">
                              "{o.operatorComment}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pending Points (Obserwacje Do Naprawy) */}
                {pendingCount > 0 && (
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <span>⚠️ Punkty Do Naprawy ({pendingCount})</span>
                    </div>
                    <div className="space-y-2">
                      {audit.observations?.filter(o => !o.isFixed && o.severity !== 'POSITIVE' && !o.severity?.includes('Dobra Praktyka')).slice(0, 5).map(o => (
                        <div key={o.id} className="p-3 bg-amber-50/80 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800/60">
                          <div className="flex justify-between items-start gap-2">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{o.description}</p>
                            <span className="shrink-0 px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                              ⚠️ DO NAPRAWY
                            </span>
                          </div>
                          {o.dueDate && (
                            <p className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-bold">
                              📅 Termin: {new Date(o.dueDate).toLocaleDateString('pl-PL')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 rounded-b-3xl flex flex-wrap gap-2 justify-between items-center">
            {canSendEmail && onSendEmail ? (
              <button onClick={() => onSendEmail(audit)} className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-200 dark:border-indigo-800/60 cursor-pointer">
                📧 Wyślij Raport
              </button>
            ) : <div />}
            <Link href={`/audyty/${audit.id}`} className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer">
              🔍 Otwórz Pełny Audyt
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

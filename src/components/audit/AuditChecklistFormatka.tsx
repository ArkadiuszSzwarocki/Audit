'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { calculateIfsScore } from '@/utils/ifsScoring';
import { AuditQuestionKaizenModal } from '@/components/ui/AuditQuestionKaizenModal';
import { compressImage } from '@/utils/imageCompressor';

interface ChecklistItem {
  questionId: string;
  chapter: string;
  code: string | null;
  questionText: string;
  guidance: string | null;
  isKnockOut: boolean;
  status: 'PENDING' | 'OK' | 'NOK' | 'GOOD_PRACTICE' | 'NA';
  severity?: string | null;
  comment: string;
  photoUrl: string | null;
  answerId: string | null;
}

interface AuditChecklistProps {
  auditId: string;
  isReadOnly?: boolean;
  onObservationAdded?: () => void;
}

export function AuditChecklistFormatka({ auditId, isReadOnly = false, onObservationAdded }: AuditChecklistProps) {
  const { showToast } = useToast();
  const { isAdmin, user } = useAuth();
  const isAuditor = isAdmin || user?.role === 'AUDITOR';

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [auditTypeName, setAuditTypeName] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingQuestionId, setSavingQuestionId] = useState<string | null>(null);
  const [uploadingQuestionId, setUploadingQuestionId] = useState<string | null>(null);

  // Modal Kaizen dla wybranego pytania
  const [kaizenModalQuestion, setKaizenModalQuestion] = useState<ChecklistItem | null>(null);

  // Severities loaded from DB + selected severity per question
  const [severities, setSeverities] = useState<{ id: string; name: string; isPositive: boolean }[]>([]);
  const [selectedSeverities, setSelectedSeverities] = useState<Record<string, string>>({});

  // Accordion state for collapsing/expanding chapters
  const [collapsedChapters, setCollapsedChapters] = useState<Record<string, boolean>>({});

  const toggleChapter = (chapterName: string) => {
    setCollapsedChapters(prev => ({
      ...prev,
      [chapterName]: !prev[chapterName],
    }));
  };

  const collapseAll = () => {
    const chaptersList = Array.from(new Set(checklist.map(q => q.chapter)));
    const allCollapsed: Record<string, boolean> = {};
    chaptersList.forEach(ch => {
      allCollapsed[ch] = true;
    });
    setCollapsedChapters(allCollapsed);
  };

  const expandAll = () => {
    setCollapsedChapters({});
  };

  useEffect(() => {
    loadChecklist();
    loadSeverities();
  }, [auditId]);

  const loadSeverities = async () => {
    try {
      const res = await fetch('/api/observation-severities');
      if (res.ok) {
        const data = await res.json();
        setSeverities(Array.isArray(data) ? data : []);
      }
    } catch {
      // Ignore severity load errors
    }
  };

  const loadChecklist = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audits/${auditId}/checklist`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const items: ChecklistItem[] = data.checklist || [];
      setChecklist(items);
      setAuditTypeName(data.auditTypeName || '');

      // Initialize selectedSeverities from loaded answers
      const initialSeverities: Record<string, string> = {};
      const initialCollapsed: Record<string, boolean> = {};
      
      items.forEach(q => {
        if (q.severity) {
          initialSeverities[q.questionId] = q.severity;
        }
        // Collapse all chapters by default upon loading
        initialCollapsed[q.chapter] = true;
      });

      setSelectedSeverities(initialSeverities);
      setCollapsedChapters(initialCollapsed);
    } catch (err: any) {
      showToast(err.message || 'Błąd ładowania pytania formatki', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    questionId: string,
    newStatus: 'OK' | 'NOK' | 'GOOD_PRACTICE' | 'NA',
    comment?: string,
    photoUrl?: string | null,
    severity?: string
  ) => {
    setSavingQuestionId(questionId);
    try {
      const currentItem = checklist.find(q => q.questionId === questionId);
      const chosenSev = severity || selectedSeverities[questionId];

      const res = await fetch(`/api/audits/${auditId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          status: newStatus,
          comment: comment !== undefined ? comment : currentItem?.comment,
          photoUrl: photoUrl !== undefined ? photoUrl : currentItem?.photoUrl,
          severity: chosenSev,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error);
      }

      setChecklist(prev =>
        prev.map(item =>
          item.questionId === questionId
            ? {
                ...item,
                status: newStatus,
                ...(comment !== undefined ? { comment } : {}),
                ...(photoUrl !== undefined ? { photoUrl } : {}),
              }
            : item
        )
      );

      if (newStatus === 'NOK') {
        if (resData.isAuditCompletedDueToKO) {
          showToast('🔴 AUDYT ZAKOŃCZONY WYNIKIEM NEGATYWNYM! Naruszenie wymogu IFS KO (Knock-Out). Audyt został automatycznie zamknięty.', 'error');
        } else {
          showToast(`Niezgodność [${chosenSev || 'Niezgodne'}] zarejestrowana i dodana do zadań!`, 'info');
        }
        if (onObservationAdded) onObservationAdded();
      } else {
        if (chosenSev && (chosenSev.toLowerCase().includes('kaizen') || chosenSev.toLowerCase().includes('udoskonalen'))) {
          try {
            const qItem = checklist.find(q => q.questionId === questionId);
            if (qItem) {
              const fullDesc = `Punkt Audytowy [${auditTypeName}]: ${qItem.questionText}${qItem.guidance ? `\nWymóg IFS: ${qItem.guidance}` : ''}${comment ? `\nUwagi: ${comment}` : ''}`;
              await fetch('/api/kaizen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  title: `[Audyt: ${auditTypeName}] ${qItem.code ? qItem.code + ': ' : ''}${qItem.questionText}`,
                  description: fullDesc,
                  benefits: 'Propozycja udoskonalenia zgłoszona jako punkt podczas audytu',
                  submittedBy: user?.name || user?.login || 'Audytor',
                  photoUrl: photoUrl !== undefined ? photoUrl : qItem.photoUrl,
                }),
              });
              showToast('💡 Punkt audytowy zapisano jako Wniosek Kaizen w systemie!', 'success');
            }
          } catch (kErr) {
            console.error('Błąd dodawania Kaizen z formatki:', kErr);
            showToast('Odpowiedź zapisana', 'success');
          }
        } else {
          showToast('Odpowiedź zapisana', 'success');
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Błąd zapisu odpowiedzi', 'error');
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleFileUpload = async (questionId: string, file: File) => {
    setUploadingQuestionId(questionId);
    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const currentItem = checklist.find(q => q.questionId === questionId);
      const targetStatus = currentItem?.status === 'PENDING' || !currentItem?.status ? 'OK' : currentItem.status;

      await handleUpdateStatus(
        questionId,
        targetStatus,
        currentItem?.comment,
        data.url
      );
      showToast('Zdjęcie załączone do pytania', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingQuestionId(null);
    }
  };

  if (loading) {
    return <div className="text-center p-8 text-slate-400 animate-pulse font-bold">Ładowanie formatki pytań...</div>;
  }

  if (checklist.length === 0) {
    return (
      <div className="p-8 text-center glass-card border-dashed border-2 border-slate-200 dark:border-slate-800">
        <span className="text-3xl block mb-2">📋</span>
        <h3 className="font-bold text-slate-700 dark:text-slate-300 text-lg">Brak przypisanej formatki pytań dla tego typu audytu</h3>
        <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
          Dla typu audytu <strong>{auditTypeName || 'Standardowy'}</strong> nie skonfigurowano jeszcze szablonu pytań.
        </p>
      </div>
    );
  }

  // Calculate progress & IFS Score
  const total = checklist.length;
  const answered = checklist.filter(q => q.status !== 'PENDING').length;
  const okCount = checklist.filter(q => q.status === 'OK').length;
  const nokCount = checklist.filter(q => q.status === 'NOK').length;
  const koNokCount = checklist.filter(q => q.status === 'NOK' && q.isKnockOut).length;

  const ifsScore = calculateIfsScore(checklist);

  // Group by chapter
  const chapters = Array.from(new Set(checklist.map(q => q.chapter)));

  return (
    <div className="space-y-6">
      {/* Read-Only Lock Banner */}
      {isReadOnly && (
        <div className="p-4 bg-amber-500/15 border-2 border-amber-500/40 text-amber-900 dark:text-amber-200 rounded-2xl shadow-md flex items-center gap-3 animate-in fade-in duration-300">
          <span className="text-2xl">🔒</span>
          <div>
            <h4 className="font-extrabold text-sm uppercase tracking-wide">Audyt jest Zamknięty — Widok Tylko do Odczytu</h4>
            <p className="text-xs opacity-90 mt-0.5">
              Ten audyt został oficjalnie zakończony. Wprowadzanie zmian, zmiana wag i edycja ocen jest zablokowana.
            </p>
          </div>
        </div>
      )}

      {/* KO Red Alert Banner */}
      {koNokCount > 0 && (
        <div className="p-4 bg-red-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🛑</span>
            <div>
              <h3 className="font-black text-base uppercase tracking-wider">
                AUDYT ZAKOŃCZONY WYNIKIEM NEGATYWNYM!
              </h3>
              <p className="text-xs text-red-100 mt-0.5">
                Wykryto {koNokCount} naruszeń wymagań krytycznych <strong>IFS Knock-Out (KO)</strong>. Audyt został automatycznie zamknięty ze statusem negatywnym.
              </p>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-white text-red-700 font-black text-xs rounded-xl shadow uppercase">
            KO FAILED
          </span>
        </div>
      )}

      {/* Header & Stats Bar */}
      <div className="glass-card p-4 sm:p-5 border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 dark:text-slate-100 whitespace-nowrap">
              📋 Formatka Pytań Kontrolnych — {auditTypeName}
            </h2>
            
            {/* Official IFS Score Badge */}
            <span className={`px-3 py-1 rounded-xl border text-xs font-black shadow-xs shrink-0 flex items-center gap-1.5 ${ifsScore.badgeBg}`}>
              {ifsScore.levelLabel}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={collapseAll}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                📁 Zwiń
              </button>
              <button
                type="button"
                onClick={expandAll}
                className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                📂 Rozwiń
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs font-extrabold">
              <span className="text-emerald-600 dark:text-emerald-400">✅ Zgodne: {okCount}</span>
              <span className="text-red-600 dark:text-red-400">🔴 Niezgodne: {nokCount}</span>
              <span className="text-slate-500 font-medium">Oceniono: {answered} / {total}</span>
            </div>
          </div>
        </div>

        {/* IFS Percentage Progress Sub-Bar */}
        <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800">
          <div className="flex justify-between items-center text-xs font-extrabold">
            <span className="text-slate-600 dark:text-slate-300">
              Wynik zgodności IFS: <strong className={ifsScore.levelColor}>{ifsScore.percentage}%</strong>
            </span>
            <span className="text-slate-500 font-mono text-[11px]">
              Zdobyto {ifsScore.totalEarnedPoints} z {ifsScore.maxPossiblePoints} pkt (Max)
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden p-0.5 shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                ifsScore.hasKoViolation ? 'bg-red-600' :
                ifsScore.percentage >= 95 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' :
                ifsScore.percentage >= 75 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
                'bg-red-500'
              }`}
              style={{ width: `${ifsScore.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* QUESTIONS GROUPED BY CHAPTERS (Collapsible Accordion Sections) */}
      <div className="space-y-6">
        {chapters.map((chapterName, cIdx) => {
          const chapterQuestions = checklist.filter(q => q.chapter === chapterName);
          const isCollapsed = Boolean(collapsedChapters[chapterName]);
          const chOk = chapterQuestions.filter(q => q.status === 'OK').length;
          const chNok = chapterQuestions.filter(q => q.status === 'NOK').length;
          const chAnswered = chapterQuestions.filter(q => q.status !== 'PENDING').length;
          const chTotal = chapterQuestions.length;
          const isComplete = chAnswered === chTotal && chTotal > 0;

          return (
            <div key={cIdx} className="space-y-4">
              {/* Chapter Header (Collapsible Accordion Bar) */}
              <button
                type="button"
                onClick={() => toggleChapter(chapterName)}
                className="w-full sticky top-16 z-10 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg flex justify-between items-center transition-all cursor-pointer border border-slate-700"
              >
                <div className="flex items-center gap-3 text-left">
                  <span className="text-base font-black text-amber-400">
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                  <span className="text-base font-extrabold text-slate-100">{chapterName}</span>
                </div>

                <div className="flex items-center gap-2.5 text-xs">
                  {chOk > 0 && <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-bold rounded">✅ {chOk}</span>}
                  {chNok > 0 && <span className="px-2 py-0.5 bg-red-950 text-red-400 font-bold rounded">🔴 {chNok}</span>}
                  
                  {/* Progress Counter: Zaudytowane X / Y */}
                  <span className={`px-3 py-1 rounded-lg font-black transition-all ${
                    isComplete
                      ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500/50'
                      : chAnswered > 0
                      ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    📊 Zaudytowane: {chAnswered} / {chTotal} {isComplete ? '✓ (Zrobione)' : ''}
                  </span>
                </div>
              </button>

              {/* Questions list in chapter */}
              {!isCollapsed && (
                <div className="space-y-4 animate-in fade-in duration-200">
                {chapterQuestions.map(q => {
                  const isSaving = savingQuestionId === q.questionId;
                  const isUploading = uploadingQuestionId === q.questionId;

                  return (
                    <div
                      key={q.questionId}
                      className={`glass-card p-5 border-2 transition-all space-y-4 ${
                        q.status === 'OK' ? 'border-emerald-200 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10' :
                        q.status === 'NOK' ? 'border-red-300 dark:border-red-900 bg-red-50/30 dark:bg-red-950/20 shadow-md' :
                        q.status === 'GOOD_PRACTICE' ? 'border-blue-200 dark:border-blue-950 bg-blue-50/20' :
                        'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      {/* Row 1: Code, KO badge, Guidance */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex items-start gap-2 min-w-0">
                          {q.code && (
                            <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono font-black text-xs shrink-0">
                              {q.code}
                            </span>
                          )}
                          {q.isKnockOut && (
                            <span className="px-2 py-0.5 rounded bg-red-600 text-white font-black text-[10px] uppercase tracking-wider shrink-0 animate-pulse">
                              🔴 IFS KO (Knock-Out)
                            </span>
                          )}
                          {(q.severity?.toLowerCase().includes('kaizen') || q.severity?.toLowerCase().includes('udoskonalen') || selectedSeverities[q.questionId]?.toLowerCase().includes('kaizen')) && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40 font-extrabold text-[11px] flex items-center gap-1 shrink-0">
                              💡 Wniosek Kaizen
                            </span>
                          )}
                          <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-snug">
                            {q.questionText}
                          </h4>
                        </div>
                      </div>

                      {/* Guidance / IFS Requirement */}
                      {q.guidance && (
                        <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 font-medium">
                          💡 <strong>Wymóg IFS / Wytyczne:</strong> {q.guidance}
                        </div>
                      )}

                      {/* Action Row: Assessment controls */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        {/* Status badge in read-only mode vs. interactive select in edit mode */}
                        <div className="flex items-center gap-2">
                          {isReadOnly ? (
                            <div className={`px-4 py-2 rounded-xl font-black text-xs border-2 shadow-xs flex items-center gap-1.5 ${
                              q.status === 'OK' ? 'bg-emerald-600 text-white border-emerald-700' :
                              q.status === 'NOK' ? 'bg-red-600 text-white border-red-700' :
                              q.status === 'GOOD_PRACTICE' ? (q.severity?.toLowerCase().includes('kaizen') || q.severity?.toLowerCase().includes('udoskonalen') ? 'bg-amber-600 text-white border-amber-700' : 'bg-blue-600 text-white border-blue-700') :
                              q.status === 'NA' ? 'bg-slate-600 text-white border-slate-700' :
                              'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300 dark:border-slate-700'
                            }`}>
                              {q.status === 'OK' && '✅ Zgodne (OK)'}
                              {q.status === 'NOK' && (selectedSeverities[q.questionId] || '🔴 IFS KO (Knock-Out)')}
                              {q.status === 'GOOD_PRACTICE' && (q.severity?.toLowerCase().includes('kaizen') || q.severity?.toLowerCase().includes('udoskonalen') ? '💡 Propozycja Udoskonalenia (Kaizen)' : '🟢 Dobra Praktyka')}
                              {q.status === 'NA' && '⚪ N/A (Nie dotyczy)'}
                              {q.status === 'PENDING' && '⚪ Nieoceniono'}
                            </div>
                          ) : (
                            <select
                              value={
                                q.status === 'OK' ? 'OK' :
                                q.status === 'GOOD_PRACTICE' ? (q.severity?.toLowerCase().includes('kaizen') || q.severity?.toLowerCase().includes('udoskonalen') ? 'KAIZEN' : 'GOOD_PRACTICE') :
                                q.status === 'NA' ? 'NA' :
                                q.status === 'NOK' ? (selectedSeverities[q.questionId] || '🔴 IFS KO (Knock-Out)') :
                                ''
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;

                                if (val === 'OK') {
                                  handleUpdateStatus(q.questionId, 'OK');
                                } else if (val === 'GOOD_PRACTICE') {
                                  handleUpdateStatus(q.questionId, 'GOOD_PRACTICE');
                                } else if (val === 'KAIZEN') {
                                  setSelectedSeverities(prev => ({ ...prev, [q.questionId]: '💡 Propozycja Udoskonalenia (Kaizen)' }));
                                  handleUpdateStatus(q.questionId, 'GOOD_PRACTICE', q.comment, q.photoUrl, '💡 Propozycja Udoskonalenia (Kaizen)');
                                } else if (val === 'NA') {
                                  handleUpdateStatus(q.questionId, 'NA');
                                } else {
                                  setSelectedSeverities(prev => ({ ...prev, [q.questionId]: val }));
                                  handleUpdateStatus(q.questionId, 'NOK', q.comment, q.photoUrl, val);
                                }
                              }}
                              className={`px-4 py-2 rounded-xl font-extrabold text-xs transition-all outline-none border-2 shadow-sm cursor-pointer ${
                                q.status === 'OK' ? 'bg-emerald-600 text-white border-emerald-700' :
                                q.status === 'NOK' ? 'bg-red-600 text-white border-red-700 scale-105' :
                                q.status === 'GOOD_PRACTICE' ? (q.severity?.toLowerCase().includes('kaizen') || q.severity?.toLowerCase().includes('udoskonalen') ? 'bg-amber-600 text-white border-amber-700' : 'bg-blue-600 text-white border-blue-700') :
                                q.status === 'NA' ? 'bg-slate-600 text-white border-slate-700' :
                                'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              <option value="" disabled>-- Wybierz wynik / ocenę audytu --</option>
                              
                              <optgroup label="✅ Ocena Pozytywna / Udoskonalenia" className="bg-slate-900 text-emerald-400 font-bold">
                                <option value="OK" className="bg-slate-900 text-emerald-400 font-bold">✅ Zgodne (OK)</option>
                                <option value="GOOD_PRACTICE" className="bg-slate-900 text-blue-400 font-bold">🟢 Dobra Praktyka</option>
                                <option value="KAIZEN" className="bg-slate-900 text-amber-400 font-extrabold">💡 Propozycja Udoskonalenia (Kaizen)</option>
                                <option value="NA" className="bg-slate-900 text-slate-300 font-bold">⚪ N/A (Nie dotyczy)</option>
                              </optgroup>

                              <optgroup label="🔴 Niezgodności i Wymogi KO (Usterka Produkcyjna)" className="bg-slate-900 text-red-400 font-bold">
                                <option value="🔴 IFS KO (Knock-Out)" className="bg-slate-900 text-red-400 font-black">
                                  🔴 IFS KO (Knock-Out — Oblewa Audyt)
                                </option>
                                {severities.filter(s => !s.isPositive).map(s => (
                                  <option key={s.id} value={s.name} className="bg-slate-900 text-white font-bold">
                                    ⚠️ {s.name}
                                  </option>
                                ))}
                              </optgroup>
                            </select>
                          )}
                        </div>

                        {/* Photo attachment button & Dedicated Kaizen button */}
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => !isReadOnly && setKaizenModalQuestion(q)}
                            disabled={isReadOnly}
                            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all border shadow-xs flex items-center gap-1.5 ${
                              isReadOnly
                                ? (q.severity?.toLowerCase().includes('kaizen') || q.severity?.toLowerCase().includes('udoskonalen')
                                    ? 'bg-amber-500 text-white border-amber-600 font-black cursor-not-allowed'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 cursor-not-allowed font-bold')
                                : q.severity?.toLowerCase().includes('kaizen') || q.severity?.toLowerCase().includes('udoskonalen')
                                ? 'bg-amber-500 text-white font-black shadow-amber-500/30'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950/80 dark:hover:bg-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 cursor-pointer'
                            }`}
                            title={isReadOnly ? 'Audyt jest zamknięty' : 'Kliknij, aby otworzyć formularz i zgłosić ten punkt jako Wniosek Kaizen'}
                          >
                            💡 Zgłoś jako Kaizen
                          </button>

                          <label className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            isReadOnly
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700 cursor-not-allowed font-bold'
                              : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer border-slate-200 dark:border-slate-700'
                          }`}>
                            📷 {isUploading ? 'Wgrywanie...' : q.photoUrl ? 'Zmień zdjęcie' : 'Załącz zdjęcie'}
                            <input
                              type="file"
                              accept="image/*"
                              capture="environment"
                              className="hidden"
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file && !isReadOnly) handleFileUpload(q.questionId, file);
                              }}
                              disabled={isUploading || isReadOnly}
                            />
                          </label>

                          {q.photoUrl && (
                            <a
                              href={q.photoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-extrabold flex items-center gap-1"
                            >
                              Podgląd 📷
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Comment / Evidence Input */}
                      <div>
                        <input
                          type="text"
                          disabled={isReadOnly}
                          readOnly={isReadOnly}
                          placeholder={isReadOnly ? (q.comment ? '' : 'Brak uwag / dowodu audytowego') : 'Dodaj opcjonalną uwagę lub dowód audytowy...'}
                          value={q.comment}
                          onChange={e => {
                            if (isReadOnly) return;
                            const val = e.target.value;
                            setChecklist(prev =>
                              prev.map(item =>
                                item.questionId === q.questionId ? { ...item, comment: val } : item
                              )
                            );
                          }}
                          onBlur={e => {
                            if (!isReadOnly && q.status !== 'PENDING') {
                              handleUpdateStatus(q.questionId, q.status, e.target.value);
                            }
                          }}
                          className={`w-full px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                            isReadOnly
                              ? 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 font-semibold cursor-not-allowed placeholder:text-slate-400'
                              : 'bg-white dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-brand-500'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Kaizen Submission Modal */}
      {kaizenModalQuestion && (
        <AuditQuestionKaizenModal
          isOpen={Boolean(kaizenModalQuestion)}
          questionId={kaizenModalQuestion.questionId}
          questionText={kaizenModalQuestion.questionText}
          questionCode={kaizenModalQuestion.code}
          chapterName={kaizenModalQuestion.chapter}
          guidance={kaizenModalQuestion.guidance}
          comment={kaizenModalQuestion.comment}
          photoUrl={kaizenModalQuestion.photoUrl}
          onClose={() => setKaizenModalQuestion(null)}
          onSubmitSuccess={() => {
            setSelectedSeverities(prev => ({ ...prev, [kaizenModalQuestion.questionId]: '💡 Propozycja Udoskonalenia (Kaizen)' }));
            handleUpdateStatus(
              kaizenModalQuestion.questionId,
              'GOOD_PRACTICE',
              kaizenModalQuestion.comment,
              kaizenModalQuestion.photoUrl,
              '💡 Propozycja Udoskonalenia (Kaizen)'
            );
          }}
        />
      )}
    </div>
  );
}

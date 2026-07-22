'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useObservations } from '@/hooks/useObservations';
import { useAudits } from '@/hooks/useAudits';
import { ImageModal } from '@/components/ui/ImageModal';
import { ExtendDeadlineModal } from '@/components/ui/ExtendDeadlineModal';
import { useAuth } from '@/hooks/useAuth';
import { useUsers } from '@/hooks/useUsers';

import { useToast } from '@/context/ToastContext';
import { useAccessTracker } from '@/hooks/useAccessTracker';
import { DocumentAccessHistoryModal } from '@/components/ui/DocumentAccessHistoryModal';

export default function TasksPage() {
  const router = useRouter();
  const { pendingObservations, loading, fetchPendingObservations, fixObservation, deleteObservation, assignObservation } = useObservations();
  const { extendDueDate } = useAudits();
  const { user, isAdmin } = useAuth();
  const { users, fetchUsers } = useUsers();
  const { showToast, showConfirm } = useToast();

  useAccessTracker({
    entityType: 'TASK',
    entityId: 'ZADANIA_PRODUKCYJNE',
    entityTitle: 'Zadania Produkcyjne (Dla Operatorów)',
  });
  
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [operatorName, setOperatorName] = useState('');
  const [operatorComment, setOperatorComment] = useState('');
  const [fixPhotoUrl, setFixPhotoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extension Modal State
  const [extendingObs, setExtendingObs] = useState<any | null>(null);

  // Image Viewer State
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    fetchPendingObservations(pendingObservations.length === 0);
    if (isAdmin) {
      fetchUsers(false);
    }
  }, [fetchPendingObservations, isAdmin, fetchUsers, pendingObservations.length]);

  const handleAssign = async (id: string, userId: string) => {
    try {
      await assignObservation(id, userId || null);
      showToast('Zadanie przypisane pomyślnie', 'success');
    } catch (error: any) {
      showToast(error.message, 'error');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFixPhotoUrl(data.url);
      showToast('Zdjęcie wgrane', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFixTask = async (id: string) => {
    const finalOperatorName = user ? user.name : operatorName.trim();
    if (!finalOperatorName) {
      showToast('Proszę podać imię i nazwisko osoby naprawiającej.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await fixObservation(id, finalOperatorName, fixPhotoUrl || undefined, operatorComment.trim() || undefined);
      showToast('Zadanie pomyślnie zrealizowane! Dziękujemy.', 'success');
      
      // Reset stany
      setActiveTask(null);
      setOperatorName('');
      setOperatorComment('');
      setFixPhotoUrl(null);
    } catch (error: any) {
      showToast(error.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExtendDueDateSubmit = async (newDueDate: string, reason: string) => {
    if (!extendingObs) return;
    try {
      const operatorNameVal = user ? user.name : 'Operator';
      await extendDueDate(extendingObs.id, newDueDate, reason, operatorNameVal);
      showToast('Termin rozwiązania został przedłużony', 'success');
      fetchPendingObservations();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const pendingList = Array.isArray(pendingObservations) ? pendingObservations : [];
  const totalCount = pendingList.length;
  const criticalCount = pendingList.filter((o: any) => o.severity === 'CRITICAL').length;
  const moderateCount = pendingList.filter((o: any) => o.severity === 'MODERATE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            Zadania Produkcyjne
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Lista otwartych niezgodności zgłoszonych podczas audytów.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Zobacz kto otworzył i zapoznał się z zadaniami produkcyjnymi"
          >
            👥 Historia zapoznań
          </button>
          <button
            onClick={() => fetchPendingObservations(false)}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Odśwież
          </button>
        </div>
      </div>

      {/* Stats summary bar */}
      {!loading && (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
              <span className="text-xl">🔴</span>
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{totalCount}</div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">Otwarte zadania</div>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-red-100 dark:bg-red-900/60 flex items-center justify-center shrink-0">
              <span className="text-xl">⚠️</span>
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-black text-red-600 dark:text-red-400 leading-none">{criticalCount}</div>
              <div className="text-xs font-semibold text-red-500 dark:text-red-500 mt-1">Krytyczne</div>
            </div>
          </div>
          <div className="rounded-2xl border border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-orange-100 dark:bg-orange-900/60 flex items-center justify-center shrink-0">
              <span className="text-xl">🟡</span>
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-black text-orange-600 dark:text-orange-400 leading-none">{moderateCount}</div>
              <div className="text-xs font-semibold text-orange-500 dark:text-orange-500 mt-1">Umiarkowane</div>
            </div>
          </div>
        </div>
      )}

      {loading && (!pendingObservations || !Array.isArray(pendingObservations) || pendingObservations.length === 0) ? (
        <div className="text-center p-8 animate-pulse">Ładowanie otwartych zadań...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {!Array.isArray(pendingObservations) || pendingObservations.length === 0 ? (
            <div className="col-span-full text-center text-emerald-600 dark:text-emerald-400 py-12 glass-card font-bold text-xl">
              🎉 Brak otwartych zadań! Wszystko działa poprawnie.
            </div>
          ) : (
            pendingObservations.map((obs: any) => (
              <div key={obs.id} className={`glass-card flex flex-col justify-between border-2 transition-all ${
                activeTask === obs.id ? 'border-brand-500 shadow-lg shadow-brand-500/20 scale-105 z-10' : 'border-transparent hover:border-slate-300 dark:hover:border-slate-600'
              }`}>
                <div>
                  {/* Card header - badges in ONE row */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-row flex-wrap gap-1.5 items-center">
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-md uppercase tracking-wider">
                        Do Naprawy
                      </span>
                      <span className={`px-2 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                        obs.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                        obs.severity === 'MODERATE' ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {obs.severity === 'CRITICAL' ? 'Krytyczne' : obs.severity === 'MODERATE' ? 'Umiarkowane' : obs.severity || 'Brak wagi'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                        {new Date(obs.createdAt).toLocaleDateString()}
                      </span>
                      <button

                        onClick={(e) => {
                          e.stopPropagation();
                          showConfirm({
                            title: 'Usuwanie Zadania',
                            message: 'Czy na pewno chcesz usunąć to zadanie?',
                            confirmText: 'Usuń',
                            isDanger: true,
                            onConfirm: async () => {
                              await deleteObservation(obs.id);
                              showToast('Zadanie usunięte', 'success');
                            }
                          });
                        }}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Usuń zadanie"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2 leading-snug">
                    {obs.aiSuggestion || obs.description}
                  </h3>
                  
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 flex flex-col gap-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      {obs.audit?.area?.name || 'Rejon nieznany'}
                    </span>
                    {obs.audit?.machine && (
                      <span className="ml-5 text-xs text-brand-600 dark:text-brand-400 font-medium">
                        Maszyna: {obs.audit.machine.name}
                      </span>
                    )}
                  </p>
                  
                  <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                    {obs.assignedTo ? (
                      <span className="inline-block px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-md text-xs font-semibold">
                        Przypisane do: {obs.assignedTo.name}
                      </span>
                    ) : <div />}

                    <button
                      onClick={() => router.push(`/kaizen/nowy?title=${encodeURIComponent('Kaizen z audytu: ' + (obs.aiSuggestion || obs.description))}&description=${encodeURIComponent(obs.description)}`)}
                      className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="Przekształć tę niezgodność w pomysł Kaizen"
                    >
                      💡 Do Kaizena
                    </button>
                  </div>

                  {/* Due Date & Extension Section */}
                  <div className="my-3 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {obs.dueDate ? (
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 ${
                          new Date(obs.dueDate) < new Date()
                            ? 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-950/80 dark:text-red-300 animate-pulse'
                            : 'bg-indigo-100 text-indigo-800 border border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300'
                        }`}>
                          📅 Termin: {new Date(obs.dueDate).toLocaleDateString('pl-PL')}
                          {new Date(obs.dueDate) < new Date() && ' ⚠️ PRZEKROCZONY!'}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium">Brak wyznaczonego terminu</span>
                      )}

                      <button
                        onClick={() => setExtendingObs(obs)}
                        className="text-xs font-bold px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        title="Przedłuż termin rozwiązania z podaniem powodu"
                      >
                        <span>⏳ Przedłuż termin</span>
                      </button>
                    </div>

                    {obs.extensions && obs.extensions.length > 0 && (
                      <div className="mt-2 p-2.5 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-lg space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-400 block">
                          📜 Historia przedłużeń terminu ({obs.extensions.length})
                        </span>
                        <ul className="space-y-1 text-xs text-slate-700 dark:text-slate-300">
                          {obs.extensions.map((ext: any) => (
                            <li key={ext.id} className="p-1.5 bg-white dark:bg-slate-900 rounded border border-amber-100 dark:border-amber-900/40 text-[11px]">
                              <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 mb-0.5">
                                <span>
                                  Termin: {ext.previousDueDate ? new Date(ext.previousDueDate).toLocaleDateString('pl-PL') : 'Brak'} ➔ <span className="text-amber-600 dark:text-amber-400 font-extrabold">{new Date(ext.newDueDate).toLocaleDateString('pl-PL')}</span>
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  {new Date(ext.createdAt).toLocaleDateString('pl-PL')} przez <strong className="text-slate-600 dark:text-slate-300">{ext.requestedBy}</strong>
                                </span>
                              </div>
                              <div className="text-slate-600 dark:text-slate-400 italic">
                                Powód: "{ext.reason}"
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                        Przypisz zadanie (Kierownik)
                      </label>
                      <select 
                        value={obs.assignedToId || ''} 
                        onChange={(e) => handleAssign(obs.id, e.target.value)}
                        className="w-full px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
                      >
                        <option value="">-- Nieprzypisane --</option>
                        {users.map(u => (
                          <option key={u.id} value={u.id}>{u.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {obs.photoUrl && activeTask !== obs.id && (
                    <button onClick={() => setModalImage(obs.photoUrl!)} className="w-full mt-2 block relative group focus:outline-none focus:ring-2 focus:ring-brand-500 rounded-lg">
                      <img src={obs.photoUrl} alt="Zdjęcie z audytu" className="w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700 opacity-90 transition-opacity group-hover:opacity-60" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/20 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white drop-shadow-md" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                      </div>
                    </button>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
                  {activeTask === obs.id ? (
                    <div className="space-y-4 animate-in slide-in-from-top-2">
                      {!user && (
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                            Twoje imię i nazwisko
                          </label>
                          <input 
                            type="text" 
                            autoFocus
                            value={operatorName}
                            onChange={e => setOperatorName(e.target.value)}
                            placeholder="np. Jan Kowalski"
                            className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Komentarz / Uwagi (Opcjonalnie)
                        </label>
                        <textarea 
                          value={operatorComment}
                          onChange={e => setOperatorComment(e.target.value)}
                          placeholder="np. Wymieniłem część na nową z magazynu..."
                          className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-emerald-500 outline-none min-h-[60px]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                          Zdjęcie po naprawie (Opcjonalnie)
                        </label>
                        <input 
                          type="file" 
                          accept="image/*" 
                          id={`fix-upload-${obs.id}`}
                          className="hidden" 
                          onChange={handleFileUpload} 
                        />
                        <label 
                          htmlFor={`fix-upload-${obs.id}`}
                          className="cursor-pointer w-full flex items-center justify-center gap-2 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                          {isUploading ? 'Przesyłanie...' : (fixPhotoUrl ? 'Zdjęcie dodane (Kliknij by zmienić)' : 'Zrób zdjęcie zrobionej pracy')}
                        </label>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => { setActiveTask(null); setFixPhotoUrl(null); }}
                          className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-md font-medium text-sm transition-colors"
                        >
                          Anuluj
                        </button>
                        <button 
                          onClick={() => handleFixTask(obs.id)}
                          disabled={isSubmitting || (!user && !operatorName.trim())}
                          className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold text-sm transition-colors shadow-sm disabled:opacity-50"
                        >
                          Zatwierdź
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => {
                        setActiveTask(obs.id);
                        setOperatorName('');
                        setOperatorComment('');
                        setFixPhotoUrl(null);
                      }}
                      className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-lg font-bold transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Oznacz jako naprawione
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <ImageModal 
        isOpen={!!modalImage} 
        imageUrl={modalImage} 
        onClose={() => setModalImage(null)} 
      />

      <ExtendDeadlineModal
        isOpen={!!extendingObs}
        onClose={() => setExtendingObs(null)}
        currentDueDate={extendingObs?.dueDate}
        onExtend={handleExtendDueDateSubmit}
      />

      <DocumentAccessHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        entityType="TASK"
        entityId="ZADANIA_PRODUKCYJNE"
        entityTitle="Zadania Produkcyjne"
      />
    </div>
  );
}

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

const getNormalizedSeverity = (sev?: string | null): 'CRITICAL' | 'MODERATE' | 'MINOR' => {
  if (!sev) return 'MINOR';
  const s = sev.toUpperCase();
  if (s === 'CRITICAL' || s.includes('KRYTYCZ') || s.includes('KO')) return 'CRITICAL';
  if (s === 'MODERATE' || s.includes('UMIARK')) return 'MODERATE';
  if (s === 'MINOR' || s.includes('MAŁO') || s.includes('MALO') || s.includes('DROB')) return 'MINOR';
  return 'MINOR';
};

const SEVERITY_STYLES: Record<string, { icon: string; cls: string }> = {
  CRITICAL: { icon: '🔴', cls: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800' },
  MODERATE: { icon: '🟡', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  MINOR:    { icon: '🟢', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
};

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
  const [historyTarget, setHistoryTarget] = useState<{ id: string; title: string } | null>(null);
  const [expandedExtensions, setExpandedExtensions] = useState<Record<string, boolean>>({});

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterMachine, setFilterMachine] = useState('');
  const [filterAssigned, setFilterAssigned] = useState('');
  const [filterDueDate, setFilterDueDate] = useState('');

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

  const handleDelete = (id: string) => {
    showConfirm({
      title: 'Usuwanie Zadania',
      message: 'Czy na pewno chcesz usunąć to zadanie?',
      confirmText: 'Usuń',
      isDanger: true,
      onConfirm: async () => {
        try {
          await deleteObservation(id);
          showToast('Zadanie usunięte', 'success');
        } catch (err: any) {
          showToast(err.message || 'Błąd podczas usuwania', 'error');
        }
      }
    });
  };

  const toggleExtensions = (id: string) => {
    setExpandedExtensions(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const pendingList = Array.isArray(pendingObservations) ? pendingObservations : [];
  const totalCount = pendingList.length;
  const criticalCount = pendingList.filter((o: any) => getNormalizedSeverity(o.severity) === 'CRITICAL').length;
  const moderateCount = pendingList.filter((o: any) => getNormalizedSeverity(o.severity) === 'MODERATE').length;
  const minorCount = pendingList.filter((o: any) => getNormalizedSeverity(o.severity) === 'MINOR').length;

  // Extract unique areas and machines for drop-down filters
  const uniqueAreas = Array.from(
    new Set(pendingList.map((o: any) => o.audit?.area?.name).filter(Boolean))
  ).sort() as string[];

  const uniqueMachines = Array.from(
    new Set(pendingList.map((o: any) => o.audit?.machine?.name).filter(Boolean))
  ).sort() as string[];

  // Advanced Filtering Pipeline
  const filteredObservations = pendingList.filter((obs: any) => {
    // 1. Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const searchable = [
        obs.aiSuggestion,
        obs.description,
        obs.audit?.area?.name,
        obs.audit?.machine?.name,
        obs.assignedTo?.name
      ].filter(Boolean).join(' ').toLowerCase();

      if (!searchable.includes(q)) return false;
    }

    // 2. Severity
    if (filterSeverity) {
      if (getNormalizedSeverity(obs.severity) !== filterSeverity) return false;
    }

    // 3. Area
    if (filterArea) {
      const areaName = obs.audit?.area?.name || 'Rejon nieznany';
      if (areaName !== filterArea) return false;
    }

    // 4. Machine
    if (filterMachine) {
      const machineName = obs.audit?.machine?.name || '';
      if (machineName !== filterMachine) return false;
    }

    // 5. Assignment
    if (filterAssigned) {
      if (filterAssigned === 'UNASSIGNED' && obs.assignedToId) return false;
      if (filterAssigned === 'MY_TASKS' && (!user || obs.assignedToId !== user.id)) return false;
      if (filterAssigned !== 'UNASSIGNED' && filterAssigned !== 'MY_TASKS' && obs.assignedToId !== filterAssigned) return false;
    }

    // 6. Due Date Status
    if (filterDueDate) {
      const isOverdue = obs.dueDate && new Date(obs.dueDate) < new Date();
      if (filterDueDate === 'OVERDUE' && !isOverdue) return false;
      if (filterDueDate === 'HAS_DUE_DATE' && !obs.dueDate) return false;
      if (filterDueDate === 'NO_DUE_DATE' && obs.dueDate) return false;
    }

    return true;
  });

  const hasActiveFilters = Boolean(
    searchTerm || filterSeverity || filterArea || filterMachine || filterAssigned || filterDueDate
  );

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterSeverity('');
    setFilterArea('');
    setFilterMachine('');
    setFilterAssigned('');
    setFilterDueDate('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-4 border-slate-200 dark:border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-3">
            ⚙️ Zadania Produkcyjne
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            Ewidencja i śledzenie otwartych zadań i niezgodności audytowych do wykonania na produkcji.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setHistoryTarget({ id: 'ZADANIA_PRODUKCYJNE', title: 'Zadania Produkcyjne' })}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
            title="Zobacz osoby, które otworzyły i zapoznały się z rejestrem zadań produkcyjnych"
          >
            👥 Zapoznania z Rejestrem
          </button>
          <button
            onClick={() => fetchPendingObservations(false)}
            className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl text-sm font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Odśwież
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
              <span className="text-2xl">🔴</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{totalCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Otwarte Zadania</div>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-200 dark:bg-red-900/60 flex items-center justify-center shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <div className="text-2xl font-black text-red-600 dark:text-red-400 leading-none">{criticalCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mt-1">Krytyczne</div>
            </div>
          </div>
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
              <span className="text-2xl">🟡</span>
            </div>
            <div>
              <div className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">{moderateCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-1">Umiarkowane</div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Suite Container */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        {/* Top Row: Search Input + Severity Tabs */}
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[260px]">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Szukaj zadania, opisu, maszyny, rejonu lub osoby..."
              className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Severity Filter Tabs */}
          <div className="flex flex-wrap gap-1.5 items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shrink-0">
            {[
              ['', 'Wszystkie'],
              ['CRITICAL', '🔴 Krytyczne'],
              ['MODERATE', '🟡 Umiarkowane'],
              ['MINOR', '🟢 Drobne']
            ].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setFilterSeverity(val)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  filterSeverity === val
                    ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs border border-slate-200 dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Second Row: Dropdown Selectors Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          {/* Area Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              📍 Obszar / Rejon
            </label>
            <select
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Wszystkie obszary ({uniqueAreas.length})</option>
              {uniqueAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          {/* Machine Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              ⚙️ Maszyna
            </label>
            <select
              value={filterMachine}
              onChange={e => setFilterMachine(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Wszystkie maszyny ({uniqueMachines.length})</option>
              {uniqueMachines.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Assignment Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              👤 Przypisanie
            </label>
            <select
              value={filterAssigned}
              onChange={e => setFilterAssigned(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Wszyscy pracownicy</option>
              {user && <option value="MY_TASKS">⭐ Moje zadania ({user.name})</option>}
              <option value="UNASSIGNED">⚪ Nieprzypisane</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>👤 {u.name}</option>
              ))}
            </select>
          </div>

          {/* Due Date Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              📅 Status Terminu
            </label>
            <select
              value={filterDueDate}
              onChange={e => setFilterDueDate(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Wszystkie terminy</option>
              <option value="OVERDUE">🔴 Po terminie (Przekroczone)</option>
              <option value="HAS_DUE_DATE">📅 Z wyznaczonym terminem</option>
              <option value="NO_DUE_DATE">⚪ Bez wyznaczonego terminu</option>
            </select>
          </div>
        </div>

        {/* Bottom Bar: Active Filters Counter & Reset Button */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="text-slate-500 dark:text-slate-400 font-medium">
            Znaleziono: <strong className="text-slate-900 dark:text-slate-100 font-bold">{filteredObservations.length}</strong> z {totalCount} zadań
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border border-amber-200 dark:border-amber-800/60 cursor-pointer"
            >
              🧹 Wyczyść filtry
            </button>
          )}
        </div>
      </div>

      {/* Table List View */}
      {loading && pendingList.length === 0 ? (
        <div className="text-center p-12 animate-pulse text-slate-400 font-bold">Ładowanie otwartych zadań...</div>
      ) : filteredObservations.length === 0 ? (
        <div className="text-center py-16 glass-card font-bold text-emerald-600 dark:text-emerald-400 text-xl border border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-2">
          <div>🎉 Brak otwartych zadań produkcyjnych spełniających wybrane kryteria!</div>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-emerald-500 transition-all cursor-pointer"
            >
              🧹 Wyczyść filtry i pokaż wszystkie
            </button>
          )}
        </div>
      ) : (
        <div className="glass-card overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] font-black border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 text-center w-12">#</th>
                  <th className="p-3">Ważność</th>
                  <th className="p-3">Treść Zadania i Opis Niezgodności</th>
                  <th className="p-3">Obszar / Maszyna</th>
                  <th className="p-3 whitespace-nowrap">Termin i Przedłużenia</th>
                  <th className="p-3 text-center w-36">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
                {filteredObservations.map((obs: any, idx: number) => {
                  const normSev = getNormalizedSeverity(obs.severity);
                  const sevStyle = SEVERITY_STYLES[normSev];
                  const displayLabel = obs.severity || (normSev === 'CRITICAL' ? 'Krytyczne' : normSev === 'MODERATE' ? 'Umiarkowane' : 'Drobne');
                  const isOverdue = obs.dueDate && new Date(obs.dueDate) < new Date();
                  const isFixing = activeTask === obs.id;

                  return (
                    <tr
                      key={obs.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        normSev === 'CRITICAL' ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                      } ${isFixing ? 'bg-emerald-50/40 dark:bg-emerald-950/30' : ''}`}
                    >
                      {/* # Index */}
                      <td className="p-3 text-center font-bold text-xs text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Severity */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg border ${sevStyle.cls}`}>
                          {sevStyle.icon} {displayLabel}
                        </span>
                      </td>

                      {/* Task Content, Description & Inline Completion Form */}
                      <td className="p-3 max-w-md">
                        <div className="flex items-start gap-3">
                          {obs.photoUrl && (
                            <button
                              onClick={() => setModalImage(obs.photoUrl!)}
                              className="shrink-0 cursor-pointer group relative"
                              title="Kliknij, aby powiększyć zdjęcie z audytu"
                            >
                              <img
                                src={obs.photoUrl}
                                alt="Zdjęcie z audytu"
                                className="w-12 h-12 object-cover rounded-xl border border-slate-300 dark:border-slate-700 group-hover:scale-105 transition-transform"
                              />
                            </button>
                          )}
                          <div className="space-y-1 w-full">
                            <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug">
                              {obs.aiSuggestion || obs.description}
                            </div>
                            {obs.aiSuggestion && obs.description !== obs.aiSuggestion && (
                              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                Opis: {obs.description}
                              </p>
                            )}
                            
                            {/* Assigned info & selector */}
                            <div className="pt-1 flex items-center gap-2 flex-wrap text-xs">
                              {obs.assignedTo ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 rounded font-semibold text-[11px] border border-brand-200 dark:border-brand-800">
                                  👤 Przypisany: {obs.assignedTo.name}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">Nieprzypisane</span>
                              )}

                              {isAdmin && (
                                <select
                                  value={obs.assignedToId || ''}
                                  onChange={(e) => handleAssign(obs.id, e.target.value)}
                                  className="text-[11px] px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-medium outline-none focus:ring-1 focus:ring-brand-500"
                                >
                                  <option value="">-- Przypisz --</option>
                                  {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* INLINE FIX FORM - Expanded directly under the task report */}
                            {isFixing && (
                              <div className="mt-3 p-4 bg-emerald-50/90 dark:bg-emerald-950/50 rounded-2xl border border-emerald-300 dark:border-emerald-800 shadow-md space-y-3 animate-in fade-in duration-200">
                                <div className="text-xs font-black text-emerald-800 dark:text-emerald-300 uppercase tracking-wider flex justify-between items-center">
                                  <span className="flex items-center gap-1.5">🛠️ Realizacja i naprawa zgłoszenia</span>
                                  <button
                                    onClick={() => setActiveTask(null)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-sm cursor-pointer"
                                    title="Zamknij formularz"
                                  >
                                    ✕
                                  </button>
                                </div>

                                {!user && (
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                                      Twoje imię i nazwisko (Wykonawca)
                                    </label>
                                    <input 
                                      type="text" 
                                      autoFocus
                                      value={operatorName}
                                      onChange={e => setOperatorName(e.target.value)}
                                      placeholder="np. Jan Kowalski"
                                      className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                                    />
                                  </div>
                                )}

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                                    Opis wykonanej pracy / Komentarz
                                  </label>
                                  <textarea 
                                    value={operatorComment}
                                    onChange={e => setOperatorComment(e.target.value)}
                                    placeholder="Opisz wykonane naprawy lub usunięte usterki..."
                                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500 min-h-[50px]"
                                  />
                                </div>

                                <div>
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    id={`fix-upload-${obs.id}`}
                                    className="hidden" 
                                    onChange={handleFileUpload} 
                                  />
                                  <label 
                                    htmlFor={`fix-upload-${obs.id}`}
                                    className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  >
                                    📷 {isUploading ? 'Przesyłanie...' : (fixPhotoUrl ? 'Zdjęcie po naprawie dodane ✓' : 'Dodaj zdjęcie wykonanej pracy (opcjonalnie)')}
                                  </label>
                                </div>

                                <div className="flex gap-2 pt-1">
                                  <button 
                                    onClick={() => { setActiveTask(null); setFixPhotoUrl(null); }}
                                    className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                                  >
                                    Anuluj
                                  </button>
                                  <button 
                                    onClick={() => handleFixTask(obs.id)}
                                    disabled={isSubmitting || (!user && !operatorName.trim())}
                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
                                  >
                                    Zatwierdź realizację
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Area & Machine */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-xs text-slate-800 dark:text-slate-200">
                          📍 {obs.audit?.area?.name || 'Rejon nieznany'}
                        </div>
                        {obs.audit?.machine && (
                          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                            ⚙️ {obs.audit.machine.name}
                          </div>
                        )}
                      </td>

                      {/* Due Date & Extensions */}
                      <td className="p-3 whitespace-nowrap text-xs space-y-1.5">
                        {obs.dueDate ? (
                          <div>
                            <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg inline-flex items-center gap-1 border ${
                              isOverdue
                                ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-300 animate-pulse'
                                : 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300'
                            }`}>
                              📅 {new Date(obs.dueDate).toLocaleDateString('pl-PL')}
                              {isOverdue && ' ⚠️ PRZEKROCZONY'}
                            </span>
                          </div>
                        ) : (
                          <div className="text-slate-400 italic text-[11px]">Brak terminu</div>
                        )}

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExtendingObs(obs)}
                            className="px-2 py-1 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-800 dark:text-amber-300 rounded text-[11px] font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer"
                            title="Przedłuż termin wykonania"
                          >
                            ⏳ Przedłuż
                          </button>

                          {obs.extensions && obs.extensions.length > 0 && (
                            <button
                              onClick={() => toggleExtensions(obs.id)}
                              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded text-[11px] font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Pokaż historię przedłużeń"
                            >
                              📜 {obs.extensions.length}
                            </button>
                          )}
                        </div>

                        {/* Extension details inline card */}
                        {expandedExtensions[obs.id] && obs.extensions && obs.extensions.length > 0 && (
                          <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] max-w-xs space-y-1">
                            <div className="font-bold text-amber-900 dark:text-amber-300">Historia przedłużeń:</div>
                            {obs.extensions.map((ext: any) => (
                              <div key={ext.id} className="border-b border-amber-200/60 dark:border-amber-900/60 pb-1 last:border-0 last:pb-0">
                                <div><strong className="text-amber-700 dark:text-amber-400">{new Date(ext.newDueDate).toLocaleDateString('pl-PL')}</strong> ({ext.requestedBy})</div>
                                <div className="italic text-slate-600 dark:text-slate-400">"{ext.reason}"</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Icon Actions Column */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Toggle Fix Form Icon Button */}
                          <button
                            onClick={() => {
                              if (isFixing) {
                                setActiveTask(null);
                              } else {
                                setActiveTask(obs.id);
                                setOperatorName('');
                                setOperatorComment('');
                                setFixPhotoUrl(null);
                              }
                            }}
                            className={`p-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                              isFixing
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                : 'bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                            }`}
                            title={isFixing ? 'Zamknij formularz naprawy' : 'Oznacz jako naprawione (otwórz formularz realizacji)'}
                          >
                            ✅
                          </button>

                          {/* Access History Icon Button */}
                          <button
                            onClick={() => setHistoryTarget({ id: obs.id, title: obs.aiSuggestion || obs.description })}
                            className="p-2 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer"
                            title="Zobacz osoby, które zapoznały się z tym zadaniem"
                          >
                            👥
                          </button>

                          {/* Convert to Kaizen Icon Button */}
                          <button
                            onClick={() => router.push(`/kaizen/nowy?title=${encodeURIComponent('Kaizen z audytu: ' + (obs.aiSuggestion || obs.description))}&description=${encodeURIComponent(obs.description)}`)}
                            className="p-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs font-bold transition-all border border-amber-200 dark:border-amber-800/60 cursor-pointer"
                            title="Przekształć to zadanie w wniosek Kaizen"
                          >
                            💡
                          </button>

                          {/* Admin Delete Icon Button */}
                          {isAdmin && (
                            <button
                              onClick={() => handleDelete(obs.id)}
                              className="p-2 bg-red-50 dark:bg-red-950/60 hover:bg-red-100 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold transition-all border border-red-200 dark:border-red-800/60 cursor-pointer"
                              title="Usuń zadanie produkcyjne"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

      {historyTarget && (
        <DocumentAccessHistoryModal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          entityType="TASK"
          entityId={historyTarget.id}
          entityTitle={historyTarget.title}
        />
      )}
    </div>
  );
}

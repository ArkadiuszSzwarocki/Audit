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
import { TaskDetailModal } from '@/components/ui/TaskDetailModal';

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
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
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
    fetchUsers(false);
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const assignedParam = params.get('assigned');
      if (assignedParam) {
        setFilterAssigned(assignedParam);
      }
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
      if (filterAssigned === 'UNASSIGNED') {
        if (obs.assignedToId || obs.assignedTo) return false;
      } else if (filterAssigned === 'MY_TASKS') {
        if (!user) return false;
        const cleanUserName = (user.name || '').trim().toLowerCase();
        const cleanUserLogin = (user.login || '').trim().toLowerCase();
        const obsAssigneeId = obs.assignedToId || obs.assignedTo?.id;
        const obsAssigneeName = (obs.assignedTo?.name || '').trim().toLowerCase();
        const obsAssigneeLogin = (obs.assignedTo?.login || '').trim().toLowerCase();

        const isAdminAccount = isAdmin || user.role === 'ADMIN' || cleanUserName.includes('admin') || cleanUserLogin.includes('admin');
        const isObsAssigneeAdmin = obsAssigneeName.includes('admin') || obsAssigneeLogin.includes('admin');

        const isMatch =
          (user.id && obsAssigneeId === user.id) ||
          (cleanUserName && obsAssigneeName === cleanUserName) ||
          (cleanUserLogin && obsAssigneeLogin === cleanUserLogin) ||
          (cleanUserName.length > 2 && obsAssigneeName && (obsAssigneeName.includes(cleanUserName) || cleanUserName.includes(obsAssigneeName))) ||
          (cleanUserLogin.length > 2 && obsAssigneeLogin && (obsAssigneeLogin.includes(cleanUserLogin) || cleanUserLogin.includes(obsAssigneeLogin))) ||
          (isAdminAccount && isObsAssigneeAdmin);

        if (!isMatch) return false;
      } else {
        const targetUser = users.find((u) => u.id === filterAssigned);
        const obsAssigneeId = obs.assignedToId || obs.assignedTo?.id;
        const obsAssigneeName = (obs.assignedTo?.name || '').trim().toLowerCase();
        const obsAssigneeLogin = (obs.assignedTo?.login || '').trim().toLowerCase();

        const isMatch =
          obsAssigneeId === filterAssigned ||
          (targetUser && targetUser.name && obsAssigneeName === targetUser.name.trim().toLowerCase()) ||
          (targetUser && targetUser.login && obsAssigneeLogin === targetUser.login.trim().toLowerCase());

        if (!isMatch) return false;
      }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <span className="text-2xl">📋</span>
            </div>
            <div>
              <div className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{totalCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">Otwarte Zadania</div>
            </div>
          </div>
          <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-red-200 dark:bg-red-900/60 flex items-center justify-center shrink-0">
              <span className="text-2xl">🔴</span>
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
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 px-5 py-4 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shrink-0">
              <span className="text-2xl">🟢</span>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{minorCount}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mt-1">Drobne / Mało Istotne</div>
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
                  <th className="p-3 text-center w-10">#</th>
                  <th className="p-3 w-28">Ważność</th>
                  <th className="p-3">Treść Zadania</th>
                  <th className="p-3 w-48 whitespace-nowrap">👤 Przypisany Pracownik</th>
                  <th className="p-3 whitespace-nowrap w-32">Termin</th>
                  <th className="p-3 text-center w-10">
                    <span title="Kliknij wiersz, aby otworzyć szczegóły">ℹ️</span>
                  </th>
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
                      onClick={() => router.push(`/zadania/${obs.id}`)}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${
                        normSev === 'CRITICAL' ? 'bg-red-50/30 dark:bg-red-950/20' : ''
                      } ${activeTask === obs.id ? 'bg-emerald-50/40 dark:bg-emerald-950/30' : ''}`}
                    >
                      {/* # */}
                      <td className="p-3 text-center font-bold text-xs text-slate-400">{idx + 1}</td>

                      {/* Severity */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md border ${sevStyle.cls}`}>
                          {sevStyle.icon} {displayLabel}
                        </span>
                      </td>

                      {/* Title */}
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2">
                          {obs.aiSuggestion || obs.description}
                        </div>
                        {obs.audit?.area && (
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            📍 {obs.audit.area.name}{obs.audit.machine ? ` · ⚙️ ${obs.audit.machine.name}` : ''}
                          </div>
                        )}
                      </td>

                      {/* Assignment Selector */}
                      <td className="p-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={obs.assignedToId || obs.assignedTo?.id || ''}
                          onChange={(e) => handleAssign(obs.id, e.target.value)}
                          className="w-full px-2.5 py-1 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-xs"
                        >
                          <option value="">⚪ Nieprzypisane</option>
                          {users.map((u: any) => (
                            <option key={u.id} value={u.id}>
                              👤 {u.name} ({u.role})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Due date */}
                      <td className="p-3 whitespace-nowrap text-xs">
                        {obs.dueDate ? (
                          <span className={`px-2 py-0.5 font-bold rounded-md border text-[10px] ${
                            isOverdue
                              ? 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-300'
                              : 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300'
                          }`}>
                            📅 {new Date(obs.dueDate).toLocaleDateString('pl-PL')}
                            {isOverdue && ' ⚠️'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Brak</span>
                        )}
                      </td>

                      {/* Arrow indicator */}
                      <td className="p-3 text-center text-slate-300 dark:text-slate-700 text-xs">›</td>
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

      <TaskDetailModal
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onViewHistory={(t) => {
          setHistoryTarget({ id: t.id, title: (t as any).aiSuggestion || t.description });
        }}
        onStartFix={(id) => {
          setActiveTask(id);
          setOperatorName('');
          setOperatorComment('');
          setFixPhotoUrl(null);
        }}
        onExtend={(t) => setExtendingObs(t)}
        isAdmin={isAdmin}
        onDelete={handleDelete}
        onConvertKaizen={(t) => {
          const obs = t as any;
          router.push(`/kaizen/nowy?title=${encodeURIComponent('Kaizen z audytu: ' + (obs.aiSuggestion || obs.description))}&description=${encodeURIComponent(obs.description)}`);
        }}
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

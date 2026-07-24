'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { getRemainingCalendarDays } from '@/utils/bhpDateUtils';

interface UserTrainingType {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
}

interface UserTraining {
  id: string;
  userId: string;
  trainingTypeId: string;
  dueDate?: string | null;
  notes?: string | null;
  trainingType: UserTrainingType;
}

interface EmployeeUser {
  id: string;
  login: string;
  name: string;
  email?: string | null;
  role: string;
  bhpTrainingDueDate?: string | null;
  trainings: UserTraining[];
}

export default function EmployeeTrainingsPage() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { showToast, showConfirm } = useToast();

  const [trainingTypes, setTrainingTypes] = useState<UserTrainingType[]>([]);
  const [users, setUsers] = useState<EmployeeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Add New Column Modal State
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');
  const [isSubmittingType, setIsSubmittingType] = useState(false);

  // Edit Single Training Date Modal State
  const [editingCell, setEditingCell] = useState<{
    user: EmployeeUser;
    type: UserTrainingType;
    currentDueDate: string | null;
  } | null>(null);
  const [editDueDateValue, setEditDueDateValue] = useState('');
  const [isSavingDate, setIsSavingDate] = useState(false);

  // My Personal Trainings Modal State
  const [showMyTrainingsModal, setShowMyTrainingsModal] = useState(false);
  const [myTrainings, setMyTrainings] = useState<any[]>([]);
  const [loadingMyTrainings, setLoadingMyTrainings] = useState(false);

  const userRoleUpper = String(user?.role || '').toUpperCase();

  // ONLY ADMIN and ZARZĄD see all employees in the plant!
  const canSeeAllEmployees =
    isAdmin ||
    userRoleUpper === 'ZARZAD' ||
    userRoleUpper === 'ZARZĄD' ||
    userRoleUpper.includes('BOARD');

  const isAuthorizedManager =
    canSeeAllEmployees ||
    userRoleUpper.includes('KONTROLA') ||
    userRoleUpper.includes('JAKOSC') ||
    userRoleUpper.includes('AUDYT') ||
    userRoleUpper.includes('BHP');

  useEffect(() => {
    if (!authLoading) {
      fetchTrainingsData();
    }
  }, [authLoading]);

  const fetchTrainingsData = async () => {
    try {
      const res = await fetch('/api/user-trainings');
      if (!res.ok) throw new Error('Nie udało się pobrać danych szkoleń i badań');
      const data = await res.json();
      setTrainingTypes(data.trainingTypes || []);
      setUsers(data.users || []);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Błąd wczytywania bazy szkoleń', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyPersonalTrainings = async () => {
    setLoadingMyTrainings(true);
    try {
      const res = await fetch('/api/user-profile/trainings');
      if (!res.ok) throw new Error('Nie udało się pobrać danych Twoich szkoleń');
      const data = await res.json();
      setMyTrainings(data.trainings || []);
      setShowMyTrainingsModal(true);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingMyTrainings(false);
    }
  };

  const handleCreateTrainingType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    setIsSubmittingType(true);
    try {
      const res = await fetch('/api/user-trainings/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTypeName.trim(),
          description: newTypeDescription.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się dodać kolumny szkolenia');

      showToast(`✨ Utworzono nową kolumnę szkoleń: "${newTypeName.trim()}"`, 'success');
      setShowAddTypeModal(false);
      setNewTypeName('');
      setNewTypeDescription('');
      fetchTrainingsData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmittingType(false);
    }
  };

  const handleDeleteTrainingType = (typeId: string, typeName: string) => {
    showConfirm({
      title: 'Usuwanie Kolumny Szkolenia / Badań',
      message: `Czy na pewno chcesz usunąć kolumnę "${typeName}" z systemu? Wszystkie wprowadzone daty dla tej kolumny zostaną usunięte.`,
      confirmText: 'Usuń kolumnę',
      isDanger: true,
      onConfirm: async () => {
        const res = await fetch(`/api/user-trainings/types?id=${typeId}`, {
          method: 'DELETE',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Nie udało się usunąć kolumny');
        showToast(`Usunięto kolumnę "${typeName}"`, 'success');
        fetchTrainingsData();
      },
    });
  };

  const handleOpenEditDate = (u: EmployeeUser, type: UserTrainingType, currentDueDate?: string | null) => {
    if (!isAuthorizedManager) return;
    setEditingCell({
      user: u,
      type,
      currentDueDate: currentDueDate || null,
    });
    setEditDueDateValue(currentDueDate ? currentDueDate.split('T')[0] : '');
  };

  const handleSaveDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCell) return;

    setIsSavingDate(true);
    try {
      const res = await fetch('/api/user-trainings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingCell.user.id,
          trainingTypeId: editingCell.type.id,
          dueDate: editDueDateValue ? editDueDateValue : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Nie udało się zapisać daty szkolenia');

      showToast(`Zaktualizowano termin "${editingCell.type.name}" dla ${editingCell.user.name}`, 'success');
      setEditingCell(null);
      fetchTrainingsData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsSavingDate(false);
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        u.name.toLowerCase().includes(q) ||
        u.login.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    });
  }, [users, searchQuery]);

  // Overall Statistics
  const stats = useMemo(() => {
    let expired = 0;
    let expiringSoon = 0;
    let valid = 0;

    users.forEach((u) => {
      trainingTypes.forEach((type) => {
        let assigned = u.trainings.find((t) => t.trainingTypeId === type.id);
        let dueDate = assigned?.dueDate;

        if (!dueDate && (type.isDefault || type.name === 'Szkolenie BHP') && u.bhpTrainingDueDate) {
          dueDate = u.bhpTrainingDueDate;
        }

        if (dueDate) {
          const days = getRemainingCalendarDays(dueDate);
          if (days <= 0) expired++;
          else if (days <= 30) expiringSoon++;
          else valid++;
        }
      });
    });

    return { expired, expiringSoon, valid };
  }, [users, trainingTypes]);

  const renderRoleBadge = (roleName: string) => {
    const r = roleName.toUpperCase();
    if (r === 'ZARZAD' || r === 'ZARZĄD' || r === 'BOARD') {
      return <span className="px-2.5 py-0.5 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-extrabold text-[11px] rounded-full">👑 Zarząd</span>;
    }
    if (r === 'ADMIN' || r === 'ADMINISTRATOR') {
      return <span className="px-2.5 py-0.5 bg-purple-500/15 text-purple-600 dark:text-purple-400 font-extrabold text-[11px] rounded-full">⚡ Admin</span>;
    }
    if (r.includes('KONTROLA') || r.includes('JAKOSC') || r.includes('AUDYT')) {
      return <span className="px-2.5 py-0.5 bg-blue-500/15 text-blue-600 dark:text-blue-400 font-extrabold text-[11px] rounded-full">🛡️ Kontrola Jakości</span>;
    }
    return <span className="px-2.5 py-0.5 bg-slate-500/10 text-slate-700 dark:text-slate-300 font-semibold text-[11px] rounded-full">🛠️ {roleName}</span>;
  };

  const renderCellStatusBadge = (dueDateInput?: string | null, isClickable: boolean = true) => {
    if (!dueDateInput) {
      return (
        <span className={`inline-flex items-center gap-1 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 ${isClickable ? 'hover:border-brand-500 hover:text-brand-500 cursor-pointer' : ''}`}>
          + Wyznacz datę
        </span>
      );
    }

    const days = getRemainingCalendarDays(dueDateInput);
    const dateFormatted = new Date(dueDateInput).toLocaleDateString('pl-PL');

    if (days <= 0) {
      return (
        <span className={`inline-flex flex-col items-center px-3 py-1.5 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 rounded-xl font-extrabold text-xs animate-pulse ${isClickable ? 'cursor-pointer hover:scale-105' : ''}`}>
          <span>🚨 Minął termin ({days} dni)</span>
          <span className="text-[10px] opacity-80">{dateFormatted}</span>
        </span>
      );
    }

    if (days <= 30) {
      return (
        <span className={`inline-flex flex-col items-center px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 rounded-xl font-bold text-xs ${isClickable ? 'cursor-pointer hover:scale-105' : ''}`}>
          <span>⏳ Pozostało: {days} dni</span>
          <span className="text-[10px] opacity-80">{dateFormatted}</span>
        </span>
      );
    }

    return (
      <span className={`inline-flex flex-col items-center px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold text-xs ${isClickable ? 'cursor-pointer hover:scale-105' : ''}`}>
        <span>✅ Ważne ({days} dni)</span>
        <span className="text-[10px] opacity-80">{dateFormatted}</span>
      </span>
    );
  };

  if (authLoading || loading) {
    return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Ładowanie ewidencji szkoleń i badań...</div>;
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🦺</span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {canSeeAllEmployees
                ? 'Szkolenia i Badania Okresowe Pracowników'
                : `Moje Szkolenia i Badania Okresowe (${user?.name})`}
            </h1>
          </div>
          <p className="text-slate-400 text-sm max-w-3xl">
            {canSeeAllEmployees
              ? 'Centrum nadzoru nad ważnością szkoleń BHP, badań lekarskich oraz uprawnień zawodowych w zakładzie.'
              : 'Podgląd terminów ważności Twoich szkoleń BHP, badań lekarskich oraz posiadanych certyfikatów.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={fetchMyPersonalTrainings}
            disabled={loadingMyTrainings}
            className="px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-2xl text-xs font-extrabold transition-all shadow-lg flex items-center gap-2 cursor-pointer min-h-[44px] touch-manipulation"
          >
            <span>👤</span>
            <span>{loadingMyTrainings ? 'Wczytywanie...' : 'Szczegóły Moich Certyfikatów'}</span>
          </button>

          {canSeeAllEmployees && (
            <button
              onClick={() => setShowAddTypeModal(true)}
              className="px-5 py-3 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl text-xs font-extrabold transition-all shadow-lg flex items-center gap-2 cursor-pointer min-h-[44px] touch-manipulation"
            >
              <span>➕</span>
              <span>Dodaj Kolumnę Szkoleń / Badań</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-red-500/30 rounded-2xl p-4 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400 font-black flex items-center justify-center text-xl">
            🚨
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.expired}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Minął termin ważności
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-amber-500/30 rounded-2xl p-4 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 font-black flex items-center justify-center text-xl">
            ⏳
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.expiringSoon}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Wygasa w ciągu 30 dni
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 shadow-md flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-xl">
            ✅
          </div>
          <div>
            <div className="text-2xl font-black text-slate-900 dark:text-slate-100">{stats.valid}</div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Aktualne szkolenia i badania
            </div>
          </div>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj pracownika po imieniu, nazwisku lub roli..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 font-bold p-1"
            >
              ✕
            </button>
          )}
        </div>

        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 px-2">
          {isAuthorizedManager
            ? '💡 Kliknij dowolną komórkę w tabeli, aby wyznaczyć lub zaktualizować datę ważności.'
            : '🔒 Podgląd Twoich osobistych terminów ważności szkoleń i badań.'}
        </div>
      </div>

      {/* Main Full-Width Matrix Table */}
      <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs uppercase tracking-wider font-extrabold">
                <th className="py-4 px-6 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 shadow-sm min-w-[220px]">
                  Pracownik
                </th>
                <th className="py-4 px-4 min-w-[130px]">Rola</th>
                {trainingTypes.map((type) => (
                  <th key={type.id} className="py-4 px-4 text-center min-w-[200px]">
                    <div className="flex items-center justify-center gap-1.5">
                      <span>{type.isDefault ? '🦺' : '📜'}</span>
                      <span className="font-extrabold text-slate-900 dark:text-slate-100">{type.name}</span>
                      {type.isDefault && <span className="text-[10px] text-amber-500 font-bold">(Domyślne)</span>}
                      {isAuthorizedManager && !type.isDefault && (
                        <button
                          onClick={() => handleDeleteTrainingType(type.id, type.name)}
                          className="ml-1 text-slate-400 hover:text-red-500 transition-colors p-1 rounded-md"
                          title="Usuń tę kolumnę"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-sm">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={2 + trainingTypes.length} className="py-12 text-center text-slate-400 font-medium">
                    Nie znaleziono pracowników w bazie.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    {/* Employee Name */}
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 z-10 shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 font-extrabold flex items-center justify-center text-xs border border-brand-500/20">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="block">{u.name}</span>
                          <span className="text-[11px] font-mono text-slate-400 font-normal">@{u.login}</span>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-4 px-4">{renderRoleBadge(u.role)}</td>

                    {/* Training Matrix Cells */}
                    {trainingTypes.map((type) => {
                      let assigned = u.trainings.find((t) => t.trainingTypeId === type.id);
                      let dueDate = assigned?.dueDate;

                      // Fallback for default BHP
                      if (!dueDate && (type.isDefault || type.name === 'Szkolenie BHP') && u.bhpTrainingDueDate) {
                        dueDate = u.bhpTrainingDueDate;
                      }

                      return (
                        <td
                          key={type.id}
                          className="py-4 px-4 text-center"
                          onClick={() => handleOpenEditDate(u, type, dueDate)}
                        >
                          {renderCellStatusBadge(dueDate, isAuthorizedManager)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add New Training Column */}
      {showAddTypeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-brand-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>➕</span> Dodaj Kolumnę Szkolenia / Badań
              </h3>
              <button
                onClick={() => setShowAddTypeModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrainingType} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Nazwa Szkolenia lub Badań *
                </label>
                <input
                  type="text"
                  required
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  placeholder="np. Badania Lekarskie Okresowe, UDT Wózki, HACCP..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Opis / Wymagania (Opcjonalnie)
                </label>
                <textarea
                  rows={2}
                  value={newTypeDescription}
                  onChange={(e) => setNewTypeDescription(e.target.value)}
                  placeholder="np. Wymagane co 2 lata dla operatorów wózków widłowych"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs font-medium focus:ring-2 focus:ring-brand-500 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTypeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingType || !newTypeName.trim()}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingType ? 'Tworzenie...' : '➕ Dodaj Kolumnę'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Date for Specific Cell */}
      {editingCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-3 border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Wyznacz / Zaktualizuj Datę Ważności
                </h3>
                <p className="text-xs text-brand-600 dark:text-brand-400 font-bold">
                  {editingCell.type.name} dla: {editingCell.user.name}
                </p>
              </div>
              <button
                onClick={() => setEditingCell(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Data Ważności Szkolenia / Badań *
                </label>
                <input
                  type="date"
                  value={editDueDateValue}
                  onChange={(e) => setEditDueDateValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCell(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSavingDate}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {isSavingDate ? 'Zapisywanie...' : 'Zapisz Datę'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: My Personal Trainings (Available to all users) */}
      {showMyTrainingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b pb-4 border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👤</span>
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    Moje Szkolenia i Badania Okresowe
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Zalogowany jako: <strong className="text-slate-800 dark:text-slate-200">{user?.name}</strong> ({user?.login})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMyTrainingsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold text-lg p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {myTrainings.length === 0 ? (
                <p className="text-center py-6 text-slate-400 text-xs font-medium">
                  Brak przypisanych dat szkoleń lub badań.
                </p>
              ) : (
                myTrainings.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{item.isDefault ? '🦺' : '📜'}</span>
                        <span>{item.typeName}</span>
                      </div>
                      {item.typeDescription && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.typeDescription}</p>
                      )}
                    </div>

                    <div>
                      {renderCellStatusBadge(item.dueDate, false)}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowMyTrainingsModal(false)}
                className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-extrabold text-xs shadow-md cursor-pointer"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

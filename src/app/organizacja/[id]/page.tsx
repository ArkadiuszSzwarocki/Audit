'use client';

import React, { useEffect, useState, useMemo, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { useUsers } from '@/hooks/useUsers';

interface DepartmentTreeData {
  boardUsers: Array<{ id: string; name: string; login: string; role: string; email?: string }>;
  ancestors: Array<{ id: string; name: string; description?: string; headUser?: any }>;
  department: {
    id: string;
    name: string;
    description?: string;
    shiftMode: number;
    parentDepartmentId?: string;
    parentDepartment?: { id: string; name: string };
    head?: { id: string; name: string; login: string; role: string; email?: string };
    headUserId?: string;
    users: Array<{ id: string; name: string; login: string; role: string; email?: string }>;
    childDepartments: Array<{
      id: string;
      name: string;
      description?: string;
      shiftMode: number;
      head?: any;
      users?: any[];
      machinesCount?: number;
    }>;
    machines: Array<{ id: string; name: string; description?: string }>;
  };
}

export default function DepartmentTreePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const { showToast, showConfirm } = useToast();
  const { users: allUsers, fetchUsers } = useUsers();

  const canManageStructure = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    return ['ADMIN', 'ADMINISTRATOR', 'ZARZAD', 'ZARZĄD', 'BOARD', 'KIEROWNIK', 'MANAGER', 'DYREKTOR', 'DIRECTOR'].includes(role);
  }, [user]);

  const [data, setData] = useState<DepartmentTreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Target Department for Assignment Modal
  const [targetDeptId, setTargetDeptId] = useState<string>(id);
  const [targetDeptName, setTargetDeptName] = useState<string>('');

  // Mode in Assign Modal: 'PICK_EXISTING' vs 'CREATE_NEW'
  const [assignMode, setAssignMode] = useState<'PICK_EXISTING' | 'CREATE_NEW'>('PICK_EXISTING');

  // Add Sub-department form state
  const [subName, setSubName] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subShiftMode, setSubShiftMode] = useState(3);
  const [subSubmitting, setSubSubmitting] = useState(false);

  // Assign existing form state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('OPERATOR');
  const [isHead, setIsHead] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);

  // Create new user & assign form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserLogin, setNewUserLogin] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');

  const fetchTreeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/organization/${id}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error('Departament nie został znaleziony.');
        throw new Error('Nie udało się pobrać drzewa zarządzania.');
      }
      const json = await res.json();
      setData(json);
      setTargetDeptName(json.department?.name || '');
    } catch (err: any) {
      setError(err.message || 'Błąd ładowania danych');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && id) {
      fetchTreeData();
      fetchUsers();
    }
  }, [user, id]);

  const openAssignModalForSection = (deptId: string, deptName: string) => {
    if (!canManageStructure) {
      showToast('Opcja wyłączona w trybie podglądu (Operator)', 'error');
      return;
    }
    setTargetDeptId(deptId);
    setTargetDeptName(deptName);
    setSelectedUserId('');
    setSelectedRole('OPERATOR');
    setIsHead(false);
    setAssignMode('PICK_EXISTING');
    setShowAssignModal(true);
  };

  const handleCreateSubPath = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStructure) {
      showToast('Brak uprawnień. Operatorzy posiadają dostęp wyłącznie do podglądu.', 'error');
      return;
    }

    if (!subName.trim()) {
      showToast('Wpisz nazwę nowej pod-ścieżki/działu', 'error');
      return;
    }

    setSubSubmitting(true);
    try {
      const res = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-department',
          data: {
            name: subName.trim(),
            description: subDesc.trim() || undefined,
            shiftMode: Number(subShiftMode),
            parentDepartmentId: id,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Nie udało się utworzyć pod-ścieżki');

      showToast(`🌿 Nowa pod-ścieżka "${subName.trim()}" została dodana!`, 'success');
      setShowAddSubModal(false);
      setSubName('');
      setSubDesc('');
      await fetchTreeData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubSubmitting(false);
    }
  };

  const handleAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStructure) {
      showToast('Brak uprawnień. Operatorzy posiadają dostęp wyłącznie do podglądu.', 'error');
      return;
    }

    if (!selectedUserId) {
      showToast('Wybierz pracownika z listy', 'error');
      return;
    }

    setAssignSubmitting(true);
    try {
      const res = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign-employee',
          data: {
            departmentId: targetDeptId,
            userId: selectedUserId,
            roleName: selectedRole,
            isHead,
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Nie udało się przypisać pracownika');

      showToast('👤 Pracownik został pomyślnie przypisany do ścieżki!', 'success');
      setShowAssignModal(false);
      await fetchTreeData();
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleCreateNewUserAndAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageStructure) {
      showToast('Brak uprawnień. Operatorzy posiadają dostęp wyłącznie do podglądu.', 'error');
      return;
    }

    if (!newUserName.trim() || !newUserLogin.trim() || !newUserPassword.trim()) {
      showToast('Wypełnij imię, login i hasło dla nowego pracownika', 'error');
      return;
    }

    setAssignSubmitting(true);
    try {
      const resUser = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName.trim(),
          login: newUserLogin.trim(),
          password: newUserPassword.trim(),
          role: selectedRole,
        }),
      });

      const jsonUser = await resUser.json();
      if (!resUser.ok) throw new Error(jsonUser.error || 'Nie udało się zarejestrować nowego pracownika');

      const createdUserId = jsonUser.id;

      const resAssign = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign-employee',
          data: {
            departmentId: targetDeptId,
            userId: createdUserId,
            roleName: selectedRole,
            isHead,
          },
        }),
      });

      const jsonAssign = await resAssign.json();
      if (!resAssign.ok) throw new Error(jsonAssign.error || 'Utworzono pracownika, ale błąd przy przypisywaniu');

      showToast(`👤 Nowy pracownik "${newUserName.trim()}" zarejestrowany i przypisany!`, 'success');
      setShowAssignModal(false);
      setNewUserName('');
      setNewUserLogin('');
      setNewUserPassword('');
      await fetchTreeData();
      await fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleUnassignEmployee = async (userId: string, userName: string) => {
    if (!canManageStructure) {
      showToast('Opcja wyłączona w trybie podglądu (Operator)', 'error');
      return;
    }

    showConfirm({
      title: 'Odpięcie pracownika ze ścieżki',
      message: `Czy na pewno chcesz odpiąć pracownika "${userName}" ze ścieżki "${data?.department.name}"?`,
      confirmText: 'Odepnij pracownika',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/organization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'unassign-employee',
              data: { userId },
            }),
          });
          if (!res.ok) throw new Error('Nie udało się odpiąć pracownika');
          showToast('Pracownik został odpięty ze ścieżki', 'success');
          await fetchTreeData();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  const handleDeleteSubDept = async (subId: string, subName: string) => {
    if (!canManageStructure) {
      showToast('Opcja wyłączona w trybie podglądu (Operator)', 'error');
      return;
    }

    showConfirm({
      title: 'Usuwanie Pod-ścieżki',
      message: `Czy na pewno chcesz usunąć pod-ścieżkę "${subName}"?`,
      confirmText: 'Usuń pod-ścieżkę',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/organization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete-department',
              data: { departmentId: subId },
            }),
          });
          if (!res.ok) throw new Error('Nie udało się usunąć pod-ścieżki');
          showToast('Pod-ścieżka została usunięta', 'success');
          await fetchTreeData();
        } catch (err: any) {
          showToast(err.message, 'error');
        }
      },
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-300 font-bold">
        Zaloguj się, aby zobaczyć drzewo zarządzania.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
        <div className="text-slate-400 font-extrabold text-sm animate-pulse">Ładowanie drzewa zarządzania...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <span className="text-5xl">⚠️</span>
          <h2 className="text-xl font-black text-slate-100">Błąd ładowania ścieżki</h2>
          <p className="text-slate-400 text-xs">{error || 'Brak danych dla podanego identyfikatora'}</p>
          <button
            onClick={() => router.push('/organizacja')}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold rounded-2xl text-xs transition-all cursor-pointer"
          >
            ← Powrót do Drzewa Organizacji
          </button>
        </div>
      </div>
    );
  }

  const { boardUsers, ancestors, department } = data;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-8 space-y-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Pasek nawigacyjny i powrót */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <button onClick={() => router.push('/organizacja')} className="hover:text-brand-400 transition-colors">
                🏢 Organizacja
              </button>
              <span>/</span>
              <span>Pionowe Drzewo Zarządzania</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
              <span>🏭</span> {department.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/organizacja')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold rounded-2xl text-xs transition-all cursor-pointer border border-slate-700"
            >
              ← Powrót do Listy
            </button>
            {canManageStructure && (
              <>
                <button
                  onClick={() => setShowAddSubModal(true)}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg cursor-pointer"
                >
                  ➕ Dodaj Pod-Ścieżkę
                </button>
                <button
                  onClick={() => openAssignModalForSection(department.id, department.name)}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg cursor-pointer"
                >
                  👤 Przypisz Pracownika
                </button>
              </>
            )}
          </div>
        </div>

        {/* Baner informacyjny dla Operatora (Tryb Read-Only) */}
        {!canManageStructure && (
          <div className="p-4 bg-slate-900 border border-blue-500/40 rounded-2xl text-xs text-blue-200 font-semibold flex items-center gap-3 w-full">
            <span className="text-xl">ℹ️</span>
            <div>
              <strong>Tryb Podglądu Ścieżki Zarządzania (Read-Only):</strong> Jesteś zalogowany jako Operator. Posiadasz pełny podgląd pionu zarządczego, kierowników i przydzielonych zespołów. Modyfikacja składu osobowego i dodawanie pod-ścieżek jest zarezerwowane dla Kierowników i Administratorów.
            </div>
          </div>
        )}

        {/* VERTIKALNE DRZEWO ZARZĄDZANIA (Od Zarządu do Operatora) */}
        <div className="space-y-6 flex flex-col items-center">
          
          {/* TIER 1: 👑 ZARZĄD & DYREKCJA GŁÓWNA */}
          <div className="w-full max-w-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-amber-950/60 border border-amber-500/40 rounded-3xl p-6 shadow-2xl space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 px-4 py-1 bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase rounded-bl-2xl border-l border-b border-amber-500/30">
              Szczyt Hierarchii Fabryki
            </div>
            <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">👑</span>
                <div>
                  <h3 className="text-lg font-black text-amber-400">Zarząd & Dyrekcja Naczelna</h3>
                  <p className="text-slate-400 text-xs font-semibold">Nadrzędny poziom decyzyjny fabryki</p>
                </div>
              </div>
              {canManageStructure && (
                <button
                  onClick={() => openAssignModalForSection(department.id, 'Zarząd & Dyrekcja')}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  + Przypisz do Zarządu
                </button>
              )}
            </div>

            {boardUsers.length === 0 ? (
              <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs text-slate-400 italic">
                Brak przypisanych członków zarządu w bazie danych.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {boardUsers.map(b => (
                  <div key={b.id} className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                    <div>
                      <div className="font-extrabold text-amber-200 text-xs">👤 {b.name}</div>
                      <div className="text-[10px] text-slate-400 font-medium">({b.login})</div>
                    </div>
                    <span className="text-amber-400 text-xs font-bold px-2 py-0.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      {['ZARZAD', 'Zarząd', 'ZARZĄD', 'BOARD'].includes(b.role.toUpperCase())
                        ? '👑 Zarząd'
                        : ['DIRECTOR', 'DYREKTOR'].includes(b.role.toUpperCase())
                        ? '⭐ Dyrekcja'
                        : `👔 ${b.role}`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Łącznik w dół */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-8 bg-gradient-to-b from-amber-500 to-brand-500"></div>
            <div className="text-brand-400 text-sm">↓</div>
          </div>

          {/* TIER 2: 🏢 ANCESTORS / NADRZĘDNE DZIAŁY */}
          {ancestors.map((anc) => (
            <React.Fragment key={anc.id}>
              <div className="w-full max-w-2xl bg-slate-900 border border-brand-500/40 rounded-3xl p-5 shadow-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🏢</span>
                    <div>
                      <h4 className="text-base font-black text-brand-300">Poziom Nadrzędny: {anc.name}</h4>
                      <p className="text-xs text-slate-400">{anc.description || 'Departament nadrzędny w strukturze'}</p>
                    </div>
                  </div>
                  {canManageStructure && (
                    <button
                      onClick={() => openAssignModalForSection(anc.id, anc.name)}
                      className="px-3 py-1 bg-brand-950 hover:bg-brand-900 text-brand-300 border border-brand-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      + Przypisz do {anc.name}
                    </button>
                  )}
                </div>
                {anc.headUser && (
                  <div className="p-2.5 bg-brand-950/40 border border-brand-800 rounded-xl text-xs text-brand-200 font-bold flex items-center gap-2">
                    <span>👑 Dyrektor / Kierownik Nadrzędny:</span>
                    <span>{anc.headUser.name} ({anc.headUser.login})</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col items-center">
                <div className="w-0.5 h-8 bg-brand-500"></div>
                <div className="text-brand-400 text-sm">↓</div>
              </div>
            </React.Fragment>
          ))}

          {/* TIER 3: 🏭 WYBRANY DZIAŁ (TARGET DEPARTMENT - np. Hala Produkcyjna) */}
          <div className="w-full max-w-2xl bg-gradient-to-br from-brand-950/80 via-slate-900 to-slate-900 border-2 border-brand-500 rounded-3xl p-7 shadow-2xl space-y-4 relative">
            <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-600 text-white text-xs font-black uppercase rounded-bl-2xl shadow-lg">
              Wybrany Dział
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>🏭</span> {department.name}
                </h2>
                {department.description && (
                  <p className="text-slate-300 text-xs mt-1">{department.description}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {department.shiftMode === 1 ? (
                  <span className="px-3 py-1 bg-blue-950 text-blue-300 border border-blue-800 font-extrabold rounded-xl text-xs">
                    📋 1 zmiana
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-950 text-amber-300 border border-amber-800 font-extrabold rounded-xl text-xs">
                    🏭 Tryb 3-zmianowy
                  </span>
                )}
                {canManageStructure && (
                  <button
                    onClick={() => openAssignModalForSection(department.id, department.name)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                  >
                    + Przypisz Pracownika
                  </button>
                )}
              </div>
            </div>

            {/* Kierownik Hali/Działu */}
            <div className="p-4 bg-slate-900/90 border border-amber-500/40 rounded-2xl space-y-1">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider">👑 Kierownik Działu / Hali</div>
              {department.head ? (
                <div className="flex items-center justify-between">
                  <div className="font-black text-white text-sm">
                    {department.head.name} <span className="text-slate-400 font-normal">({department.head.login})</span>
                  </div>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/30">
                    Kierownik Bezpośredni
                  </span>
                </div>
              ) : (
                <div className="text-red-400 text-xs font-semibold">❌ Brak wyznaczonego kierownika dla tego działu</div>
              )}
            </div>

            {/* Przypisane maszyny */}
            {department.machines && department.machines.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">⚙️ Maszyny i Rejony w Dziale</div>
                <div className="flex flex-wrap gap-2">
                  {department.machines.map(m => (
                    <span key={m.id} className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold">
                      ⚙️ {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Łącznik w dół do pod-ścieżek i pracowników */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-8 bg-emerald-500"></div>
            <div className="text-emerald-400 text-sm">↓</div>
          </div>

          {/* TIER 4: 🌿 PODRZĘDNE LINIE / SEKCJE / POD-ŚCIEŻKI */}
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-emerald-400 flex items-center gap-2">
                <span>🌿</span> Pod-Ścieżki i Sekcje w tym Dziale ({department.childDepartments.length})
              </h3>
              {canManageStructure && (
                <button
                  onClick={() => setShowAddSubModal(true)}
                  className="px-3 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  + Nowa Pod-Ścieżka
                </button>
              )}
            </div>

            {department.childDepartments.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Brak pod-ścieżek (np. Linii 1, Linii 2, Sekcji).
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {department.childDepartments.map(child => (
                  <div
                    key={child.id}
                    className="p-4 bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded-2xl transition-all space-y-2 group shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        onClick={() => router.push(`/organizacja/${child.id}`)}
                        className="font-extrabold text-white group-hover:text-emerald-400 cursor-pointer transition-colors text-sm"
                      >
                        🌿 {child.name}
                      </span>
                      {canManageStructure && (
                        <button
                          onClick={() => openAssignModalForSection(child.id, child.name)}
                          className="px-2 py-0.5 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 rounded-lg text-[10px] font-bold cursor-pointer"
                          title="Przypisz pracownika bezpośrednio do tej pod-ścieżki"
                        >
                          + Przypisz
                        </button>
                      )}
                    </div>

                    <div className="text-[11px] text-slate-400">
                      {child.head ? `👑 ${child.head.name}` : 'Brak kierownika'}
                    </div>

                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold">
                        👥 {child.users ? child.users.length : 0} osób
                      </span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded font-bold">
                        ⚙️ {child.machinesCount || 0} maszyn
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Łącznik w dół */}
          <div className="flex flex-col items-center">
            <div className="w-0.5 h-8 bg-blue-500"></div>
            <div className="text-blue-400 text-sm">↓</div>
          </div>

          {/* TIER 5: 👥 PRZYPISANE STANOWISKA & PRACOWNICY (DB USERS) */}
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-blue-400 flex items-center gap-2">
                <span>👥</span> Pracownicy i Stanowiska w tym Dziale ({department.users.length})
              </h3>
              {canManageStructure && (
                <button
                  onClick={() => openAssignModalForSection(department.id, department.name)}
                  className="px-3 py-1 bg-blue-950 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  + Przypisz Pracownika
                </button>
              )}
            </div>

            {department.users.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                Brak przypisanych pracowników w tej sekcji.
              </p>
            ) : (
              <div className="space-y-2">
                {department.users.map(u => (
                  <div key={u.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">👤</span>
                      <div>
                        <div className="font-extrabold text-white text-xs sm:text-sm">{u.name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>Login: {u.login}</span>
                          <span className="px-2 py-0.5 bg-blue-950 text-blue-300 font-bold rounded text-[10px] border border-blue-800">
                            Stanowisko: {u.role}
                          </span>
                        </div>
                      </div>
                    </div>

                    {canManageStructure && (
                      <button
                        onClick={() => handleUnassignEmployee(u.id, u.name)}
                        className="px-2.5 py-1 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-xl transition-all text-xs font-bold border border-transparent hover:border-red-900 cursor-pointer"
                        title="Odepnij pracownika ze ścieżki"
                      >
                        ✕ Odepnij
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MODAL: DODAWANIE POD-ŚCIEŻKI / DZIAŁU */}
        {showAddSubModal && canManageStructure && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <form onSubmit={handleCreateSubPath} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>🌿</span> Nowa Pod-Ścieżka / Sekcja
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-brand-950/40 border border-brand-800 rounded-2xl text-xs text-brand-300 font-semibold">
                Tworzysz pod-ścieżkę w dziale: <strong>{department.name}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Nazwa Pod-Ścieżki *</label>
                <input
                  type="text"
                  value={subName}
                  onChange={e => setSubName(e.target.value)}
                  placeholder="np. Linia 1, Gniazdo Montażu, Sekcja Jakości"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-brand-500 text-sm"
                  disabled={subSubmitting}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">Opis (opcjonalnie)</label>
                <textarea
                  value={subDesc}
                  onChange={e => setSubDesc(e.target.value)}
                  placeholder="Opis sekcji lub linii..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl font-bold text-white outline-none focus:border-brand-500 text-sm"
                  disabled={subSubmitting}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubModal(false)}
                  className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 text-xs"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={subSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
                >
                  {subSubmitting ? 'Zapisywanie...' : 'Utwórz Pod-Ścieżkę'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* MODAL: PRZYPISYWANIE Z PRZYPISANIEM ROLI / TWORZENIE PRACY */}
        {showAssignModal && canManageStructure && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>👤</span> Przypisanie Pracownika do Ścieżki
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-blue-950/40 border border-blue-800 rounded-2xl text-xs text-blue-300 font-semibold">
                Wybrana Ścieżka Docelowa: <strong>{targetDeptName}</strong>
              </div>

              {/* Wybór Trybu: Przypisz Istniejącego vs Zarejestruj Nowego */}
              <div className="flex p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAssignMode('PICK_EXISTING')}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    assignMode === 'PICK_EXISTING'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>📋</span> Wybierz z Bazy ({allUsers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAssignMode('CREATE_NEW')}
                  className={`flex-1 py-2 rounded-xl transition-all ${
                    assignMode === 'CREATE_NEW'
                      ? 'bg-brand-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>➕</span> Zarejestruj Nowego
                </button>
              </div>

              {assignMode === 'PICK_EXISTING' ? (
                <form onSubmit={handleAssignUser} className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Pracownik z Bazy *</label>
                    <select
                      value={selectedUserId}
                      onChange={e => setSelectedUserId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-semibold text-sm"
                      required
                    >
                      <option value="">-- Wybierz pracownika z bazy danych --</option>
                      {allUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          👤 {u.name} ({u.login}) - {u.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Rola / Rola na Ścieżce</label>
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-semibold text-sm"
                    >
                      <option value="OPERATOR">🛠️ Operator Produkcji</option>
                      <option value="BRYGADZISTA">👥 Brygadzista / Lider Zespołu</option>
                      <option value="KIEROWNIK">👑 Kierownik Działu / Hali</option>
                      <option value="DYREKTOR">⭐ Dyrektor Pionowy</option>
                      <option value="ZARZAD">👑 Członek Zarządu</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-300">
                    <input
                      type="checkbox"
                      id="isHeadCheck"
                      checked={isHead}
                      onChange={e => setIsHead(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="isHeadCheck" className="cursor-pointer text-xs font-bold">
                      👑 Wyznacz jako GŁÓWNEGO KIEROWNIKA tej ścieżki
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 text-xs"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={assignSubmitting}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {assignSubmitting ? 'Przypisywanie...' : 'Przypisz Pracownika'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateNewUserAndAssign} className="space-y-4 text-xs font-bold">
                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Imię i Nazwisko *</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={e => setNewUserName(e.target.value)}
                      placeholder="np. Piotr Nowak"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 text-sm font-semibold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-slate-400 uppercase tracking-wider mb-1">Login (Nick) *</label>
                      <input
                        type="text"
                        value={newUserLogin}
                        onChange={e => setNewUserLogin(e.target.value)}
                        placeholder="piotr.nowak"
                        autoComplete="off"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 text-xs font-mono"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 uppercase tracking-wider mb-1">Hasło *</label>
                      <input
                        type="password"
                        value={newUserPassword}
                        onChange={e => setNewUserPassword(e.target.value)}
                        placeholder="Wpisz hasło"
                        autoComplete="new-password"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 text-xs font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 uppercase tracking-wider mb-1">Rola w Systemie</label>
                    <select
                      value={selectedRole}
                      onChange={e => setSelectedRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white outline-none focus:border-brand-500 font-semibold text-sm"
                    >
                      <option value="OPERATOR">🛠️ Operator Produkcji</option>
                      <option value="BRYGADZISTA">👥 Brygadzista / Lider Zespołu</option>
                      <option value="KIEROWNIK">👑 Kierownik Działu / Hali</option>
                      <option value="DYREKTOR">⭐ Dyrektor Pionowy</option>
                      <option value="ZARZAD">👑 Członek Zarządu</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-amber-300">
                    <input
                      type="checkbox"
                      id="isHeadCheckNew"
                      checked={isHead}
                      onChange={e => setIsHead(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
                    />
                    <label htmlFor="isHeadCheckNew" className="cursor-pointer text-xs font-bold">
                      👑 Wyznacz jako GŁÓWNEGO KIEROWNIKA tej ścieżki
                    </label>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAssignModal(false)}
                      className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl font-bold hover:bg-slate-700 text-xs"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      disabled={assignSubmitting}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {assignSubmitting ? 'Rejestrowanie...' : 'Zarejestruj i Przypisz'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

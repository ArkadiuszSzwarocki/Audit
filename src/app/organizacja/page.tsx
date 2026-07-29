'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { DepartmentTree } from '@/components/organization/DepartmentTree';
import { CreateDepartmentForm } from '@/components/organization/CreateDepartmentForm';
import { EmployeeAssignmentForm } from '@/components/organization/EmployeeAssignmentForm';
import { CreatePositionForm } from '@/components/organization/CreatePositionForm';
import { useToast } from '@/context/ToastContext';
import { Department } from '@/hooks/useOrganization';

export default function OrganizacjaPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { fetchStructure, fetchPositions, structure, positions, loading, error } = useOrganization();
  const { showToast, showConfirm } = useToast();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  const canManageStructure = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    return ['ADMIN', 'ADMINISTRATOR', 'ZARZAD', 'ZARZĄD', 'BOARD', 'KIEROWNIK', 'MANAGER', 'DYREKTOR', 'DIRECTOR'].includes(role);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchStructure();
      fetchPositions();
    }
  }, [user]);

  // Keep selected department synchronized with latest structure data
  useEffect(() => {
    if (selectedDepartment && structure.length > 0) {
      const findInTree = (list: Department[], id: string): Department | null => {
        for (const item of list) {
          if (item.id === id) return item;
          if (item.childDepartments && item.childDepartments.length > 0) {
            const found = findInTree(item.childDepartments, id);
            if (found) return found;
          }
        }
        return null;
      };
      const updated = findInTree(structure, selectedDepartment.id);
      if (updated) {
        setSelectedDepartment(updated);
      }
    }
  }, [structure]);

  const handleUnassignUser = async (userId: string, userName: string) => {
    if (!canManageStructure) {
      showToast('Opcja wyłączona w trybie podglądu (Operator)', 'error');
      return;
    }

    showConfirm({
      title: 'Odpięcie pracownika z departamentu',
      message: `Czy na pewno chcesz odpiąć użytkownika "${userName}" z departamentu "${selectedDepartment?.name}"?`,
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
          if (res.ok) {
            showToast('✅ Pracownik został odpięty', 'success');
            await fetchStructure();
          } else {
            showToast('❌ Błąd podczas odpisywania pracownika', 'error');
          }
        } catch (err) {
          showToast('❌ Błąd sieciowe podczas odpisywania', 'error');
        }
      },
    });
  };

  const handleDeleteDepartment = async (deptId: string, deptName: string) => {
    if (!canManageStructure) {
      showToast('Opcja wyłączona w trybie podglądu (Operator)', 'error');
      return;
    }

    showConfirm({
      title: 'Usuwanie Departamentu',
      message: `Czy na pewno chcesz usunąć departament "${deptName}"? Pracownicy przypisani do niego zostaną bez przypisanego działu.`,
      confirmText: 'Usuń departament',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await fetch('/api/organization', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'delete-department',
              data: { departmentId: deptId },
            }),
          });
          if (res.ok) {
            showToast('✅ Departament usunięty', 'success');
            setSelectedDepartment(null);
            await fetchStructure();
          } else {
            showToast('❌ Nie udało się usunąć departamentu', 'error');
          }
        } catch (err) {
          showToast('❌ Błąd podczas usuwania', 'error');
        }
      },
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-950">
        <div className="text-center text-slate-600 dark:text-slate-400 text-lg font-bold">
          Zaloguj się, aby przeglądać strukturę organizacyjną fabryki.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Nagłówek */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>🏢</span> Drzewo Organizacyjne Fabryki
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-semibold mt-1">
              Struktura działów fabrycznych, wyznaczeni kierownicy i przypisani pracownicy
            </p>
          </div>
        </div>

        {/* Baner informacyjny dla Operatora (Tryb Read-Only) */}
        {!canManageStructure && (
          <div className="p-4 bg-blue-50 dark:bg-slate-800/80 border border-blue-200 dark:border-slate-700 rounded-2xl text-xs text-blue-900 dark:text-blue-200 font-semibold flex items-center gap-3">
            <span className="text-xl">ℹ️</span>
            <div>
              <strong>Tryb Podglądu Struktury Organizacyjnej (Read-Only):</strong> Jesteś zalogowany jako pracownik/operator. Posiadasz pełen wgląd w drzewo działów fabryki oraz przydzielonych kierowników. Modyfikacja struktury jest zastrzeżona dla Kierowników i Administratorów.
            </div>
          </div>
        )}

        {/* Layout: Drzewo + Szczegóły */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lewa kolumna - Drzewo departamentów */}
          <div className="lg:col-span-2">
            <DepartmentTree
              structure={structure}
              loading={loading}
              error={error}
              onSelectDepartment={setSelectedDepartment}
            />
          </div>

          {/* Prawa kolumna - Szczegóły i akcje */}
          <div className="space-y-6">
            {/* Tworzenie departamentu (Tylko dla Kierowników/Admina) */}
            {canManageStructure && (
              <CreateDepartmentForm
                parentDepartmentId={selectedDepartment?.id}
                onDepartmentCreated={() => {
                  fetchStructure();
                }}
              />
            )}

            {/* Szczegóły wybranego departamentu */}
            {selectedDepartment && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                    <span>📋</span> Szczegóły Departamentu
                  </h3>
                  {canManageStructure && (
                    <button
                      onClick={() => handleDeleteDepartment(selectedDepartment.id, selectedDepartment.name)}
                      className="px-2.5 py-1 text-xs font-extrabold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-all cursor-pointer border border-red-200 dark:border-red-900"
                    >
                      🗑️ Usuń Dział
                    </button>
                  )}
                </div>

                <button
                  onClick={() => router.push(`/organizacja/${selectedDepartment.id}`)}
                  className="w-full py-2.5 px-4 bg-brand-600 hover:bg-brand-500 text-white font-black rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>🌳 Otwórz Ścieżkę Zarządzania (od Zarządu do Operatorów) →</span>
                </button>

                <div className="space-y-3 text-sm">
                  <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nazwa Działu</div>
                    <div className="font-extrabold text-slate-800 dark:text-slate-100 text-base">{selectedDepartment.name}</div>
                  </div>

                  {selectedDepartment.description && (
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Opis</div>
                      <div className="text-slate-600 dark:text-slate-300 font-medium">{selectedDepartment.description}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tryb pracy</div>
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedDepartment.shiftMode === 1 ? '📋 1 zmiana (Administracja)' : `🏭 ${selectedDepartment.shiftMode}-zmianowy (Produkcja)`}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kierownik Działu</div>
                      <div className="font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedDepartment.head ? (
                          <span className="text-amber-700 dark:text-amber-400">👑 {selectedDepartment.head.name} ({selectedDepartment.head.login})</span>
                        ) : (
                          <span className="text-red-500 font-semibold">❌ Brak kierownika</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedDepartment.parentDepartment && (
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Departament nadrzędny</div>
                      <div className="font-bold text-brand-600 dark:text-brand-400">↑ {selectedDepartment.parentDepartment.name}</div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      👥 Przypisani Pracownicy w Bazie ({selectedDepartment.users ? selectedDepartment.users.length : 0})
                    </div>

                    {!selectedDepartment.users || selectedDepartment.users.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Brak przypisanych pracowników w dziale.</p>
                    ) : (
                      <ul className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {selectedDepartment.users.map(u => (
                          <li key={u.id} className="flex items-center justify-between text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div>
                              <span className="font-bold text-slate-800 dark:text-slate-100">👤 {u.name}</span>
                              <span className="ml-1.5 text-slate-400 font-medium">({u.login})</span>
                              {u.role && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 rounded font-bold text-[10px]">{u.role}</span>}
                            </div>
                            {canManageStructure && (
                              <button
                                onClick={() => handleUnassignUser(u.id, u.name)}
                                className="text-slate-400 hover:text-red-500 font-bold px-1.5 py-0.5 rounded cursor-pointer"
                                title="Odepnij pracownika"
                              >
                                ✕
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Przypisanie Pracownika z Bazy (Tylko dla Kierowników/Admina) */}
            {canManageStructure && (
              <EmployeeAssignmentForm
                selectedDepartment={selectedDepartment || undefined}
                onAssignmentComplete={() => {
                  fetchStructure();
                }}
              />
            )}

            {/* Tworzenie Stanowiska (Tylko dla Kierowników/Admina) */}
            {canManageStructure && (
              <CreatePositionForm
                onPositionCreated={() => {
                  fetchPositions();
                }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

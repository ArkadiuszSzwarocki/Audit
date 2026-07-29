'use client';

import { useState, useEffect } from 'react';
import { useOrganization, Department, Position } from '@/hooks/useOrganization';
import { useToast } from '@/context/ToastContext';
import { useUsers } from '@/hooks/useUsers';

interface EmployeeAssignmentFormProps {
  selectedDepartment?: Department;
  onAssignmentComplete?: () => void;
}

export function EmployeeAssignmentForm({
  selectedDepartment,
  onAssignmentComplete
}: EmployeeAssignmentFormProps) {
  const { showToast } = useToast();
  const { users: allUsers, fetchUsers } = useUsers();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    roleName: '',
    isHead: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchUsers();
        const posRes = await fetch('/api/organization?action=positions');
        if (posRes.ok) {
          const posData = await posRes.json();
          setPositions(posData);
        }
      } catch (error) {
        console.error('Błąd wczytywania danych:', error);
      }
    };

    loadData();
  }, [fetchUsers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.userId) {
      showToast('Wybierz pracownika z bazy danych', 'error');
      return;
    }

    if (!selectedDepartment) {
      showToast('Wybierz departament z listy lub drzewa', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/organization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign-employee',
          data: {
            userId: formData.userId,
            departmentId: selectedDepartment.id,
            roleName: formData.roleName || undefined,
            isHead: formData.isHead,
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Błąd przypisania pracownika');
      }

      showToast('✅ Pracownik przypisany do departamentu!', 'success');
      setFormData({
        userId: '',
        roleName: '',
        isHead: false,
      });

      if (onAssignmentComplete) {
        onAssignmentComplete();
      }
    } catch (error: any) {
      showToast(`❌ ${error.message || 'Błąd przypisania pracownika'}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>👤</span> Przypisz Pracownika z Bazy
        </h3>
        {selectedDepartment && (
          <span className="text-xs px-2.5 py-1 bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-bold rounded-lg border border-brand-200 dark:border-brand-800">
            📍 {selectedDepartment.name}
          </span>
        )}
      </div>

      {!selectedDepartment ? (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-300 font-bold">
          ⚠️ Wybierz departament z drzewa organizacyjnego po lewej stronie
        </div>
      ) : (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs text-blue-800 dark:text-blue-300 font-semibold">
          Wybrano departament: <strong>{selectedDepartment.name}</strong> ({selectedDepartment.shiftMode === 1 ? '1 zmiana' : '3-zmianowy'})
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Wybierz Pracownika z Bazy Danych *
        </label>
        <select
          value={formData.userId}
          onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm cursor-pointer"
          disabled={loading || !selectedDepartment}
        >
          <option value="">-- Wybierz zarejestrowanego pracownika --</option>
          {allUsers.map(u => (
            <option key={u.id} value={u.id}>
              👤 {u.name} ({u.login}) — Rola: {u.role}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
          Stanowisko / Rola w Departamentie (opcjonalnie)
        </label>
        <select
          value={formData.roleName}
          onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 outline-none text-sm cursor-pointer"
          disabled={loading || !selectedDepartment}
        >
          <option value="">-- Pozostaw dotychczasową rolę --</option>
          <option value="OPERATOR">⚙️ Operator Maszyny / Produkcji</option>
          <option value="KIEROWNIK">👑 Kierownik Działu / Lider Zmiany</option>
          <option value="ZARZAD">👑 Członek Zarządu (Zarząd)</option>
          <option value="DIRECTOR">⭐ Dyrektor Pionu / Działu</option>
          <option value="ADMIN">⚡ Administrator</option>
          {positions.map(p => (
            <option key={p.id} value={p.name}>
              👔 {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer p-2.5 bg-amber-50/50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800">
          <input
            type="checkbox"
            checked={formData.isHead}
            onChange={(e) => setFormData(prev => ({ ...prev, isHead: e.target.checked }))}
            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
            disabled={loading || !selectedDepartment}
          />
          <span>👑 Wyznacz ten konto jako Główny Kierownik Departamentu</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !selectedDepartment}
        className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-extrabold rounded-2xl shadow-lg transition-all text-sm cursor-pointer"
      >
        {loading ? 'Przypisywanie...' : '✅ Przypisz Pracownika do Departamentu'}
      </button>
    </form>
  );
}

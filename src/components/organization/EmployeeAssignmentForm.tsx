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
  const { assignEmployeeToDepartment } = useOrganization();
  const { showToast } = useToast();
  const { users: allUsers, fetchUsers } = useUsers();
  const [managers, setManagers] = useState<any[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    managerId: '',
    positionId: '',
    shiftMode: 1
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        // Pobierz użytkowników
        await fetchUsers();

        // Pobierz stanowiska
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
      showToast('Wybierz pracownika', 'error');
      return;
    }

    if (!selectedDepartment) {
      showToast('Wybierz departament', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await assignEmployeeToDepartment({
        userId: formData.userId,
        departmentId: selectedDepartment.id,
        managerId: formData.managerId || undefined,
        positionId: formData.positionId || undefined,
        shiftMode: formData.shiftMode
      });

      if (result.success) {
        showToast('✅ Pracownik przypisany!', 'success');
        setFormData({
          userId: '',
          managerId: '',
          positionId: '',
          shiftMode: selectedDepartment.shiftMode || 1
        });
        if (onAssignmentComplete) {
          onAssignmentComplete();
        }
      } else {
        showToast(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('❌ Błąd przypisania pracownika', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">👤 Przypisz Pracownika</h3>

      {!selectedDepartment && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
          ⚠️ Najpierw wybierz departament z listy
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Pracownik *</label>
        <select
          value={formData.userId}
          onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={loading || !selectedDepartment}
        >
          <option value="">-- Wybierz pracownika --</option>
          {allUsers.map(user => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.login})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Stanowisko (opcjonalnie)</label>
        <select
          value={formData.positionId}
          onChange={(e) => setFormData(prev => ({ ...prev, positionId: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={loading || !selectedDepartment}
        >
          <option value="">-- Wybierz stanowisko --</option>
          {positions.map(pos => (
            <option key={pos.id} value={pos.id}>
              {pos.name} (Poziom {pos.level})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Kierownik (opcjonalnie)</label>
        <select
          value={formData.managerId}
          onChange={(e) => setFormData(prev => ({ ...prev, managerId: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={loading || !selectedDepartment}
        >
          <option value="">-- Wybierz kierownika --</option>
          {allUsers
            .filter(m => m.id !== formData.userId)
            .map(manager => (
              <option key={manager.id} value={manager.id}>
                {manager.name} ({manager.login})
              </option>
            ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Tryb zmian</label>
        <select
          value={formData.shiftMode}
          onChange={(e) => setFormData(prev => ({ ...prev, shiftMode: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={loading || !selectedDepartment}
        >
          <option value={1}>📋 1 zmiana (Administracja)</option>
          <option value={3}>🏭 3 zmianowy (Produkcja)</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading || !selectedDepartment}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-semibold"
      >
        {loading ? 'Przypisywanie...' : 'Przypisz Pracownika'}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useOrganization, Department } from '@/hooks/useOrganization';
import { useToast } from '@/context/ToastContext';

interface CreateDepartmentFormProps {
  parentDepartmentId?: string;
  onDepartmentCreated?: (department: Department) => void;
}

export function CreateDepartmentForm({
  parentDepartmentId,
  onDepartmentCreated
}: CreateDepartmentFormProps) {
  const { createDepartment } = useOrganization();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shiftMode: 3
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Wpisz nazwę departamentu', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await createDepartment({
        name: formData.name.trim(),
        description: formData.description || undefined,
        shiftMode: formData.shiftMode,
        parentDepartmentId
      });

      if (result.success) {
        showToast('✅ Departament utworzony!', 'success');
        setFormData({ name: '', description: '', shiftMode: 3 });
        if (onDepartmentCreated) {
          onDepartmentCreated(result.department);
        }
      } else {
        showToast(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('❌ Błąd tworzenia departamentu', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">➕ Nowy Departament</h3>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nazwa *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="np. Dział Produkcji"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Opis (opcjonalnie)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="np. Odpowiada za produkcję..."
          rows={3}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Tryb zmian</label>
        <select
          value={formData.shiftMode}
          onChange={(e) => setFormData(prev => ({ ...prev, shiftMode: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          <option value={1}>📋 Administracja (1 zmiana)</option>
          <option value={3}>🏭 Produkcja/Magazyn (3 zmianowy)</option>
        </select>
      </div>

      {parentDepartmentId && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          ℹ️ Departament będzie podrzędny względem wybranego
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold"
      >
        {loading ? 'Tworzenie...' : 'Utwórz Departament'}
      </button>
    </form>
  );
}

'use client';

import { useState } from 'react';
import { useOrganization, Position } from '@/hooks/useOrganization';
import { useToast } from '@/context/ToastContext';

interface CreatePositionFormProps {
  onPositionCreated?: (position: Position) => void;
}

export function CreatePositionForm({ onPositionCreated }: CreatePositionFormProps) {
  const { createPosition } = useOrganization();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    level: 1,
    permissions: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Wpisz nazw\u0119 stanowiska', 'error');
      return;
    }

    if (formData.level < 1 || formData.level > 10) {
      showToast('Poziom musi by\u0107 od 1 do 10', 'error');
      return;
    }

    setLoading(true);
    try {
      const result = await createPosition({
        name: formData.name.trim(),
        description: formData.description || undefined,
        level: formData.level,
        permissions: formData.permissions || undefined
      });

      if (result.success) {
        showToast('✅ Stanowisko utworzone!', 'success');
        setFormData({
          name: '',
          description: '',
          level: 1,
          permissions: ''
        });
        if (onPositionCreated) {
          onPositionCreated(result.position);
        }
      } else {
        showToast(`❌ ${result.error}`, 'error');
      }
    } catch (error) {
      showToast('❌ B\u0142\u0105d tworzenia stanowiska', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-900">👔 Nowe Stanowisko</h3>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nazwa stanowiska *</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="np. Dyrektor, Manager, Operator"
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Poziom hierarchii *</label>
        <select
          value={formData.level}
          onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        >
          {Array.from({ length: 10 }, (_, i) => i + 1).map(level => (
            <option key={level} value={level}>
              {level === 1 ? '👑 Poziom 1 (Najwy\u017cszy)' : `Poziom ${level}`}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">1 = Dyrektor/Zarząd, 5-10 = Pracownik operacyjny</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Opis (opcjonalnie)</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="np. Odpowiada za całą produkcję..."
          rows={2}
          disabled={loading}
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">Uprawnienia (opcjonalnie)</label>
        <input
          type="text"
          value={formData.permissions}
          onChange={(e) => setFormData(prev => ({ ...prev, permissions: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          placeholder="np. APPROVE_LEAVE, MANAGE_EMPLOYEES"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-semibold"
      >
        {loading ? 'Tworzenie...' : 'Utwórz Stanowisko'}
      </button>
    </form>
  );
}

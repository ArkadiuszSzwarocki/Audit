'use client';

import React, { useState } from 'react';
import { useOrganization, Department } from '@/hooks/useOrganization';

interface DepartmentTreeProps {
  onSelectDepartment?: (department: Department) => void;
}

export function DepartmentTree({ onSelectDepartment }: DepartmentTreeProps) {
  const { structure, loading, error } = useOrganization();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelect = (department: Department) => {
    setSelectedId(department.id);
    if (onSelectDepartment) {
      onSelectDepartment(department);
    }
  };

  const renderDepartment = (dept: Department, level: number = 0): React.JSX.Element => {
    const hasChildren = dept.childDepartments && dept.childDepartments.length > 0;
    const isExpanded = expandedIds.has(dept.id);
    const isSelected = selectedId === dept.id;

    return (
      <div key={dept.id} className="relative">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg cursor-pointer transition-colors ${
            isSelected ? 'bg-blue-100 border-l-4 border-blue-600' : 'hover:bg-gray-100'
          }`}
          style={{ marginLeft: `${level * 20}px` }}
          onClick={() => handleSelect(dept)}
        >
          {hasChildren && (
            <button
              className="flex-shrink-0 w-5 h-5 flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(dept.id);
              }}
            >
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
          {!hasChildren && <div className="w-5" />}

          <div className="flex-1">
            <div className="font-semibold text-gray-900">{dept.name}</div>
            <div className="text-xs text-gray-500">
              {dept.head ? `👤 ${dept.head.name}` : '❌ Brak kierownika'}
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs">
            {dept.shiftMode === 1 ? (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">1 zmiana</span>
            ) : (
              <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">{dept.shiftMode} zmianowy</span>
            )}
            {dept.users && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">{dept.users.length} osób</span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l border-gray-300" style={{ marginLeft: `${level * 20 + 10}px` }}>
            {dept.childDepartments!.map(child => renderDepartment(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-4 text-gray-500">Wczytywanie struktury...</div>;
  }

  if (error) {
    return <div className="text-center py-4 text-red-500">❌ {error}</div>;
  }

  if (structure.length === 0) {
    return <div className="text-center py-4 text-gray-500">Brak departamentów. Utwórz pierwszy!</div>;
  }

  return (
    <div className="space-y-1 bg-white rounded-lg shadow p-4">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">📊 Struktura Organizacyjna</h3>
      </div>
      <div className="space-y-1">
        {structure.map(dept => renderDepartment(dept))}
      </div>
    </div>
  );
}

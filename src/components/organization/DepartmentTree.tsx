'use client';

import React, { useState } from 'react';
import { useOrganization, Department } from '@/hooks/useOrganization';

interface DepartmentTreeProps {
  structure?: Department[];
  loading?: boolean;
  error?: string | null;
  onSelectDepartment?: (department: Department) => void;
}

export function DepartmentTree({
  structure: propStructure,
  loading: propLoading,
  error: propError,
  onSelectDepartment
}: DepartmentTreeProps) {
  const hookOrg = useOrganization();
  const structure = propStructure !== undefined ? propStructure : hookOrg.structure;
  const loading = propLoading !== undefined ? propLoading : hookOrg.loading;
  const error = propError !== undefined ? propError : hookOrg.error;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Auto-expand all top-level departments on first render
  React.useEffect(() => {
    if (structure && structure.length > 0) {
      setExpandedIds(new Set(structure.map(d => d.id)));
    }
  }, [structure]);

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
      <div key={dept.id} className="relative my-1">
        <div
          className={`flex items-center justify-between gap-3 py-2.5 px-3.5 rounded-xl cursor-pointer transition-all ${
            isSelected
              ? 'bg-brand-50/80 dark:bg-brand-950/40 border-l-4 border-brand-600 shadow-sm'
              : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-slate-100 dark:border-slate-800'
          }`}
          style={{ marginLeft: `${level * 16}px` }}
          onClick={() => handleSelect(dept)}
        >
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {hasChildren ? (
              <button
                type="button"
                className="flex-shrink-0 w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(dept.id);
                }}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <span className="w-6 flex justify-center text-slate-400 text-xs">🏢</span>
            )}

            <div className="truncate">
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <span>{dept.name}</span>
                {dept.parentDepartment && (
                  <span className="text-[10px] text-slate-400 font-normal">
                    (pod: {dept.parentDepartment.name})
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                {dept.head ? (
                  <span className="text-amber-700 dark:text-amber-400 font-semibold">
                    👑 Kierownik: {dept.head.name} ({dept.head.login})
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Brak wyznaczonego kierownika</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs flex-shrink-0">
            {dept.shiftMode === 1 ? (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold rounded-lg text-[11px] border border-blue-200 dark:border-blue-800">
                📋 1 zmiana
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-bold rounded-lg text-[11px] border border-amber-200 dark:border-amber-800">
                🏭 3-zmianowy
              </span>
            )}
            <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold rounded-lg text-[11px]">
              👥 {dept.users ? dept.users.length : 0} osób
            </span>
            <a
              href={`/organizacja/${dept.id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-0.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-lg text-[11px] transition-colors shadow-sm"
              title="Otwórz Dedykowaną Ścieżkę Zarządzania od Zarządu do Operatora"
            >
              🌳 Ścieżka →
            </a>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="border-l-2 border-slate-200 dark:border-slate-800 ml-3 pl-2 mt-1 space-y-1">
            {dept.childDepartments!.map(child => renderDepartment(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <div className="text-center py-8 text-slate-500 animate-pulse font-medium">Wczytywanie struktury fabrycznej...</div>;
  }

  if (error) {
    return <div className="text-center py-6 text-red-500 font-semibold">❌ {error}</div>;
  }

  if (!structure || structure.length === 0) {
    return (
      <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-6">
        <span className="text-4xl">🏭</span>
        <h4 className="text-slate-700 dark:text-slate-300 font-bold mt-2">Brak departamentów w fabryce</h4>
        <p className="text-slate-500 text-xs mt-1">Utwórz pierwszy departament w formularzu po prawej stronie, aby zbudować drzewo organizacyjne.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl p-5 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>🏭</span> Drzewo Organizacyjne Fabryki
        </h3>
        <span className="text-xs text-slate-400 font-bold">Łącznie departamentów: {structure.length}</span>
      </div>
      <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
        {structure.map(dept => renderDepartment(dept))}
      </div>
    </div>
  );
}

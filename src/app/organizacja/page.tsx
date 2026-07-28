'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';
import { DepartmentTree } from '@/components/organization/DepartmentTree';
import { CreateDepartmentForm } from '@/components/organization/CreateDepartmentForm';
import { EmployeeAssignmentForm } from '@/components/organization/EmployeeAssignmentForm';
import { CreatePositionForm } from '@/components/organization/CreatePositionForm';
import { useState as useStateAlias } from 'react';
import { Department } from '@/hooks/useOrganization';

export default function OrganizacjaPage() {
  const { user } = useAuth();
  const { fetchStructure, fetchPositions, structure, positions } = useOrganization();
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);

  useEffect(() => {
    if (user) {
      fetchStructure();
      fetchPositions();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center text-gray-600 text-lg">
          Zaloguj się, aby zarządzać strukturą organizacyjną.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Nagłówek */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🏢 Struktura Organizacyjna
          </h1>
          <p className="text-gray-600">
            Zarządzaj departamentami, stanowiskami i hierarchią kierowników
          </p>
        </div>

        {/* Layout: Drzewo + Szczegóły */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lewa kolumna - Drzewo departamentów */}
          <div className="lg:col-span-2">
            <DepartmentTree onSelectDepartment={setSelectedDepartment} />
          </div>

          {/* Prawa kolumna - Szczegóły i akcje */}
          <div className="space-y-6">
            {/* Tworzenie departamentu */}
            <CreateDepartmentForm
              parentDepartmentId={selectedDepartment?.id}
              onDepartmentCreated={() => {
                fetchStructure();
              }}
            />

            {/* Szczegóły wybranego departamentu */}
            {selectedDepartment && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">📋 Szczegóły Departamentu</h3>

                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Nazwa</div>
                    <div className="font-semibold text-gray-900">{selectedDepartment.name}</div>
                  </div>

                  {selectedDepartment.description && (
                    <div>
                      <div className="text-sm text-gray-600">Opis</div>
                      <div className="text-gray-700">{selectedDepartment.description}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-sm text-gray-600">Tryb zmian</div>
                    <div className="font-semibold text-gray-900">
                      {selectedDepartment.shiftMode === 1 ? '📋 1 zmiana' : `🏭 ${selectedDepartment.shiftMode} zmianowy`}
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-600">Kierownik</div>
                    <div className="font-semibold text-gray-900">
                      {selectedDepartment.head ? (
                        <span>{selectedDepartment.head.name} ({selectedDepartment.head.login})</span>
                      ) : (
                        <span className="text-red-600">❌ Brak kierownika</span>
                      )}
                    </div>
                  </div>

                  {selectedDepartment.parentDepartment && (
                    <div>
                      <div className="text-sm text-gray-600">Departament nadrzędny</div>
                      <div className="font-semibold text-gray-900">↑ {selectedDepartment.parentDepartment.name}</div>
                    </div>
                  )}

                  {selectedDepartment.users && selectedDepartment.users.length > 0 && (
                    <div>
                      <div className="text-sm text-gray-600">Pracownicy ({selectedDepartment.users.length})</div>
                      <ul className="mt-2 space-y-1">
                        {selectedDepartment.users.map(user => (
                          <li key={user.id} className="text-sm px-2 py-1 bg-blue-50 rounded">
                            {user.name} ({user.login})
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stanowiska */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">👔 Stanowiska</h3>
              
              {positions.length === 0 ? (
                <p className="text-gray-500 text-sm">Brak stanowisk. Dodaj pierwsze!</p>
              ) : (
                <ul className="space-y-2">
                  {positions
                    .sort((a, b) => a.level - b.level)
                    .map(pos => (
                      <li key={pos.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="font-semibold text-gray-900">{pos.name}</div>
                          <div className="text-xs text-gray-500">Poziom {pos.level}</div>
                        </div>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            {/* Przypisanie Pracownika */}
            <EmployeeAssignmentForm
              selectedDepartment={selectedDepartment || undefined}
              onAssignmentComplete={() => {
                fetchStructure();
              }}
            />

            {/* Tworzenie Stanowiska */}
            <CreatePositionForm
              onPositionCreated={() => {
                fetchPositions();
              }}
            />
          </div>
        </div>

        {/* Informacje o hierarchii */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold text-gray-900 mb-4">ℹ️ Jak to działa?</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✅ Departamenty mogą być zagnieżdżone (parent-child)</li>
              <li>✅ Każdy departament ma kierownika</li>
              <li>✅ Pracownicy mają przypisanego kierownika</li>
              <li>✅ Urlopy przesyłane są w górę hierarchii</li>
              <li>✅ Każdy poziom ma inny proces zatwierdzania</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-600">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🔗 Łańcuch Zatwierdzania</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-2xl">👤</span>
                <span>Pracownik</span>
              </div>
              <div className="flex justify-center text-gray-400">↓</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <span>Kierownik bezpośredni</span>
              </div>
              <div className="flex justify-center text-gray-400">↓</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                <span>Kierownik Działu</span>
              </div>
              <div className="flex justify-center text-gray-400">↓</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">👑</span>
                <span>Dyrektor/Zarząd</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

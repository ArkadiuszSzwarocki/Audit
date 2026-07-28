'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLeaves } from '@/hooks/useLeaves';
import { useDepartments } from '@/hooks/useDepartments';
import { LeaveCalendar } from '@/components/ui/LeaveCalendar';

export default function UrlopyPage() {
  const { user } = useAuth();
  const { fetchDepartments, departments } = useDepartments();
  const { fetchLeaveRequests, fetchLeaveBalance } = useLeaves();

  const [userDepartmentShiftMode, setUserDepartmentShiftMode] = useState(3);

  useEffect(() => {
    if (user?.id) {
      fetchLeaveRequests(user.id);
      fetchLeaveBalance(user.id);
      fetchDepartments(true);
    }
  }, [user?.id]);

  // Pobierz shiftMode użytkownika
  useEffect(() => {
    const fetchUserDepartment = async () => {
      if (!user?.id) return;

      try {
        const response = await fetch(`/api/user-profile?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.department?.shiftMode) {
            setUserDepartmentShiftMode(data.department.shiftMode);
          }
        }
      } catch (error) {
        console.error('Błąd przy pobieraniu profilu użytkownika:', error);
      }
    };

    fetchUserDepartment();
  }, [user?.id]);

  const handleLeaveRequestCreated = () => {
    if (user?.id) {
      fetchLeaveRequests(user.id);
      fetchLeaveBalance(user.id);
    }
  };

  if (!user) {
    return (
      <div className="p-6 text-center text-gray-600">
        Zaloguj się, aby zobaczyć urlopy i harmonogram.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Nagłówek */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            📅 Urlopy i Czas Pracy
          </h1>
          <p className="text-gray-600">
            Zarządzaj swoimi urlopami i zobacz harmonogram zmian
          </p>
          {userDepartmentShiftMode === 1 ? (
            <div className="mt-2 inline-block px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-sm font-semibold">
              📋 Administracja (1 zmiana)
            </div>
          ) : (
            <div className="mt-2 inline-block px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-sm font-semibold">
              🏭 Produkcja (3 zmianowy)
            </div>
          )}
        </div>

        {/* Główny kalendarz */}
        <div className="mb-8">
          <LeaveCalendar
            userId={user.id}
            departmentShiftMode={userDepartmentShiftMode}
            onLeaveRequestCreated={handleLeaveRequestCreated}
          />
        </div>

        {/* Sekcja informacyjna */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Jak to działa */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
            <h2 className="text-xl font-bold text-gray-900 mb-4">❓ Jak to działa?</h2>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li>✅ Kliknij na dni w kalendarzu, aby wybrać okres urlopu</li>
              <li>✅ Kliknij "Złóż wniosek urlopowy", aby utworzyć wniosek</li>
              <li>✅ Wybierz typ urlopu (zwykły, L4, bezpłatny itp.)</li>
              <li>✅ Twój manager zatwierdzi lub odrzuci wniosek</li>
              <li>✅ Po zatwierdzeniu dni zostaną odjęte z puli</li>
            </ul>
          </div>

          {/* Legenda */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-600">
            <h2 className="text-xl font-bold text-gray-900 mb-4">🎨 Legenda kolorów</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#10b981' }} />
                <span>Zmiana robocza / Urlop zatwierdzony</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#fbbf24' }} />
                <span>Urlop oczekujący na zatwierdzenie</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#ef4444' }} />
                <span>Zwolnienie lekarskie (L4)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#9ca3af' }} />
                <span>Dzień wolny</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

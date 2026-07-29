'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLeaves } from '@/hooks/useLeaves';
import { useDepartments } from '@/hooks/useDepartments';
import { LeaveCalendar } from '@/components/ui/LeaveCalendar';
import { GlobalTeamLeaveCalendar } from '@/components/ui/GlobalTeamLeaveCalendar';
import { LeaveRequestHistory } from '@/components/leave/LeaveRequestHistory';

function UrlopyContent() {
  const { user } = useAuth();
  const { fetchDepartments } = useDepartments();
  const { fetchLeaveRequests, fetchLeaveBalance } = useLeaves();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'TEAM'>(
    tabParam === 'team' ? 'TEAM' : 'PERSONAL'
  );
  const [userDepartmentShiftMode, setUserDepartmentShiftMode] = useState(3);

  useEffect(() => {
    if (tabParam === 'team') {
      setActiveTab('TEAM');
    } else if (tabParam === 'personal') {
      setActiveTab('PERSONAL');
    }
  }, [tabParam]);

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
    // Dispatch custom event to refresh history component
    window.dispatchEvent(new CustomEvent('leave-request-created'));
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
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Nagłówek i Nawigacja Zakładek */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-1 flex items-center gap-2">
              <span>📅</span> Urlopy i Czas Pracy
            </h1>
            <p className="text-gray-600">
              Zarządzaj swoimi urlopami oraz sprawdzaj harmonogram całego zespołu
            </p>
          </div>

          {/* Przełącznik Zakładek (Mój Kalendarz / Grafik Zespołu) */}
          <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-sm border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveTab('PERSONAL')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'PERSONAL'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              📅 Mój Kalendarz & Wnioski
            </button>
            <button
              onClick={() => setActiveTab('TEAM')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                activeTab === 'TEAM'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              🌐 Ogólny Grafik Zespołu (Wszyscy)
            </button>
          </div>
        </div>

        {/* Zakładka 1: Mój Kalendarz & Osobiste Wnioski */}
        {activeTab === 'PERSONAL' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Badgik trybu zmianowego */}
            <div>
              {userDepartmentShiftMode === 1 ? (
                <div className="inline-block px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-xs font-semibold">
                  📋 Administracja (1 zmiana)
                </div>
              ) : (
                <div className="inline-block px-3 py-1 bg-amber-200 text-amber-900 rounded-full text-xs font-semibold">
                  🏭 Produkcja (3 zmianowy)
                </div>
              )}
            </div>

            {/* Główny kalendarz osobisty */}
            <div>
              <LeaveCalendar
                userId={user.id}
                departmentShiftMode={userDepartmentShiftMode}
                onLeaveRequestCreated={handleLeaveRequestCreated}
              />
            </div>

            {/* Historia osobistych wniosków urlopowych */}
            <div>
              <LeaveRequestHistory userId={user.id} />
            </div>

            {/* Sekcja informacyjna */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Jak to działa */}
              <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
                <h2 className="text-xl font-bold text-gray-900 mb-4">❓ Jak to działa?</h2>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li>✅ Kliknij na dni w kalendarzu, aby wybrać okres urlopu</li>
                  <li>✅ Kliknij &quot;Złóż wniosek urlopowy&quot;, aby utworzyć wniosek</li>
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
        )}

        {/* Zakładka 2: Ogólny Grafik Zespołu (Wszyscy Użytkownicy + Moderacja dla Kierownika) */}
        {activeTab === 'TEAM' && (
          <div className="animate-in fade-in duration-300">
            <GlobalTeamLeaveCalendar />
          </div>
        )}
      </div>
    </div>
  );
}

export default function UrlopyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center animate-pulse text-xs text-slate-500">Ładowanie modułu urlopów...</div>}>
      <UrlopyContent />
    </Suspense>
  );
}

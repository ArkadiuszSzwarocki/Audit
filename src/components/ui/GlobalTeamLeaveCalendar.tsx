'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/context/ToastContext';
import { getPolishHolidays, isWeekend as checkIsWeekend } from '@/config/polishHolidays';

interface LeaveUser {
  id: string;
  name: string;
  login: string;
  role: string;
  department?: { id: string; name: string };
}

interface LeaveRequestItem {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  type: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  createdAt: string;
  user?: LeaveUser;
  approver?: { id: string; name: string };
}

const TYPE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  WYPOCZYNKOWY: { label: 'Urlop', bg: 'bg-emerald-500', text: 'text-white' },
  VACATION: { label: 'Urlop', bg: 'bg-emerald-500', text: 'text-white' },
  NA_ZADANIE: { label: 'Żądanie', bg: 'bg-purple-500', text: 'text-white' },
  ON_DEMAND: { label: 'Żądanie', bg: 'bg-purple-500', text: 'text-white' },
  BEZPLATNY: { label: 'Bezpłatny', bg: 'bg-amber-500', text: 'text-white' },
  UNPAID: { label: 'Bezpłatny', bg: 'bg-amber-500', text: 'text-white' },
  CHOROBOWY: { label: 'L4', bg: 'bg-rose-500', text: 'text-white' },
  SICK_LEAVE: { label: 'L4', bg: 'bg-rose-500', text: 'text-white' },
  MACIERZYNSKI: { label: 'Macierzyński', bg: 'bg-pink-500', text: 'text-white' },
  MATERNITY: { label: 'Macierzyński', bg: 'bg-pink-500', text: 'text-white' },
  RODZICIELSKI: { label: 'Rodzicielski', bg: 'bg-rose-600', text: 'text-white' },
  PARENTAL: { label: 'Rodzicielski', bg: 'bg-rose-600', text: 'text-white' },
  OJCOWSKI: { label: 'Ojcowski', bg: 'bg-blue-600', text: 'text-white' },
  PATERNITY: { label: 'Ojcowski', bg: 'bg-blue-600', text: 'text-white' },
  WYCHOAWNCZY: { label: 'Wychowawczy', bg: 'bg-purple-600', text: 'text-white' },
  CHILD_CARE: { label: 'Wychowawczy', bg: 'bg-purple-600', text: 'text-white' },
  OPIEKA_ART188: { label: 'Opieka 188', bg: 'bg-cyan-600', text: 'text-white' },
  CHILD_CARE_ART188: { label: 'Opieka 188', bg: 'bg-cyan-600', text: 'text-white' },
  SILA_WYZSZA: { label: 'Siła Wyższa', bg: 'bg-yellow-600', text: 'text-white' },
  FORCE_MAJEURE: { label: 'Siła Wyższa', bg: 'bg-yellow-600', text: 'text-white' },
  OPIEKUNCZY: { label: 'Opiekuńczy', bg: 'bg-indigo-600', text: 'text-white' },
  CARER_LEAVE: { label: 'Opiekuńczy', bg: 'bg-indigo-600', text: 'text-white' },
  OKOLICZNOSCIOWY: { label: 'Okolicznościowy', bg: 'bg-teal-600', text: 'text-white' },
  SPECIAL: { label: 'Okolicznościowy', bg: 'bg-teal-600', text: 'text-white' },
  SZKOLENIOWY: { label: 'Szkoleniowy', bg: 'bg-sky-600', text: 'text-white' },
  TRAINING: { label: 'Szkoleniowy', bg: 'bg-sky-600', text: 'text-white' },
  KRWIODASTWO: { label: 'Krew/Szpik', bg: 'bg-red-700', text: 'text-white' },
  BLOOD_DONOR: { label: 'Krew/Szpik', bg: 'bg-red-700', text: 'text-white' },
  REHABILITACYJNY: { label: 'Rehabilitacyjny', bg: 'bg-emerald-700', text: 'text-white' },
  REHABILITATION: { label: 'Rehabilitacyjny', bg: 'bg-emerald-700', text: 'text-white' },
};

export function GlobalTeamLeaveCalendar() {
  const { user } = useAuth();
  const { showToast, showConfirm } = useToast();

  const isManagerOrAdmin = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    return [
      'ADMIN',
      'ADMINISTRATOR',
      'ZARZAD',
      'ZARZĄD',
      'BOARD',
      'KIEROWNIK',
      'MANAGER',
      'BRYGADZISTA',
      'LEADER',
    ].includes(role);
  }, [user]);

  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>([]);
  const [allUsers, setAllUsers] = useState<LeaveUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');

  // Stan modala podglądu / moderacji wniosku
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequestItem | null>(null);
  const [isSubmittingAction, setIsSubmittingAction] = useState<boolean>(false);
  const [approverNote, setApproverNote] = useState<string>('');

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [resUrlopy, resUsers] = await Promise.all([
        fetch('/api/urlopy'),
        fetch('/api/leave-balance?action=all'),
      ]);

      if (resUrlopy.ok) {
        const data = await resUrlopy.json();
        setLeaveRequests(Array.isArray(data) ? data : []);
      }

      if (resUsers.ok) {
        const resJson = await resUsers.json();
        const rawList = resJson.data || resJson;
        if (Array.isArray(rawList)) {
          const userList: LeaveUser[] = rawList
            .map((b: any) => b.user)
            .filter((u: any) => u && u.id);
          setAllUsers(userList);
        }
      }
    } catch (err) {
      console.error('Błąd pobierania danych zespołu:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Lista WSZYSTKICH pracowników w firmie (wraz z obecnymi wnioskami)
  const employeesList = useMemo(() => {
    const userMap = new Map<string, LeaveUser>();

    // 1. Dodaj wszystkich użytkowników z systemu
    allUsers.forEach((u) => userMap.set(u.id, u));

    // 2. Dodaj ewentualnych użytkowników z wniosków
    leaveRequests.forEach((req) => {
      if (req.user && !userMap.has(req.user.id)) {
        userMap.set(req.user.id, req.user);
      }
    });

    const list = Array.from(userMap.values());
    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase();
    return list.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.login.toLowerCase().includes(q) ||
        (u.department?.name && u.department.name.toLowerCase().includes(q))
    );
  }, [allUsers, leaveRequests, searchQuery]);

  // Dni widocznego miesiąca
  const daysInMonthList = useMemo(() => {
    const daysCount = new Date(currentYear, currentMonth + 1, 0).getDate();
    const holidays = getPolishHolidays(currentYear);

    const list = [];
    for (let day = 1; day <= daysCount; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isWeekend = checkIsWeekend(date);
      const holidayName = holidays.get(dateStr);
      const dayName = date.toLocaleDateString('pl-PL', { weekday: 'short' });

      list.push({
        dayNumber: day,
        date,
        dateStr,
        dayName,
        isWeekend,
        isHoliday: !!holidayName,
        holidayName,
      });
    }
    return list;
  }, [currentYear, currentMonth]);

  // Znajdź wniosek urlopowy dla pracownika i dnia
  const getLeaveForUserAndDay = (userId: string, dateStr: string) => {
    return leaveRequests.find((req) => {
      if (req.userId !== userId) return false;
      // Odrzucone wnioski (REJECTED) ukrywamy z grafiku ogólnego (chyba że wybrano filtr Odrzucone)
      if (req.status === 'REJECTED' && statusFilter !== 'REJECTED') return false;
      if (statusFilter !== 'ALL' && req.status !== statusFilter) return false;

      const start = req.startDate.split('T')[0];
      const end = req.endDate.split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  // Nawigacja miesiąca
  const navigateMonth = (direction: -1 | 1) => {
    setCurrentMonth((prev) => {
      const next = prev + direction;
      if (next < 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      if (next > 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return next;
    });
  };

  // Zmiana statusu (Zatwierdź / Odrzuć)
  const handleUpdateStatus = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedRequest) return;
    setIsSubmittingAction(true);

    try {
      const response = await fetch(`/api/urlopy/${selectedRequest.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          approverNote: approverNote.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się zmienić statusu');
      }

      showToast(
        status === 'APPROVED' ? 'Wniosek został zatwierdzony!' : 'Wniosek został odrzucony.',
        status === 'APPROVED' ? 'success' : 'info'
      );
      setSelectedRequest(null);
      setApproverNote('');
      fetchAllData();
      window.dispatchEvent(new CustomEvent('leave-request-created'));
    } catch (err: any) {
      showToast(err.message || 'Błąd modyfikacji wniosku', 'error');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Anulowanie / Usunięcie zatwierdzonego wniosku przez Kierownika/Admina z powrotem dni do puli
  const handleDeleteRequest = async () => {
    if (!selectedRequest) return;

    showConfirm({
      title: 'Anulowanie wniosku urlopowego',
      message: `Czy na pewno chcesz anulować / usunąć wniosek urlopowy dla ${selectedRequest.user?.name}? Dni z tego wniosku (${selectedRequest.daysCount} dni) zostaną automatycznie zwrócone do puli pracownika!`,
      confirmText: 'Anuluj / Usuń wniosek',
      isDanger: true,
      onConfirm: async () => {
        setIsSubmittingAction(true);
        try {
          const response = await fetch(`/api/urlopy/${selectedRequest.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Błąd podczas usuwania wniosku');
          }

          const res = await response.json();
          showToast(res.message || 'Wniosek został anulowany, a dni powróciły do puli.', 'success');
          setSelectedRequest(null);
          fetchAllData();
          window.dispatchEvent(new CustomEvent('leave-request-created'));
        } catch (err: any) {
          showToast(err.message || 'Błąd podczas anulowania wniosku', 'error');
        } finally {
          setIsSubmittingAction(false);
        }
      },
    });
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
      {/* Nagłówek i Nawigacja */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>🌐</span> Ogólny Grafik i Kalendarz Zespołu ({employeesList.length} osób)
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-0.5">
            Grafik nieobecności wszystkich pracowników. {isManagerOrAdmin ? 'Kierownik może moderować i anulować wnioski bezpośrednio z tego widoku.' : 'Podgląd ogólny dla ułatwienia planowania nieobecności.'}
          </p>
        </div>

        {/* Kontrolki Miesiąca i Filtry */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              ←
            </button>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 min-w-[130px] text-center uppercase tracking-wider">
              {new Date(currentYear, currentMonth).toLocaleDateString('pl-PL', {
                month: 'long',
                year: 'numeric',
              })}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
            >
              →
            </button>
          </div>

          <input
            type="text"
            placeholder="🔍 Szukaj pracownika..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none"
          >
            <option value="ALL">Wszystkie statusy</option>
            <option value="APPROVED">Zatwierdzone</option>
            <option value="PENDING">Oczekujące</option>
          </select>
        </div>
      </div>

      {/* Tabela Macierzowa Grafiku */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 font-bold animate-pulse text-xs">
          Ładowanie ogólnego kalendarza zespołu...
        </div>
      ) : employeesList.length === 0 ? (
        <div className="py-12 text-center text-slate-400 italic text-xs">
          Brak pracowników spełniających kryteria wyszukiwania.
        </div>
      ) : (
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl shadow-inner max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-20">
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase border-b border-slate-200 dark:border-slate-700">
                <th className="p-3 sticky left-0 bg-slate-100 dark:bg-slate-800 z-30 w-48 shadow-md">
                  Pracownik ({employeesList.length})
                </th>
                {daysInMonthList.map((d) => (
                  <th
                    key={d.dateStr}
                    className={`p-1.5 text-center min-w-[32px] border-l border-slate-200 dark:border-slate-700 ${
                      d.isWeekend || d.isHoliday ? 'bg-slate-200/60 dark:bg-slate-700/60 text-slate-500' : ''
                    }`}
                    title={d.isHoliday ? d.holidayName : undefined}
                  >
                    <div>{d.dayNumber}</div>
                    <div className="text-[8px] opacity-70 font-medium">{d.dayName}</div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {employeesList.map((emp) => (
                <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Imię i Nazwisko Pracownika */}
                  <td className="p-2.5 font-bold text-slate-900 dark:text-slate-100 sticky left-0 bg-white dark:bg-slate-900 shadow-md border-r border-slate-200 dark:border-slate-800 z-10 truncate max-w-[190px]">
                    <div className="truncate">{emp.name}</div>
                    {emp.department?.name && (
                      <div className="text-[9px] text-slate-400 font-normal truncate">
                        {emp.department.name}
                      </div>
                    )}
                  </td>

                  {/* Komórki Dni */}
                  {daysInMonthList.map((d) => {
                    const leaveReq = getLeaveForUserAndDay(emp.id, d.dateStr);
                    const isNonWorking = d.isWeekend || d.isHoliday;

                    if (!leaveReq) {
                      return (
                        <td
                          key={`${emp.id}-${d.dateStr}`}
                          className={`p-1 border-l border-slate-100 dark:border-slate-800/60 ${
                            isNonWorking ? 'bg-slate-100/50 dark:bg-slate-800/30' : ''
                          }`}
                        />
                      );
                    }

                    const typeMeta = TYPE_LABELS[leaveReq.type] || {
                      label: leaveReq.type,
                      bg: 'bg-blue-500',
                      text: 'text-white',
                    };

                    const isPending = leaveReq.status === 'PENDING';
                    const isRejected = leaveReq.status === 'REJECTED';

                    return (
                      <td
                        key={`${emp.id}-${d.dateStr}`}
                        onClick={() => setSelectedRequest(leaveReq)}
                        className="p-1 border-l border-slate-100 dark:border-slate-800 cursor-pointer text-center select-none"
                        title={`${emp.name}: ${typeMeta.label} (${leaveReq.status}) — Kliknij aby otworzyć szczegóły`}
                      >
                        <div
                          className={`text-[9px] font-black py-1 px-0.5 rounded-md truncate transition-transform hover:scale-105 shadow-xs ${
                            isPending
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : isRejected
                              ? 'bg-red-100 text-red-800 line-through opacity-60'
                              : `${typeMeta.bg} ${typeMeta.text}`
                          }`}
                        >
                          {isPending ? '⏳ Oczekuje' : typeMeta.label}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Podglądu i Moderacji Wniosku Urlopowego */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>📋</span> Wniosek Urlopowy: {selectedRequest.user?.name}
                </h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  {isManagerOrAdmin ? 'Panel Moderacji Kierownika / Administratora' : 'Szczegóły wniosku urlopowego'}
                </p>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Pracownik:</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">{selectedRequest.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Typ urlopu:</span>
                  <span className="font-extrabold text-brand-600 dark:text-brand-400">
                    {TYPE_LABELS[selectedRequest.type]?.label || selectedRequest.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Okres nieobecności:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {new Date(selectedRequest.startDate).toLocaleDateString('pl-PL')} — {new Date(selectedRequest.endDate).toLocaleDateString('pl-PL')} ({selectedRequest.daysCount} dni robocze)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Status:</span>
                  <span
                    className={`font-black px-2 py-0.5 rounded-md text-[10px] ${
                      selectedRequest.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedRequest.status === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {selectedRequest.status === 'APPROVED'
                      ? 'ZATWIERDZONY'
                      : selectedRequest.status === 'PENDING'
                      ? 'OCZEKUJĄCY NA AKCEPTACJĘ'
                      : 'ODRZUCONY'}
                  </span>
                </div>
                {selectedRequest.reason && (
                  <div className="pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 italic">
                    Powód: {selectedRequest.reason}
                  </div>
                )}
              </div>

              {/* Sekcja Akcji Kierownika / Admina */}
              {isManagerOrAdmin && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Uwaga / Notatka kierownika (opcjonalnie):
                    </label>
                    <input
                      type="text"
                      placeholder="np. Zastępstwo ustalone z zespołem"
                      value={approverNote}
                      onChange={(e) => setApproverNote(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {selectedRequest.status !== 'APPROVED' && (
                      <button
                        onClick={() => handleUpdateStatus('APPROVED')}
                        disabled={isSubmittingAction}
                        className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span>✅</span> Zatwierdź Wniosek
                      </button>
                    )}

                    {selectedRequest.status !== 'REJECTED' && (
                      <button
                        onClick={() => handleUpdateStatus('REJECTED')}
                        disabled={isSubmittingAction}
                        className="flex-1 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <span>❌</span> Odrzuć Wniosek
                      </button>
                    )}

                    {/* Dostępne dla Kierowników i Adminów: Anulowanie / Usunięcie wniosku ze zwrotem dni */}
                    <button
                      onClick={handleDeleteRequest}
                      disabled={isSubmittingAction}
                      className="flex-1 py-2.5 px-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Anuluj zatwierdzony/oczekujący wniosek i zwróć dni do puli pracownika"
                    >
                      <span>🗑️</span> Anuluj Wniosek
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

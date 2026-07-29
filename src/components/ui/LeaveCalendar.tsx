'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLeaves, LeaveRequest, LeaveBalance } from '@/hooks/useLeaves';
import { useShifts, ShiftSchedule } from '@/hooks/useShifts';
import { useAuth } from '@/hooks/useAuth';
import { LeaveRequestModal } from './LeaveRequestModal';
import { getPolishHolidays, isWeekend as checkIsWeekend } from '@/config/polishHolidays';

interface LeaveCalendarProps {
  userId: string;
  departmentShiftMode: number;
  onDateSelected?: (startDate: Date, endDate: Date) => void;
  onLeaveRequestCreated?: () => void;
  month?: number;
  year?: number;
}

interface LeaveInfo {
  type: string;
  status: string;
  label: string;
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isWeekend: boolean;
  isHoliday: boolean;
  holidayName?: string;
  leaveInfo?: LeaveInfo;
  shiftStatus?: {
    SHIFT_1?: string;
    SHIFT_2?: string;
    SHIFT_3?: string;
  };
}

/** Mapowanie typów wniosków na etykiety wyświetlane w UI. */
const LEAVE_TYPE_LABELS: Record<string, string> = {
  VACATION: 'Urlop',
  WYPOCZYNKOWY: 'Urlop',
  SICK_LEAVE: 'L4',
  CHOROBOWY: 'L4',
  ON_DEMAND: 'Na żądanie',
  NA_ZADANIE: 'Na żądanie',
  UNPAID: 'Bezpłatny',
  BEZPLATNY: 'Bezpłatny',
  SPECIAL: 'Specjalny',
  SPECJALNY: 'Specjalny',
};

/** Kolory tła komórek w zależności od statusu/typu wniosku. */
const CELL_BG_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  APPROVED: { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  PENDING: { bg: '#fff7ed', border: '#fdba74', text: '#9a3412' },
  REJECTED: { bg: '#fef2f2', border: '#fca5a5', text: '#991b1b' },
  SICK_LEAVE: { bg: '#fff1f2', border: '#fda4af', text: '#9f1239' },
  OTHER_ABSENCE: { bg: '#f5f3ff', border: '#c4b5fd', text: '#5b21b6' },
  WEEKEND: { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' },
  HOLIDAY: { bg: '#f3f4f6', border: '#d1d5db', text: '#6b7280' },
};

/** Kolory zmian (dots). */
const SHIFT_COLORS = {
  SHIFT_1: '#10b981',
  SHIFT_2: '#3b82f6',
  SHIFT_3: '#f59e0b',
  DAY_OFF: '#9ca3af',
};

/** Kolory legendy statusów wniosków. */
const LEGEND_ITEMS = [
  { color: '#dcfce7', borderColor: '#86efac', label: 'Urlop zatwierdzony' },
  { color: '#fff7ed', borderColor: '#fdba74', label: 'Urlop oczekujący' },
  { color: '#fef2f2', borderColor: '#fca5a5', label: 'Urlop odrzucony' },
  { color: '#fff1f2', borderColor: '#fda4af', label: 'L4 (zwolnienie lekarskie)' },
  { color: '#f5f3ff', borderColor: '#c4b5fd', label: 'Nieobecność inna' },
  { color: '#f3f4f6', borderColor: '#d1d5db', label: 'Weekend / Święto' },
];

/** Typy wniosków klasyfikowane jako L4. */
const SICK_LEAVE_TYPES = new Set(['SICK_LEAVE', 'CHOROBOWY']);

/** Typy wniosków klasyfikowane jako "inna nieobecność". */
const OTHER_ABSENCE_TYPES = new Set(['UNPAID', 'BEZPLATNY', 'SPECIAL', 'SPECJALNY']);

/**
 * Zwraca kategorię kolorystyczną dla wniosku urlopowego.
 * Hierarchia: typ L4/inna > status (approved/pending/rejected).
 */
function getLeaveColorCategory(type: string, status: string): string {
  if (SICK_LEAVE_TYPES.has(type)) return 'SICK_LEAVE';
  if (OTHER_ABSENCE_TYPES.has(type)) return 'OTHER_ABSENCE';
  return status;
}

export function LeaveCalendar({
  userId,
  departmentShiftMode,
  onDateSelected,
  onLeaveRequestCreated,
  month = new Date().getMonth(),
  year = new Date().getFullYear()
}: LeaveCalendarProps) {
  const { user } = useAuth();
  const { leaveRequests, leaveBalance, fetchLeaveRequests, fetchLeaveBalance } = useLeaves();
  const { schedule } = useShifts();

  const [currentMonth, setCurrentMonth] = useState(month);
  const [currentYear, setCurrentYear] = useState(year);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isLeaveRequestModalOpen, setIsLeaveRequestModalOpen] = useState(false);

  // Pobierz wnioski urlopowe i pulę przy montowaniu
  useEffect(() => {
    if (userId) {
      fetchLeaveRequests(userId);
      fetchLeaveBalance(userId);
    }
  }, [userId]);

  // Normalizuje datę do formatu YYYY-MM-DD (bez timezone)
  const toDateStr = (d: Date | string): string => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  };

  // Pobiera pełną informację o urlopie dla daty (nie tylko status)
  const getLeaveInfoForDate = (date: Date): LeaveInfo | undefined => {
    const dateStr = toDateStr(date);
    for (const leave of leaveRequests) {
      const startStr = toDateStr(leave.startDate);
      const endStr = toDateStr(leave.endDate);

      if (dateStr >= startStr && dateStr <= endStr) {
        const typeStr = leave.type as string;
        const label = LEAVE_TYPE_LABELS[typeStr] || typeStr;
        return {
          type: typeStr,
          status: leave.status,
          label,
        };
      }
    }
    return undefined;
  };

  // Sprawdza, czy dzień jest zablokowany (ma wniosek PENDING lub APPROVED)
  const isDayBlocked = (leaveInfo?: LeaveInfo): boolean => {
    if (!leaveInfo) return false;
    return leaveInfo.status === 'PENDING' || leaveInfo.status === 'APPROVED';
  };

  // Sprawdza zmianowy dla daty
  const getShiftStatusForDate = (date: Date): any => {
    const scheduleEntry = schedule.find(
      s => new Date(s.workDate).toDateString() === date.toDateString()
    );

    if (!scheduleEntry) return {};

    return { [scheduleEntry.shiftType]: scheduleEntry.shiftType };
  };

  // Cache świąt dla widocznych miesięcy
  const holidaysMap = useMemo(() => {
    const map = new Map<string, string>();
    // Ładujemy święta dla bieżącego miesiąca i sąsiednich (widoczne w siatce)
    for (let y = currentYear - 1; y <= currentYear + 1; y++) {
      const yearHolidays = getPolishHolidays(y);
      yearHolidays.forEach((name, key) => map.set(key, name));
    }
    return map;
  }, [currentYear]);

  // Generuje dni kalendarza
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    // getDay() returns 0=Sunday, but calendar starts on Monday
    // Convert: Mon=0, Tue=1, Wed=2, Thu=3, Fri=4, Sat=5, Sun=6
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7;

    const days: CalendarDay[] = [];

    const buildDay = (date: Date, dayOfMonth: number, isCurrentMonth: boolean): CalendarDay => {
      const dateKey = toDateStr(date);
      const weekend = checkIsWeekend(date);
      const holidayName = holidaysMap.get(dateKey);
      const leaveInfo = isCurrentMonth ? getLeaveInfoForDate(date) : undefined;
      const shiftStatus = isCurrentMonth ? getShiftStatusForDate(date) : undefined;

      return {
        date,
        dayOfMonth,
        isCurrentMonth,
        isWeekend: weekend,
        isHoliday: !!holidayName,
        holidayName,
        leaveInfo,
        shiftStatus,
      };
    };

    // Dni z poprzedniego miesiąca
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push(buildDay(date, prevMonthLastDay - i, false));
    }

    // Dni bieżącego miesiąca
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      days.push(buildDay(date, i, true));
    }

    // Dni następnego miesiąca
    const totalCells = days.length;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      const date = new Date(currentYear, currentMonth + 1, i);
      days.push(buildDay(date, i, false));
    }

    return days;
  }, [currentMonth, currentYear, leaveRequests, schedule, holidaysMap]);

  // Obsługa kliknięcia na dzień
  const handleDayClick = (day: CalendarDay) => {
    if (!day.isCurrentMonth) return;
    if (isDayBlocked(day.leaveInfo)) return;
    if (day.isWeekend || day.isHoliday) return;

    const date = new Date(day.date.getFullYear(), day.date.getMonth(), day.date.getDate());

    setSelectedDates(prev => {
      const dateStr = date.toDateString();
      const isSelected = prev.some(d => d.toDateString() === dateStr);

      if (isSelected) {
        return prev.filter(d => d.toDateString() !== dateStr);
      } else {
        // Maksymalnie 30 dni na raz
        if (prev.length >= 30) return prev;
        return [...prev, date].sort((a, b) => a.getTime() - b.getTime());
      }
    });
  };

  // Obsługa zatwierdzenia wyboru
  const handleConfirmSelection = () => {
    if (selectedDates.length === 0) return;

    const startDate = selectedDates[0];
    const endDate = selectedDates[selectedDates.length - 1];

    if (onDateSelected) {
      onDateSelected(startDate, endDate);
    }

    setIsLeaveRequestModalOpen(true);
  };

  // Czy dzień jest wybrany
  const isDaySelected = (date: Date) => {
    return selectedDates.some(d => d.toDateString() === date.toDateString());
  };

  // Zwraca styl tła komórki na podstawie statusu dnia
  const getCellStyle = (day: CalendarDay): React.CSSProperties => {
    if (!day.isCurrentMonth) {
      return { backgroundColor: '#f9fafb', borderColor: '#e5e7eb' };
    }

    // Priorytet: wniosek > święto > weekend
    if (day.leaveInfo) {
      const category = getLeaveColorCategory(day.leaveInfo.type, day.leaveInfo.status);
      const colors = CELL_BG_COLORS[category];
      if (colors) {
        return { backgroundColor: colors.bg, borderColor: colors.border };
      }
    }

    if (day.isHoliday) {
      return { backgroundColor: CELL_BG_COLORS.HOLIDAY.bg, borderColor: CELL_BG_COLORS.HOLIDAY.border };
    }

    if (day.isWeekend) {
      return { backgroundColor: CELL_BG_COLORS.WEEKEND.bg, borderColor: CELL_BG_COLORS.WEEKEND.border };
    }

    return { backgroundColor: '#ffffff', borderColor: '#e5e7eb' };
  };

  // Zwraca kolor tekstu badge'a
  const getBadgeTextColor = (day: CalendarDay): string => {
    if (!day.leaveInfo) return '#374151';
    const category = getLeaveColorCategory(day.leaveInfo.type, day.leaveInfo.status);
    return CELL_BG_COLORS[category]?.text || '#374151';
  };

  // Rendering komórki dnia
  const renderDayCell = (day: CalendarDay) => {
    const isSelected = isDaySelected(day.date);
    const blocked = day.isCurrentMonth && isDayBlocked(day.leaveInfo);
    const isNonWorkingDay = day.isWeekend || day.isHoliday;
    const isClickable = day.isCurrentMonth && !blocked && !isNonWorkingDay;

    const cellStyle = getCellStyle(day);

    const baseClasses = `
      flex flex-col p-2 rounded-lg transition-all duration-200 relative
      ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-blue-300' : ''}
      ${blocked ? 'cursor-not-allowed opacity-80' : ''}
      ${!day.isCurrentMonth ? 'opacity-40' : ''}
      ${isNonWorkingDay && day.isCurrentMonth ? 'cursor-default' : ''}
      ${isSelected ? 'ring-2 ring-blue-500 shadow-md' : ''}
      border min-h-24
    `;

    return (
      <div
        key={day.date.toISOString()}
        className={baseClasses}
        style={cellStyle}
        onClick={() => handleDayClick(day)}
        title={
          blocked
            ? 'Ten dzień jest już zajęty wnioskiem'
            : day.isHoliday
              ? day.holidayName
              : undefined
        }
      >
        {/* Numer dnia */}
        <div className={`text-sm font-semibold mb-1 ${
          !day.isCurrentMonth ? 'text-gray-400' :
          isNonWorkingDay ? 'text-gray-500' :
          'text-gray-900'
        }`}>
          {day.dayOfMonth}
        </div>

        {/* Badge z typem wniosku — prawy górny róg */}
        {day.leaveInfo && day.isCurrentMonth && (
          <div
            className="absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-tight"
            style={{
              color: getBadgeTextColor(day),
              backgroundColor: 'rgba(255,255,255,0.7)',
              border: `1px solid ${cellStyle.borderColor}`,
            }}
          >
            {day.leaveInfo.label}
          </div>
        )}

        {/* Info o święcie */}
        {day.isHoliday && day.isCurrentMonth && !day.leaveInfo && (
          <div className="text-[9px] text-gray-500 font-medium leading-tight mt-auto truncate w-full">
            🏛️ {day.holidayName}
          </div>
        )}

        {/* Weekend label */}
        {day.isWeekend && day.isCurrentMonth && !day.isHoliday && !day.leaveInfo && (
          <div className="text-[9px] text-gray-400 font-medium mt-auto">
            Wolne
          </div>
        )}

        {/* Zmianowy — w zależności od shiftMode */}
        {day.isCurrentMonth && !isNonWorkingDay && !day.leaveInfo && (
          <div className="text-xs space-y-0.5 w-full mt-auto">
            {departmentShiftMode === 1 ? (
              // Administracja - tylko SHIFT_1
              <div>
                {day.shiftStatus?.SHIFT_1 && (
                  <div
                    className="px-1 py-0.5 rounded text-white text-xs font-semibold text-center"
                    style={{ backgroundColor: SHIFT_COLORS.SHIFT_1 }}
                  >
                    S1
                  </div>
                )}
              </div>
            ) : (
              // Produkcja/Magazyn - 3 zmianowy
              <>
                {['SHIFT_1', 'SHIFT_2', 'SHIFT_3'].map(shift => (
                  <div key={shift}>
                    {day.shiftStatus?.[shift as keyof typeof day.shiftStatus] && (
                      <div
                        className="px-1 py-0.5 rounded text-white text-xs font-bold text-center"
                        style={{
                          backgroundColor: SHIFT_COLORS[shift as keyof typeof SHIFT_COLORS]
                        }}
                      >
                        {shift === 'SHIFT_1' ? 'S1' : shift === 'SHIFT_2' ? 'S2' : 'S3'}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Ikona blokady */}
        {blocked && (
          <div className="absolute bottom-1 right-1 text-[10px] opacity-60" title="Dzień zajęty">
            🔒
          </div>
        )}
      </div>
    );
  };

  // Nawigacja miesiąca z obsługą zmiany roku
  const navigateMonth = (direction: -1 | 1) => {
    setCurrentMonth(prev => {
      const newMonth = prev + direction;
      if (newMonth < 0) {
        setCurrentYear(y => y - 1);
        return 11;
      }
      if (newMonth > 11) {
        setCurrentYear(y => y + 1);
        return 0;
      }
      return newMonth;
    });
  };

  // Obliczenie liczby dni oczekujących na akceptację
  const pendingDaysCount = useMemo(() => {
    return leaveRequests
      .filter((r) => r.status === 'PENDING')
      .reduce((acc, req) => {
        const start = new Date(req.startDate);
        const end = new Date(req.endDate);
        let count = 0;
        const cur = new Date(start);
        while (cur <= end) {
          if (!checkIsWeekend(cur)) count++;
          cur.setDate(cur.getDate() + 1);
        }
        return acc + count;
      }, 0);
  }, [leaveRequests]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Nagłówek */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Kalendarz Urlopów i Zmian
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigateMonth(-1)}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold cursor-pointer"
          >
            ←
          </button>
          <div className="text-sm font-semibold text-gray-700 min-w-[150px] text-center">
            {new Date(currentYear, currentMonth).toLocaleDateString('pl-PL', {
              month: 'long',
              year: 'numeric'
            })}
          </div>
          <button
            onClick={() => navigateMonth(1)}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold cursor-pointer"
          >
            →
          </button>
        </div>
      </div>

      {/* Podsumowanie Dostępnego Urlopu — ILE ZOSTAŁO URLOPU UŻYTKOWNIKOWI */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pozostało do wykorzystania */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
              Pozostało Urlopu ({currentYear})
            </div>
            <div className="text-3xl font-black mt-1">
              {leaveBalance ? leaveBalance.availableDays : '...'} <span className="text-base font-bold text-emerald-100">dni</span>
            </div>
            <div className="text-[11px] text-emerald-100/90 font-medium mt-0.5">
              Z puli rocznej {leaveBalance?.totalDays || 26} dni
            </div>
          </div>
          <div className="text-3xl bg-white/20 p-2.5 rounded-2xl">🌴</div>
        </div>

        {/* Wykorzystane dni */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Wykorzystany Urlop
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {leaveBalance ? leaveBalance.usedDays : 0} <span className="text-xs font-bold text-slate-500">dni</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Zatwierdzone wnioski
            </div>
          </div>
          <div className="text-2xl bg-emerald-100 p-2 rounded-xl text-emerald-600">✅</div>
        </div>

        {/* Oczekuje na zatwierdzenie */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Wniosek w trakcie
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {pendingDaysCount} <span className="text-xs font-bold text-slate-500">dni</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Oczekuje na akceptację
            </div>
          </div>
          <div className="text-2xl bg-amber-100 p-2 rounded-xl text-amber-600">⏳</div>
        </div>

        {/* Urlop zaległy */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Urlop Zaległy
            </div>
            <div className="text-2xl font-black text-purple-600 mt-1">
              {leaveBalance?.overdueDays ? Math.max(0, leaveBalance.overdueDays - (leaveBalance.usedOverdueDays || 0)) : 0} <span className="text-xs font-bold text-slate-500">dni</span>
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
              Z poprzedniego roku
            </div>
          </div>
          <div className="text-2xl bg-purple-100 p-2 rounded-xl text-purple-600">📅</div>
        </div>
      </div>

      {/* Legenda — statusy wniosków */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-sm mb-3">
          {LEGEND_ITEMS.map(item => (
            <div key={item.label} className="flex items-center gap-2">
              <div
                className="w-5 h-4 rounded border"
                style={{ backgroundColor: item.color, borderColor: item.borderColor }}
              />
              <span className="text-xs font-medium text-gray-700">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Legenda — zmiany */}
        <div className="border-t border-blue-200 pt-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.SHIFT_1 }} />
              <span className="text-xs text-gray-700">Zmiana 1 (8-16)</span>
            </div>
            {departmentShiftMode > 1 && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.SHIFT_2 }} />
                  <span className="text-xs text-gray-700">Zmiana 2 (16-24)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.SHIFT_3 }} />
                  <span className="text-xs text-gray-700">Zmiana 3 (0-8)</span>
                </div>
              </>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.DAY_OFF }} />
              <span className="text-xs text-gray-700">Dzień wolny</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stanowiący dni tygodnia */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'].map(day => (
          <div key={day} className={`text-center font-bold text-sm py-2 ${
            day === 'Sob' || day === 'Nd' ? 'text-gray-400' : 'text-gray-700'
          }`}>
            {day}
          </div>
        ))}
      </div>

      {/* Kalendarz */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {calendarDays.map(day => renderDayCell(day))}
      </div>

      {/* Informacje o wyborze */}
      {selectedDates.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="text-sm text-gray-700 mb-2">
            <strong>Wybrane dni:</strong> {selectedDates.length}
          </div>
          <div className="text-sm text-gray-700 mb-4">
            {selectedDates[0].toLocaleDateString('pl-PL')} —{' '}
            {selectedDates[selectedDates.length - 1].toLocaleDateString('pl-PL')}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmSelection}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Złóż wniosek urlopowy
            </button>
            <button
              onClick={() => setSelectedDates([])}
              className="px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold"
            >
              Anuluj wybór
            </button>
          </div>
        </div>
      )}

      {/* Aktualna pula urlopowa */}
      {leaveBalance && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm text-gray-700">
            <strong>Pula urlopowa {new Date().getFullYear()}:</strong> {leaveBalance.totalDays}{' '}
            dni
          </div>
          <div className="text-sm text-gray-700">
            <strong>Wykorzystane:</strong> {leaveBalance.usedDays} dni
          </div>
          <div className="text-sm text-gray-700">
            <strong>Pozostało:</strong>{' '}
            <span className="font-bold text-green-700">
              {leaveBalance.totalDays - leaveBalance.usedDays} dni
            </span>
          </div>
        </div>
      )}

      {/* Modal do tworzenia wniosku urlopowego */}
      <LeaveRequestModal
        isOpen={isLeaveRequestModalOpen}
        onClose={() => {
          setIsLeaveRequestModalOpen(false);
          setSelectedDates([]);
        }}
        startDate={selectedDates.length > 0 ? selectedDates[0] : undefined}
        endDate={selectedDates.length > 0 ? selectedDates[selectedDates.length - 1] : undefined}
        onLeaveRequestCreated={() => {
          // Odśwież dane kalendarza
          fetchLeaveRequests(userId);
          fetchLeaveBalance(userId);
          if (onLeaveRequestCreated) {
            onLeaveRequestCreated();
          }
          setIsLeaveRequestModalOpen(false);
          setSelectedDates([]);
        }}
      />
    </div>
  );
}

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLeaves, LeaveRequest, LeaveBalance } from '@/hooks/useLeaves';
import { useShifts, ShiftSchedule } from '@/hooks/useShifts';
import { useAuth } from '@/hooks/useAuth';
import { LeaveRequestModal } from './LeaveRequestModal';

interface LeaveCalendarProps {
  userId: string;
  departmentShiftMode: number;
  onDateSelected?: (startDate: Date, endDate: Date) => void;
  onLeaveRequestCreated?: () => void;
  month?: number;
  year?: number;
}

interface CalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  leaveStatus?: string;
  shiftStatus?: {
    SHIFT_1?: string;
    SHIFT_2?: string;
    SHIFT_3?: string;
  };
}

const SHIFT_COLORS = {
  SHIFT_1: '#10b981', // Zielony
  SHIFT_2: '#3b82f6', // Niebieski
  SHIFT_3: '#f59e0b', // Pomarańczowy
  DAY_OFF: '#9ca3af', // Szary
  VACATION_APPROVED: '#10b981', // Zielony
  VACATION_PENDING: '#fbbf24', // Żółty
  SICK_LEAVE: '#ef4444', // Czerwony
  ON_DEMAND: '#8b5cf6' // Fioletowy
};

export function LeaveCalendar({
  userId,
  departmentShiftMode,
  onDateSelected,
  onLeaveRequestCreated,
  month = new Date().getMonth(),
  year = new Date().getFullYear()
}: LeaveCalendarProps) {
  const { user } = useAuth();
  const { leaveRequests, leaveBalance } = useLeaves();
  const { schedule } = useShifts();

  const [currentMonth, setCurrentMonth] = useState(month);
  const [currentYear, setCurrentYear] = useState(year);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isLeaveRequestModalOpen, setIsLeaveRequestModalOpen] = useState(false);

  // Sprawdza status urlopu dla daty
  const getLeaveStatusForDate = (date: Date): string | undefined => {
    for (const leave of leaveRequests) {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      if (date >= startDate && date <= endDate) {
        if (leave.status === 'APPROVED') return 'VACATION_APPROVED';
        if (leave.status === 'PENDING') return 'VACATION_PENDING';
        if (leave.status === 'REJECTED') return 'REJECTED';
        if (leave.type === 'SICK_LEAVE') return 'SICK_LEAVE';
      }
    }
    return undefined;
  };

  // Sprawdza zmianowy dla daty
  const getShiftStatusForDate = (date: Date): any => {
    const scheduleEntry = schedule.find(
      s => new Date(s.workDate).toDateString() === date.toDateString()
    );

    if (!scheduleEntry) return {};

    return { [scheduleEntry.shiftType]: scheduleEntry.shiftType };
  };

  // Generuje dni kalendarza
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: CalendarDay[] = [];

    // Dni z poprzedniego miesiąca
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(currentYear, currentMonth - 1, prevMonthLastDay - i),
        dayOfMonth: prevMonthLastDay - i,
        isCurrentMonth: false
      });
    }

    // Dni bieżącego miesiąca
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const leaveStatus = getLeaveStatusForDate(date);
      const shiftStatus = getShiftStatusForDate(date);

      days.push({
        date,
        dayOfMonth: i,
        isCurrentMonth: true,
        leaveStatus,
        shiftStatus
      });
    }

    // Dni następnego miesiąca
    const totalCells = days.length;
    const remainingCells = 42 - totalCells;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({
        date: new Date(currentYear, currentMonth + 1, i),
        dayOfMonth: i,
        isCurrentMonth: false
      });
    }

    return days;
  }, [currentMonth, currentYear, leaveRequests, schedule]);

  // Obsługa kliknięcia na dzień
  const handleDayClick = (date: Date) => {
    if (!date.getHours()) {
      // Upewnij się, że to północ
      date = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

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

  // Rendering komórki dnia
  const renderDayCell = (day: CalendarDay) => {
    const isSelected = isDaySelected(day.date);
    const baseClasses = `
      flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer
      transition-colors duration-200 relative
      ${day.isCurrentMonth ? 'bg-white hover:bg-gray-50' : 'bg-gray-100 text-gray-400'}
      ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}
      border border-gray-200 min-h-24
    `;

    return (
      <div
        key={day.date.toISOString()}
        className={baseClasses}
        onClick={() => day.isCurrentMonth && handleDayClick(day.date)}
      >
        {/* Numer dnia */}
        <div className="text-sm font-semibold text-gray-900 mb-1">
          {day.dayOfMonth}
        </div>

        {/* Status urlopu - górna część */}
        {day.leaveStatus && (
          <div
            className="absolute top-1 right-1 w-2 h-2 rounded-full"
            style={{
              backgroundColor: SHIFT_COLORS[day.leaveStatus as keyof typeof SHIFT_COLORS]
            }}
            title={day.leaveStatus}
          />
        )}

        {/* Zmianowy - w zależności od shiftMode */}
        <div className="text-xs space-y-0.5 w-full">
          {departmentShiftMode === 1 ? (
            // Administracja - tylko SHIFT_1
            <div>
              {day.shiftStatus?.SHIFT_1 && (
                <div
                  className="px-1 py-0.5 rounded text-white text-xs font-semibold"
                  style={{ backgroundColor: SHIFT_COLORS.SHIFT_1 }}
                >
                  S1
                </div>
              )}
              {!day.shiftStatus?.SHIFT_1 && day.isCurrentMonth && (
                <div className="px-1 py-0.5 text-gray-400 text-xs">—</div>
              )}
            </div>
          ) : (
            // Produkcja/Magazyn - 3 zmianowy
            <>
              {['SHIFT_1', 'SHIFT_2', 'SHIFT_3'].map(shift => (
                <div key={shift}>
                  {day.shiftStatus?.[shift as keyof typeof day.shiftStatus] && (
                    <div
                      className="px-1 py-0.5 rounded text-white text-xs font-bold"
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
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Nagłówek */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Kalendarz Urlopów i Zmian
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentMonth(m => (m === 0 ? 11 : m - 1))}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900"
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
            onClick={() => setCurrentMonth(m => (m === 11 ? 0 : m + 1))}
            className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900"
          >
            →
          </button>
        </div>
      </div>

      {/* Legenda */}
      <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.SHIFT_1 }} />
            <span>Zmiana 1 (8-16)</span>
          </div>
          {departmentShiftMode > 1 && (
            <>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.SHIFT_2 }} />
                <span>Zmiana 2 (16-24)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.SHIFT_3 }} />
                <span>Zmiana 3 (0-8)</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.DAY_OFF }} />
            <span>Dzień wolny</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.VACATION_APPROVED }} />
            <span>Urlop zatwierdz.</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.VACATION_PENDING }} />
            <span>Urlop oczekujący</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: SHIFT_COLORS.SICK_LEAVE }} />
            <span>L4</span>
          </div>
        </div>
      </div>

      {/* Stanowiący dni tygodnia */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd'].map(day => (
          <div key={day} className="text-center font-bold text-gray-700 text-sm py-2">
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

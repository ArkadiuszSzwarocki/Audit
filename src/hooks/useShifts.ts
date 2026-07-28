'use client';

import { useState, useCallback } from 'react';

export interface ShiftSchedule {
  id: string;
  userId: string;
  workDate: string;
  shiftType: 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3' | 'DAY_OFF';
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleGeneration {
  success: boolean;
  userId: string;
  year: number;
  month: number;
  shiftMode: number;
  daysInMonth: number;
  schedule: Array<{
    workDate: string;
    validShifts: string[];
    shiftMode: number;
    restricted: boolean;
  }>;
  message: string;
}

export function useShifts() {
  const [schedule, setSchedule] = useState<ShiftSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobiera grafik pracownika
  const fetchSchedule = useCallback(
    async (userId: string, startDate: Date, endDate: Date) => {
      setLoading(true);
      setError(null);

      try {
        const query = new URLSearchParams({
          userId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        });

        const response = await fetch(`/api/shifts?${query}`);

        if (!response.ok) {
          throw new Error('Nie udało się pobrać grafiku');
        }

        const data = await response.json();
        setSchedule(data);
        return data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Przypisuje zmianę
  const assignShift = useCallback(
    async (userId: string, workDate: Date, shiftType: 'SHIFT_1' | 'SHIFT_2' | 'SHIFT_3' | 'DAY_OFF') => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            workDate: workDate.toISOString(),
            shiftType
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Błąd przy przypisywaniu zmianowy');
        }

        const result = await response.json();
        await fetchSchedule(userId, new Date(workDate.getFullYear(), workDate.getMonth(), 1), new Date(workDate.getFullYear(), workDate.getMonth() + 1, 0));
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchSchedule]
  );

  // Generuje miesięczny grafik
  const generateMonthlySchedule = useCallback(
    async (userId: string, year: number, month: number): Promise<ScheduleGeneration> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/shifts/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, year, month })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Błąd przy generowaniu grafiku');
        }

        const result = await response.json();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    schedule,
    loading,
    error,
    fetchSchedule,
    assignShift,
    generateMonthlySchedule
  };
}

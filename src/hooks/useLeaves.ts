'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface LeaveRequest {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  type: 'VACATION' | 'SICK_LEAVE' | 'ON_DEMAND' | 'UNPAID' | 'SPECIAL';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reason?: string;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    login: string;
    name: string;
  };
  manager?: {
    id: string;
    login: string;
    name: string;
  };
}

export interface LeaveBalance {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  createdAt: string;
  updatedAt: string;
}

export function useLeaves() {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobiera wnioski urlopowe
  const fetchLeaveRequests = useCallback(async (userId?: string) => {
    if (!userId && !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/urlopy?userId=${userId || user?.id}`);
      if (!response.ok) {
        throw new Error('Nie udało się pobrać wniosków urlopowych');
      }

      const data = await response.json();
      setLeaveRequests(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Pobiera pule urlopowe
  const fetchLeaveBalance = useCallback(async (userId?: string) => {
    if (!userId && !user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leave-balance?userId=${userId || user?.id}`);
      if (!response.ok) {
        throw new Error('Nie udało się pobrać pul urlopowych');
      }

      const data = await response.json();
      const currentYear = new Date().getFullYear();
      const balance = data.find((b: LeaveBalance) => b.year === currentYear);
      setLeaveBalance(balance || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Tworzy wniosek urlopowy
  const createLeaveRequest = useCallback(
    async (data: {
      startDate: Date;
      endDate: Date;
      type: 'VACATION' | 'SICK_LEAVE' | 'ON_DEMAND' | 'UNPAID' | 'SPECIAL';
      reason?: string;
      managerId?: string;
    }) => {
      if (!user?.id) {
        throw new Error('Użytkownik nie zalogowany');
      }

      setLoading(true);
      setError(null);

      try {
        // Konwertuj daty na format YYYY-MM-DD aby uniknąć problemów ze strefą czasową
        const formatDateAsString = (date: Date): string => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const response = await fetch('/api/urlopy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            startDate: formatDateAsString(data.startDate),
            endDate: formatDateAsString(data.endDate),
            type: data.type,
            reason: data.reason,
            managerId: data.managerId
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Błąd przy tworzeniu wniosku');
        }

        const result = await response.json();
        await fetchLeaveRequests();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user?.id, fetchLeaveRequests]
  );

  // Zmienia status wniosku
  const updateLeaveRequestStatus = useCallback(
    async (id: string, status: 'APPROVED' | 'REJECTED') => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/urlopy/${id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Błąd przy zmianie statusu');
        }

        await fetchLeaveRequests();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchLeaveRequests]
  );

  return {
    leaveRequests,
    leaveBalance,
    loading,
    error,
    fetchLeaveRequests,
    fetchLeaveBalance,
    createLeaveRequest,
    updateLeaveRequestStatus
  };
}

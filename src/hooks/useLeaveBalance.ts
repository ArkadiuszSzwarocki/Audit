import { useState, useCallback } from 'react';

interface LeaveBalance {
  id: string;
  userId: string;
  year: number;
  totalDays: number;
  usedDays: number;
  availableDays: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    login: string;
    email?: string;
    role: string;
    department?: {
      id: string;
      name: string;
    };
  };
}

export function useLeaveBalance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllBalances = useCallback(async (year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = year 
        ? `/api/leave-balance?action=all&year=${year}`
        : '/api/leave-balance?action=all';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Nie udało się pobrać pul urlopowych');
      }
      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchUserBalance = useCallback(async (userId: string, year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = year 
        ? `/api/leave-balance?userId=${userId}&year=${year}`
        : `/api/leave-balance?userId=${userId}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Nie udało się pobrać salda urlopów');
      }
      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const adjustBalance = useCallback(async (
    userId: string,
    adjustment: number,
    year?: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leave-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust',
          userId,
          year,
          adjustment
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się zmienić salda');
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const setTotalDays = useCallback(async (
    userId: string,
    newTotalDays: number,
    reason?: string,
    year?: number
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leave-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-total',
          userId,
          year,
          newTotalDays,
          reason
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się zmienić puli');
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetBalance = useCallback(async (userId: string, year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/leave-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset',
          userId,
          year
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Nie udało się zresetować salda');
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchAllBalances,
    fetchUserBalance,
    adjustBalance,
    setTotalDays,
    resetBalance
  };
}

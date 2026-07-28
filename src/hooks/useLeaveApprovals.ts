'use client';

import { useState, useCallback } from 'react';

export interface LeaveRequest {
  id: string;
  userId: string;
  user?: {
    id: string;
    name: string;
    login: string;
    department?: {
      id: string;
      name: string;
    };
  };
  startDate: string | Date;
  endDate: string | Date;
  type: string;
  status: string;
  reason?: string;
  managerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useLeaveApprovals() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobiera urlopy oczekujące na zatwierdzenie dla kierownika
  const fetchPendingRequests = useCallback(async (managerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leave-approvals?managerId=${managerId}`);
      if (!response.ok) throw new Error('Nie udało się pobrać wniosków');
      const data = await response.json();
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobiera wszystkie urlopy dla danego użytkownika
  const fetchUserRequests = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/urlopy?userId=${userId}`);
      if (!response.ok) throw new Error('Nie udało się pobrać wniosków');
      const data = await response.json();
      setLeaveRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      setLeaveRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Zatwierdza urlop
  const approveLeaveRequest = useCallback(async (leaveRequestId: string, reason?: string) => {
    try {
      const response = await fetch('/api/leave-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          leaveRequestId,
          reason
        })
      });

      if (!response.ok) throw new Error('Nie udało się zatwierdzić wniosku');
      const result = await response.json();

      // Aktualizuj lokalny stan
      setLeaveRequests(prev =>
        prev.map(req =>
          req.id === leaveRequestId ? { ...req, status: 'APPROVED' } : req
        )
      );

      return { success: true, data: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      return { success: false, error: message };
    }
  }, []);

  // Odrzuca urlop
  const rejectLeaveRequest = useCallback(async (leaveRequestId: string, reason?: string) => {
    try {
      const response = await fetch('/api/leave-approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reject',
          leaveRequestId,
          reason
        })
      });

      if (!response.ok) throw new Error('Nie udało się odrzucić wniosku');
      const result = await response.json();

      // Aktualizuj lokalny stan
      setLeaveRequests(prev =>
        prev.map(req =>
          req.id === leaveRequestId ? { ...req, status: 'REJECTED' } : req
        )
      );

      return { success: true, data: result };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      return { success: false, error: message };
    }
  }, []);

  // Pobiera statystykę dla kierownika
  const getApprovalStats = useCallback(async (managerId: string) => {
    try {
      const response = await fetch(`/api/leave-approvals?action=stats&managerId=${managerId}`);
      if (!response.ok) throw new Error('Nie udało się pobrać statystyk');
      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      return { success: false, error: message };
    }
  }, []);

  return {
    leaveRequests,
    loading,
    error,
    fetchPendingRequests,
    fetchUserRequests,
    approveLeaveRequest,
    rejectLeaveRequest,
    getApprovalStats
  };
}

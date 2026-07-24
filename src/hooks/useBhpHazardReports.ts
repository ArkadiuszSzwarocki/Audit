'use client';

import { useState, useCallback } from 'react';

export interface BhpHazardReport {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  reportedBy: string;
  photoUrl?: string | null;
  fixPhotoUrl?: string | null;
  fixedBy?: string | null;
  fixedAt?: string | null;
  actionTaken?: string | null;
  notifyEmails?: string | null;
  dueDate?: string | null;
  areaId?: string | null;
  machineId?: string | null;
  assignedToId?: string | null;
  createdAt: string;
  updatedAt: string;
  area?: { id: string; name: string } | null;
  machine?: { id: string; name: string } | null;
  assignedTo?: { id: string; name: string; email: string | null } | null;
}

export function useBhpHazardReports() {
  const [reports, setReports] = useState<BhpHazardReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (filters?: { assignedToId?: string; status?: string; category?: string }, setGlobalLoading = true) => {
    if (setGlobalLoading) setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters?.assignedToId) params.set('assignedToId', filters.assignedToId);
      if (filters?.status) params.set('status', filters.status);
      if (filters?.category) params.set('category', filters.category);

      const res = await fetch(`/api/bhp?${params.toString()}`);
      if (!res.ok) throw new Error('Błąd podczas pobierania zgłoszeń BHP');
      const data = await res.json();
      setReports(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (setGlobalLoading) setLoading(false);
    }
  }, []);

  const createReport = useCallback(async (dto: Partial<BhpHazardReport>): Promise<BhpHazardReport> => {
    const res = await fetch('/api/bhp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? 'Błąd tworzenia zgłoszenia BHP');
    }
    const created = await res.json();
    setReports((prev) => [created, ...prev]);
    return created;
  }, []);

  const resolveReport = useCallback(async (id: string, fixPhotoUrl?: string, actionTaken?: string): Promise<BhpHazardReport> => {
    const res = await fetch(`/api/bhp/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', fixPhotoUrl, actionTaken }),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? 'Błąd eliminowania zagrożenia BHP');
    }
    const updated = await res.json();
    setReports((prev) => prev.map((r) => (r.id === id ? updated : r)));
    return updated;
  }, []);

  const deleteReport = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/bhp/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Błąd usuwania zgłoszenia BHP');
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return { reports, loading, error, fetchReports, createReport, resolveReport, deleteReport };
}

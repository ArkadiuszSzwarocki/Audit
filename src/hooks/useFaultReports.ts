'use client';

import { useState, useCallback } from 'react';

export interface FaultReport {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  reportedBy: string;
  photoUrl: string | null;
  fixPhotoUrl: string | null;
  fixedBy: string | null;
  fixedAt: string | null;
  operatorComment: string | null;
  notifyEmails: string | null;
  dueDate: string | null;
  createdAt: string;
  areaId?: string | null;
  machineId?: string | null;
  area: { id: string; name: string } | null;
  machine: { id: string; name: string } | null;
  assignedTo: { id: string; name: string; email: string | null } | null;
}

export function useFaultReports() {
  const [reports, setReports] = useState<FaultReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (params?: { status?: string; assignedToId?: string }, showLoading?: boolean) => {
    const isFirstLoad = showLoading !== undefined ? showLoading : false;
    if (isFirstLoad) setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (params?.status) qs.set('status', params.status);
      if (params?.assignedToId) qs.set('assignedToId', params.assignedToId);
      const res = await fetch(`/api/fault-reports?${qs.toString()}`);
      if (!res.ok) throw new Error('Błąd pobierania zgłoszeń');
      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  }, []);

  const createReport = useCallback(async (data: {
    title: string;
    description: string;
    severity?: string;
    reportedBy?: string;
    photoUrl?: string | null;
    notifyEmails?: string | null;
    dueDate?: string | null;
    areaId?: string | null;
    machineId?: string | null;
    assignedToId?: string | null;
  }): Promise<FaultReport> => {
    const res = await fetch('/api/fault-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Błąd tworzenia zgłoszenia');
    setReports(prev => [json, ...prev]);
    return json;
  }, []);

  const resolveReport = useCallback(async (id: string, fixPhotoUrl?: string, operatorComment?: string): Promise<FaultReport> => {
    const res = await fetch(`/api/fault-reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', fixPhotoUrl, operatorComment }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Błąd aktualizacji');
    setReports(prev => prev.map(r => r.id === id ? json : r));
    return json;
  }, []);

  const deleteReport = useCallback(async (id: string): Promise<void> => {
    const res = await fetch(`/api/fault-reports/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? 'Błąd usunięcia');
    }
    setReports(prev => prev.filter(r => r.id !== id));
  }, []);

  return { reports, loading, error, fetchReports, createReport, resolveReport, deleteReport };
}

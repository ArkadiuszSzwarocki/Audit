import { useState, useCallback } from 'react';

export interface QualityReport {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  reportedBy: string;
  batchNumber?: string | null;
  quantityAffected?: string | null;
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
  area?: { id: string; name: string } | null;
  machine?: { id: string; name: string } | null;
  assignedTo?: { id: string; name: string; email?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export function useQualityReports() {
  const [reports, setReports] = useState<QualityReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = useCallback(async (filters?: Record<string, string>, showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (filters) {
        Object.entries(filters).forEach(([k, v]) => {
          if (v) queryParams.append(k, v);
        });
      }

      const res = await fetch(`/api/jakosc?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Błąd podczas pobierania zgłoszeń jakościowych.');

      const data = await res.json();
      setReports(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  const createReport = async (dto: Partial<QualityReport>) => {
    const res = await fetch('/api/jakosc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Nie udało się dodać zgłoszenia jakościowego');

    setReports((prev) => [data, ...prev]);
    return data;
  };

  const setDueDate = async (id: string, dueDate: string, assignedToId?: string) => {
    const res = await fetch(`/api/jakosc/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set_due_date', dueDate, assignedToId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Błąd wyznaczania terminu CAPA');

    setReports((prev) => prev.map((r) => (r.id === id ? data : r)));
    return data;
  };

  const resolveReport = async (id: string, fixedBy: string, actionTaken: string, fixPhotoUrl?: string) => {
    const res = await fetch(`/api/jakosc/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve', fixedBy, actionTaken, fixPhotoUrl }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Nie udało się zamknąć niezgodności jakościowej');

    setReports((prev) => prev.map((r) => (r.id === id ? data : r)));
    return data;
  };

  const deleteReport = async (id: string) => {
    const res = await fetch(`/api/jakosc/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Błąd usuwania zgłoszenia jakościowego');

    setReports((prev) => prev.filter((r) => r.id !== id));
  };

  return {
    reports,
    loading,
    error,
    fetchReports,
    createReport,
    setDueDate,
    resolveReport,
    deleteReport,
  };
}

import { useState, useCallback } from 'react';

export interface Audit {
  id: string;
  title: string;
  status: string;
  areaId: string;
  machineId: string | null;
  createdAt: string;
  area?: { name: string };
  machine?: { name: string };
  auditType?: { id: string; name: string };
  observations?: Observation[];
}

export interface Observation {
  id: string;
  auditId: string;
  description: string;
  aiSuggestion: string | null;
  photoUrl: string | null;
  severity: string;
  dueDate?: string | null;
  isFixed: boolean;
  fixedBy?: string | null;
  fixedAt?: string | null;
  fixPhotoUrl?: string | null;
  operatorComment?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string } | null;
  extensions?: {
    id: string;
    previousDueDate?: string | null;
    newDueDate: string;
    reason: string;
    requestedBy: string;
    createdAt: string;
  }[];
  createdAt: string;
}

export function useAudits() {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(false);
  
  const fetchAudits = useCallback(async (showLoading?: boolean) => {
    const isFirstLoad = showLoading !== undefined ? showLoading : false;
    if (isFirstLoad) setLoading(true);
    try {
      const res = await fetch('/api/audits');
      const data = await res.json();
      setAudits(Array.isArray(data) ? data : []);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  }, []);

  const createAudit = async (areaId: string, machineId?: string, auditTypeId?: string, title?: string) => {
    const res = await fetch('/api/audits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, areaId, machineId, auditTypeId }),
    });
    if (!res.ok) throw new Error('Nie udało się utworzyć audytu');
    const response = await res.json();
    return response.data || response;
  };

  const enhanceDescription = async (rawDescription: string) => {
    const res = await fetch('/api/ai/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawDescription }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data.improvedDescription;
  };

  const addObservation = async (auditId: string, description: string, aiSuggestion?: string, photoUrl?: string, severity?: string, dueDate?: string) => {
    const res = await fetch('/api/observations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ auditId, description, aiSuggestion, photoUrl, severity, dueDate }),
    });
    if (!res.ok) throw new Error('Nie udało się zapisać spostrzeżenia');
    return res.json();
  };

  const extendDueDate = async (id: string, newDueDate: string, reason: string, requestedBy: string) => {
    const res = await fetch(`/api/observations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'extendDueDate', newDueDate, reason, requestedBy }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Nie udało się przedłużyć terminu');
    return data;
  };

  const fetchAuditById = async (id: string) => {
    const res = await fetch(`/api/audits/${id}`);
    if (!res.ok) throw new Error('Nie udało się pobrać audytu');
    return res.json();
  };

  const updateAuditStatus = async (id: string, status: string) => {
    const res = await fetch(`/api/audits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Nie udało się zaktualizować statusu');
    return res.json();
  };

  const deleteObservation = async (id: string, currentAuditId?: string) => {
    const res = await fetch(`/api/observations?id=${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Nie udało się usunąć zgłoszenia');
    
    // Optionally refresh the current audit if provided
    if (currentAuditId) {
      await fetchAuditById(currentAuditId);
    }
  };

  return {
    audits,
    loading,
    fetchAudits,
    createAudit,
    enhanceDescription,
    addObservation,
    fetchAuditById,
    updateAuditStatus,
    deleteObservation,
    extendDueDate
  };
}

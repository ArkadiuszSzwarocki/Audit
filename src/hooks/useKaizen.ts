import { useState, useCallback } from 'react';

export interface Kaizen {
  id: string;
  title: string;
  description: string;
  benefits: string | null;
  submittedBy: string;
  status: string;
  committeeNote: string | null;
  pointsAwarded?: number | null;
  pointsCategory?: string | null;
  areaId: string | null;
  machineId: string | null;
  photoUrl: string | null;
  createdAt: string;
  area?: { name: string };
  machine?: { name: string };
}

export function useKaizen() {
  const [kaizens, setKaizens] = useState<Kaizen[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchKaizens = useCallback(async (showLoading?: boolean) => {
    const isFirstLoad = showLoading !== undefined ? showLoading : false;
    if (isFirstLoad) setLoading(true);
    try {
      const res = await fetch('/api/kaizen');
      if (res.ok) {
        const data = await res.json();
        setKaizens(Array.isArray(data) ? data.filter(Boolean) : []);
      } else {
        setKaizens([]);
      }
    } catch (err) {
      setKaizens([]);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  }, []);

  const createKaizen = async (data: { title: string; description: string; benefits?: string; submittedBy: string; areaId?: string; machineId?: string; photoUrl?: string }) => {
    const res = await fetch('/api/kaizen', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const resJson = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resJson.error || resJson.message || 'Nie udało się zgłosić pomysłu');
    }
    return resJson.data || resJson;
  };

  const fetchKaizenById = async (id: string) => {
    const res = await fetch(`/api/kaizen/${id}`);
    if (!res.ok) throw new Error('Nie udało się pobrać szczegółów wniosku');
    return res.json();
  };

  const updateKaizenStatus = async (
    id: string,
    status: string,
    committeeNote?: string,
    pointsAwarded?: number,
    pointsCategory?: string
  ) => {
    const res = await fetch(`/api/kaizen/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, committeeNote, pointsAwarded, pointsCategory }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'Nie udało się zaktualizować wniosku');
    }
    return res.json();
  };

  const deleteKaizen = async (id: string) => {
    const res = await fetch(`/api/kaizen/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Nie udało się usunąć wniosku');
    setKaizens(prev => prev.filter(k => k.id !== id));
    return res.json();
  };

  return {
    kaizens,
    loading,
    fetchKaizens,
    createKaizen,
    fetchKaizenById,
    updateKaizenStatus,
    deleteKaizen,
  };
}

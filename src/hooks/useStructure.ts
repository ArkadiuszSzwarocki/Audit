import { useState, useEffect, useCallback } from 'react';

export interface Area {
  id: string;
  name: string;
  description: string | null;
}

export interface Machine {
  id: string;
  name: string;
  description: string | null;
  areaId: string;
}

export function useStructure() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAreas = useCallback(async () => {
    try {
      const res = await fetch('/api/areas');
      if (!res.ok) throw new Error('Nie udało się pobrać rejonów');
      const data = await res.json();
      setAreas(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const fetchMachines = useCallback(async () => {
    try {
      const res = await fetch('/api/machines');
      if (!res.ok) throw new Error('Nie udało się pobrać maszyn');
      const data = await res.json();
      setMachines(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const loadData = useCallback(async (showLoading?: boolean) => {
    const isFirstLoad = showLoading !== undefined ? showLoading : false;
    if (isFirstLoad) setLoading(true);
    await Promise.all([fetchAreas(), fetchMachines()]);
    if (isFirstLoad) setLoading(false);
  }, [fetchAreas, fetchMachines]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const addArea = async (name: string, description?: string) => {
    const res = await fetch('/api/areas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Błąd dodawania rejonu');
    }
    await fetchAreas();
  };

  const addMachine = async (name: string, areaId: string, description?: string) => {
    const res = await fetch('/api/machines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, areaId, description }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Błąd dodawania maszyny');
    }
    await fetchMachines();
  };

  const deleteArea = async (id: string) => {
    const res = await fetch(`/api/areas/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Nie udało się usunąć rejonu');
    }
    await loadData(false);
  };

  const deleteMachine = async (id: string) => {
    const res = await fetch(`/api/machines/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Nie udało się usunąć maszyny');
    }
    await loadData(false);
  };

  return {
    areas,
    machines,
    loading,
    error,
    addArea,
    addMachine,
    deleteArea,
    deleteMachine,
    refresh: loadData
  };
}

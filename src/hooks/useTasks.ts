import { useState, useCallback } from 'react';

export interface PendingObservation {
  id: string;
  auditId: string;
  description: string;
  aiSuggestion: string | null;
  photoUrl: string | null;
  isFixed: boolean;
  createdAt: string;
  audit: {
    title: string;
    area: { name: string };
    machine: { name: string } | null;
  };
}

export function useTasks() {
  const [tasks, setTasks] = useState<PendingObservation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (showLoading?: boolean) => {
    const isFirstLoad = showLoading !== undefined ? showLoading : false;
    if (isFirstLoad) setLoading(true);
    try {
      const res = await fetch('/api/observations?status=pending');
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  }, []);

  const resolveTask = async (id: string, fixedBy: string, fixPhotoUrl?: string) => {
    const res = await fetch('/api/observations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, fixedBy, fixPhotoUrl }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Błąd podczas zamykania zadania');
    }
    await fetchTasks(false);
  };

  return {
    tasks,
    loading,
    fetchTasks,
    resolveTask
  };
}

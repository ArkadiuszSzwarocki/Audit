import { useState, useCallback } from 'react';
import { Observation } from './useAudits';

export function useObservations() {
  const [pendingObservations, setPendingObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingObservations = useCallback(async (showLoading?: boolean) => {
    const isFirstLoad = showLoading !== undefined ? showLoading : false;
    if (isFirstLoad) setLoading(true);
    try {
      setError(null);
      const res = await fetch('/api/observations?status=pending');
      
      if (!res.ok) {
        throw new Error(`API Error: ${res.status} ${res.statusText}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setPendingObservations(data);
      } else {
        setPendingObservations([]);
        throw new Error('Unexpected API response format');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Błąd pobierania spostrzeżeń';
      console.error('Błąd pobierania spostrzeżeń:', err);
      setError(errorMsg);
      setPendingObservations([]);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  }, []);

  const fixObservation = async (id: string, fixedBy: string, fixPhotoUrl?: string, operatorComment?: string) => {
    const res = await fetch('/api/observations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, fixedBy, fixPhotoUrl, operatorComment }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Wystąpił błąd podczas zatwierdzania naprawy');
    }
    
    // Refresh the list after successful fix silently
    await fetchPendingObservations(false);
  };

  const deleteObservation = async (id: string) => {
    const res = await fetch(`/api/observations?id=${id}`, {
      method: 'DELETE',
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Wystąpił błąd podczas usuwania zgłoszenia');
    }
    
    // Refresh the list after successful deletion silently
    await fetchPendingObservations(false);
  };

  const assignObservation = async (id: string, assignedToId: string | null) => {
    const res = await fetch(`/api/observations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedToId }),
    });
    
    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || 'Wystąpił błąd podczas przypisywania zgłoszenia');
    }
    
    await fetchPendingObservations(false);
  };

  return {
    pendingObservations,
    loading,
    error,
    fetchPendingObservations,
    fixObservation,
    deleteObservation,
    assignObservation
  };
}

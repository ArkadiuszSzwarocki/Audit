'use client';

import { useState, useCallback } from 'react';

export interface Department {
  id: string;
  name: string;
  shiftMode: number;
  createdAt: string;
  updatedAt: string;
  users?: Array<{
    id: string;
    login: string;
    name: string;
  }>;
}

export function useDepartments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobiera wszystkie działy
  const fetchDepartments = useCallback(async (includeUsers: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const query = includeUsers ? '?withUsers=true' : '';
      const response = await fetch(`/api/departments${query}`);

      if (!response.ok) {
        throw new Error('Nie udało się pobrać działów');
      }

      const data = await response.json();
      setDepartments(data);
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Tworzy nowy dział
  const createDepartment = useCallback(
    async (data: { name: string; shiftMode?: number }) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/departments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: data.name,
            shiftMode: data.shiftMode || 3
          })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Błąd przy tworzeniu działu');
        }

        const result = await response.json();
        await fetchDepartments();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fetchDepartments]
  );

  return {
    departments,
    loading,
    error,
    fetchDepartments,
    createDepartment
  };
}

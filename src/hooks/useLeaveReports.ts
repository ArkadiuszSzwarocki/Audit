import { useState, useCallback } from 'react';

export function useLeaveReports() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployeeUtilization = useCallback(async (year?: number, departmentId?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/leave-reports', window.location.origin);
      url.searchParams.append('action', 'employee-utilization');
      if (year) url.searchParams.append('year', year.toString());
      if (departmentId) url.searchParams.append('departmentId', departmentId);

      const response = await fetch(url);
      if (!response.ok) throw new Error('Błąd pobierania raportu');

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDepartmentSummary = useCallback(async (year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/leave-reports', window.location.origin);
      url.searchParams.append('action', 'department-summary');
      if (year) url.searchParams.append('year', year.toString());

      const response = await fetch(url);
      if (!response.ok) throw new Error('Błąd pobierania raportu');

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyTrend = useCallback(async (year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/leave-reports', window.location.origin);
      url.searchParams.append('action', 'monthly-trend');
      if (year) url.searchParams.append('year', year.toString());

      const response = await fetch(url);
      if (!response.ok) throw new Error('Błąd pobierania raportu');

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLeaveTypes = useCallback(async (year?: number) => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/leave-reports', window.location.origin);
      url.searchParams.append('action', 'leave-types');
      if (year) url.searchParams.append('year', year.toString());

      const response = await fetch(url);
      if (!response.ok) throw new Error('Błąd pobierania raportu');

      const data = await response.json();
      return { success: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const exportToCSV = useCallback(async (data: any[], filename: string) => {
    try {
      const response = await fetch('/api/leave-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export-csv',
          data
        })
      });

      if (!response.ok) throw new Error('Błąd eksportu');

      const result = await response.json();
      
      // Utwórz CSV blob i pobierz
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = filename || result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Nieznany błąd';
      setError(message);
      return { success: false, error: message };
    }
  }, []);

  return {
    loading,
    error,
    fetchEmployeeUtilization,
    fetchDepartmentSummary,
    fetchMonthlyTrend,
    fetchLeaveTypes,
    exportToCSV
  };
}

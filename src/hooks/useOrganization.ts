'use client';

import { useState, useCallback, useEffect } from 'react';

export interface Position {
  id: string;
  name: string;
  level: number;
  description?: string;
  permissions?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  shiftMode: number;
  parentDepartmentId?: string;
  headId?: string;
  head?: {
    id: string;
    name: string;
    login: string;
  };
  parentDepartment?: {
    id: string;
    name: string;
  };
  childDepartments?: Department[];
  users?: Array<{
    id: string;
    name: string;
    login: string;
  }>;
}

export interface ApprovalLevel {
  level: number;
  approverPositionId: string;
  autoApprove?: boolean;
}

export function useOrganization() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [structure, setStructure] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pobiera wszystkie stanowiska
  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/organization?action=positions');
      if (!response.ok) throw new Error('Nie udało się pobrać stanowisk');
      const data = await response.json();
      setPositions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
    }
  }, []);

  // Pobiera całą hierarchię organizacyjną
  const fetchStructure = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/organization?action=structure');
      if (!response.ok) throw new Error('Nie udało się pobrać struktury');
      const data = await response.json();
      setStructure(data);
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nieznany błąd');
    } finally {
      setLoading(false);
    }
  }, []);

  // Tworzy nowe stanowisko
  const createPosition = useCallback(
    async (data: { name: string; description?: string; level: number; permissions?: string }) => {
      try {
        const response = await fetch('/api/organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create-position', data })
        });
        if (!response.ok) throw new Error('Błąd tworzenia stanowiska');
        const position = await response.json();
        setPositions(prev => [...prev, position].sort((a, b) => a.level - b.level));
        return { success: true, position };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        return { success: false, error: message };
      }
    },
    []
  );

  // Tworzy nowy departament
  const createDepartment = useCallback(
    async (data: {
      name: string;
      description?: string;
      shiftMode?: number;
      parentDepartmentId?: string;
      headId?: string;
    }) => {
      try {
        const response = await fetch('/api/organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'create-department', data })
        });
        if (!response.ok) throw new Error('Błąd tworzenia departamentu');
        const department = await response.json();
        
        // Odśwież strukturę
        await fetchStructure();
        return { success: true, department };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        return { success: false, error: message };
      }
    },
    [fetchStructure]
  );

  // Przypisuje kierownika do departamentu
  const assignHeadToDepartment = useCallback(
    async (departmentId: string, userId: string) => {
      try {
        const response = await fetch('/api/organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'assign-head', departmentId, userId })
        });
        if (!response.ok) throw new Error('Błąd przypisania kierownika');
        const result = await response.json();
        
        // Odśwież strukturę
        await fetchStructure();
        return { success: true, result };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        return { success: false, error: message };
      }
    },
    [fetchStructure]
  );

  // Przypisuje pracownika do departamentu
  const assignEmployeeToDepartment = useCallback(
    async (data: {
      userId: string;
      departmentId: string;
      managerId?: string;
      positionId?: string;
      shiftMode?: number;
    }) => {
      try {
        const response = await fetch('/api/organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'assign-employee', data })
        });
        if (!response.ok) throw new Error('Błąd przypisania pracownika');
        const result = await response.json();
        
        // Odśwież strukturę
        await fetchStructure();
        return { success: true, result };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        return { success: false, error: message };
      }
    },
    [fetchStructure]
  );

  // Konfiguruje łańcuch zatwierdzania
  const setupApprovalChain = useCallback(
    async (departmentId: string, approvalLevels: ApprovalLevel[]) => {
      try {
        const response = await fetch('/api/organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'setup-approval-chain',
            data: { departmentId, approvalLevels }
          })
        });
        if (!response.ok) throw new Error('Błąd konfiguracji łańcucha zatwierdzania');
        const chain = await response.json();
        return { success: true, chain };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        return { success: false, error: message };
      }
    },
    []
  );

  // Pobiera łańcuch zatwierdzania dla departamentu
  const getApprovalChain = useCallback(
    async (departmentId: string) => {
      try {
        const response = await fetch('/api/organization', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get-approval-chain', departmentId })
        });
        if (!response.ok) throw new Error('Błąd pobierania łańcucha zatwierdzania');
        const chain = await response.json();
        return { success: true, chain };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Nieznany błąd';
        return { success: false, error: message };
      }
    },
    []
  );

  return {
    departments,
    positions,
    structure,
    loading,
    error,
    fetchPositions,
    fetchStructure,
    createPosition,
    createDepartment,
    assignHeadToDepartment,
    assignEmployeeToDepartment,
    setupApprovalChain,
    getApprovalChain
  };
}

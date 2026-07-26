import { useState, useCallback } from 'react';

export interface User {
  id: string;
  login: string;
  name: string;
  role: string;
  isKaizenCommittee?: boolean;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = useCallback(async (showLoading?: boolean) => {
    const isFirstLoad = showLoading !== undefined ? showLoading : false;
    if (isFirstLoad) setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Błąd pobierania użytkowników:', error);
    } finally {
      if (isFirstLoad) setLoading(false);
    }
  }, []);

  return { users, loading, fetchUsers };
}

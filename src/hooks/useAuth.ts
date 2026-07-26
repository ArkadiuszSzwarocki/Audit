'use client';

import { useState, useEffect } from 'react';

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isKaizenCommittee, setIsKaizenCommittee] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; role: string; login?: string; isKaizenCommittee?: boolean; notifyBhp?: boolean; notifyQuality?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check');
      const data = await res.json();
      const userRoleUpper = String(data.user?.role || '').toUpperCase();
      const isCommittee = Boolean(
        data.isKaizenCommittee ||
        data.user?.isKaizenCommittee ||
        data.isAdmin ||
        userRoleUpper === 'KOMISJA KAIZEN' ||
        userRoleUpper === 'KOMISJA_KAIZEN' ||
        userRoleUpper === 'KAIZEN_COMMITTEE'
      );
      
      setIsAdmin(data.isAdmin || false);
      setIsKaizenCommittee(isCommittee);
      setUser(data.user || null);
    } catch (error) {
      setIsAdmin(false);
      setIsKaizenCommittee(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginStr: string, passwordStr: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login: loginStr, password: passwordStr })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Błąd logowania');
    }
    setIsAdmin(true);
    checkAuth();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setIsAdmin(false);
    setIsKaizenCommittee(false);
    setUser(null);
    window.location.href = '/logowanie';
  };

  return { isAdmin, isKaizenCommittee, user, loading, login, logout, checkAuth };
}

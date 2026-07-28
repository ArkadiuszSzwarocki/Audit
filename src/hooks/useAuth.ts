'use client';

import { useState, useEffect } from 'react';

const normalizeRole = (role?: string | null) => String(role || '').replace(/[^a-z0-9]/gi, '').toUpperCase();

export function useAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isKaizenCommittee, setIsKaizenCommittee] = useState(false);
  const [user, setUser] = useState<{ id: string; name: string; role: string; login?: string; isKaizenCommittee?: boolean; notifyBhp?: boolean; notifyQuality?: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const updateAuthState = (data: any) => {
    const userRoleUpper = normalizeRole(data.user?.role);
    const isCommittee = Boolean(
      data.isKaizenCommittee ||
      data.user?.isKaizenCommittee ||
      data.isAdmin ||
      userRoleUpper === 'KOMISJAKAIZEN' ||
      userRoleUpper === 'KAIZENCOMMITTEE'
    );
    const isAdminRole = Boolean(
      data.isAdmin ||
      userRoleUpper === 'ADMIN' ||
      userRoleUpper === 'ADMINISTRATOR' ||
      userRoleUpper === 'ZARZAD' ||
      userRoleUpper === 'BOARD'
    );

    setIsAdmin(isAdminRole);
    setIsKaizenCommittee(isCommittee);
    setUser(data.user || null);
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/check', {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = await res.json();
      updateAuthState(data);
      return data;
    } catch (error) {
      setIsAdmin(false);
      setIsKaizenCommittee(false);
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const login = async (loginStr: string, passwordStr: string) => {
    setLoading(true);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ login: loginStr, password: passwordStr })
    });
    if (!res.ok) {
      const data = await res.json();
      setLoading(false);
      throw new Error(data.error || 'Błąd logowania');
    }

    const data = await res.json();
    const normalizedUser = {
      ...data.user,
      role: data.user?.role || 'USER',
    };

    const authCheckRes = await fetch('/api/auth/check', { credentials: 'include', cache: 'no-store' });
    if (authCheckRes.ok) {
      const authData = await authCheckRes.json();
      updateAuthState(authData);
      setLoading(false);
      return authData.user;
    }

    updateAuthState({
      isAdmin: normalizedUser.role === 'ADMIN' || normalizedUser.role === 'ADMINISTRATOR' || normalizedUser.role === 'ZARZAD' || normalizedUser.role === 'ZARZĄD' || normalizedUser.role === 'BOARD',
      isKaizenCommittee: false,
      user: normalizedUser,
    });

    setLoading(false);
    return normalizedUser;
  };

  const logout = async () => {
    setLoading(true);
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setIsAdmin(false);
    setIsKaizenCommittee(false);
    setUser(null);
    window.location.href = '/logowanie';
  };

  return { isAdmin, isKaizenCommittee, user, loading, login, logout, checkAuth };
}

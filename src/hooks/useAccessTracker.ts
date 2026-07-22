'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AccessTrackerProps {
  entityType: 'AUDIT' | 'TASK' | 'KAIZEN' | 'FAULT';
  entityId: string | null | undefined;
  entityTitle: string | null | undefined;
}

export function useAccessTracker({ entityType, entityId, entityTitle }: AccessTrackerProps) {
  const { user, loading: authLoading } = useAuth();
  const logIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const trackedEntityIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!entityId || authLoading) return;

    // Prevent duplicate open logs for the same entity in the same mount cycle
    if (trackedEntityIdRef.current === entityId && logIdRef.current) {
      // If title updated, update the log title on server
      if (entityTitle && entityTitle !== 'Dokument') {
        fetch('/api/access-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'update_title',
            logId: logIdRef.current,
            entityTitle,
          }),
        }).catch(() => {});
      }
      return;
    }

    trackedEntityIdRef.current = entityId;
    startTimeRef.current = Date.now();

    const effectiveUser = user || { login: 'admin', name: 'Administrator' };
    const userLogin = (effectiveUser.login || effectiveUser.name || 'użytkownik').trim();
    const userName = (effectiveUser.name || userLogin).trim();

    // 1. Send OPEN log
    fetch('/api/access-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'open',
        userLogin,
        userName,
        entityType,
        entityId,
        entityTitle: entityTitle || 'Dokument',
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data && data.logId) {
          logIdRef.current = data.logId;
        }
      })
      .catch((err) => console.error('Błąd rejestracji dostępu:', err));

    // 2. Heartbeat interval every 5 seconds
    const interval = setInterval(() => {
      if (!logIdRef.current) return;
      const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);

      fetch('/api/access-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          logId: logIdRef.current,
          durationSec,
        }),
      }).catch(() => {});
    }, 5000);

    // 3. Cleanup on unmount
    return () => {
      clearInterval(interval);
      if (logIdRef.current) {
        const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const payload = JSON.stringify({
          action: 'close',
          logId: logIdRef.current,
          durationSec,
        });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/access-logs', blob);
      }
    };
  }, [entityType, entityId, entityTitle, user?.login, user?.name, authLoading]);
}

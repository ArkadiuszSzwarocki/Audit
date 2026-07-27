'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface AccessTrackerProps {
  entityType: 'AUDIT' | 'TASK' | 'KAIZEN' | 'FAULT' | 'BHP' | 'QUALITY';
  entityId: string | null | undefined;
  entityTitle: string | null | undefined;
}

export function useAccessTracker({ entityType, entityId, entityTitle }: AccessTrackerProps) {
  const { user, loading: authLoading } = useAuth();
  const logIdRef = useRef<string | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const trackedEntityIdRef = useRef<string | null>(null);
  const actionCountRef = useRef<number>(0);
  const actionTypesRef = useRef<Set<string>>(new Set());

  // Funkcja do obliczania engagement level na podstawie czasu + akcji
  const calculateEngagementLevel = (durationSec: number, actionCount: number): string => {
    // ANALYZED: 60+ sekund lub ponad 3 akcje
    if (durationSec >= 60 || actionCount >= 3) return 'ANALYZED';
    // REVIEWED: 30-60 sekund lub 1-2 akcje
    if (durationSec >= 30 || actionCount >= 1) return 'REVIEWED';
    // SKIMMED: poniżej 30 sekund i bez akcji
    return 'SKIMMED';
  };

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
    actionCountRef.current = 0;
    actionTypesRef.current = new Set();

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

    // 2. Track user actions on the page
    const handleScroll = () => {
      actionTypesRef.current.add('scroll');
      actionCountRef.current += 1;
    };

    const handleImageOpen = () => {
      actionTypesRef.current.add('image_open');
      actionCountRef.current += 1;
    };

    const handlePrint = () => {
      actionTypesRef.current.add('print');
      actionCountRef.current += 1;
    };

    const handleTabChange = () => {
      actionTypesRef.current.add('tab_change');
      actionCountRef.current += 1;
    };

    // Attach event listeners
    window.addEventListener('scroll', handleScroll);
    
    // Listen for custom events from components
    window.addEventListener('kaizen:image_open', handleImageOpen);
    window.addEventListener('kaizen:print', handlePrint);
    window.addEventListener('kaizen:tab_change', handleTabChange);

    // 3. Heartbeat interval every 5 seconds
    const interval = setInterval(() => {
      if (!logIdRef.current) return;
      const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const engagementLevel = calculateEngagementLevel(durationSec, actionCountRef.current);

      fetch('/api/access-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'heartbeat',
          logId: logIdRef.current,
          durationSec,
          actionCount: actionCountRef.current,
          actionTypes: Array.from(actionTypesRef.current),
          engagementLevel,
        }),
      }).catch(() => {});
    }, 5000);

    // 4. Cleanup on unmount
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('kaizen:image_open', handleImageOpen);
      window.removeEventListener('kaizen:print', handlePrint);
      window.removeEventListener('kaizen:tab_change', handleTabChange);

      if (logIdRef.current) {
        const durationSec = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const engagementLevel = calculateEngagementLevel(durationSec, actionCountRef.current);
        const payload = JSON.stringify({
          action: 'close',
          logId: logIdRef.current,
          durationSec,
          actionCount: actionCountRef.current,
          actionTypes: Array.from(actionTypesRef.current),
          engagementLevel,
        });
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon('/api/access-logs', blob);
      }
    };
  }, [entityType, entityId, entityTitle, user?.login, user?.name, authLoading]);
}

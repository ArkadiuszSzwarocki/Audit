'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  requestNotificationPermission,
  sendDesktopNotification,
  isNotificationSeen,
  markNotificationSeen,
} from '@/utils/desktopNotification';

interface PollItem {
  id: string;
  module: 'FAULT' | 'BHP' | 'QUALITY' | 'TASK' | 'KAIZEN';
  moduleLabel: string;
  title: string;
  status?: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  url: string;
}

export function useDesktopNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isEnabled, setIsEnabled] = useState(false);
  const isInitializedRef = useRef(false);
  const knownItemsRef = useRef<Map<string, { updatedAt: string; status?: string; dueDate?: string | null }>>(new Map());

  const handleRequestPermission = useCallback(async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      setIsEnabled(true);
      sendDesktopNotification({
        title: '🔔 Powiadomienia Systemowe Włączone',
        body: 'Otrzymasz powiadomienie koło zegarka Windows za każdym razem, gdy zostanie dodane lub zmienione zgłoszenie.',
        requireInteraction: true,
        onClickUrl: '/',
      });
    }
    return res;
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        setIsEnabled(true);
      }
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const checkUpdates = async () => {
      try {
        const res = await fetch('/api/notifications/poll');
        if (!res.ok) return;
        const data = await res.json();
        const items: PollItem[] = data.items || [];

        // First run: populate knownItemsRef without firing notifications
        if (!isInitializedRef.current) {
          items.forEach((item) => {
            knownItemsRef.current.set(item.id, {
              updatedAt: item.updatedAt,
              status: item.status,
              dueDate: item.dueDate,
            });
          });
          isInitializedRef.current = true;
          return;
        }

        // Subsequent runs: compare items
        items.forEach((item) => {
          const previous = knownItemsRef.current.get(item.id);

          if (!previous) {
            // New item created!
            knownItemsRef.current.set(item.id, {
              updatedAt: item.updatedAt,
              status: item.status,
              dueDate: item.dueDate,
            });

            const notifKey = `new_${item.id}_${item.createdAt}`;
            if (Notification.permission === 'granted' && !isNotificationSeen(notifKey)) {
              markNotificationSeen(notifKey);
              sendDesktopNotification({
                title: `🚨 Nowe zgłoszenie: ${item.moduleLabel}`,
                body: `${item.title}\nPowiadomienie oczekuje na Twoją reakcję.`,
                onClickUrl: item.url,
                tag: `audit-new-${item.id}`,
                requireInteraction: true, // Notification banner stays near clock!
              });
            }
          } else if (new Date(item.updatedAt).getTime() > new Date(previous.updatedAt).getTime() + 1000) {
            // Item updated!
            knownItemsRef.current.set(item.id, {
              updatedAt: item.updatedAt,
              status: item.status,
              dueDate: item.dueDate,
            });

            const notifKey = `update_${item.id}_${item.updatedAt}`;
            if (Notification.permission === 'granted' && !isNotificationSeen(notifKey)) {
              markNotificationSeen(notifKey);
              const changeInfo = item.status ? ` [Status: ${item.status}]` : '';
              sendDesktopNotification({
                title: `📝 Zmiana w zgłoszeniu: ${item.moduleLabel}`,
                body: `${item.title}${changeInfo}\nZostały wprowadzone nowe modyfikacje. Kliknij, aby otworzyć.`,
                onClickUrl: item.url,
                tag: `audit-update-${item.id}`,
                requireInteraction: true, // Notification banner stays near clock!
              });
            }
          }
        });
      } catch (err) {
        console.error('Błąd sprawdzania powiadomień:', err);
      }
    };

    // Run initial check and set interval
    checkUpdates();
    timer = setInterval(checkUpdates, 10000);

    return () => clearInterval(timer);
  }, []);

  return {
    permission,
    isEnabled,
    requestPermission: handleRequestPermission,
  };
}

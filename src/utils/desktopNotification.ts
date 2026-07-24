/**
 * Web Desktop Notifications utility for Windows OS notification integration.
 * Provides native Windows desktop notifications (near the clock/System Tray)
 * with mandatory interaction persistence (requireInteraction: true).
 */

export interface DesktopNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  onClickUrl?: string;
  requireInteraction?: boolean;
}

/**
 * Play a gentle double-beep notification sound using Web Audio API (no external file dependencies).
 */
export function playNotificationSound(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const playBeep = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);

      gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };

    // Double chime effect
    playBeep(659.25, 0.0, 0.15); // E5
    playBeep(880.0, 0.12, 0.25);  // A5
  } catch (err) {
    console.error('Audio chime error:', err);
  }
}

/**
 * Request desktop notification permission from browser.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
}

// Global window cache to prevent duplicate notification sounds and banners across tabs
const getSeenKeys = (): Set<string> => {
  if (typeof window === 'undefined') return new Set();
  if (!(window as any).__seen_audit_notifications) {
    (window as any).__seen_audit_notifications = new Set<string>();
  }
  return (window as any).__seen_audit_notifications;
};

export function isNotificationSeen(key: string): boolean {
  const seen = getSeenKeys();
  if (seen.has(key)) return true;
  // Also check sessionStorage for cross-tab persistence in same browser session
  try {
    const sSeen = sessionStorage.getItem(`audit_notif_seen_${key}`);
    if (sSeen) {
      seen.add(key);
      return true;
    }
  } catch {}
  return false;
}

export function markNotificationSeen(key: string): void {
  const seen = getSeenKeys();
  seen.add(key);
  try {
    sessionStorage.setItem(`audit_notif_seen_${key}`, '1');
  } catch {}
}

/**
 * Send a native Windows desktop notification banner next to the clock.
 * Sets requireInteraction: true so it waits for user interaction/close.
 */
export function sendDesktopNotification(options: DesktopNotificationOptions): Notification | null {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return null;
  }

  if (Notification.permission !== 'granted') {
    return null;
  }

  try {
    const tag = options.tag || `audit-notif-${options.title.replace(/\s+/g, '_')}`;

    // Sound and Notification options
    playNotificationSound();

    const notifOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: tag, // Windows uses tag to replace/merge duplicate notifications!
      requireInteraction: options.requireInteraction ?? true, // Notification waits for user to close it!
      silent: false,
    };

    const notification = new Notification(options.title, notifOptions);

    if (options.onClickUrl) {
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        window.location.href = options.onClickUrl!;
        notification.close();
      };
    }

    return notification;
  } catch (err) {
    console.error('Błąd podczas wysyłania powiadomienia systemowego:', err);
    return null;
  }
}

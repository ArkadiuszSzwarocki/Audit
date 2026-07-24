/**
 * Helper utilities for BHP Training Expiration & Calendar Days Notifications.
 * Includes all calendar days (Saturdays and Sundays included).
 */

export function getRemainingCalendarDays(dueDateInput: Date | string, fromDateInput: Date | string = new Date()): number {
  if (!dueDateInput) return 9999;
  const dueDate = new Date(dueDateInput);
  const fromDate = new Date(fromDateInput);

  // Normalize to start of day (midnight)
  const dStart = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
  const dEnd = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

  const diffMs = dEnd.getTime() - dStart.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Backward compatibility alias
export const getRemainingBusinessDays = getRemainingCalendarDays;

/**
 * Supported notification thresholds (in calendar days):
 * 30, 20, 15, 10, 5, 4, 3, 2, 1, 0 (expired)
 */
export function getActiveBhpThreshold(remainingDays: number): number | null {
  if (remainingDays > 30) return null;
  if (remainingDays <= 0) return 0;
  if (remainingDays <= 1) return 1;
  if (remainingDays <= 2) return 2;
  if (remainingDays <= 3) return 3;
  if (remainingDays <= 4) return 4;
  if (remainingDays <= 5) return 5;
  if (remainingDays <= 10) return 10;
  if (remainingDays <= 15) return 15;
  if (remainingDays <= 20) return 20;
  if (remainingDays <= 30) return 30;
  return null;
}

export function shouldShowBhpNotice(
  dueDateInput?: Date | string | null,
  dismissedThreshold?: number | null
): { show: boolean; activeThreshold: number | null; remainingDays: number; remainingBusinessDays: number } {
  if (!dueDateInput) {
    return { show: false, activeThreshold: null, remainingDays: 9999, remainingBusinessDays: 9999 };
  }

  const remainingDays = getRemainingCalendarDays(dueDateInput);
  const activeThreshold = getActiveBhpThreshold(remainingDays);

  if (activeThreshold === null) {
    return { show: false, activeThreshold: null, remainingDays, remainingBusinessDays: remainingDays };
  }

  // If user dismissed this exact threshold or a stricter/equal threshold, don't show
  if (dismissedThreshold !== null && dismissedThreshold !== undefined && dismissedThreshold <= activeThreshold) {
    return { show: false, activeThreshold, remainingDays, remainingBusinessDays: remainingDays };
  }

  return { show: true, activeThreshold, remainingDays, remainingBusinessDays: remainingDays };
}

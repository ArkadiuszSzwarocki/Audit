export interface IfsChecklistItem {
  questionId: string;
  status: 'PENDING' | 'OK' | 'NOK' | 'GOOD_PRACTICE' | 'NA';
  severity?: string | null;
  isKnockOut?: boolean;
}

export interface IfsScoreResult {
  totalQuestions: number;
  answeredQuestions: number;
  applicableQuestions: number;
  maxPossiblePoints: number;
  totalEarnedPoints: number;
  percentage: number;
  hasKoViolation: boolean;
  koCount: number;
  level: 'HIGHER_LEVEL' | 'FOUNDATION_LEVEL' | 'FAILED' | 'PENDING';
  levelLabel: string;
  levelColor: string;
  badgeBg: string;
}

export function calculateIfsScore(checklist: IfsChecklistItem[]): IfsScoreResult {
  const totalQuestions = checklist.length;
  const answeredQuestions = checklist.filter(q => q.status !== 'PENDING').length;
  const applicableList = checklist.filter(q => q.status !== 'NA');
  const applicableQuestions = applicableList.length;

  if (totalQuestions === 0 || answeredQuestions === 0) {
    return {
      totalQuestions,
      answeredQuestions,
      applicableQuestions,
      maxPossiblePoints: 0,
      totalEarnedPoints: 0,
      percentage: 0,
      hasKoViolation: false,
      koCount: 0,
      level: 'PENDING',
      levelLabel: 'W trakcie oceny (Brak ocen)',
      levelColor: 'text-slate-400',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-700',
    };
  }

  let totalEarnedPoints = 0;
  let koCount = 0;

  applicableList.forEach(q => {
    if (q.status === 'OK' || q.status === 'GOOD_PRACTICE') {
      totalEarnedPoints += 20;
    } else if (q.status === 'NOK') {
      const sev = (q.severity || '').toLowerCase();
      const isKO = q.isKnockOut || sev.includes('ko') || sev.includes('knock-out');

      if (isKO) {
        koCount += 1;
        totalEarnedPoints -= 20;
      } else if (sev.includes('krytycz')) {
        totalEarnedPoints -= 20;
      } else if (sev.includes('umiark')) {
        totalEarnedPoints += 5;
      } else if (sev.includes('mało') || sev.includes('drobne')) {
        totalEarnedPoints += 15;
      }
    }
  });

  const maxPossiblePoints = applicableQuestions * 20;
  const rawPercentage = maxPossiblePoints > 0 ? Math.round((totalEarnedPoints / maxPossiblePoints) * 100) : 0;
  const percentage = Math.max(0, Math.min(100, rawPercentage));
  const hasKoViolation = koCount > 0;

  if (hasKoViolation) {
    return {
      totalQuestions,
      answeredQuestions,
      applicableQuestions,
      maxPossiblePoints,
      totalEarnedPoints,
      percentage,
      hasKoViolation,
      koCount,
      level: 'FAILED',
      levelLabel: `🔴 AUDYT NIEZDANY (${percentage}%) — Naruszenie KO (${koCount})`,
      levelColor: 'text-red-500',
      badgeBg: 'bg-red-950 text-red-300 border-red-700 animate-pulse',
    };
  }

  if (percentage >= 95) {
    return {
      totalQuestions,
      answeredQuestions,
      applicableQuestions,
      maxPossiblePoints,
      totalEarnedPoints,
      percentage,
      hasKoViolation: false,
      koCount: 0,
      level: 'HIGHER_LEVEL',
      levelLabel: `🥇 IFS Poziom Wyższy (${percentage}%)`,
      levelColor: 'text-emerald-400',
      badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-600',
    };
  }

  if (percentage >= 75) {
    return {
      totalQuestions,
      answeredQuestions,
      applicableQuestions,
      maxPossiblePoints,
      totalEarnedPoints,
      percentage,
      hasKoViolation: false,
      koCount: 0,
      level: 'FOUNDATION_LEVEL',
      levelLabel: `🥈 IFS Poziom Podstawowy (${percentage}%)`,
      levelColor: 'text-amber-400',
      badgeBg: 'bg-amber-950 text-amber-300 border-amber-600',
    };
  }

  return {
    totalQuestions,
    answeredQuestions,
    applicableQuestions,
    maxPossiblePoints,
    totalEarnedPoints,
    percentage,
    hasKoViolation: false,
    koCount: 0,
    level: 'FAILED',
    levelLabel: `🔴 AUDYT NIEZDANY (${percentage}%) — Poniżej 75%`,
    levelColor: 'text-red-400',
    badgeBg: 'bg-red-950 text-red-300 border-red-700',
  };
}

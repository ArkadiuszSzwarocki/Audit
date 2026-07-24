'use client';

import React, { useEffect, useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { shouldShowBhpNotice } from '@/utils/bhpDateUtils';
import Link from 'next/link';

interface ExpiringEmployeeNotice {
  userName: string;
  userRole: string;
  trainingName: string;
  remainingDays: number;
  isExpired: boolean;
}

export function BhpTrainingNoticeModal() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [noticeData, setNoticeData] = useState<{
    show: boolean;
    dueDate: string | null;
    trainingTitle?: string;
    remainingBusinessDays: number;
    activeThreshold: number | null;
  }>({
    show: false,
    dueDate: null,
    trainingTitle: 'Szkolenie BHP',
    remainingBusinessDays: 9999,
    activeThreshold: null,
  });

  // Manager alert state
  const [managerAlerts, setManagerAlerts] = useState<ExpiringEmployeeNotice[]>([]);
  const [showManagerAlert, setShowManagerAlert] = useState(false);

  const [loading, setLoading] = useState(true);

  const userRoleUpper = String(user?.role || '').toUpperCase();
  const isManager =
    userRoleUpper.includes('ADMIN') ||
    userRoleUpper.includes('ZARZAD') ||
    userRoleUpper.includes('ZARZĄD') ||
    userRoleUpper.includes('KONTROLA') ||
    userRoleUpper.includes('JAKOSC') ||
    userRoleUpper.includes('AUDYT') ||
    userRoleUpper.includes('BHP');

  useEffect(() => {
    fetchProfileAndAlerts();
  }, [user]);

  const fetchProfileAndAlerts = async () => {
    try {
      // 1. Fetch Personal Profile Training & Medical Notices
      const res = await fetch('/api/user-profile');
      if (res.ok) {
        const data = await res.json();
        
        let mostUrgentDueDate = data.bhpTrainingDueDate || null;
        let mostUrgentTitle = 'Szkolenie BHP';

        if (Array.isArray(data.trainings) && data.trainings.length > 0) {
          let minDays = 9999;
          data.trainings.forEach((t: any) => {
            if (t.dueDate) {
              const checkDays = shouldShowBhpNotice(t.dueDate, data.dismissedBhpNoticeThreshold).remainingBusinessDays;
              if (checkDays < minDays) {
                minDays = checkDays;
                mostUrgentDueDate = t.dueDate;
                mostUrgentTitle = t.trainingType?.name || 'Szkolenie / Badanie';
              }
            }
          });
        }

        if (mostUrgentDueDate) {
          const check = shouldShowBhpNotice(mostUrgentDueDate, data.dismissedBhpNoticeThreshold);
          setNoticeData({
            show: check.show,
            dueDate: mostUrgentDueDate,
            trainingTitle: mostUrgentTitle,
            remainingBusinessDays: check.remainingBusinessDays,
            activeThreshold: check.activeThreshold,
          });
        }
      }

      // 2. Fetch Manager Alerts for ADMIN, ZARZĄD, KONTROLA JAKOŚCI, BHP
      if (isManager) {
        const trainRes = await fetch('/api/user-trainings');
        if (trainRes.ok) {
          const trainData = await trainRes.json();
          const expiringList: ExpiringEmployeeNotice[] = trainData.summary?.expiringUsers || [];
          if (expiringList.length > 0) {
            setManagerAlerts(expiringList);
            setShowManagerAlert(true);
          }
        }
      }
    } catch (err) {
      console.error('Błąd pobierania powiadomień BHP:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissPersonal = async () => {
    if (noticeData.activeThreshold === null) return;
    try {
      const res = await fetch('/api/user-profile/bhp-dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threshold: noticeData.activeThreshold }),
      });

      if (res.ok) {
        setNoticeData((prev) => ({ ...prev, show: false }));
        showToast('Potwierdzono zapoznanie się z Twoim terminem BHP.', 'success');
      }
    } catch (err) {
      console.error('Błąd odrzucenia powiadomienia BHP:', err);
    }
  };

  if (loading) return null;

  // Render Manager Summary Alert first if present
  if (showManagerAlert && managerAlerts.length > 0) {
    const expiredCount = managerAlerts.filter((m) => m.isExpired).length;
    const expiringSoonCount = managerAlerts.filter((m) => !m.isExpired).length;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-300">
        <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-3xl shadow-2xl overflow-hidden flex flex-col space-y-4">
          <div className="p-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="text-3xl">🦺</span>
              <div>
                <div className="text-[10px] font-black uppercase text-amber-200 tracking-wider">
                  POWIADOMIENIE MENEDŻERSKIE (BHP / JAKOŚĆ / ZARZĄD)
                </div>
                <h2 className="text-lg font-black tracking-tight">
                  Wygasające Szkolenia & Badania Pracowników
                </h2>
              </div>
            </div>
            <button
              onClick={() => setShowManagerAlert(false)}
              className="text-white/80 hover:text-white font-bold text-lg p-1.5 rounded-lg"
            >
              ✕
            </button>
          </div>

          <div className="p-6 space-y-4 text-slate-800 dark:text-slate-200">
            <div className="flex items-center gap-3">
              {expiredCount > 0 && (
                <span className="px-3 py-1 bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 font-extrabold text-xs rounded-xl">
                  🚨 Minął termin: {expiredCount}
                </span>
              )}
              {expiringSoonCount > 0 && (
                <span className="px-3 py-1 bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-extrabold text-xs rounded-xl">
                  ⏳ Wygasa w 30 dni: {expiringSoonCount}
                </span>
              )}
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {managerAlerts.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{item.userName}</span>
                    <span className="text-slate-400 ml-1.5">({item.trainingName})</span>
                  </div>

                  <div>
                    {item.isExpired ? (
                      <span className="font-extrabold text-red-600 dark:text-red-400">
                        Minął termin ({Math.abs(item.remainingDays)} dni)
                      </span>
                    ) : (
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        Pozostało {item.remainingDays} dni
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {managerAlerts.length > 6 && (
                <p className="text-center text-[11px] text-slate-400 font-bold">
                  ...oraz jeszcze {managerAlerts.length - 6} pracowników.
                </p>
              )}
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <Link
                href="/struktura/szkolenia"
                onClick={() => setShowManagerAlert(false)}
                className="flex-1 py-3 px-4 bg-brand-600 hover:bg-brand-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>🦺</span> Otwarcia Ewidencji Szkoleń →
              </Link>
              <button
                type="button"
                onClick={() => setShowManagerAlert(false)}
                className="py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Zamknij powiadomienie
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Personal Notice Modal
  if (!noticeData.show || !noticeData.dueDate) return null;

  const formattedDueDate = new Date(noticeData.dueDate).toLocaleDateString('pl-PL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const isExpired = noticeData.remainingBusinessDays <= 0;
  const isUrgent = noticeData.remainingBusinessDays <= 5;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border-2 border-amber-500 dark:border-amber-600 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div
          className={`p-5 text-white flex items-center gap-4.5 ${
            isExpired
              ? 'bg-gradient-to-r from-red-600 to-rose-700'
              : isUrgent
              ? 'bg-gradient-to-r from-orange-600 to-red-600'
              : 'bg-gradient-to-r from-amber-600 to-orange-600'
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-2xl shrink-0">
            {isExpired ? '🚨' : '🦺'}
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-200 tracking-wider">
              SYSTEM BEZPIECZEŃSTWA I HIGIENY PRACY (BHP)
            </div>
            <h2 className="text-lg font-black tracking-tight leading-snug">
              {isExpired ? 'Wygasły Termin Szkolenia BHP!' : 'Przypomnienie o Szkoleniu BHP'}
            </h2>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-sm text-slate-800 dark:text-slate-200">
          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                Data Ważności Szkolenia:
              </span>
              <span className="font-mono text-base font-black text-amber-900 dark:text-amber-200">
                {formattedDueDate}
              </span>
            </div>

            <div className="flex justify-between items-center border-t border-amber-200/60 dark:border-amber-800/60 pt-2">
              <span className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400 tracking-wider">
                Pozostało dni:
              </span>
              <span
                className={`font-black text-base px-2.5 py-0.5 rounded-lg ${
                  isExpired
                    ? 'bg-red-600 text-white'
                    : isUrgent
                    ? 'bg-orange-600 text-white'
                    : 'bg-amber-500 text-white'
                }`}
              >
                {isExpired
                  ? `Przekroczono! (${Math.abs(noticeData.remainingBusinessDays)} dni)`
                  : `${noticeData.remainingBusinessDays} dni`}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {isExpired ? (
              <>
                Twoje okresowe szkolenie BHP <strong>wygasło</strong>. Prosimy o natychmiastowy kontakt z Inspektorem BHP w celu wyznaczenia nowego terminu.
              </>
            ) : (
              <>
                Zbliża się termin ważności Twojego okresowego szkolenia BHP. Prosimy o powiadomienie przełożonego oraz Działu BHP w celu odbycia odnowienia szkolenia przed upływem wyznaczonej daty.
              </>
            )}
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={handleDismissPersonal}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-600 dark:text-slate-950 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>✅</span> Tak, pamiętam — nie pokazuj ponownie
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

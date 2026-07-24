'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { openKaizenRewardPrintWindow } from '@/utils/kaizenRewardPrintBuilder';

interface PayoutRequest {
  id: string;
  docNumber: string;
  userName: string;
  userLogin?: string | null;
  bankAccount?: string | null;
  kaizenIds: string;
  kaizenTitles?: string | null;
  totalPoints: number;
  totalAmount: number;
  rewardType: string;
  notes?: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export default function KaizenWyplatyPage() {
  const { showToast } = useToast();
  const { user, isAdmin, loading: authLoading } = useAuth();

  const [payouts, setPayouts] = useState<PayoutRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isOperatorOrAuditor = !isAdmin && user?.role && ['OPERATOR', 'AUDYTOR', 'AUDITOR'].includes(user.role.toUpperCase());

  useEffect(() => {
    if (!authLoading && !isOperatorOrAuditor) {
      fetchPayouts();
    }
  }, [authLoading, isOperatorOrAuditor]);

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kaizen-payouts');
      if (res.ok) {
        const data = await res.json();
        setPayouts(Array.isArray(data) ? data : []);
      } else {
        showToast('Nie udało się pobrać listy wniosków o wypłatę', 'error');
      }
    } catch (err) {
      console.error('Błąd pobierania wypłat:', err);
      showToast('Błąd połączenia z serwerem', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    const actionText = newStatus === 'APPROVED' ? 'Zatwierdzić i Wypłacić' : 'Odrzucić';
    if (!window.confirm(`Czy na pewno chcesz ${actionText} ten wniosek o wypłatę nagrody?`)) {
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/kaizen-payouts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        showToast(
          newStatus === 'APPROVED'
            ? 'Wniosek o wypłatę został zatwierdzony. Wynagrodzenie zostało oznaczone jako rozliczone!'
            : 'Wniosek o wypłatę został odrzucony.',
          newStatus === 'APPROVED' ? 'success' : 'info'
        );
        fetchPayouts();
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Błąd aktualizacji statusu wypłaty', 'error');
      }
    } catch (err) {
      console.error('Błąd zmiany statusu wypłaty:', err);
      showToast('Błąd połączenia z serwerem', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handlePrintPreview = (p: PayoutRequest) => {
    let count = 1;
    try {
      const ids = JSON.parse(p.kaizenIds || '[]');
      count = ids.length || 1;
    } catch {}

    openKaizenRewardPrintWindow({
      docNumber: p.docNumber,
      userName: p.userName,
      userLogin: p.userLogin || p.userName,
      bankAccount: p.bankAccount || '',
      rewardType: p.rewardType,
      notes: p.notes || '',
      pointsCount: p.totalPoints,
      kaizensCount: count,
      createdAt: p.createdAt,
    });
  };

  const filteredPayouts = payouts.filter((p) => {
    if (filterStatus === 'ALL') return true;
    return p.status === filterStatus;
  });

  const pendingCount = payouts.filter((p) => p.status === 'PENDING').length;
  const approvedCount = payouts.filter((p) => p.status === 'APPROVED').length;
  const rejectedCount = payouts.filter((p) => p.status === 'REJECTED').length;

  if (!authLoading && isOperatorOrAuditor) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center space-y-4">
        <span className="text-5xl block">🔒</span>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Brak uprawnień do widoku wypłat</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Strona zatwierdzania wypłat nagród Kaizen (Załącznik nr 3) jest dostępna wyłącznie dla członków Komisji Kaizen, Dyrekcji oraz Działu HR.
        </p>
        <Link
          href="/kaizen"
          className="inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-xl shadow-md transition-all"
        >
          ← Powrót do rejestru Kaizen
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/kaizen"
            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-2xl font-bold text-xs transition-colors"
          >
            ← Powrót do Kaizen
          </Link>
          <div>
            <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              💳 Panel Komisji Kaizen & HR – Zatwierdzanie Wypłat
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Przegląd wniosków o wypłatę nagród (Załącznik nr 3) oraz realizacja premii dla pracowników
            </p>
          </div>
        </div>

        <Link
          href="/kaizen/regulamin"
          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
        >
          📜 Regulamin i Taryfikator Kaizen
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setFilterStatus('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            filterStatus === 'PENDING'
              ? 'bg-amber-500 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <span>⏳ Oczekujące</span>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 bg-white text-amber-900 font-black text-[10px] rounded-full">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('APPROVED')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            filterStatus === 'APPROVED'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <span>✅ Wypłacone</span>
          {approvedCount > 0 && (
            <span className="px-2 py-0.5 bg-emerald-800 text-white font-black text-[10px] rounded-full">
              {approvedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('REJECTED')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
            filterStatus === 'REJECTED'
              ? 'bg-red-600 text-white shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <span>❌ Odrzucone</span>
          {rejectedCount > 0 && (
            <span className="px-2 py-0.5 bg-red-800 text-white font-black text-[10px] rounded-full">
              {rejectedCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
            filterStatus === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Wszystkie ({payouts.length})
        </button>
      </div>

      {/* Content List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold animate-pulse">
          Ładowanie wniosków o wypłatę nagród Kaizen...
        </div>
      ) : filteredPayouts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <span className="text-4xl block">📭</span>
          <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">Brak wniosków w tej kategorii</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Gdy pracownik wygeneruje wniosek o wypłatę premii (Załącznik nr 3), pojawi się on automatycznie na tej liście do zatwierdzenia przez Komisję i Dział HR.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPayouts.map((item) => {
            let kaizenCount = 1;
            try {
              const ids = JSON.parse(item.kaizenIds || '[]');
              kaizenCount = ids.length || 1;
            } catch {}

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-md hover:shadow-lg transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    {item.status === 'PENDING' && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-black text-xs rounded-xl">
                        ⏳ OCZEKUJE NA WYPŁATĘ
                      </span>
                    )}
                    {item.status === 'APPROVED' && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-black text-xs rounded-xl">
                        ✅ WYPŁACONO (ZATWIERDZONE)
                      </span>
                    )}
                    {item.status === 'REJECTED' && (
                      <span className="px-3 py-1 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300 font-black text-xs rounded-xl">
                        ❌ ODRZUCENIE
                      </span>
                    )}
                    <span className="font-mono text-xs font-bold text-slate-500">
                      Nr: <strong>{item.docNumber}</strong>
                    </span>
                  </div>

                  <span className="text-xs font-medium text-slate-400">
                    Wniesiono: {new Date(item.createdAt).toLocaleString('pl-PL')}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  {/* Pracownik */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Wnioskodawca
                    </span>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      👤 {item.userName}
                    </p>
                    <p className="font-mono text-slate-500">
                      @{item.userLogin || item.userName}
                    </p>
                    {item.bankAccount && (
                      <p className="font-mono text-slate-700 dark:text-slate-300 pt-1 text-[11px]">
                        💳 IBAN: <strong>{item.bankAccount}</strong>
                      </p>
                    )}
                  </div>

                  {/* Szczegóły Kaizen */}
                  <div className="space-y-1 md:col-span-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">
                      Wnioskowane Pomysły Kaizen ({kaizenCount})
                    </span>
                    <p className="font-bold text-slate-800 dark:text-slate-200 line-clamp-3">
                      {item.kaizenTitles || `Liczba wniosków: ${kaizenCount}`}
                    </p>
                    {item.notes && (
                      <p className="text-slate-500 italic pt-1 text-[11px]">
                        Uwagi: {item.notes}
                      </p>
                    )}
                  </div>

                  {/* Finanse */}
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl flex flex-col justify-center space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider block">
                      Należność do Przelewu
                    </span>
                    <span className="text-xl font-black text-emerald-900 dark:text-emerald-100">
                      💰 {item.totalAmount} zł netto
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                      ⭐ Suma punktów: {item.totalPoints} pkt
                    </span>
                  </div>
                </div>

                {/* Approved signature footer */}
                {item.status === 'APPROVED' && item.approvedBy && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      Zatwierdzone przez: <strong>{item.approvedBy}</strong>
                    </span>
                    <span>
                      Data zatwierdzenia: {item.approvedAt ? new Date(item.approvedAt).toLocaleString('pl-PL') : '-'}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => handlePrintPreview(item)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-extrabold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-300 dark:border-slate-700"
                  >
                    🖨️ Podgląd Załącznika nr 3
                  </button>

                  {item.status === 'PENDING' && (
                    <>
                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'REJECTED')}
                        className="px-3.5 py-2 bg-red-100 hover:bg-red-200 text-red-900 dark:bg-red-950 dark:hover:bg-red-900 dark:text-red-200 rounded-xl font-extrabold text-xs transition-colors cursor-pointer border border-red-300 dark:border-red-800"
                      >
                        ❌ Odrzuć
                      </button>

                      <button
                        type="button"
                        disabled={processingId === item.id}
                        onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        {processingId === item.id ? 'Przetwarzanie...' : '✅ Zatwierdź i Wypłać'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

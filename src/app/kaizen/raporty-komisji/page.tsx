'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';

interface EmployeeSummary {
  userName: string;
  userLogin: string;
  totalPoints: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  unpaidPoints: number;
  unpaidRewardAmount: number;
  payoutCount: number;
  approvedPayoutCount: number;
  pendingPayoutCount: number;
  rejectedPayoutCount: number;
  lastPayoutDate?: string;
  bankAccount?: string;
}

interface PayoutHistory {
  id: string;
  docNumber: string;
  userName: string;
  totalAmount: number;
  totalPoints: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  approvedAt?: string;
}

interface ReportData {
  totalEmployees: number;
  totalPayoutRequests: number;
  totalApprovedKaizens: number;
  totalApprovedAmount: number;
  totalApprovedFromKaizens: number;
  totalPendingAmount: number;
  totalUnpaidKaizenAmount: number;
  totalRejectedAmount: number;
  employees: EmployeeSummary[];
  payoutHistory: PayoutHistory[];
  approvedKaizens: any[];
}

export default function RaportKomisjiPage() {
  const { showToast } = useToast();
  const { user, isAdmin, isKaizenCommittee, loading: authLoading } = useAuth();

  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<'pracownicy' | 'historia'>('pracownicy');

  const userRoleUpper = String(user?.role || '').toUpperCase();
  const isAuthorized = isAdmin || isKaizenCommittee || ['KOMISJA KAIZEN', 'KOMISJA_KAIZEN', 'KAIZEN_COMMITTEE', 'ZARZAD', 'ZARZĄD', 'ADMIN'].includes(userRoleUpper);

  useEffect(() => {
    if (!authLoading && !isAuthorized) {
      return;
    }
    if (!authLoading) {
      fetchReport();
    }
  }, [authLoading, isAuthorized]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/kaizen/raporty-komisji');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
      } else {
        showToast('Nie udało się pobrać raportu', 'error');
      }
    } catch (err) {
      console.error('Błąd pobierania raportu:', err);
      showToast('Błąd połączenia z serwerem', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!authLoading && !isAuthorized) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center space-y-4">
        <span className="text-5xl block">🔒</span>
        <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Brak uprawnień</h2>
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Raporty dla Komisji Kaizen są dostępne wyłącznie dla członków Komisji, Dyrekcji oraz Dział HR.
        </p>
        <Link
          href="/kaizen"
          className="inline-block px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-xl shadow-md transition-all"
        >
          ← Powrót do Kaizen
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
        <div className="p-12 text-center text-slate-400 font-bold animate-pulse">
          Ładowanie raportu...
        </div>
      </div>
    );
  }

  const topEmployees = report?.employees.slice(0, 10) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300 pb-12">
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
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              📊 Raporty Komisji Kaizen
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Przegląd sald pracowników, historii wypłat i rankingów
            </p>
          </div>
        </div>

        <button
          onClick={fetchReport}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-white font-black text-xs rounded-xl shadow-md transition-all"
        >
          🔄 Odśwież
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-2xl p-5 border border-blue-200 dark:border-blue-800">
          <div className="text-xs font-black uppercase text-blue-800 dark:text-blue-300 tracking-wider">
            Pracownicy
          </div>
          <div className="text-3xl font-black text-blue-950 dark:text-blue-100 mt-1">
            {report?.totalEmployees || 0}
          </div>
          <div className="text-xs text-blue-700 dark:text-blue-400 mt-1 font-medium">
            Zgłosili wnioski
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 rounded-2xl p-5 border border-emerald-200 dark:border-emerald-800">
          <div className="text-xs font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider">
            Zatwierdzone Kaizeny
          </div>
          <div className="text-3xl font-black text-emerald-950 dark:text-emerald-100 mt-1">
            {report?.totalApprovedKaizens || 0}
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-medium">
            Do wypłacenia
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 rounded-2xl p-5 border border-amber-200 dark:border-amber-800">
          <div className="text-xs font-black uppercase text-amber-800 dark:text-amber-300 tracking-wider">
            Do Wypłacenia
          </div>
          <div className="text-3xl font-black text-amber-950 dark:text-amber-100 mt-1">
            {((report?.totalPendingAmount || 0) + (report?.totalUnpaidKaizenAmount || 0)).toLocaleString('pl-PL')} zł
          </div>
          <div className="text-xs text-amber-700 dark:text-amber-400 mt-1 font-medium">
            W weryfikacji + Niezgłoszone
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-2xl p-5 border border-red-200 dark:border-red-800">
          <div className="text-xs font-black uppercase text-red-800 dark:text-red-300 tracking-wider">
            Już Wypłacone
          </div>
          <div className="text-3xl font-black text-red-950 dark:text-red-100 mt-1">
            {((report?.totalApprovedAmount || 0) + (report?.totalApprovedFromKaizens || 0)).toLocaleString('pl-PL')} zł
          </div>
          <div className="text-xs text-red-700 dark:text-red-400 mt-1 font-medium">
            Potwierdzono i wypłacono
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 rounded-2xl p-5 border border-purple-200 dark:border-purple-800">
          <div className="text-xs font-black uppercase text-purple-800 dark:text-purple-300 tracking-wider">
            Razem Wniosków
          </div>
          <div className="text-3xl font-black text-purple-950 dark:text-purple-100 mt-1">
            {report?.totalPayoutRequests || 0}
          </div>
          <div className="text-xs text-purple-700 dark:text-purple-400 mt-1 font-medium">
            Formalnie zgłoszonych
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setFilterTab('pracownicy')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            filterTab === 'pracownicy'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          👥 Pracownicy i Salda
        </button>
        <button
          onClick={() => setFilterTab('historia')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
            filterTab === 'historia'
              ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          📈 Historia Wypłat
        </button>
      </div>

      {/* Pracownicy Tab */}
      {filterTab === 'pracownicy' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-black uppercase text-slate-700 dark:text-slate-300">
                      Pracownik
                    </th>
                    <th className="px-4 py-3 text-center font-black uppercase text-slate-700 dark:text-slate-300">
                      Login
                    </th>
                    <th className="px-4 py-3 text-right font-black uppercase text-slate-700 dark:text-slate-300">
                      Łącznie 💰
                    </th>
                    <th className="px-4 py-3 text-right font-black uppercase text-slate-700 dark:text-slate-300">
                      ✅ Zatwierdzone
                    </th>
                    <th className="px-4 py-3 text-right font-black uppercase text-slate-700 dark:text-slate-300">
                      ⏳ Oczekujące
                    </th>
                    <th className="px-4 py-3 text-right font-black uppercase text-slate-700 dark:text-slate-300">
                      ❌ Odrzucone
                    </th>
                    <th className="px-4 py-3 text-center font-black uppercase text-slate-700 dark:text-slate-300">
                      Wnioski
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {(report?.employees || []).map((emp, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        {emp.userName}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600 dark:text-slate-400">
                        @{emp.userLogin}
                      </td>
                      <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-slate-100">
                        {(emp.totalAmount || 0).toLocaleString('pl-PL')} zł
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg font-bold">
                          {(emp.approvedAmount || 0).toLocaleString('pl-PL')} zł
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 rounded-lg font-bold">
                          {(emp.pendingAmount || 0).toLocaleString('pl-PL')} zł
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="px-2 py-1 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300 rounded-lg font-bold">
                          {(emp.rejectedAmount || 0).toLocaleString('pl-PL')} zł
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-lg font-bold text-slate-700 dark:text-slate-300">
                          {emp.payoutCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top 10 Ranking */}
          {topEmployees.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 rounded-2xl p-6 border border-amber-200 dark:border-amber-800">
              <h3 className="text-lg font-black text-amber-900 dark:text-amber-100 mb-4 flex items-center gap-2">
                🏆 Top 10 Pracowników (Zatwierdzone Wypłaty)
              </h3>
              <div className="space-y-2">
                {topEmployees.map((emp, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-black w-8 h-8 flex items-center justify-center bg-amber-200 dark:bg-amber-800 rounded-full text-amber-900 dark:text-amber-100">
                        {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-slate-100">{emp.userName}</div>
                        <div className="text-xs text-slate-500 font-mono">@{emp.userLogin}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg text-emerald-600 dark:text-emerald-400">
                        {(emp.approvedAmount || 0).toLocaleString('pl-PL')} zł
                      </div>
                      <div className="text-xs text-slate-500 font-medium">
                        {emp.approvedPayoutCount} zatw.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Historia Tab */}
      {filterTab === 'historia' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left font-black uppercase text-slate-700 dark:text-slate-300">
                    Nr Dokumentu
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase text-slate-700 dark:text-slate-300">
                    Pracownik
                  </th>
                  <th className="px-4 py-3 text-right font-black uppercase text-slate-700 dark:text-slate-300">
                    Kwota
                  </th>
                  <th className="px-4 py-3 text-center font-black uppercase text-slate-700 dark:text-slate-300">
                    Punkty
                  </th>
                  <th className="px-4 py-3 text-center font-black uppercase text-slate-700 dark:text-slate-300">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase text-slate-700 dark:text-slate-300">
                    Data Wniosku
                  </th>
                  <th className="px-4 py-3 text-left font-black uppercase text-slate-700 dark:text-slate-300">
                    Data Zatwierdzenia
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {(report?.payoutHistory || []).map((payout) => (
                  <tr
                    key={payout.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {payout.docNumber}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                      {payout.userName}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {(payout.totalAmount || 0).toLocaleString('pl-PL')} zł
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      {payout.totalPoints} pkt
                    </td>
                    <td className="px-4 py-3 text-center">
                      {payout.status === 'APPROVED' && (
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 rounded-lg font-bold text-[10px]">
                          ✅ ZATWIERDZONE
                        </span>
                      )}
                      {payout.status === 'PENDING' && (
                        <span className="px-2 py-1 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 rounded-lg font-bold text-[10px]">
                          ⏳ OCZEKUJE
                        </span>
                      )}
                      {payout.status === 'REJECTED' && (
                        <span className="px-2 py-1 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300 rounded-lg font-bold text-[10px]">
                          ❌ ODRZUCONE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {new Date(payout.createdAt).toLocaleString('pl-PL')}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                      {payout.approvedAt ? new Date(payout.approvedAt).toLocaleString('pl-PL') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

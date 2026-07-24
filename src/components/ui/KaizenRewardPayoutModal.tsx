'use client';

import React, { useState, useMemo } from 'react';
import { useToast } from '@/context/ToastContext';
import { downloadKaizenRewardEml } from '@/utils/kaizenRewardEmailBuilder';
import { openKaizenRewardPrintWindow } from '@/utils/kaizenRewardPrintBuilder';

interface KaizenRewardPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    login?: string;
  };
  userPoints?: number;
  submittedKaizensCount?: number;
  isScoringEnabled?: boolean;
  initialTab?: 'NEW_PAYOUT' | 'HISTORY';
}

interface KaizenItem {
  id: string;
  title: string;
  pointsAwarded?: number | null;
  status: string;
  submittedBy: string;
  isPaidOut?: boolean;
  createdAt: string;
}

interface PayoutRequestItem {
  id: string;
  docNumber: string;
  userName: string;
  userLogin?: string | null;
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

interface KaizenRewardPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string;
    login?: string;
  };
  userPoints?: number;
  submittedKaizensCount?: number;
  isScoringEnabled?: boolean;
  initialTab?: 'NEW_PAYOUT' | 'HISTORY';
}

export function KaizenRewardPayoutModal({
  isOpen,
  onClose,
  user,
  userPoints = 0,
  submittedKaizensCount = 0,
  isScoringEnabled = false,
  initialTab = 'NEW_PAYOUT',
}: KaizenRewardPayoutModalProps) {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'NEW_PAYOUT' | 'HISTORY'>(initialTab);
  const [rewardType, setRewardType] = useState('Premia finansowa z programu Kaizen');
  const [targetEmails, setTargetEmails] = useState('kadry@zaklad.pl, ksiegowosc@zaklad.pl');
  const [notes, setNotes] = useState('');

  const [kaizenList, setKaizenList] = useState<KaizenItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [payoutHistory, setPayoutHistory] = useState<PayoutRequestItem[]>([]);
  const [loadingKaizens, setLoadingKaizens] = useState(false);

  const getKaizenCashValue = (pts?: number | null) => {
    const p = pts || 0;
    if (p <= 0) return 0;
    if (p <= 5) return 10;
    if (p <= 10) return 50;
    if (p <= 15) return 100;
    return 150;
  };

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      fetchApprovedKaizens();
    }
  }, [isOpen, initialTab]);

  const fetchApprovedKaizens = async () => {
    setLoadingKaizens(true);
    try {
      const cleanName = (user.name || '').trim().toLowerCase();
      const cleanLogin = (user.login || '').trim().toLowerCase();

      // Fetch Kaizens
      const res = await fetch('/api/kaizen');
      if (res.ok) {
        const data = await res.json();
        const approved = Array.isArray(data)
          ? data.filter((k: KaizenItem) => {
              if (k.status !== 'APPROVED') return false;
              const sb = (k.submittedBy || '').trim().toLowerCase();
              if (!sb) return false;
              return (
                sb === cleanName ||
                sb === cleanLogin ||
                (cleanName.length > 2 && sb.includes(cleanName)) ||
                (cleanName.length > 2 && cleanName.includes(sb)) ||
                (cleanLogin.length > 2 && sb.includes(cleanLogin)) ||
                (cleanLogin.length > 2 && cleanLogin.includes(sb))
              );
            })
          : [];
        setKaizenList(approved);

        // By default check only UNPAID approved Kaizens
        const unpaidIds = new Set<string>(approved.filter((k: KaizenItem) => !k.isPaidOut).map((k: KaizenItem) => k.id));
        setSelectedIds(unpaidIds);
      }

      // Fetch Payout Requests History (Bank Statement)
      const resPayouts = await fetch('/api/kaizen-payouts');
      if (resPayouts.ok) {
        const dataPayouts = await resPayouts.json();
        const userPayouts = Array.isArray(dataPayouts)
          ? dataPayouts.filter((p: PayoutRequestItem) => {
              const un = (p.userName || '').trim().toLowerCase();
              const ul = (p.userLogin || '').trim().toLowerCase();
              return (
                un === cleanName ||
                un === cleanLogin ||
                (cleanName.length > 2 && un.includes(cleanName)) ||
                (cleanName.length > 2 && cleanName.includes(un)) ||
                (cleanLogin.length > 2 && ul.includes(cleanLogin))
              );
            })
          : [];
        setPayoutHistory(userPayouts);
      }
    } catch (err) {
      console.error('Błąd pobierania danych wypłat Kaizen:', err);
    } finally {
      setLoadingKaizens(false);
    }
  };

  const toggleSelectKaizen = (item: KaizenItem) => {
    if (item.isPaidOut) return; // Cannot re-select already paid out Kaizens
    const next = new Set(selectedIds);
    if (next.has(item.id)) {
      next.delete(item.id);
    } else {
      next.add(item.id);
    }
    setSelectedIds(next);
  };

  const selectedKaizens = useMemo(() => {
    return kaizenList.filter(k => selectedIds.has(k.id));
  }, [kaizenList, selectedIds]);

  const selectedTotalPoints = useMemo(() => {
    return selectedKaizens.reduce((sum, k) => sum + (k.pointsAwarded || 0), 0);
  }, [selectedKaizens]);

  const selectedTotalCash = useMemo(() => {
    return selectedKaizens.reduce((sum, k) => sum + getKaizenCashValue(k.pointsAwarded), 0);
  }, [selectedKaizens]);

  const docNumber = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `WN/KAIZEN/${year}/${month}/${randomSuffix}`;
  }, [isOpen]);

  const historyTotalPaid = useMemo(() => {
    return payoutHistory
      .filter(p => p.status === 'APPROVED')
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [payoutHistory]);

  const historyTotalPending = useMemo(() => {
    return payoutHistory
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  }, [payoutHistory]);

  if (!isOpen) return null;

  const getCleanData = () => {
    const count = selectedKaizens.length;
    const cashStr = selectedTotalCash > 0 ? `${selectedTotalCash} zł netto` : '0 zł';
    return {
      docNumber,
      userName: user.name,
      userLogin: user.login || user.name,
      bankAccount: '',
      pointsCount: selectedTotalPoints || userPoints,
      kaizensCount: count || submittedKaizensCount,
      rewardType: `${rewardType} — Wypłata: ${cashStr}`,
      notes: `Wniosek obejmuje ${count} zatwierdzonych pomysłów Kaizen. Należna kwota wypłaty: ${cashStr} (${selectedTotalPoints} pkt).` + (notes.trim() ? ` Uzasadnienie: ${notes.trim()}` : ''),
      createdAt: new Date().toISOString(),
    };
  };

  const registerPayoutInDb = async () => {
    if (selectedKaizens.length === 0) return;
    try {
      await fetch('/api/kaizen-payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docNumber,
          bankAccount: '',
          kaizenIds: Array.from(selectedIds),
          totalPoints: selectedTotalPoints,
          totalAmount: selectedTotalCash,
          rewardType: `${rewardType} — Wypłata: ${selectedTotalCash} zł netto`,
          notes: notes.trim(),
        }),
      });
    } catch (err) {
      console.error('Błąd rejestracji wniosku wypłaty w bazie:', err);
    }
  };

  const handleDownloadEml = async () => {
    await registerPayoutInDb();
    downloadKaizenRewardEml(getCleanData(), targetEmails, window.location.origin);
    showToast('Pobrano plik powiadomienia .EML dla kadr i księgowości (Załącznik nr 3)', 'success');
  };

  const handlePrintFilled = async () => {
    await registerPayoutInDb();
    openKaizenRewardPrintWindow(getCleanData());
    showToast('Otwarto okno drukowania wniosku (Załącznik nr 3)', 'success');
  };

  const handlePrintBlank = () => {
    openKaizenRewardPrintWindow({
      docNumber,
      userName: '',
      userLogin: '',
      bankAccount: '',
      rewardType: '',
      notes: '',
      pointsCount: userPoints,
      kaizensCount: submittedKaizensCount,
      createdAt: new Date().toISOString(),
    });
    showToast('Otwarto czysty czarno-biały wniosek do ręcznego wypełnienia (Załącznik nr 3)', 'success');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerPayoutInDb();
    downloadKaizenRewardEml(getCleanData(), targetEmails, window.location.origin);
    openKaizenRewardPrintWindow(getCleanData());
    showToast('Wniosek o wypłatę (Załącznik nr 3) został przekazany do Komisji!', 'success');
    onClose();
  };

  const handleRePrintHistory = (p: PayoutRequestItem) => {
    let count = 1;
    try {
      const ids = JSON.parse(p.kaizenIds || '[]');
      count = ids.length || 1;
    } catch {}

    openKaizenRewardPrintWindow({
      docNumber: p.docNumber,
      userName: p.userName,
      userLogin: p.userLogin || p.userName,
      bankAccount: '',
      rewardType: p.rewardType,
      notes: p.notes || '',
      pointsCount: p.totalPoints,
      kaizensCount: count,
      createdAt: p.createdAt,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-600 to-orange-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-2 bg-white/20 rounded-2xl backdrop-blur-xs">🎁</span>
            <div>
              <div className="text-[10px] font-black uppercase text-amber-200 tracking-wider">
                PROGRAM KAIZEN | ALLSPICE
              </div>
              <h2 className="text-lg font-black tracking-tight">System Rozliczeń i Wypłat Nagród</h2>
              <p className="text-xs text-amber-100 font-mono">
                {user.name} <span className="opacity-80">(@{user.login || user.name})</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('NEW_PAYOUT')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'NEW_PAYOUT'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 border-t-2 border-amber-500 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>🎁</span> Nowy Wniosek (Załącznik nr 3)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2.5 rounded-t-2xl font-black text-xs transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'HISTORY'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 border-t-2 border-emerald-500 shadow-2xs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <span>📜</span> Wyciąg i Historia Transakcji ({payoutHistory.length})
          </button>
        </div>

        {/* TAB 1: NEW PAYOUT FORM */}
        {activeTab === 'NEW_PAYOUT' && (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs font-medium">
          {/* User info summary banner */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400 tracking-wider block">
                Wnioskodawca
              </span>
              <span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                {user.name} <span className="font-mono text-xs text-slate-500 font-normal">(@{user.login || user.name})</span>
              </span>
            </div>
            <div className="text-right">
              <span className="px-3 py-1 bg-amber-500 text-white font-black text-xs rounded-xl shadow-xs inline-block">
                ⭐ {selectedTotalPoints || userPoints} pkt
              </span>
            </div>
          </div>

          {/* Lista Zatwierdzonych Kaizenów do Wypłaty */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Wybierz Kaizeny do Rozliczenia ({selectedKaizens.length} z {kaizenList.length})
              </label>
              <button
                type="button"
                onClick={() => {
                  if (selectedIds.size === kaizenList.length) {
                    setSelectedIds(new Set());
                  } else {
                    setSelectedIds(new Set(kaizenList.map(k => k.id)));
                  }
                }}
                className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
              >
                {selectedIds.size === kaizenList.length ? 'Odznacz wszystkie' : 'Zaznacz wszystkie'}
              </button>
            </div>

            {loadingKaizens ? (
              <div className="p-4 text-center text-slate-400 font-bold animate-pulse">Ładowanie wniosków Kaizen...</div>
            ) : kaizenList.length === 0 ? (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 text-center">
                Brak zarejestrowanych zatwierdzonych wniosków Kaizen dla Twojego konta.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700">
                {kaizenList.map((item) => {
                  const isChecked = selectedIds.has(item.id);
                  const cashVal = getKaizenCashValue(item.pointsAwarded);
                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleSelectKaizen(item)}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                        item.isPaidOut
                          ? 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed'
                          : isChecked
                          ? 'bg-amber-100/90 dark:bg-amber-950/80 border-amber-400 dark:border-amber-700 text-slate-900 dark:text-slate-100 shadow-2xs cursor-pointer'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 opacity-60 hover:opacity-100 cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          disabled={item.isPaidOut}
                          onChange={() => {}} // Handled by parent div
                          className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                        />
                        <div className="truncate">
                          <p className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                            {item.title}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {new Date(item.createdAt).toLocaleDateString('pl-PL')}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-black text-xs block text-slate-900 dark:text-slate-100">
                          +{item.pointsAwarded || 0} pkt
                        </span>
                        {item.isPaidOut ? (
                          <span className="text-[10px] font-extrabold text-slate-500 block bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-md">
                            ✅ Wypłacono
                          </span>
                        ) : (
                          <span className="text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 block">
                            💰 {cashVal} zł netto
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Podsumowanie Wyliczonej Kwoty Nagrody */}
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border-2 border-emerald-400 dark:border-emerald-700/80 rounded-2xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-300 tracking-wider block">
                Wyliczona Kwota Wypłaty (Załącznik nr 3)
              </span>
              <span className="text-sm font-black text-emerald-950 dark:text-emerald-100">
                💰 {selectedTotalCash} zł netto <span className="font-normal text-xs text-emerald-800 dark:text-emerald-300">({selectedKaizens.length} wniosków, {selectedTotalPoints} pkt)</span>
              </span>
            </div>
            <div className="px-3 py-1 bg-emerald-600 text-white font-black text-xs rounded-xl shadow-xs">
              DO WYPŁATY
            </div>
          </div>

          {/* Reward Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Forma Nagrody / Wnioskowany Wariant
            </label>
            <select
              value={rewardType}
              onChange={(e) => setRewardType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
            >
              <option value="Premia finansowa z programu Kaizen">💰 Premia finansowa z programu Kaizen</option>
              <option value="Voucher / Karta Podarunkowa">🎟️ Voucher / Karta Podarunkowa</option>
              <option value="Nagroda Rzeczowa dla Pomysłodawcy">🏆 Nagroda Rzeczowa dla Pomysłodawcy</option>
            </select>
          </div>

          {/* Target emails */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Adresy E-mail Działu Kadr / Księgowości
            </label>
            <input
              type="text"
              value={targetEmails}
              onChange={(e) => setTargetEmails(e.target.value)}
              placeholder="kadry@zaklad.pl, ksiegowosc@zaklad.pl"
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Uwagi / Uzasadnienie (Opcjonalnie)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="np. Wniosek o rozliczenie zrealizowanych udoskonaleń Kaizen w miesiącu..."
              className="w-full px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          {/* Printing options & buttons */}
          <div className="pt-3 space-y-2 border-t border-slate-200 dark:border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePrintFilled}
                className="w-full py-2.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-700 cursor-pointer"
              >
                <span>🖨️</span> Drukuj Wypełniony
              </button>

              <button
                type="button"
                onClick={handlePrintBlank}
                className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 text-amber-900 dark:text-amber-200 rounded-xl font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 border border-amber-300 dark:border-amber-800 cursor-pointer"
                title="Wydrukuj formularz z kropkowanymi liniami do ręcznego uzupełnienia"
              >
                <span>📄</span> Drukuj Czysty Formularz
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadEml}
                className="w-full py-2.5 px-3 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/80 dark:hover:bg-amber-900 text-amber-950 dark:text-amber-200 rounded-xl font-extrabold text-xs transition-colors flex items-center justify-center gap-1.5 border border-amber-300 dark:border-amber-800 cursor-pointer"
              >
                <span>📧</span> Pobierz E-mail (.EML)
              </button>

              <button
                type="submit"
                className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>🚀</span> Generuj i Wyślij
              </button>
            </div>
          </div>
        </form>
        )}

        {/* TAB 2: BANK STATEMENT / TRANSACTION HISTORY */}
        {activeTab === 'HISTORY' && (
          <div className="p-5 overflow-y-auto space-y-4 text-xs font-medium">
            {/* Banking App Style Summary Header Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-emerald-800 dark:text-emerald-400 tracking-wider block">
                  💰 Przelane (Wypłacono)
                </span>
                <span className="text-lg font-black text-emerald-950 dark:text-emerald-100">
                  {historyTotalPaid} zł netto
                </span>
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl">
                <span className="text-[10px] font-black uppercase text-amber-800 dark:text-amber-400 tracking-wider block">
                  ⏳ W Realizacji (HR)
                </span>
                <span className="text-lg font-black text-amber-950 dark:text-amber-100">
                  {historyTotalPending} zł netto
                </span>
              </div>

              <div className="p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl col-span-2 sm:col-span-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
                  📄 Razem Wniosków
                </span>
                <span className="text-lg font-black text-slate-800 dark:text-slate-200">
                  {payoutHistory.length} szt.
                </span>
              </div>
            </div>

            {/* Transaction History Log Header */}
            <div className="flex items-center justify-between pt-2">
              <h3 className="font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <span>📑</span> Wyciąg z Transakcji Wypłat Nagród
              </h3>
              <span className="text-[10px] font-bold text-slate-400">
                Ostatnia aktualizacja: dzisiaj
              </span>
            </div>

            {/* List of Payout Transactions */}
            {payoutHistory.length === 0 ? (
              <div className="p-8 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-2">
                <span className="text-3xl block">🏦</span>
                <p className="font-extrabold text-slate-700 dark:text-slate-300">Brak historii transakcji wypłat</p>
                <p className="text-[11px] text-slate-500">
                  Nie złożono jeszcze żadnego wniosku o wypłatę (Załącznik nr 3). Wygeneruj pierwszy wniosek w zakładce obok.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {payoutHistory.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.status === 'PENDING' && (
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-black text-[10px] rounded-md">
                            ⏳ W Realizacji
                          </span>
                        )}
                        {item.status === 'APPROVED' && (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 font-black text-[10px] rounded-md">
                            ✅ Wypłacono
                          </span>
                        )}
                        {item.status === 'REJECTED' && (
                          <span className="px-2.5 py-0.5 bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-300 font-black text-[10px] rounded-md">
                            ❌ Odrzucono
                          </span>
                        )}
                        <span className="font-mono text-[11px] font-bold text-slate-500">
                          {item.docNumber}
                        </span>
                      </div>

                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 truncate">
                        {item.kaizenTitles || item.rewardType}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Data zgłoszenia: {new Date(item.createdAt).toLocaleString('pl-PL')}
                        {item.approvedBy && ` | Zatwierdził HR: ${item.approvedBy}`}
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 pt-2 sm:pt-0">
                      <div className="text-right">
                        <span className="text-sm font-black text-emerald-700 dark:text-emerald-400 block">
                          +{item.totalAmount} zł netto
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">
                          ⭐ {item.totalPoints} pkt
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRePrintHistory(item)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-[11px] border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Drukuj ponownie Załącznik nr 3 dla tej transakcji"
                      >
                        🖨️ Drukuj Załącznik
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

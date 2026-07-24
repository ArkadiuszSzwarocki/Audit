'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  kaizen: {
    total: number;
    pending: number;
    approved: number;
    totalPoints: number;
  };
  faults: {
    total: number;
    open: number;
    resolved: number;
    critical: number;
  };
  audits: {
    total: number;
    completed: number;
    inProgress: number;
    pendingTasks: number;
  };
  bhp?: {
    total: number;
    open: number;
    resolved: number;
    critical: number;
  };
  quality?: {
    total: number;
    open: number;
    resolved: number;
    critical: number;
  };
}

export default function Home() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Sprawdzenie czy użytkownik ma uprawnienia do tworzenia audytów (brak przycisku dla Roli Operator / Pracownik)
  const isOperatorOrEmployee = user?.role === 'OPERATOR' || user?.role === 'PRACOWNIK';
  const canCreateAudit = isAdmin || (Boolean(user) && !isOperatorOrEmployee);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
      })
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, []);

  const modules = [
    {
      title: 'Zadania Produkcyjne',
      desc: 'Otwarte zgłoszenia z audytów do naprawy przez operatorów.',
      color: 'from-emerald-500 to-teal-500',
      link: '/zadania',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      badge: 'Audyty',
    },
    {
      title: 'Zgłoszenia Usterek',
      desc: 'Szybkie zgłaszanie usterek sprzętowych i BHP bez audytu.',
      color: 'from-rose-500 to-red-600',
      link: '/usterki',
      icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      badge: 'Usterki',
    },
    {
      title: 'Audyty 5S / BHP',
      desc: 'Przegląd wykonanych audytów, generowanie raportów i analiz.',
      color: 'from-blue-500 to-cyan-500',
      link: '/audyty',
      icon: 'M9 19v-6a2 2 0 00-2-2H4a2 2 0 00-2 2v6a2 2 0 002 2h3a2 2 0 002-2zm0 0V9a2 2 0 012-2h3a2 2 0 012 2v10m-6 0a2 2 0 002 2h3a2 2 0 002-2m0 0V5a2 2 0 012-2h3a2 2 0 012 2v14a2 2 0 01-2 2h-3a2 2 0 01-2-2z',
      badge: 'Jakość',
    },
    {
      title: 'Kaizen & Ulepszenia',
      desc: 'Zgłaszaj, opiniuj i zatwierdzaj pomysły na usprawnienie procesu.',
      color: 'from-amber-500 to-orange-500',
      link: '/kaizen',
      icon: 'M13 10V3L4 14h7v7l9-11h-7z',
      badge: 'Lean',
    },
    {
      title: 'Informator Standardów',
      desc: 'Baza wiedzy z wymogami 5S, GMP, HACCP i magazynowania.',
      color: 'from-purple-500 to-indigo-500',
      link: '/informator',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      badge: 'Standardy',
    },
    {
      title: 'Dostęp Sieciowy (LAN)',
      desc: 'Adres IP i podgląd kart sieciowych dla innych komputerów.',
      color: 'from-teal-500 to-emerald-600',
      link: '/ustawienia/siec',
      icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9',
      badge: 'Sieć',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      {/* Top Operational Header */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">
            Pulpit Operacyjny
          </h1>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mt-1">
            Bieżące podsumowanie wniosków Kaizen, usterek/awarii oraz audytów zakładowych.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2.5">
          <Link
            href="/kaizen/nowy"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <span>💡</span> Nowy Kaizen
          </Link>
          <Link
            href="/usterki/nowe"
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <span>🔧</span> Zgłoś Awarię
          </Link>
          {canCreateAudit && (
            <Link
              href="/audyty/nowy"
              className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <span>📋</span> Nowy Audyt
            </Link>
          )}
        </div>
      </section>

      {/* Executive Summary Cards Section (Kaizen, Awarie, Audyty, BHP) */}
      <section className="space-y-4">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>📊</span> Podsumowanie Statystyk
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* KAIZEN CARD */}
          <div className="glass-card relative overflow-hidden p-5 border border-amber-200/60 dark:border-amber-900/40 bg-gradient-to-br from-amber-50/50 via-white to-amber-100/20 dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  💡
                </div>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Kaizen
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-3">
                Udoskonalenia
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-amber-600 dark:text-amber-400">
                    {loadingStats ? '...' : stats?.kaizen.pending ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Oczekujące</div>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {loadingStats ? '...' : stats?.kaizen.approved ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Zatwierdzone</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium px-1">
                <span>Wnioski: <strong>{stats?.kaizen.total ?? 0}</strong></span>
                <span>Punkty: <strong className="text-amber-600 dark:text-amber-400">{stats?.kaizen.totalPoints ?? 0} pkt</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
              <Link href="/kaizen/nowy" className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline">
                + Kaizen
              </Link>
              <Link href="/kaizen" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 transition-colors">
                Więcej →
              </Link>
            </div>
          </div>

          {/* FAULTS / AWARIE CARD */}
          <div className="glass-card relative overflow-hidden p-5 border border-rose-200/60 dark:border-rose-900/40 bg-gradient-to-br from-rose-50/50 via-white to-red-100/20 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-red-600"></div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  🔧
                </div>
                <span className="px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Usterki
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-3">
                Awarie Sprzętowe
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-rose-600 dark:text-rose-400">
                    {loadingStats ? '...' : stats?.faults.open ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">W naprawie</div>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-teal-600 dark:text-teal-400">
                    {loadingStats ? '...' : stats?.faults.resolved ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Naprawione</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium px-1">
                <span>Łącznie: <strong>{stats?.faults.total ?? 0}</strong></span>
                <span>Krytyczne: <strong className="text-rose-600 dark:text-rose-400">{stats?.faults.critical ?? 0}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
              <Link href="/usterki/nowe" className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline">
                + Zgłoś Awarię
              </Link>
              <Link href="/usterki" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors">
                Więcej →
              </Link>
            </div>
          </div>

          {/* BHP HAZARDS CARD */}
          <div className="glass-card relative overflow-hidden p-5 border border-orange-200/60 dark:border-orange-900/40 bg-gradient-to-br from-orange-50/50 via-white to-amber-100/20 dark:from-orange-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-amber-600"></div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  🛡️
                </div>
                <span className="px-2 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-800 dark:text-orange-300 text-[10px] font-extrabold uppercase tracking-wider">
                  EHS / BHP
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-3">
                Zagrożenia BHP
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-orange-600 dark:text-orange-400">
                    {loadingStats ? '...' : stats?.bhp?.open ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">W eliminacji</div>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {loadingStats ? '...' : stats?.bhp?.resolved ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Usunięte</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium px-1">
                <span>Łącznie: <strong>{stats?.bhp?.total ?? 0}</strong></span>
                <span>Wysokie ryzyko: <strong className="text-red-600 dark:text-red-400">{stats?.bhp?.critical ?? 0}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
              <Link href="/bhp/nowy" className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline">
                + Zgłoś BHP
              </Link>
              <Link href="/bhp" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-orange-600 transition-colors">
                Więcej →
              </Link>
            </div>
          </div>

          {/* QUALITY CARD */}
          <div className="glass-card relative overflow-hidden p-5 border border-purple-200/60 dark:border-purple-900/40 bg-gradient-to-br from-purple-50/50 via-white to-indigo-100/20 dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  📦
                </div>
                <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Jakość & CAPA
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-3">
                Niezgodności Jakościowe
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-purple-600 dark:text-purple-400">
                    {loadingStats ? '...' : stats?.quality?.open ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Aktywne CAPA</div>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                    {loadingStats ? '...' : stats?.quality?.resolved ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Skorygowane</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium px-1">
                <span>Łącznie: <strong>{stats?.quality?.total ?? 0}</strong></span>
                <span>Blokady: <strong className="text-red-600 dark:text-red-400">{stats?.quality?.critical ?? 0}</strong></span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 flex justify-between items-center">
              <Link href="/jakosc/nowy" className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline">
                + Zgłoś Niezgodność
              </Link>
              <Link href="/jakosc" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-purple-600 transition-colors">
                Więcej →
              </Link>
            </div>
          </div>

          {/* AUDITS CARD */}
          <div className="glass-card relative overflow-hidden p-5 border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-br from-blue-50/50 via-white to-cyan-100/20 dark:from-blue-950/20 dark:via-slate-900 dark:to-slate-900 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  📋
                </div>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 text-[10px] font-extrabold uppercase tracking-wider">
                  Audyty 5S
                </span>
              </div>

              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-3">
                Przeglądy Jakości
              </h3>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {loadingStats ? '...' : stats?.audits.completed ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Wykonane</div>
                </div>
                <div className="p-2.5 bg-white/80 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                    {loadingStats ? '...' : stats?.audits.pendingTasks ?? 0}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Zadania CAPA</div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 mb-3 font-medium px-1">
                <span>Łącznie: <strong>{stats?.audits.total ?? 0}</strong></span>
                <span>W trakcie: <strong>{stats?.audits.inProgress ?? 0}</strong></span>
              </div>
            </div>

            <div className={`pt-3 border-t border-slate-200/60 dark:border-slate-800 flex items-center ${canCreateAudit ? 'justify-between' : 'justify-end'}`}>
              {canCreateAudit && (
                <Link href="/audyty/nowy" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  + Audyt
                </Link>
              )}
              <Link href="/audyty" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors">
                Więcej →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Modules Grid */}
      <section className="space-y-6">
        <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>🚀</span> Moduły Aplikacji
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((m) => (
            <Link
              href={m.link}
              key={m.title}
              className="group glass-card overflow-hidden relative p-6 hover:-translate-y-1 transition-all duration-300 border border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-600 shadow-sm hover:shadow-lg flex flex-col justify-between"
            >
              <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${m.color}`}></div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${m.color} text-white shadow-md group-hover:scale-105 transition-transform`}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={m.icon} />
                    </svg>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                    {m.badge}
                  </span>
                </div>

                <h3 className="text-lg font-extrabold text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                  {m.title}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {m.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs font-bold text-brand-600 dark:text-brand-400">
                <span>Otwórz moduł</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer repository quick bar */}
      <section className="glass-card p-6 flex flex-col md:flex-row items-center justify-between bg-slate-50 dark:bg-slate-800/40 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            📚
          </div>
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Dokumentacja i Instrukcje Zakładowe</h4>
            <p className="text-xs text-slate-500">Procedury BHP, instrukcje stanowiskowe, schematy maszyn.</p>
          </div>
        </div>
        <Link
          href="/dokumentacja"
          className="px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
        >
          Przeglądaj Dokumenty →
        </Link>
      </section>
    </div>
  );
}

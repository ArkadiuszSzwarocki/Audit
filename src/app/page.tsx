'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [networkUrl, setNetworkUrl] = useState('');

  useEffect(() => {
    fetch('/api/system-info')
      .then((r) => r.json())
      .then((data) => {
        if (data.primaryUrl) setNetworkUrl(data.primaryUrl);
      })
      .catch(console.error);
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
      {/* Welcome Banner */}
      <section className="glass-card p-8 border-l-4 border-l-brand-500 bg-gradient-to-r from-brand-50/60 via-indigo-50/30 to-transparent dark:from-brand-950/20 dark:via-indigo-950/10 dark:to-transparent space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
              System Audytów, Usterek i Kaizen
            </h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium max-w-2xl text-base">
              Zarządzaj jakością, raportuj niezgodności i realizuj naprawy na produkcji w czasie rzeczywistym.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <Link
              href="/audyty/nowy"
              className="px-5 py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>📋</span> Nowy Audyt
            </Link>
            <Link
              href="/usterki/nowe"
              className="px-5 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>🔧</span> Zgłoś Usterkę
            </Link>
            <Link
              href="/kaizen/nowy"
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>💡</span> Nowy Kaizen
            </Link>
          </div>
        </div>

        {/* Network IP Bar Banner */}
        {networkUrl && (
          <div className="p-3.5 px-4 rounded-xl bg-emerald-700 text-white font-mono text-xs font-bold flex flex-wrap justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <span>🌐 Adres dla innych komputerów / telefonu w sieci Wi-Fi/LAN:</span>
              <span className="underline text-emerald-200 text-sm">{networkUrl}</span>
            </div>
            <Link href="/ustawienia/siec" className="px-3 py-1 bg-white text-emerald-900 rounded-lg text-xs font-bold hover:bg-emerald-50 transition-colors">
              Szczegóły →
            </Link>
          </div>
        )}
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

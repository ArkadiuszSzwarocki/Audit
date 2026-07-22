'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSelector } from '@/components/ui/ThemeSelector';

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const { isAdmin, user, logout } = useAuth();
  const pathname = usePathname();

  const [menuCounts, setMenuCounts] = useState<{ pendingKaizens: number; pendingTasks: number; openFaultReports: number }>({
    pendingKaizens: 0,
    pendingTasks: 0,
    openFaultReports: 0,
  });

  useEffect(() => {
    const loadCounts = () => {
      fetch('/api/menu-counts')
        .then((r) => r.json())
        .then((data) => {
          if (data && typeof data.pendingKaizens === 'number') {
            setMenuCounts(data);
          }
        })
        .catch(console.error);
    };

    loadCounts();
    const interval = setInterval(loadCounts, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  const navItems = [
    {
      name: 'Informator',
      href: '/informator',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Audyty',
      href: '/audyty',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 022 2h2a2 2 0 022-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      name: 'Zadania Produkcji',
      href: '/zadania',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: 'Zgłoszenia Usterek',
      href: '/usterki',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    {
      name: 'Kaizen & Ulepszenia',
      href: '/kaizen',
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      name: 'Dokumentacja',
      href: '/dokumentacja',
      icon: (
        <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      name: 'Historia Zapoznań',
      href: '/ustawienia/historia-dostepu',
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  const settingsItems = [
    {
      name: 'Dostęp Sieciowy (LAN & IP)',
      href: '/ustawienia/siec',
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
      ),
    },
    {
      name: 'Struktura Zakładu',
      href: '/struktura',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Typy audytów',
      href: '/ustawienia/typy-audytow',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      name: 'Role i Uprawnienia (RBAC)',
      href: '/ustawienia/role',
      icon: (
        <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      name: 'Wagi i Kategorie Zdarzeń',
      href: '/ustawienia/wagi-spostrzezen',
      icon: (
        <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-8 5h8" />
        </svg>
      ),
    },
    {
      name: 'Punktacja i Cele Kaizen',
      href: '/ustawienia/punktacja-kaizen',
      icon: (
        <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
    },
  ];

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full">
      {/* Logo & Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <Link href="/" onClick={() => isMobile && onMobileClose()} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-tight block">
              Audit<span className="text-brand-500">App</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">System Audytów</span>
          </div>
        </Link>

        {isMobile && (
          <button 
            onClick={onMobileClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all focus:outline-none"
            title="Zamknij menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav items */}
      <div className="p-4 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
        <section>
          <h3 className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
            Główna Nawigacja
          </h3>
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => isMobile && onMobileClose()}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500 shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>

                    {item.href === '/zadania' && menuCounts.pendingTasks > 0 && (
                      <span className="min-w-[22px] h-5 px-1.5 flex items-center justify-center rounded-full bg-red-500 text-white text-[11px] font-extrabold shadow-sm shadow-red-500/30 shrink-0">
                        {menuCounts.pendingTasks}
                      </span>
                    )}

                    {item.href === '/usterki' && menuCounts.openFaultReports > 0 && (
                      <span className="min-w-[22px] h-5 px-1.5 flex items-center justify-center rounded-full bg-rose-600 text-white text-[11px] font-extrabold shadow-sm shadow-rose-500/30 shrink-0">
                        {menuCounts.openFaultReports}
                      </span>
                    )}

                    {item.href === '/kaizen' && menuCounts.pendingKaizens > 0 && (
                      <span className="min-w-[22px] h-5 px-1.5 flex items-center justify-center rounded-full bg-amber-500 text-white text-[11px] font-extrabold shadow-sm shadow-amber-500/30 shrink-0">
                        {menuCounts.pendingKaizens}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Konfiguracja (Ustawienia - widoczne tylko dla Administratora) */}
        {isAdmin && (
          <section>
            <h3 className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              Konfiguracja & Ustawienia
            </h3>
            <ul className="space-y-1">
              {settingsItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => isMobile && onMobileClose()}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                        isActive
                          ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500 shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                      }`}
                    >
                      <span className={isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Administracja (Zarządzanie Użytkownikami - widoczne tylko dla Administratora) */}
        {isAdmin && (
          <section>
            <h3 className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
              Administracja
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/struktura/uzytkownicy"
                  onClick={() => isMobile && onMobileClose()}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    pathname === '/struktura/uzytkownicy'
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                  }`}
                >
                  <span className="text-slate-400 dark:text-slate-500">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </span>
                  <span>Użytkownicy</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/ustawienia/baza-danych"
                  onClick={() => isMobile && onMobileClose()}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
                    pathname === '/ustawienia/baza-danych'
                      ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-l-4 border-brand-500 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                  }`}
                >
                  <span className="text-slate-400 dark:text-slate-500">
                    <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                  </span>
                  <span>Baza Danych (Prisma)</span>
                </Link>
              </li>
            </ul>
          </section>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Permanent Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 lg:w-72 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 h-screen sticky top-0 z-30 print:hidden">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-opacity animate-in fade-in duration-300 print:hidden"
          onClick={onMobileClose}
        />
      )}
      <aside 
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-out print:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent(true)}
      </aside>
    </>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSelector } from '@/components/ui/ThemeSelector';
import { ChangePasswordModal } from '@/components/ui/ChangePasswordModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

interface UserProfileStats {
  assignedTasksCount: number;
  assignedFaultsCount: number;
  submittedKaizensCount: number;
  userPoints: number;
  rankTitle: string;
}

export default function Header({ onOpenMobileMenu }: HeaderProps) {
  const { user, isAdmin, logout } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [stats, setStats] = useState<UserProfileStats>({
    assignedTasksCount: 0,
    assignedFaultsCount: 0,
    submittedKaizensCount: 0,
    userPoints: 0,
    rankTitle: '🌱 Początkujący Innowator',
  });

  useEffect(() => {
    if (user) {
      fetchUserStats();
      const interval = setInterval(fetchUserStats, 12000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchUserStats = async () => {
    try {
      const res = await fetch('/api/user-profile');
      if (res.ok) {
        const data = await res.json();
        setStats({
          assignedTasksCount: data.assignedTasksCount || 0,
          assignedFaultsCount: data.assignedFaultsCount || 0,
          submittedKaizensCount: data.submittedKaizensCount || 0,
          userPoints: data.userPoints || 0,
          rankTitle: data.rankTitle || '🌱 Początkujący Innowator',
        });
      }
    } catch {
      // Ignore background stats fetch errors
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 print:hidden shadow-sm px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger button */}
            <button 
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none flex items-center gap-2 group cursor-pointer"
              title="Otwórz menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Menu</span>
            </button>

            <span className="hidden lg:inline-block text-xs font-bold uppercase tracking-wider text-slate-400">
              Panel Audytowy
            </span>
          </div>

          {/* Action / User section */}
          <div className="flex items-center gap-3">
            {/* Theme Selector Mode */}
            <ThemeSelector compact />

            <Link
              href="/ustawienia/historia-dostepu"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl text-xs font-bold transition-all border border-amber-200/60 dark:border-amber-800/60"
              title="Rejestr odczytów i cyfrowych podpisów zapoznania się z dokumentami"
            >
              <span>📜</span> Rejestr Zapoznań
            </Link>

            {/* Interactive Logged-in User Profile Dropdown Pill */}
            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all shadow-xs cursor-pointer ${
                    isUserMenuOpen
                      ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-500 text-brand-700 dark:text-brand-300 ring-2 ring-brand-500/20'
                      : 'bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border-slate-200/60 dark:border-slate-700/60'
                  }`}
                  title="Kliknij, aby otworzyć panel profilu, statystyk i ustawień"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>

                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-100 hidden sm:inline-block max-w-[120px] truncate">
                    {user.name}
                  </span>

                  {/* Assigned tasks badge */}
                  {stats.assignedTasksCount > 0 && (
                    <span
                      className="px-2 py-0.5 bg-red-500 text-white font-black text-[10px] rounded-full shadow-xs animate-pulse"
                      title={`${stats.assignedTasksCount} przypisanych zadań produktywnych`}
                    >
                      📋 {stats.assignedTasksCount}
                    </span>
                  )}

                  {/* Points badge */}
                  {Boolean(stats.userPoints) && (
                    <span className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 bg-amber-500 text-white font-black text-[10px] rounded-full shadow-xs">
                      ⭐ {stats.userPoints} pkt
                    </span>
                  )}

                  <svg
                    className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu Popup */}
                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsUserMenuOpen(false)}
                    />

                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-40 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      {/* Header User Card */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-600 to-brand-400 text-white font-black text-sm flex items-center justify-center shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="truncate min-w-0">
                            <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100 truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-mono">
                              @{user.login || user.name}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <span className="px-2.5 py-0.5 bg-brand-100 text-brand-800 dark:bg-brand-950 dark:text-brand-300 font-extrabold text-[10px] rounded-md uppercase tracking-wider">
                            Rola: {user.role}
                          </span>
                          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-[10px] rounded-md">
                            {stats.rankTitle}
                          </span>
                        </div>
                      </div>

                      {/* Stats Overview */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                        <div className="p-2.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 rounded-xl">
                          <span className="text-[10px] font-extrabold text-red-600 dark:text-red-400 uppercase tracking-wider block">
                            Zadania do zrobienia
                          </span>
                          <span className="text-lg font-black text-red-700 dark:text-red-300">
                            {stats.assignedTasksCount}
                          </span>
                        </div>

                        <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl">
                          <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                            Punkty Kaizen
                          </span>
                          <span className="text-lg font-black text-amber-700 dark:text-amber-300">
                            ⭐ {stats.userPoints}
                          </span>
                        </div>
                      </div>

                      {/* Action Links */}
                      <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <Link
                          href="/zadania"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span>📋</span> Moje Zadania Produkcji
                          </span>
                          {stats.assignedTasksCount > 0 && (
                            <span className="px-2 py-0.5 bg-red-500 text-white font-black text-[10px] rounded-full">
                              {stats.assignedTasksCount}
                            </span>
                          )}
                        </Link>

                        <Link
                          href="/kaizen"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span>💡</span> Moje Pomysły Kaizen
                          </span>
                          <span className="text-slate-400 text-[11px] font-normal">
                            ({stats.submittedKaizensCount})
                          </span>
                        </Link>

                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setIsPasswordModalOpen(true);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <span>🔒</span> Zmień Hasło
                        </button>
                      </div>

                      {/* Logout button */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <span>🚪</span> Wyloguj się
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link 
                href="/logowanie" 
                className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white shadow-sm transition-all"
              >
                Zaloguj
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
}

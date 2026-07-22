'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { ThemeSelector } from '@/components/ui/ThemeSelector';

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export default function Header({ onOpenMobileMenu }: HeaderProps) {
  const { user, isAdmin } = useAuth();

  return (
    <header className="sticky top-0 z-20 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 print:hidden shadow-sm px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-3">
          {/* Mobile hamburger button */}
          <button 
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none flex items-center gap-2 group"
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
          {/* Theme Selector Mode (Light / Dark / System) */}
          <ThemeSelector compact />

          <Link
            href="/ustawienia/historia-dostepu"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl text-xs font-bold transition-all border border-amber-200/60 dark:border-amber-800/60"
            title="Rejestr odczytów i cyfrowych podpisów zapoznania się z dokumentami"
          >
            <span>📜</span> Rejestr Zapoznań
          </Link>

          {user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <div className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold text-xs flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden sm:inline-block">{user.name}</span>
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
  );
}

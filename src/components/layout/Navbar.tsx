'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from './Sidebar';

export default function Navbar() {
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 print:hidden shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none flex items-center gap-2 group"
              title="Otwórz menu nawigacyjne"
            >
              <svg className="w-6 h-6 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-brand-600 dark:group-hover:text-brand-400 hidden sm:inline-block">Menu</span>
            </button>

            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-lg">A</span>
              </div>
              <span className="font-extrabold text-xl text-slate-800 dark:text-slate-100 tracking-tight">
                Audit<span className="text-brand-500">App</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                <div className="w-6 h-6 rounded-full bg-brand-500 text-white font-bold text-xs flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 hidden md:inline-block">{user.name}</span>
              </div>
            ) : (
              <Link 
                href="/logowanie" 
                className="text-xs font-bold px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-sm transition-all"
              >
                Zaloguj
              </Link>
            )}
          </div>
        </div>
      </div>

      <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={() => setIsSidebarOpen(false)} />
    </nav>
  );
}

'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { BhpTrainingNoticeModal } from '../ui/BhpTrainingNoticeModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  const isLoginPage = pathname === '/logowanie';

  if (isLoginPage) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
            {children}
          </div>
        </ToastProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <BhpTrainingNoticeModal />
        <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          {/* Kontener 1: Pasek Boczny (Stałek na Desktopie, Drawer na Mobile) */}
          <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />

          {/* Kontener 2: Główny Roboczy Obszar Strony */}
          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            <Header onOpenMobileMenu={() => setIsMobileOpen(true)} />
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

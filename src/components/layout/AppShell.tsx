'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import { ToastProvider } from '@/context/ToastContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { BhpTrainingNoticeModal } from '../ui/BhpTrainingNoticeModal';
import { useAuth } from '@/hooks/useAuth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const isStandalonePage =
    pathname === '/logowanie' ||
    (typeof window !== 'undefined' && window.location.search.includes('embed=true'));

  const isHelpDeskPage = pathname === '/helpdesk' || pathname.startsWith('/helpdesk/');
  const userRole = String(user?.role || '').replace(/[^a-z0-9]/gi, '').toUpperCase();
  const isRestrictedHelpDeskUser = !!user && ['HELPDESK', 'ITHELPDESK', 'IT'].includes(userRole);
  const showHelpDeskShell = isHelpDeskPage && isRestrictedHelpDeskUser;
  const showFullShell = !showHelpDeskShell;

  if (isStandalonePage) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 sm:p-4">
            {children}
          </div>
        </ToastProvider>
      </ThemeProvider>
    );
  }

  if (loading && !user && !isStandalonePage) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </ToastProvider>
      </ThemeProvider>
    );
  }

  if (isStandalonePage) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-2 sm:p-4">
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
          {showFullShell && (
            <Sidebar isMobileOpen={isMobileOpen} onMobileClose={() => setIsMobileOpen(false)} />
          )}

          <div className="flex-1 flex flex-col min-w-0 min-h-screen">
            {showFullShell ? (
              <Header onOpenMobileMenu={() => setIsMobileOpen(true)} />
            ) : (
              <div className="sticky top-0 z-20 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 py-3 flex justify-end">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await logout();
                    } catch {
                      if (typeof window !== 'undefined') {
                        window.location.assign('/logowanie');
                      }
                    }
                  }}
                  className="px-4 py-2 rounded-xl border bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60 font-extrabold text-xs transition-all shadow-xs cursor-pointer flex items-center gap-2"
                  title="Wyloguj się"
                >
                  <span>🚪</span>
                  Wyloguj
                </button>
              </div>
            )}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}

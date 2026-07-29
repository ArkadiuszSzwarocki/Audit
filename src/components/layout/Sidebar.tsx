'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface MenuItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
  badgeColor?: string;
  visible?: boolean;
}

interface Module {
  id: string;
  name: string;
  emoji: string;
  icon: React.ReactNode;
  items: MenuItem[];
  visible?: boolean;
}

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  const { isAdmin, isKaizenCommittee, user, logout } = useAuth();
  const pathname = usePathname();

  const isHelpDeskPage = pathname === '/helpdesk' || pathname.startsWith('/helpdesk/');
  const userRoleUpper = String(user?.role || '').toUpperCase();
  const normalizedRole = userRoleUpper.replace(/[^A-Z0-9]/g, '');
  const isRestrictedHelpDeskUser = isHelpDeskPage && !!user && ['HELPDESK', 'ITHELPDESK', 'IT'].includes(normalizedRole);
  const canManageKaizen = !!(
    isAdmin ||
    isKaizenCommittee ||
    ['KOMISJA KAIZEN', 'KOMISJA_KAIZEN', 'KAIZEN_COMMITTEE'].includes(userRoleUpper)
  );

  // Moduły - domyślnie otwarte
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({
    audits: true,
    personnel: true,
    kaizen: true,
    quality: true,
    admin: false,
  });

  // Ustawienie widoczności sekcji admina po załadowaniu roli
  useEffect(() => {
    if (isAdmin) {
      setOpenModules((prev) => ({ ...prev, admin: true }));
    }
  }, [isAdmin]);

  const toggleModule = (key: string) => {
    setOpenModules((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const [menuCounts, setMenuCounts] = useState<{
    pendingKaizens: number;
    pendingTasks: number;
    openFaultReports: number;
    openBhpHazards: number;
    openQualityReports: number;
  }>({
    pendingKaizens: 0,
    pendingTasks: 0,
    openFaultReports: 0,
    openBhpHazards: 0,
    openQualityReports: 0,
  });

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const r = await fetch('/api/menu-counts');
        if (r.ok) {
          const data = await r.json();
          if (data && typeof data.pendingKaizens === 'number') {
            setMenuCounts(data);
          }
        }
      } catch {
        // Silently ignore network polling errors
      }
    };

    loadCounts();
    const interval = setInterval(loadCounts, 10000);
    return () => clearInterval(interval);
  }, [pathname]);

  // Definiowanie 5 modułów + Zadania Produkcji i Help Desk poza modułami
  const [showHelpDeskInfo, setShowHelpDeskInfo] = useState(false);

  const taskItem: MenuItem = {
    name: 'Zadania Produkcji',
    href: '/zadania',
    badge: menuCounts.pendingTasks,
    badgeColor: 'bg-red-500',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    visible: true,
  };

  const helpDeskItem: MenuItem = {
    name: 'Help Desk',
    href: '/helpdesk',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
    visible: true,
  };

  const modules: Module[] = [
    // 1. Zgłoszenia (⚠️)
    {
      id: 'quality',
      name: 'Zgłoszenia',
      emoji: '⚠️',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      visible: true,
      items: [
        {
          name: 'Zagrożenia BHP',
          href: '/bhp',
          badge: menuCounts.openBhpHazards,
          badgeColor: 'bg-orange-600',
          icon: (
            <svg className="w-5 h-5 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Zgłoszenia Jakościowe',
          href: '/jakosc',
          badge: menuCounts.openQualityReports,
          badgeColor: 'bg-purple-600',
          icon: (
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Zgłoszenia Usterek',
          href: '/usterki',
          badge: menuCounts.openFaultReports,
          badgeColor: 'bg-rose-600',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          ),
          visible: true,
        },
      ],
    },
    // 2. Kaizen (✨)
    {
      id: 'kaizen',
      name: 'Kaizen',
      emoji: '✨',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
      visible: true,
      items: [
        {
          name: 'Kaizen & Ulepszenia',
          href: '/kaizen',
          badge: menuCounts.pendingKaizens,
          badgeColor: 'bg-amber-500',
          icon: (
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Wypłaty Kaizen (Komisja)',
          href: '/kaizen/wyplaty',
          icon: (
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          visible: canManageKaizen,
        },
      ],
    },
    // 3. Personnel (👥)
    {
      id: 'personnel',
      name: 'Personel',
      emoji: '👥',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      visible: true,
      items: [
        {
          name: 'Szkolenia & Badania',
          href: '/struktura/szkolenia',
          icon: (
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Urlopy & Czas Pracy',
          href: '/urlopy',
          icon: (
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Aprobata Urlopów',
          href: '/urlopy/approvals',
          badge: 0,
          badgeColor: 'bg-yellow-500',
          icon: (
            <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          visible: ['MANAGER', 'ADMIN', 'DIRECTOR'].includes(userRoleUpper),
        },
        {
          name: 'Zarządzanie Pulą',
          href: '/urlopy/saldo',
          badgeColor: 'bg-green-500',
          icon: (
            <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          visible: ['ADMIN', 'ADMINISTRATOR', 'ZARZAD', 'ZARZĄD', 'DIRECTOR', 'HR'].includes(userRoleUpper),
        },
        {
          name: 'Raporty Urlopów',
          href: '/urlopy/raporty',
          icon: (
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          visible: ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(userRoleUpper),
        },
        {
          name: 'Organizacja',
          href: '/organizacja',
          icon: (
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          ),
          visible: true,
        },
      ],
    },
    // 4. Audyty (📋)
    {
      id: 'audits',
      name: 'Audyty',
      emoji: '📋',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      visible: true,
      items: [
        {
          name: 'Audyty',
          href: '/audyty',
          icon: (
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Dokumentacja',
          href: '/dokumentacja',
          icon: (
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Informator',
          href: '/informator',
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          visible: true,
        },
      ],
    },
    // 5. Ustawienia (⚙️)
    {
      id: 'admin',
      name: 'Ustawienia',
      emoji: '⚙️',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
      ),
      visible: isAdmin,
      items: [
        {
          name: 'Baza Danych (Prisma)',
          href: '/ustawienia/baza-danych',
          icon: (
            <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Dostęp Sieciowy (LAN & IP)',
          href: '/ustawienia/siec',
          icon: (
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Punktacja i Cele Kaizen',
          href: '/ustawienia/punktacja-kaizen',
          icon: (
            <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Role i Uprawnienia (RBAC)',
          href: '/ustawienia/role',
          icon: (
            <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Struktura Zakładu',
          href: '/struktura',
          icon: (
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Typy Audytów',
          href: '/ustawienia/typy-audytow',
          icon: (
            <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Użytkownicy i Konta',
          href: '/struktura/uzytkownicy',
          icon: (
            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
          visible: true,
        },
        {
          name: 'Wagi i Kategorie Zdarzeń',
          href: '/ustawienia/wagi-spostrzezen',
          icon: (
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-8 5h8" />
            </svg>
          ),
          visible: true,
        },
      ],
    },
  ];

  // Renderuj Zadania i Help Desk jako osobne byty przed modułami
  const renderTasksStandalone = () => (
    <Link
      href={taskItem.href}
      onClick={() => isMobileOpen && onMobileClose()}
      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all group w-full ${
        pathname === taskItem.href
          ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/10'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">
          {taskItem.icon}
        </span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{taskItem.name}</span>
      </div>
      {taskItem.badge && taskItem.badge > 0 && (
        <span className={`min-w-[18px] h-4 px-1 flex items-center justify-center rounded-full ${taskItem.badgeColor} text-white text-[10px] font-black shadow-sm`}>
          {taskItem.badge}
        </span>
      )}
    </Link>
  );

  const renderHelpDeskStandalone = () => (
    <button
      onClick={() => setShowHelpDeskInfo(true)}
      className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all group w-full text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/10"
      title="Kliknij aby dowiedzieć się więcej o Help Desk"
    >
      <div className="flex items-center gap-3">
        <span className="text-lg">
          {helpDeskItem.icon}
        </span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">{helpDeskItem.name}</span>
      </div>
      <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );

  const renderContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Logo & Header */}
      <div className="flex justify-between items-center px-6 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <Link href="/" onClick={() => isMobile && onMobileClose()} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <div>
            <span className="font-extrabold text-lg text-slate-800 dark:text-slate-100 tracking-tight block">
              Audit<span className="text-brand-500">App</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">System Audytów</span>
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

      {/* Nav items container */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
        <div className="space-y-4">
          {/* Zadania Produkcji - standalone item na górze */}
          {renderTasksStandalone()}
          
          {/* Help Desk - standalone item */}
          {renderHelpDeskStandalone()}

          {/* Modules */}
          {modules
            .filter((mod) => mod.visible !== false)
            .map((module) => {
              const isOpen = openModules[module.id];
              const hasActiveChild = module.items.some((item) => pathname === item.href);

              return (
                <div key={module.id} className="space-y-1">
                  {/* Module header button */}
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold tracking-wide transition-all group ${
                      hasActiveChild 
                        ? 'text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20' 
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl filter group-hover:scale-110 transition-transform font-bold">
                        {module.emoji}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 group-hover:text-slate-950 dark:group-hover:text-white">
                        {module.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isOpen && (
                        (() => {
                          const badgeSum = module.items
                            .filter((item) => item.visible !== false && item.badge && item.badge > 0)
                            .reduce((sum, item) => sum + (item.badge || 0), 0);
                          return badgeSum > 0 ? (
                            <span className="min-w-[18px] h-4 px-1 flex items-center justify-center rounded-full bg-brand-500 text-white text-[10px] font-black shadow-sm shrink-0">
                              {badgeSum}
                            </span>
                          ) : null;
                        })()
                      )}
                      <svg
                        className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Module sub-items */}
                  {isOpen && (
                    <ul className="pl-4 space-y-1 mt-1 border-l-2 border-slate-100 dark:border-slate-800 ml-4 animate-in fade-in slide-in-from-top-1 duration-200">
                      {module.items
                        .filter((item) => item.visible !== false)
                        .map((item) => {
                          const isActive = pathname === item.href;
                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => isMobile && onMobileClose()}
                                className={`flex items-center justify-between px-3 py-2 rounded-lg font-medium text-xs transition-all duration-150 ${
                                  isActive
                                    ? 'bg-brand-500/10 text-brand-600 dark:text-brand-400 font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-white hover:translate-x-1'
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className={`w-4 h-4 flex items-center justify-center shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`}>
                                    {item.icon}
                                  </span>
                                  <span>{item.name}</span>
                                </div>

                                {Boolean(item.badge && item.badge > 0) && (
                                  <span className={`min-w-[18px] h-4.5 px-1 flex items-center justify-center rounded-full ${item.badgeColor || 'bg-brand-500'} text-white text-[9.5px] font-extrabold shadow-sm shrink-0`}>
                                    {item.badge}
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );

  if (isRestrictedHelpDeskUser) {
    return null;
  }

  return (
    <>
      {/* Permanent Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 lg:w-72 shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-r border-slate-200/80 dark:border-slate-800/80 h-screen sticky top-0 z-30 print:hidden">
        {renderContent(false)}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[60] transition-opacity animate-in fade-in duration-300 print:hidden cursor-pointer"
          onClick={onMobileClose}
        />
      )}
      <aside 
        className={`lg:hidden fixed inset-y-0 left-0 z-[61] w-80 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl transform transition-transform duration-300 ease-out print:hidden ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {renderContent(true)}
      </aside>

      {/* Help Desk Info Modal */}
      {showHelpDeskInfo && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Help Desk</h3>
              </div>
              <button
                onClick={() => setShowHelpDeskInfo(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-700 dark:text-slate-300">
                Help Desk to forma komunikacji z działem IT. Tutaj zgłaszamy:
              </p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span className="text-slate-700 dark:text-slate-300"><strong>Problemy techniczne</strong> i awarie systemów</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span className="text-slate-700 dark:text-slate-300"><strong>Zakupy sprzętu i oprogramowania</strong> dla działu IT</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-500 font-bold mt-0.5">•</span>
                  <span className="text-slate-700 dark:text-slate-300"><strong>Wnioski o wsparcie</strong> i doradztwo techniczne</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-6 flex gap-3">
              <Link
                href="/helpdesk"
                onClick={() => setShowHelpDeskInfo(false)}
                className="flex-1 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg transition-colors text-center"
              >
                Przejdź do Help Desk
              </Link>
              <button
                onClick={() => setShowHelpDeskInfo(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
              >
                Zamknij
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

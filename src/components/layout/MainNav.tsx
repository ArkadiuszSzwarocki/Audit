import { useToast } from '@/context/ToastContext';
import { useDesktopNotifications } from '@/hooks/useDesktopNotifications';
import Link from 'next/link';

const navItems = [
  { href: '/audyty', label: 'Audyty' },
  { href: '/zadania', label: 'Zadania' },
  { href: '/kaizen', label: 'Kaizen' },
  { href: '/usterki', label: 'Usterki' },
  { href: '/jakosc', label: 'Jakość' },
  { href: '/bhp', label: 'BHP' },
  { href: '/helpdesk', label: 'Help Desk' },
  { href: '/struktura', label: 'Struktura' },
  { href: '/dokumentacja', label: 'Dokumentacja' },
  { href: '/informator', label: 'Informator' },
];

export function MainNav() {
  const { showToast } = useToast();
  const { requestPermission } = useDesktopNotifications();

  const handleNotificationClick = () => {
    showToast('Notification clicked', 'info');
  };

  const handleNotificationClickHandler = () => {
    requestPermission();
  };

  return (
    <nav className="flex flex-wrap items-center justify-between p-4">
      <div className="flex flex-wrap items-center gap-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleNotificationClick}
          className="flex items-center gap-2 rounded-full bg-blue-500 px-3 py-1 text-white"
        >
          <span>Notifications</span>
        </button>
        <button
          onClick={handleNotificationClickHandler}
          className="flex items-center gap-2 rounded-full bg-green-500 px-3 py-1 text-white"
        >
          <span>Enable Notifications</span>
        </button>
      </div>
    </nav>
  );
}

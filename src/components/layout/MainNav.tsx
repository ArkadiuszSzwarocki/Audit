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
  return (
    <nav className="flex flex-wrap items-center justify-between p-4">
      <div className="flex flex-wrap items-center gap-4">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

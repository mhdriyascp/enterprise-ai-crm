'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  role?: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard' },
  { href: '/tenants', label: 'Tenants', role: 'platform-admin' },
  { href: '/users', label: 'Users' },
  { href: '/workflows', label: 'Workflows' },
  { href: '/integrations', label: 'Integrations' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 flex-col border-r border-slate-200 bg-white">
      <div className="px-5 py-4 text-lg font-semibold text-brand-600">CRM Admin</div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                'rounded-md px-3 py-2 text-sm font-medium transition-colors ' +
                (active
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900')
              }
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-400">
        Enterprise AI CRM
      </div>
    </aside>
  );
}

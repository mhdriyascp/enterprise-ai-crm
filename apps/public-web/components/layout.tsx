'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/features', label: 'Features' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/contact', label: 'Contact' },
];

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002';

export function Navbar() {
  const pathname = usePathname();
  return (
    <header className="border-b border-slate-200">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-lg font-semibold text-brand-600">
          Enterprise AI CRM
        </Link>
        <nav className="hidden gap-6 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                'text-sm font-medium transition-colors ' +
                (pathname === link.href
                  ? 'text-brand-600'
                  : 'text-slate-600 hover:text-slate-900')
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <a
          href={`${appUrl}/login`}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Sign in
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-slate-200">
      <div className="mx-auto max-w-6xl px-6 py-8 text-sm text-slate-500">
        <p>© {new Date().getFullYear()} Enterprise AI CRM. All rights reserved.</p>
      </div>
    </footer>
  );
}

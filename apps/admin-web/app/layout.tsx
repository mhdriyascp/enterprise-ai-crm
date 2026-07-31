import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'CRM Admin Portal',
  description: 'Administration portal for the Enterprise AI CRM platform',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-y-auto px-8 py-6">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

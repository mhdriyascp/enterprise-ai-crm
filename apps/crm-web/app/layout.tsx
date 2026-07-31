import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/sidebar';

export const metadata: Metadata = {
  title: 'CRM',
  description: 'Enterprise AI CRM application for sales teams',
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

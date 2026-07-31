import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Footer, Navbar } from '@/components/layout';

export const metadata: Metadata = {
  title: 'Enterprise AI CRM — AI-first customer relationships',
  description:
    'An AI-first, multi-tenant CRM platform with deeply embedded AI agents, RAG search, and workflow automation.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

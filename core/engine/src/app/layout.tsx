import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'MDB — Meridian Artifact Browser',
  description: 'AI-powered engineering cockpit for Meridian product artifacts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

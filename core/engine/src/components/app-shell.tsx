'use client';

import { TopBar } from '@/components/top-bar';
import { Breadcrumb } from '@/components/breadcrumb';

/**
 * Persistent application shell wrapping all instrument views.
 * Contains: top bar (project name, readiness gauge, tabs, search) and breadcrumb.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />
      <div className="border-b border-gray-800 bg-gray-950 px-4 py-2">
        <Breadcrumb />
      </div>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

'use client';

import { TopBar } from '@/components/top-bar';
import { Breadcrumb } from '@/components/breadcrumb';

export interface AppShellProps {
  children: React.ReactNode;
  /** Project name from config, passed down to TopBar. */
  projectName?: string;
}

/**
 * Persistent application shell wrapping all instrument views.
 * Contains: top bar (project name from config, readiness gauge, tabs, search) and breadcrumb.
 */
export function AppShell({ children, projectName }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <TopBar projectName={projectName} />
      <div className="border-b border-gray-800 bg-gray-950 px-4 py-2">
        <Breadcrumb />
      </div>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}

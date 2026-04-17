'use client';

import { TopBar } from '@/components/top-bar';
import { Breadcrumb } from '@/components/breadcrumb';
import { ReadinessProvider } from '@/components/readiness-provider';
import { BreadcrumbExtrasProvider } from '@/components/breadcrumb-context';

export interface AppShellProps {
  children: React.ReactNode;
  /** Project name from config, passed down to TopBar. */
  projectName?: string;
}

/**
 * Persistent application shell wrapping all instrument views.
 * Contains: top bar (project name from config, readiness gauge, tabs, search) and breadcrumb.
 *
 * Wraps all content in ReadinessProvider so the readiness score is consistent
 * across all views — the mini-gauge in the top bar and the large gauge on
 * Checklists both consume the same context (VAL-CHECK-003).
 */
export function AppShell({ children, projectName }: AppShellProps) {
  return (
    <ReadinessProvider>
      <BreadcrumbExtrasProvider>
        <div className="flex min-h-screen flex-col">
          <TopBar projectName={projectName} />
          <div className="border-b border-gray-800 bg-gray-950 px-4 py-2">
            <Breadcrumb />
          </div>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </BreadcrumbExtrasProvider>
    </ReadinessProvider>
  );
}

import path from 'node:path';
import type { Metadata } from 'next';
import { AppShell } from '@/components/app-shell';
import { loadConfig, getConfig } from '@/lib/config';
import './globals.css';

// Initialise config from the target repo's config file (server component, runs on server only).
// Falls back gracefully to defaults when the file is missing or malformed.
const repoRoot = process.env.MDB_TARGET_REPO || process.cwd();
loadConfig(path.resolve(repoRoot, '.meridian/core/config.yaml'));

export const metadata: Metadata = {
  title: 'MDB — Meridian Artifact Browser',
  description: 'AI-powered engineering cockpit for Meridian product artifacts',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const config = getConfig();

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-950 text-gray-100 antialiased">
        <AppShell projectName={config.project.name}>{children}</AppShell>
      </body>
    </html>
  );
}

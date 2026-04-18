/**
 * API Route: /api/checklists
 *
 * Returns all built-in checklist definitions loaded from YAML data files.
 * Validates play references before returning.
 *
 * Error propagation:
 *   - ALL built-ins failed → 500 with loadErrors
 *   - Partial failures     → 200 with partial:true and loadErrors
 *   - All OK               → 200 with partial:false (no loadErrors)
 *
 * Fulfills: VAL-CHECK-028 (checklists read from data layer at runtime)
 */

import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { ensureConfigLoaded, getConfig, resolveRepoRoot } from '@/lib/config';
import { getBuiltInChecklists, validateAllPlayReferences } from '@/lib/checklist-loader';

export const dynamic = 'force-dynamic';

interface BriefArtifactSummary {
  readonly path: string;
  readonly title: string;
  readonly preview: string;
  readonly content: string;
}

function discoverBriefArtifacts(): ReadonlyArray<BriefArtifactSummary> {
  ensureConfigLoaded();
  const repoRoot = resolveRepoRoot();
  const config = getConfig();
  const productRoot = path.resolve(repoRoot, config.product.basePath);
  const candidateDirs = ['user-provided', 'specification', 'research'].map((dir) =>
    path.join(productRoot, dir),
  );
  const files: BriefArtifactSummary[] = [];

  for (const dir of candidateDirs) {
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      if (!/\.(md|markdown|txt|ya?ml)$/i.test(entry.name)) continue;
      const abs = path.join(dir, entry.name);
      const raw = fs.readFileSync(abs, 'utf-8').trim();
      if (!raw) continue;
      const relative = path.relative(productRoot, abs);
      const titleLine = raw.split(/\r?\n/).find((line) => line.trim().length > 0) ?? entry.name;
      files.push({
        path: relative,
        title: titleLine.replace(/^#+\s*/, '').slice(0, 120),
        preview: raw.replace(/\s+/g, ' ').slice(0, 220),
        content: raw.slice(0, 6000),
      });
      if (files.length >= 8) return files;
    }
  }

  return files;
}

export async function GET() {
  try {
    const briefArtifacts = discoverBriefArtifacts();
    const { checklists, errors } = getBuiltInChecklists();
    const validation = validateAllPlayReferences();

    if (!validation.valid) {
      console.warn(
        '[api/checklists] Invalid play references detected:',
        validation.invalidReferences,
      );
    }

    // ALL built-ins failed → 500
    if (checklists.length === 0 && errors.length > 0) {
      console.error('[api/checklists] All built-in checklists failed to load:', errors);

      return NextResponse.json(
        {
          checklists: [],
          briefArtifacts,
          partial: false,
          loadErrors: errors,
          validation: { valid: false, invalidCount: 0 },
        },
        { status: 500 },
      );
    }

    // Partial failures → 200 with partial flag
    if (errors.length > 0) {
      console.warn('[api/checklists] Some checklists failed to load:', errors);

      return NextResponse.json({
        checklists,
        briefArtifacts,
        partial: true,
        loadErrors: errors,
        validation: {
          valid: validation.valid,
          invalidCount: validation.invalidReferences.length,
        },
      });
    }

    // All OK
    return NextResponse.json({
      checklists,
      briefArtifacts,
      partial: false,
      validation: {
        valid: validation.valid,
        invalidCount: validation.invalidReferences.length,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/checklists] Error loading checklists:', message);

    return NextResponse.json(
      {
        checklists: [],
        briefArtifacts: [],
        partial: false,
        loadErrors: [message],
        validation: { valid: false, invalidCount: 0 },
        error: message,
      },
      { status: 500 },
    );
  }
}

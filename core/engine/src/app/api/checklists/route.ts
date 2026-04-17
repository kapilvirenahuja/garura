/**
 * API Route: /api/checklists
 *
 * Returns all built-in checklist definitions loaded from YAML data files.
 * Validates play references before returning.
 *
 * Fulfills: VAL-CHECK-028 (checklists read from data layer at runtime)
 */

import { NextResponse } from 'next/server';
import { getBuiltInChecklists, validateAllPlayReferences } from '@/lib/checklist-loader';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const checklists = getBuiltInChecklists();
    const validation = validateAllPlayReferences();

    if (!validation.valid) {
      console.warn(
        '[api/checklists] Invalid play references detected:',
        validation.invalidReferences,
      );
    }

    return NextResponse.json({
      checklists,
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
        validation: { valid: false, invalidCount: 0 },
        error: message,
      },
      { status: 500 },
    );
  }
}

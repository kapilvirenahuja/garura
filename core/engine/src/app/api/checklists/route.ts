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
import { getBuiltInChecklists, validateAllPlayReferences } from '@/lib/checklist-loader';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
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
        partial: false,
        loadErrors: [message],
        validation: { valid: false, invalidCount: 0 },
        error: message,
      },
      { status: 500 },
    );
  }
}

/**
 * API Route: /api/checklists/midproject
 *
 * Returns checklists selected and ordered for the mid-project state (readiness > 0).
 * Active checklists are ordered by their impact on readiness score (highest first).
 * Completed checklists are separated for display at the bottom.
 * Includes a selection rationale for the generative region.
 *
 * Fulfills: VAL-CHECK-012 (multiple checklists),
 *           VAL-CHECK-015 (completed at bottom),
 *           VAL-CHECK-016 (ordered by impact),
 *           VAL-CHECK-017 (selection rationale)
 */

import { NextResponse } from 'next/server';
import path from 'node:path';
import { getConfig, resolveRepoRoot } from '@/lib/config';
import {
  getBuiltInChecklists,
  type ChecklistDefinition,
  type ChecklistRelatedEpic,
} from '@/lib/checklist-loader';
import { computeReadinessFromPath } from '@/lib/readiness';
import { selectChecklists } from '@/lib/checklist-engine';
import { createGitIntegration } from '@/lib/git-integration';
import { parseArtifacts, type RoadmapContent } from '@/lib/artifact-parser';

export const dynamic = 'force-dynamic';

/**
 * Checklist IDs that, when a roadmap exists with at least one epic, should
 * surface a clickable "Open in Playbook" chip in the UI (VAL-PLAY-008,
 * VAL-CROSS-001). We pick the most relevant live epic and inject it as
 * `relatedEpic`. Static YAML definitions intentionally do not hard-code a
 * specific epic id — the mapping is derived from the current roadmap
 * artifact so it stays accurate as the roadmap evolves.
 */
const CHECKLISTS_THAT_LINK_TO_EPIC = new Set<string>(['prepare-epic', 'brownfield-onboarding']);

/**
 * Pick the epic to surface as the "related" context for checklists that
 * operate on a specific epic. Preference order:
 *   1. First epic marked in-progress
 *   2. First epic in roadmap order
 *
 * Returns `null` when the roadmap has no epics.
 */
function pickRelatedEpic(roadmap: RoadmapContent | null): ChecklistRelatedEpic | null {
  if (!roadmap || roadmap.epics.length === 0) return null;
  const inProgress = roadmap.epics.find(
    (e) => typeof e.status === 'string' && /in[-_\s]?progress/i.test(e.status),
  );
  const picked = inProgress ?? roadmap.epics[0];
  if (!picked) return null;
  const label = picked.name ? `${picked.id}: ${picked.name}` : picked.id;
  return { id: picked.id, label };
}

/**
 * Clone the checklist list, injecting `relatedEpic` into every entry that
 * wants one but does not already declare one. Checklists with an explicit
 * `relatedEpic` in their YAML are left untouched.
 */
function enrichChecklistsWithRoadmapEpic(
  checklists: ReadonlyArray<ChecklistDefinition>,
  relatedEpic: ChecklistRelatedEpic | null,
): ReadonlyArray<ChecklistDefinition> {
  if (!relatedEpic) return checklists;
  return checklists.map((cl) => {
    if (cl.relatedEpic) return cl;
    if (!CHECKLISTS_THAT_LINK_TO_EPIC.has(cl.id)) return cl;
    return { ...cl, relatedEpic };
  });
}

function loadRoadmap(productBasePath: string): RoadmapContent | null {
  const results = parseArtifacts([
    { path: path.join(productBasePath, 'roadmap.yaml'), type: 'roadmap' },
  ]);
  const hit = results.find((r) => r.type === 'roadmap' && r.status === 'ok');
  return (hit?.content as RoadmapContent | undefined) ?? null;
}

export async function GET() {
  try {
    const config = getConfig();
    const repoRoot = resolveRepoRoot();
    const productBasePath = path.resolve(repoRoot, config.product.basePath);

    // Get current git hash for readiness computation
    const git = createGitIntegration(repoRoot);
    const changeResult = await git.detectChanges();
    const gitHash = 'changed' in changeResult ? changeResult.currentHash : null;

    // Compute readiness to determine project state and ordering
    const readinessResult = computeReadinessFromPath(productBasePath, gitHash);

    // Load all built-in checklists
    const { checklists: allChecklists } = getBuiltInChecklists();

    // Inject a `relatedEpic` reference for checklists that operate on a
    // specific epic (prepare-epic, brownfield-onboarding). This drives the
    // "Open in Playbook" chip in the Checklists UI (VAL-PLAY-008).
    const roadmap = loadRoadmap(productBasePath);
    const relatedEpic = pickRelatedEpic(roadmap);
    const enriched = enrichChecklistsWithRoadmapEpic(allChecklists, relatedEpic);

    // Select, order, and categorize checklists for mid-project view.
    // Step completion ordering is handled client-side by useStepExecution hook —
    // no server-side persistence needed for V1 (session state is sufficient).
    const selection = selectChecklists(enriched, readinessResult);

    return NextResponse.json({
      active: selection.active,
      completed: selection.completed,
      selectionRationale: selection.selectionRationale,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/checklists/midproject] Error:', message);

    return NextResponse.json(
      {
        active: [],
        completed: [],
        selectionRationale: 'Unable to determine checklist selection.',
        error: message,
      },
      { status: 500 },
    );
  }
}

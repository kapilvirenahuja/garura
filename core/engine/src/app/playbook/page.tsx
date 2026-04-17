'use client';

import { useState, useCallback } from 'react';
import { CrossRefToken } from '@/components/cross-ref-token';
import { InlineExpansion } from '@/components/inline-expansion';

/** Represents a resolved entity detail for display in expansions. */
interface EntityDetail {
  readonly refId: string;
  readonly type: string;
  readonly title: string;
  readonly description: string;
  readonly source: string;
}

/**
 * Sample entity data for the Playbook Reader foundation.
 * In later milestones, this data comes from the cross-reference resolver + AI.
 */
const SAMPLE_ENTITIES: Readonly<Record<string, EntityDetail>> = {
  F1: {
    refId: 'F1',
    type: 'Feature',
    title: 'Task Inbox',
    description: 'Unified inbox showing all tasks assigned to the current user across projects.',
    source: 'features.yaml',
  },
  F2: {
    refId: 'F2',
    type: 'Feature',
    title: 'Smart Prioritization',
    description: 'AI-powered task ranking based on project health, deadlines, and dependencies.',
    source: 'features.yaml',
  },
  'SC-TASK-001': {
    refId: 'SC-TASK-001',
    type: 'Scenario',
    title: 'Inbox displays tasks sorted by priority',
    description:
      'User opens inbox. Tasks from all linked projects appear sorted by descending priority score.',
    source: 'scenarios.yaml',
  },
};

/**
 * Playbook Reader instrument page.
 *
 * Renders AI-composed narrative views from the artifact cross-reference graph.
 * Foundation wiring: demonstrates CrossRefToken → InlineExpansion interaction.
 * Full AI composition is wired in the Playbook Reader milestone.
 */
export default function PlaybookPage() {
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());

  const handleTokenClick = useCallback((refId: string) => {
    setExpandedTokens((prev) => {
      const next = new Set(prev);
      if (next.has(refId)) {
        next.delete(refId);
      } else {
        next.add(refId);
      }
      return next;
    });
  }, []);

  return (
    <div data-testid="playbook-view">
      <h2 className="text-2xl font-bold text-white">Playbook Reader</h2>
      <p className="mt-2 text-gray-400">
        AI-composed narrative views from the artifact cross-reference graph.
      </p>

      {/* Sample narrative with cross-reference tokens */}
      <div className="mt-6 space-y-4" data-testid="playbook-narrative">
        <p className="text-gray-300">
          The system centres on the <CrossRefToken refId="F1" onClick={handleTokenClick} /> feature,
          which provides a unified inbox for task management. Tasks are ranked using{' '}
          <CrossRefToken refId="F2" onClick={handleTokenClick} /> algorithms to surface the most
          important work first.
        </p>

        {/* Inline expansions for clicked tokens */}
        {expandedTokens.has('F1') && (
          <InlineExpansion summary="F1 — Task Inbox" defaultOpen>
            <EntityExpansionContent entity={SAMPLE_ENTITIES['F1']!} />
          </InlineExpansion>
        )}

        {expandedTokens.has('F2') && (
          <InlineExpansion summary="F2 — Smart Prioritization" defaultOpen>
            <EntityExpansionContent entity={SAMPLE_ENTITIES['F2']!} />
          </InlineExpansion>
        )}

        <p className="text-gray-300">
          The primary verification scenario{' '}
          <CrossRefToken refId="SC-TASK-001" onClick={handleTokenClick} /> validates that the inbox
          correctly sorts tasks by priority score.
        </p>

        {expandedTokens.has('SC-TASK-001') && (
          <InlineExpansion
            summary="SC-TASK-001 — Inbox displays tasks sorted by priority"
            defaultOpen
          >
            <EntityExpansionContent entity={SAMPLE_ENTITIES['SC-TASK-001']!} />
          </InlineExpansion>
        )}
      </div>
    </div>
  );
}

/** Renders entity details inside an InlineExpansion. */
function EntityExpansionContent({ entity }: { entity: EntityDetail }) {
  return (
    <div data-testid="entity-details" data-ref-id={entity.refId} className="space-y-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="rounded bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-300">
          {entity.type}
        </span>
        <span className="text-gray-400">·</span>
        <span className="text-xs text-gray-500">{entity.source}</span>
      </div>
      <h4 className="font-medium text-white">{entity.title}</h4>
      <p className="text-gray-400">{entity.description}</p>
    </div>
  );
}

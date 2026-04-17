'use client';

/**
 * WikiTagText — Renders a prose string, splitting on `[[play:prompt]]`
 * wiki-tag patterns and substituting interactive {@link WikiTagRunner}
 * components for every valid tag it finds.
 *
 * Behaviour:
 *   - Strings with no wiki tags render as a single text node — identical to
 *     what React would render if you passed the string directly.
 *   - Strings containing one or more valid `[[play:prompt]]` tags render
 *     plain text for the prose and a {@link WikiTagRunner} for each tag.
 *   - Malformed patterns (e.g. `[[play:]]`) are preserved verbatim in the
 *     text output — they NEVER produce a broken interactive element
 *     (VAL-ACTION-027).
 *
 * This component is the single integration point used by both the
 * Playbook Reader narrative renderer and the `EntityExpansion` "Explain
 * further" result so wiki tags are uniformly interactive regardless of
 * where they appear (VAL-ACTION-031).
 */

import React from 'react';
import { parseWikiTagSegments } from '@/lib/wiki-tag-parser';
import { WikiTagRunner } from '@/components/wiki-tag-runner';

export interface WikiTagTextProps {
  /** The raw prose string to render. */
  readonly text: string;
  /**
   * Optional narrative section id forwarded to every WikiTagRunner so
   * completed results are persisted against the correct anchor
   * (VAL-ACTION-025 / VAL-ACTION-026).
   */
  readonly sectionId?: string;
}

export function WikiTagText({ text, sectionId }: WikiTagTextProps) {
  const segments = parseWikiTagSegments(text);

  // Short-circuit when no tags were detected — avoid wrapping plain text in
  // an extra Fragment that would needlessly disturb the DOM.
  if (segments.length === 0) return null;
  const [first] = segments;
  if (segments.length === 1 && first && first.type === 'text') {
    return <>{first.text}</>;
  }

  return (
    <>
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <React.Fragment key={i}>{seg.text}</React.Fragment>
        ) : (
          <WikiTagRunner key={i} play={seg.play} prompt={seg.prompt} sectionId={sectionId} />
        ),
      )}
    </>
  );
}

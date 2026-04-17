/**
 * Tests for `wiki-tag-parser.ts`
 *
 * Covers feature `mdb-wiki-tag-parser`:
 *   - VAL-ACTION-001: Detects [[play-name:prompt]] patterns
 *   - VAL-ACTION-005: Forward-only state transitions (pending → running → complete)
 *   - VAL-ACTION-027: Malformed patterns render as plain text (no error, no token)
 *   - VAL-ACTION-034: Special characters preserved in prompt and CLI-escaped
 */

import { describe, expect, it } from 'vitest';
import {
  canTransitionWikiTag,
  escapePromptForCli,
  parseSingleWikiTag,
  parseWikiTagSegments,
  transitionWikiTag,
  type WikiTagSegment,
} from '@/lib/wiki-tag-parser';

// =============================================================================
// VAL-ACTION-001 — Pattern detection
// =============================================================================
describe('parseSingleWikiTag — basic pattern (VAL-ACTION-001)', () => {
  it('parses [[research:query]] into play and prompt', () => {
    const parsed = parseSingleWikiTag('[[research:query]]');
    expect(parsed).not.toBeNull();
    expect(parsed?.play).toBe('research');
    expect(parsed?.prompt).toBe('query');
    expect(parsed?.raw).toBe('[[research:query]]');
  });

  it('accepts hyphenated play names', () => {
    const parsed = parseSingleWikiTag('[[quality-check:scope]]');
    expect(parsed?.play).toBe('quality-check');
    expect(parsed?.prompt).toBe('scope');
  });

  it('accepts underscore-containing play names', () => {
    const parsed = parseSingleWikiTag('[[analyze_pr:changeset]]');
    expect(parsed?.play).toBe('analyze_pr');
    expect(parsed?.prompt).toBe('changeset');
  });

  it('preserves leading/trailing whitespace in prompt', () => {
    const parsed = parseSingleWikiTag('[[research:  leading and trailing  ]]');
    expect(parsed?.prompt).toBe('  leading and trailing  ');
  });
});

describe('parseWikiTagSegments — embedded in text (VAL-ACTION-001)', () => {
  it('returns a single text segment when no tags are present', () => {
    const segments = parseWikiTagSegments('nothing interesting here');
    expect(segments).toEqual<WikiTagSegment[]>([
      { type: 'text', text: 'nothing interesting here' },
    ]);
  });

  it('extracts a wiki tag from surrounding text', () => {
    const segments = parseWikiTagSegments('Before [[research:query]] after.');
    expect(segments).toHaveLength(3);
    expect(segments[0]).toEqual({ type: 'text', text: 'Before ' });
    expect(segments[1]).toMatchObject({
      type: 'wikitag',
      play: 'research',
      prompt: 'query',
      raw: '[[research:query]]',
    });
    expect(segments[2]).toEqual({ type: 'text', text: ' after.' });
  });

  it('extracts multiple wiki tags in a single string', () => {
    const segments = parseWikiTagSegments('[[a:one]] and [[b:two]]');
    const tags = segments.filter((s) => s.type === 'wikitag');
    expect(tags).toHaveLength(2);
    expect(tags[0]).toMatchObject({ play: 'a', prompt: 'one' });
    expect(tags[1]).toMatchObject({ play: 'b', prompt: 'two' });
  });

  it('returns empty array for empty input', () => {
    expect(parseWikiTagSegments('')).toEqual([]);
  });
});

// =============================================================================
// VAL-ACTION-027 — Malformed patterns render as plain text
// =============================================================================
describe('parseSingleWikiTag — malformed patterns (VAL-ACTION-027)', () => {
  it('rejects empty prompt: [[play:]]', () => {
    expect(parseSingleWikiTag('[[play:]]')).toBeNull();
  });

  it('rejects empty envelope: [[]]', () => {
    expect(parseSingleWikiTag('[[]]')).toBeNull();
  });

  it('rejects missing closing brackets: [[play', () => {
    expect(parseSingleWikiTag('[[play')).toBeNull();
  });

  it('rejects missing colon separator: [[play-prompt]]', () => {
    expect(parseSingleWikiTag('[[play-prompt]]')).toBeNull();
  });

  it('rejects empty play name: [[:prompt]]', () => {
    expect(parseSingleWikiTag('[[:prompt]]')).toBeNull();
  });

  it('rejects play names with illegal characters: [[play name:prompt]]', () => {
    expect(parseSingleWikiTag('[[play name:prompt]]')).toBeNull();
  });

  it('rejects single-bracket variants: [play:prompt]', () => {
    expect(parseSingleWikiTag('[play:prompt]')).toBeNull();
  });
});

describe('parseWikiTagSegments — malformed patterns become plain text', () => {
  // Concatenate every text segment back into a string. Narrowing to `type ===
  // 'text'` keeps TS happy about the `text` property access.
  const concatText = (segs: WikiTagSegment[]): string =>
    segs
      .filter((s): s is { type: 'text'; text: string } => s.type === 'text')
      .map((s) => s.text)
      .join('');

  it('renders [[play:]] entirely as text with no wiki tag segment', () => {
    const segments = parseWikiTagSegments('see [[play:]] here');
    expect(segments.every((s) => s.type === 'text')).toBe(true);
    expect(concatText(segments)).toBe('see [[play:]] here');
  });

  it('renders [[]] entirely as text', () => {
    const segments = parseWikiTagSegments('value [[]] end');
    expect(segments.every((s) => s.type === 'text')).toBe(true);
    expect(concatText(segments)).toBe('value [[]] end');
  });

  it('renders unterminated [[play as text without throwing', () => {
    expect(() => parseWikiTagSegments('text [[play incomplete')).not.toThrow();
    const segments = parseWikiTagSegments('text [[play incomplete');
    expect(segments.every((s) => s.type === 'text')).toBe(true);
    expect(concatText(segments)).toBe('text [[play incomplete');
  });

  it('isolates a valid tag from a malformed neighbour', () => {
    const segments = parseWikiTagSegments('[[play:]] then [[research:query]]');
    const tags = segments.filter((s) => s.type === 'wikitag');
    expect(tags).toHaveLength(1);
    expect(tags[0]).toMatchObject({ play: 'research', prompt: 'query' });
  });
});

// =============================================================================
// VAL-ACTION-034 — Special characters preserved + CLI-escaped
// =============================================================================
describe('parseSingleWikiTag — special characters (VAL-ACTION-034)', () => {
  it('preserves quotes, angle brackets, question marks', () => {
    const parsed = parseSingleWikiTag('[[research:what\'s the impact of "timeout" on <system>?]]');
    expect(parsed?.prompt).toBe('what\'s the impact of "timeout" on <system>?');
  });

  it('preserves shell metacharacters as literal text in the prompt', () => {
    const parsed = parseSingleWikiTag('[[research:a; rm -rf / | echo $HOME]]');
    expect(parsed?.prompt).toBe('a; rm -rf / | echo $HOME');
  });

  it('preserves unicode characters', () => {
    const parsed = parseSingleWikiTag('[[research:日本語 — résumé ✓]]');
    expect(parsed?.prompt).toBe('日本語 — résumé ✓');
  });
});

describe('escapePromptForCli — CLI safety (VAL-ACTION-034)', () => {
  it('wraps simple prompts in single quotes', () => {
    expect(escapePromptForCli('query')).toBe("'query'");
  });

  it('escapes single quotes in the prompt', () => {
    // POSIX-safe escape: close quote, emit \' literal, re-open quote.
    expect(escapePromptForCli("what's up")).toBe("'what'\\''s up'");
  });

  it('leaves double quotes untouched inside single-quoted shell string', () => {
    expect(escapePromptForCli('has "quotes"')).toBe('\'has "quotes"\'');
  });

  it('neutralises shell metacharacters by quoting', () => {
    const escaped = escapePromptForCli('a; rm -rf / | echo $HOME');
    expect(escaped.startsWith("'")).toBe(true);
    expect(escaped.endsWith("'")).toBe(true);
    // The literal string must still be present inside the quotes.
    expect(escaped).toContain('a; rm -rf / | echo $HOME');
  });

  it('returns an empty-but-quoted string for empty input', () => {
    expect(escapePromptForCli('')).toBe("''");
  });
});

// =============================================================================
// VAL-ACTION-005 — Forward-only state transitions
// =============================================================================
describe('WikiTag state transitions (VAL-ACTION-005)', () => {
  it('allows pending → running', () => {
    expect(canTransitionWikiTag('pending', 'running')).toBe(true);
    expect(transitionWikiTag('pending', 'running')).toBe('running');
  });

  it('allows running → complete', () => {
    expect(canTransitionWikiTag('running', 'complete')).toBe(true);
    expect(transitionWikiTag('running', 'complete')).toBe('complete');
  });

  it('allows pending → complete (short-circuit when cached)', () => {
    expect(canTransitionWikiTag('pending', 'complete')).toBe(true);
    expect(transitionWikiTag('pending', 'complete')).toBe('complete');
  });

  it('rejects complete → pending', () => {
    expect(canTransitionWikiTag('complete', 'pending')).toBe(false);
    // transitionWikiTag is a no-op on invalid inputs, state stays at current.
    expect(transitionWikiTag('complete', 'pending')).toBe('complete');
  });

  it('rejects complete → running', () => {
    expect(canTransitionWikiTag('complete', 'running')).toBe(false);
    expect(transitionWikiTag('complete', 'running')).toBe('complete');
  });

  it('rejects running → pending', () => {
    expect(canTransitionWikiTag('running', 'pending')).toBe(false);
    expect(transitionWikiTag('running', 'pending')).toBe('running');
  });

  it('is idempotent — same-state transitions preserve state', () => {
    expect(transitionWikiTag('pending', 'pending')).toBe('pending');
    expect(transitionWikiTag('running', 'running')).toBe('running');
    expect(transitionWikiTag('complete', 'complete')).toBe('complete');
  });
});

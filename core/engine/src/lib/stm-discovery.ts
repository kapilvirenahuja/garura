/**
 * STM evidence discovery.
 *
 * Walks the Garura STM base directory and returns every evidence file found
 * under every issue subfolder. The walk is fully recursive — Garura writes
 * nested layouts such as
 *
 *   <issue>/evidence/checkpoint/planning/run-01.yaml
 *   <issue>/quality-check/run-02.yaml
 *   <issue>/validation/result.md
 *
 * so a single-level scan misses the bulk of the payload. This helper mirrors
 * the recursive walk used by `scanStmEvidence` in `epic-status.ts`, but is
 * epic-agnostic: it yields every evidence file across every issue.
 *
 * All errors (missing/unreadable directories, permission denied, etc.) are
 * swallowed so callers can treat discovery as best-effort.
 */

import fs from 'node:fs';
import path from 'node:path';
import type { ArtifactType } from './artifact-parser';

/** A discovered STM evidence file with its artifact type. */
export interface StmEvidenceFile {
  readonly path: string;
  readonly type: ArtifactType;
}

/**
 * Recursively collect every YAML/Markdown evidence file under `dirPath`.
 * Appends results to `out`; returns nothing. Best-effort on errors.
 */
function collectEvidenceFiles(dirPath: string, out: StmEvidenceFile[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectEvidenceFiles(full, out);
      continue;
    }
    if (!entry.isFile()) continue;
    if (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml')) {
      out.push({ path: full, type: 'stm-evidence-yaml' });
    } else if (entry.name.endsWith('.md')) {
      out.push({ path: full, type: 'stm-evidence-markdown' });
    }
  }
}

/**
 * Discover every STM evidence file beneath `stmBasePath`.
 *
 * Behaviour:
 *   - Returns an empty array if `stmBasePath` does not exist or is not a
 *     directory.
 *   - Enumerates every issue subdirectory under `stmBasePath`.
 *   - Walks each issue subdirectory RECURSIVELY, so nested evidence layouts
 *     (e.g. `evidence/checkpoint/planning/run-01.yaml`) are included.
 *   - Classifies every `.yaml`/`.yml` file as `stm-evidence-yaml` and every
 *     `.md` file as `stm-evidence-markdown`. Other file types are ignored.
 */
export function discoverStmEvidence(stmBasePath: string): StmEvidenceFile[] {
  if (!fs.existsSync(stmBasePath)) return [];
  const out: StmEvidenceFile[] = [];
  try {
    const entries = fs.readdirSync(stmBasePath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const issueDir = path.join(stmBasePath, entry.name);
      collectEvidenceFiles(issueDir, out);
    }
  } catch {
    // Best-effort: swallow and return what we have.
  }
  return out;
}

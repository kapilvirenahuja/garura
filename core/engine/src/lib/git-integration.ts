/**
 * Garura Git Integration Layer
 *
 * simple-git wrapper providing branch listing with commit hashes, commit history
 * retrieval (hash, author, timestamp, message in newest-first order), last-processed
 * hash tracking via local JSON state file, change detection via hash comparison,
 * and graceful handling of missing git repositories and missing state files.
 *
 * Fulfills: VAL-FOUND-063, VAL-FOUND-064, VAL-FOUND-065, VAL-FOUND-066,
 *           VAL-FOUND-067, VAL-FOUND-068
 */

import fs from 'node:fs';
import path from 'node:path';
import { simpleGit, type SimpleGit } from 'simple-git';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A branch entry with its name and latest commit hash */
export interface BranchInfo {
  readonly name: string;
  readonly hash: string;
}

/** Result of listing branches */
export interface BranchListResult {
  readonly ok: true;
  readonly branches: readonly BranchInfo[];
}

/** A single commit entry from the history */
export interface CommitEntry {
  readonly hash: string;
  readonly author: string;
  readonly timestamp: string;
  readonly message: string;
}

/** Result of retrieving commit history */
export interface CommitHistoryResult {
  readonly ok: true;
  readonly commits: readonly CommitEntry[];
}

/** Error result from a git operation */
export interface GitErrorResult {
  readonly ok: false;
  readonly error: string;
}

/** Discriminated union for branch list operations */
export type BranchListOutcome = BranchListResult | GitErrorResult;

/** Discriminated union for commit history operations */
export type CommitHistoryOutcome = CommitHistoryResult | GitErrorResult;

/** Shape of the persisted state file */
interface StateFileData {
  readonly lastProcessedHash: string;
}

/** Result of change detection */
export interface ChangeDetectionResult {
  readonly changed: boolean;
  readonly currentHash: string;
  readonly lastProcessedHash: string | null;
}

// ---------------------------------------------------------------------------
// Default state file path
// ---------------------------------------------------------------------------

const DEFAULT_STATE_FILENAME = '.garura-git-state.json';

// ---------------------------------------------------------------------------
// GitIntegration class
// ---------------------------------------------------------------------------

export class GitIntegration {
  private readonly git: SimpleGit;
  private readonly repoPath: string;
  private readonly stateFilePath: string;

  /**
   * Create a new GitIntegration instance.
   *
   * @param repoPath - Absolute path to the git repository
   * @param stateFilePath - Optional path for the state file; defaults to `{repoPath}/.garura-git-state.json`
   */
  constructor(repoPath: string, stateFilePath?: string) {
    this.repoPath = repoPath;
    this.stateFilePath = stateFilePath ?? path.join(repoPath, DEFAULT_STATE_FILENAME);
    this.git = simpleGit(repoPath);
  }

  // -------------------------------------------------------------------------
  // Branch listing (VAL-FOUND-063)
  // -------------------------------------------------------------------------

  /**
   * List all branches with their latest commit hashes.
   *
   * Returns a graceful error for non-git directories without crashing.
   */
  async listBranches(): Promise<BranchListOutcome> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        return {
          ok: false,
          error: `Not a git repository: ${this.repoPath}`,
        };
      }

      // Use raw to get full (non-abbreviated) commit hashes
      const output = await this.git.raw([
        'branch',
        '-a',
        '--sort=-committerdate',
        '--format=%(refname:short) %(objectname)',
      ]);

      const branches: BranchInfo[] = output
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)
        .map((line) => {
          // Use lastIndexOf to handle branch names containing spaces,
          // such as "(HEAD detached at abc123)". The hash (40-char hex)
          // is always the last space-delimited token.
          const lastSpaceIndex = line.lastIndexOf(' ');
          return {
            name: line.slice(0, lastSpaceIndex),
            hash: line.slice(lastSpaceIndex + 1),
          };
        });

      return { ok: true, branches };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // -------------------------------------------------------------------------
  // Commit history (VAL-FOUND-064)
  // -------------------------------------------------------------------------

  /**
   * Retrieve commit history ordered newest-first.
   *
   * @param maxCount - Maximum number of commits to retrieve (default 50)
   * @param branch - Branch name to retrieve history for (default: current branch)
   */
  async getCommitHistory(maxCount: number = 50, branch?: string): Promise<CommitHistoryOutcome> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        return {
          ok: false,
          error: `Not a git repository: ${this.repoPath}`,
        };
      }

      const logOptions: string[] = [`-n`, `${maxCount}`, '--date=iso-strict'];
      if (branch) {
        logOptions.push(branch);
      }

      const log = await this.git.log(logOptions);
      const commits: CommitEntry[] = log.all.map((entry) => ({
        hash: entry.hash,
        author: entry.author_name,
        timestamp: entry.date,
        message: entry.message,
      }));

      return { ok: true, commits };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // -------------------------------------------------------------------------
  // Last-processed hash tracking (VAL-FOUND-065, VAL-FOUND-068)
  // -------------------------------------------------------------------------

  /**
   * Read the last-processed commit hash from the state file.
   *
   * Returns `null` when the state file does not exist (first run) or is
   * unreadable — without crashing.
   */
  readLastProcessedHash(): string | null {
    try {
      if (!fs.existsSync(this.stateFilePath)) {
        return null;
      }

      const raw = fs.readFileSync(this.stateFilePath, 'utf-8');
      const data = JSON.parse(raw) as Partial<StateFileData>;

      if (typeof data.lastProcessedHash !== 'string' || data.lastProcessedHash === '') {
        return null;
      }

      return data.lastProcessedHash;
    } catch {
      // Corrupted / unreadable state file → treat as missing
      return null;
    }
  }

  /**
   * Persist the last-processed commit hash to the local JSON state file.
   *
   * Creates the file if it does not exist, overwrites otherwise.
   */
  writeLastProcessedHash(hash: string): void {
    const dir = path.dirname(this.stateFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const data: StateFileData = { lastProcessedHash: hash };
    fs.writeFileSync(this.stateFilePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
  }

  // -------------------------------------------------------------------------
  // Default branch resolution + commit-ahead counting
  // -------------------------------------------------------------------------

  /**
   * Resolve the name of the repository's default branch.
   *
   * Resolution order:
   *   1. `refs/remotes/origin/HEAD` symbolic ref, when present, stripped of
   *      its `origin/` prefix (handles repos cloned with an explicit upstream).
   *   2. Local branch named `main`, when present.
   *   3. Local branch named `master`, when present.
   *   4. `null` when none of the above can be resolved — callers should treat
   *      this as "no default branch to compare against".
   */
  async getDefaultBranch(): Promise<string | null> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) return null;
    } catch {
      return null;
    }

    // 1. origin/HEAD symbolic ref
    try {
      const symref = (
        await this.git.raw(['symbolic-ref', '--quiet', '--short', 'refs/remotes/origin/HEAD'])
      ).trim();
      if (symref.startsWith('origin/')) {
        const name = symref.slice('origin/'.length).trim();
        if (name.length > 0) return name;
      }
    } catch {
      // No origin/HEAD (e.g. freshly `git init` repo) → fall through.
    }

    // 2. Local main / master
    try {
      const local = await this.git.branchLocal();
      if (local.all.includes('main')) return 'main';
      if (local.all.includes('master')) return 'master';
    } catch {
      // Ignore — fall through to null.
    }

    return null;
  }

  /**
   * Count the number of commits on `branch` that are NOT reachable from
   * `base` — i.e. how many commits the branch is "ahead" of the base.
   *
   * Implemented via `git rev-list --count base..branch`. Returns `0` when
   * the branch has no unique commits relative to the base, and `0` as a
   * graceful fallback when the underlying git invocation fails (e.g. the
   * branch does not exist, or the repo is unreadable). Never throws.
   */
  async countCommitsAhead(branch: string, base: string): Promise<number> {
    if (!branch || !base) return 0;
    try {
      const output = (await this.git.raw(['rev-list', '--count', `${base}..${branch}`])).trim();
      const parsed = Number.parseInt(output, 10);
      return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }

  // -------------------------------------------------------------------------
  // Change detection (VAL-FOUND-066)
  // -------------------------------------------------------------------------

  /**
   * Compare current HEAD hash with the last-processed hash.
   *
   * When they differ → `changed: true`
   * When identical  → `changed: false`
   *
   * If the state file is missing (first run), `lastProcessedHash` is `null`
   * and `changed` is `true` to trigger a full index build.
   */
  async detectChanges(): Promise<ChangeDetectionResult | GitErrorResult> {
    try {
      const isRepo = await this.git.checkIsRepo();
      if (!isRepo) {
        return {
          ok: false,
          error: `Not a git repository: ${this.repoPath}`,
        };
      }

      const currentHash = await this.git.revparse(['HEAD']);
      const lastProcessedHash = this.readLastProcessedHash();

      return {
        changed: lastProcessedHash === null || currentHash !== lastProcessedHash,
        currentHash,
        lastProcessedHash,
      };
    } catch (error: unknown) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /** Get the path to the state file */
  getStateFilePath(): string {
    return this.stateFilePath;
  }

  /** Get the repository path */
  getRepoPath(): string {
    return this.repoPath;
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Create a new GitIntegration instance.
 *
 * @param repoPath - Absolute path to the git repository
 * @param stateFilePath - Optional override for the state file path
 */
export function createGitIntegration(repoPath: string, stateFilePath?: string): GitIntegration {
  return new GitIntegration(repoPath, stateFilePath);
}

/**
 * Tests for MDB Git Integration Layer
 *
 * Uses the actual meridian-os repository (which this code lives in) as the
 * test git repository, and temp directories for testing non-git / state-file
 * scenarios.
 *
 * Fulfills: VAL-FOUND-063, VAL-FOUND-064, VAL-FOUND-065, VAL-FOUND-066,
 *           VAL-FOUND-067, VAL-FOUND-068
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GitIntegration, createGitIntegration } from '@/lib/git-integration';
import type {
  BranchListResult,
  CommitHistoryResult,
  GitErrorResult,
  ChangeDetectionResult,
} from '@/lib/git-integration';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The root of the meridian-os repo — a real git repository */
const REPO_ROOT = path.resolve(__dirname, '../../../../');

/** Create a temporary directory for testing */
function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mdb-git-test-'));
}

/** Remove a temporary directory and all contents */
function removeTempDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Git Integration', () => {
  // -----------------------------------------------------------------------
  // Branch Listing (VAL-FOUND-063)
  // -----------------------------------------------------------------------
  describe('listBranches (VAL-FOUND-063)', () => {
    it('returns at least one branch with a valid commit hash', async () => {
      const git = createGitIntegration(REPO_ROOT);
      const result = await git.listBranches();

      expect(result.ok).toBe(true);
      const branches = (result as BranchListResult).branches;
      expect(branches.length).toBeGreaterThanOrEqual(1);

      // Find a branch that should exist (main or feat/mdb-engine)
      const branchNames = branches.map((b) => b.name);
      const hasExpectedBranch =
        branchNames.includes('main') ||
        branchNames.includes('feat/mdb-engine') ||
        branchNames.some((name) => name.startsWith('remotes/'));
      expect(hasExpectedBranch).toBe(true);
    });

    it('each branch has a non-empty name and a valid 40-char hex hash', async () => {
      const git = createGitIntegration(REPO_ROOT);
      const result = await git.listBranches();

      expect(result.ok).toBe(true);
      const branches = (result as BranchListResult).branches;

      for (const branch of branches) {
        expect(branch.name).toBeTruthy();
        expect(branch.name.length).toBeGreaterThan(0);
        // Git commit hashes are 40 hex characters
        expect(branch.hash).toMatch(/^[0-9a-f]{40}$/);
      }
    });

    it('returns error for non-git directory without crashing (VAL-FOUND-067)', async () => {
      const tempDir = createTempDir();
      try {
        const git = createGitIntegration(tempDir);
        const result = await git.listBranches();

        expect(result.ok).toBe(false);
        const errorResult = result as GitErrorResult;
        expect(errorResult.error).toBeTruthy();
        expect(errorResult.error.length).toBeGreaterThan(0);
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('correctly parses detached HEAD entries without malformed hash/name pairs', async () => {
      const tempDir = createTempDir();
      try {
        // Create a git repo with a commit, then detach HEAD
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });
        execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'ignore' });
        execSync('git config user.name "Test"', { cwd: tempDir, stdio: 'ignore' });
        fs.writeFileSync(path.join(tempDir, 'file.txt'), 'hello');
        execSync('git add . && git commit -m "initial"', { cwd: tempDir, stdio: 'ignore' });
        const commitHash = execSync('git rev-parse HEAD', {
          cwd: tempDir,
          encoding: 'utf-8',
        }).trim();
        // Detach HEAD at the current commit
        execSync(`git checkout --detach ${commitHash}`, { cwd: tempDir, stdio: 'ignore' });

        const git = createGitIntegration(tempDir);
        const result = await git.listBranches();

        expect(result.ok).toBe(true);
        const branches = (result as BranchListResult).branches;

        // Should include at least the detached HEAD entry and the main/master branch
        expect(branches.length).toBeGreaterThanOrEqual(1);

        for (const branch of branches) {
          // Every hash must be a valid 40-char hex string — not a fragment of the name
          expect(branch.hash).toMatch(/^[0-9a-f]{40}$/);
          // Name must be non-empty and not contain the hash
          expect(branch.name).toBeTruthy();
          expect(branch.name.length).toBeGreaterThan(0);
        }

        // The detached HEAD entry (if present) should have the correct hash
        const detachedEntry = branches.find((b) => b.name.includes('detached'));
        if (detachedEntry) {
          expect(detachedEntry.hash).toBe(commitHash);
        }
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('normal branch entries continue to parse correctly after detached HEAD fix', async () => {
      const git = createGitIntegration(REPO_ROOT);
      const result = await git.listBranches();

      expect(result.ok).toBe(true);
      const branches = (result as BranchListResult).branches;

      // Verify normal branches still have proper names (no trailing hash fragments)
      for (const branch of branches) {
        expect(branch.hash).toMatch(/^[0-9a-f]{40}$/);
        // Branch names should not contain 40-char hex strings (those belong in hash)
        expect(branch.name).not.toMatch(/[0-9a-f]{40}/);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Commit History (VAL-FOUND-064)
  // -----------------------------------------------------------------------
  describe('getCommitHistory (VAL-FOUND-064)', () => {
    it('returns commit entries in newest-first order with all required fields', async () => {
      const git = createGitIntegration(REPO_ROOT);
      const result = await git.getCommitHistory(10);

      expect(result.ok).toBe(true);
      const commits = (result as CommitHistoryResult).commits;
      expect(commits.length).toBeGreaterThan(0);
      expect(commits.length).toBeLessThanOrEqual(10);

      // Each commit must have hash, author, timestamp, message
      for (const commit of commits) {
        expect(commit.hash).toMatch(/^[0-9a-f]{40}$/);
        expect(commit.author).toBeTruthy();
        expect(commit.timestamp).toBeTruthy();
        expect(commit.message).toBeTruthy();
      }
    });

    it('commits are ordered newest-first (descending timestamps)', async () => {
      const git = createGitIntegration(REPO_ROOT);
      const result = await git.getCommitHistory(20);

      expect(result.ok).toBe(true);
      const commits = (result as CommitHistoryResult).commits;

      if (commits.length > 1) {
        for (let i = 0; i < commits.length - 1; i++) {
          const current = new Date(commits[i]!.timestamp).getTime();
          const next = new Date(commits[i + 1]!.timestamp).getTime();
          expect(current).toBeGreaterThanOrEqual(next);
        }
      }
    });

    it('respects maxCount parameter', async () => {
      const git = createGitIntegration(REPO_ROOT);
      const result = await git.getCommitHistory(3);

      expect(result.ok).toBe(true);
      const commits = (result as CommitHistoryResult).commits;
      expect(commits.length).toBeLessThanOrEqual(3);
    });

    it('returns error for non-git directory without crashing', async () => {
      const tempDir = createTempDir();
      try {
        const git = createGitIntegration(tempDir);
        const result = await git.getCommitHistory();

        expect(result.ok).toBe(false);
        const errorResult = result as GitErrorResult;
        expect(errorResult.error).toBeTruthy();
      } finally {
        removeTempDir(tempDir);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Last-Processed Hash Tracking (VAL-FOUND-065)
  // -----------------------------------------------------------------------
  describe('last-processed hash tracking (VAL-FOUND-065)', () => {
    let tempDir: string;
    let stateFilePath: string;

    beforeEach(() => {
      tempDir = createTempDir();
      stateFilePath = path.join(tempDir, '.mdb-git-state.json');
    });

    afterEach(() => {
      removeTempDir(tempDir);
    });

    it('write and read round-trip: written hash matches read hash', () => {
      const git = createGitIntegration(REPO_ROOT, stateFilePath);

      git.writeLastProcessedHash('abc123def456');
      const readBack = git.readLastProcessedHash();

      expect(readBack).toBe('abc123def456');
    });

    it('state file exists on disk after writing', () => {
      const git = createGitIntegration(REPO_ROOT, stateFilePath);

      git.writeLastProcessedHash('deadbeef1234');

      expect(fs.existsSync(stateFilePath)).toBe(true);
    });

    it('state file contains valid JSON with lastProcessedHash field', () => {
      const git = createGitIntegration(REPO_ROOT, stateFilePath);

      git.writeLastProcessedHash('feedface9876');

      const raw = fs.readFileSync(stateFilePath, 'utf-8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      expect(parsed).toHaveProperty('lastProcessedHash', 'feedface9876');
    });

    it('overwriting the hash updates the stored value', () => {
      const git = createGitIntegration(REPO_ROOT, stateFilePath);

      git.writeLastProcessedHash('first-hash');
      expect(git.readLastProcessedHash()).toBe('first-hash');

      git.writeLastProcessedHash('second-hash');
      expect(git.readLastProcessedHash()).toBe('second-hash');
    });

    it('creates parent directories if they do not exist', () => {
      const nestedPath = path.join(tempDir, 'nested', 'dir', '.mdb-state.json');
      const git = createGitIntegration(REPO_ROOT, nestedPath);

      git.writeLastProcessedHash('nested-hash');
      expect(git.readLastProcessedHash()).toBe('nested-hash');
      expect(fs.existsSync(nestedPath)).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // Missing State File (VAL-FOUND-068)
  // -----------------------------------------------------------------------
  describe('missing state file (VAL-FOUND-068)', () => {
    it('returns null when state file does not exist (first run)', () => {
      const tempDir = createTempDir();
      try {
        const stateFilePath = path.join(tempDir, 'nonexistent-state.json');
        const git = createGitIntegration(REPO_ROOT, stateFilePath);

        const result = git.readLastProcessedHash();
        expect(result).toBeNull();
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('does not throw when state file is missing', () => {
      const tempDir = createTempDir();
      try {
        const stateFilePath = path.join(tempDir, 'missing.json');
        const git = createGitIntegration(REPO_ROOT, stateFilePath);

        expect(() => git.readLastProcessedHash()).not.toThrow();
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('returns null for corrupted state file (invalid JSON)', () => {
      const tempDir = createTempDir();
      try {
        const stateFilePath = path.join(tempDir, 'bad-state.json');
        fs.writeFileSync(stateFilePath, '{{invalid json!!', 'utf-8');

        const git = createGitIntegration(REPO_ROOT, stateFilePath);
        const result = git.readLastProcessedHash();

        expect(result).toBeNull();
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('returns null for state file with missing lastProcessedHash field', () => {
      const tempDir = createTempDir();
      try {
        const stateFilePath = path.join(tempDir, 'partial-state.json');
        fs.writeFileSync(stateFilePath, JSON.stringify({ other: 'data' }), 'utf-8');

        const git = createGitIntegration(REPO_ROOT, stateFilePath);
        const result = git.readLastProcessedHash();

        expect(result).toBeNull();
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('returns null for state file with empty string hash', () => {
      const tempDir = createTempDir();
      try {
        const stateFilePath = path.join(tempDir, 'empty-hash.json');
        fs.writeFileSync(stateFilePath, JSON.stringify({ lastProcessedHash: '' }), 'utf-8');

        const git = createGitIntegration(REPO_ROOT, stateFilePath);
        const result = git.readLastProcessedHash();

        expect(result).toBeNull();
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('subsequent operations proceed normally after null read', () => {
      const tempDir = createTempDir();
      try {
        const stateFilePath = path.join(tempDir, 'no-state.json');
        const git = createGitIntegration(REPO_ROOT, stateFilePath);

        // First read — null (missing)
        expect(git.readLastProcessedHash()).toBeNull();

        // Write a hash
        git.writeLastProcessedHash('new-hash-123');

        // Now read back succeeds
        expect(git.readLastProcessedHash()).toBe('new-hash-123');
      } finally {
        removeTempDir(tempDir);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Change Detection (VAL-FOUND-066)
  // -----------------------------------------------------------------------
  describe('detectChanges (VAL-FOUND-066)', () => {
    it('returns changed=true when hashes differ', async () => {
      const tempDir = createTempDir();
      try {
        const stateFilePath = path.join(tempDir, '.mdb-state.json');
        const git = createGitIntegration(REPO_ROOT, stateFilePath);

        // Write a known-different hash
        git.writeLastProcessedHash('0000000000000000000000000000000000000000');

        const result = await git.detectChanges();
        expect('ok' in result).toBe(false);

        const detection = result as ChangeDetectionResult;
        expect(detection.changed).toBe(true);
        expect(detection.currentHash).toBeTruthy();
        expect(detection.lastProcessedHash).toBe('0000000000000000000000000000000000000000');
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('returns changed=false when hashes are the same', async () => {
      const tempDir = createTempDir();
      try {
        const stateFilePath = path.join(tempDir, '.mdb-state.json');
        const git = createGitIntegration(REPO_ROOT, stateFilePath);

        // First, detect to get the current hash
        const initial = (await git.detectChanges()) as ChangeDetectionResult;
        expect(initial.currentHash).toBeTruthy();

        // Write the current hash
        git.writeLastProcessedHash(initial.currentHash);

        // Now detect again — should be unchanged
        const result = (await git.detectChanges()) as ChangeDetectionResult;
        expect(result.changed).toBe(false);
        expect(result.currentHash).toBe(initial.currentHash);
        expect(result.lastProcessedHash).toBe(initial.currentHash);
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('returns changed=true when state file is missing (first run triggers full build)', async () => {
      const tempDir = createTempDir();
      try {
        const stateFilePath = path.join(tempDir, 'nonexistent.json');
        const git = createGitIntegration(REPO_ROOT, stateFilePath);

        const result = (await git.detectChanges()) as ChangeDetectionResult;
        expect(result.changed).toBe(true);
        expect(result.lastProcessedHash).toBeNull();
        expect(result.currentHash).toBeTruthy();
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('returns error for non-git directory without crashing', async () => {
      const tempDir = createTempDir();
      try {
        const git = createGitIntegration(tempDir);
        const result = await git.detectChanges();

        expect('ok' in result).toBe(true);
        expect((result as GitErrorResult).ok).toBe(false);
        expect((result as GitErrorResult).error).toBeTruthy();
      } finally {
        removeTempDir(tempDir);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Non-git directory handling (VAL-FOUND-067)
  // -----------------------------------------------------------------------
  describe('non-git directory handling (VAL-FOUND-067)', () => {
    it('listBranches returns error object without exception', async () => {
      const tempDir = createTempDir();
      try {
        const git = createGitIntegration(tempDir);
        const result = await git.listBranches();

        expect(result.ok).toBe(false);
        const err = result as GitErrorResult;
        expect(err.error).toContain('Not a git repository');
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('getCommitHistory returns error object without exception', async () => {
      const tempDir = createTempDir();
      try {
        const git = createGitIntegration(tempDir);
        const result = await git.getCommitHistory();

        expect(result.ok).toBe(false);
        const err = result as GitErrorResult;
        expect(err.error).toContain('Not a git repository');
      } finally {
        removeTempDir(tempDir);
      }
    });

    it('detectChanges returns error object without exception', async () => {
      const tempDir = createTempDir();
      try {
        const git = createGitIntegration(tempDir);
        const result = await git.detectChanges();

        expect('ok' in result).toBe(true);
        expect((result as GitErrorResult).ok).toBe(false);
        expect((result as GitErrorResult).error).toContain('Not a git repository');
      } finally {
        removeTempDir(tempDir);
      }
    });
  });

  // -----------------------------------------------------------------------
  // Factory function & accessors
  // -----------------------------------------------------------------------
  describe('createGitIntegration factory', () => {
    it('creates instance with default state file path', () => {
      const git = createGitIntegration(REPO_ROOT);
      expect(git).toBeInstanceOf(GitIntegration);
      expect(git.getRepoPath()).toBe(REPO_ROOT);
      expect(git.getStateFilePath()).toBe(path.join(REPO_ROOT, '.mdb-git-state.json'));
    });

    it('creates instance with custom state file path', () => {
      const customPath = '/tmp/custom-state.json';
      const git = createGitIntegration(REPO_ROOT, customPath);
      expect(git.getStateFilePath()).toBe(customPath);
    });
  });
});

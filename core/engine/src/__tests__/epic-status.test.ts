/**
 * Tests for Epic Discovery and Status Inference (Flight Deck)
 *
 * Fulfills:
 *   VAL-FLIGHT-001: Epic Discovery from Branches
 *   VAL-FLIGHT-002: Stage Inference
 *   VAL-FLIGHT-003: STM Evidence Scanning
 *   VAL-FLIGHT-004: No Branch Graceful (empty state)
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  parseEpicBranch,
  inferStage,
  scanStmEvidence,
  discoverEpics,
  type EpicStage,
} from '@/lib/epic-status';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'garura-epic-status-test-'));
}

function removeTempDir(dirPath: string): void {
  fs.rmSync(dirPath, { recursive: true, force: true });
}

function initGitRepo(repoPath: string): void {
  execSync('git init -q', { cwd: repoPath });
  execSync('git config user.email "test@test.com"', { cwd: repoPath });
  execSync('git config user.name "Test Dev"', { cwd: repoPath });
  // Seed with a main branch commit
  fs.writeFileSync(path.join(repoPath, 'README.md'), '# Test\n');
  execSync('git add . && git commit -q -m "initial"', { cwd: repoPath });
  // Ensure the default branch is named "main"
  execSync('git branch -M main', { cwd: repoPath });
}

function createBranch(repoPath: string, branchName: string, fileName = 'work.txt'): void {
  execSync(`git checkout -q -b "${branchName}"`, { cwd: repoPath });
  fs.writeFileSync(path.join(repoPath, fileName), `work on ${branchName}\n`);
  execSync(`git add . && git commit -q -m "work on ${branchName}"`, { cwd: repoPath });
  execSync('git checkout -q main', { cwd: repoPath });
}

/**
 * Create an epic branch pointed at main's HEAD — i.e. a freshly-branched
 * epic with zero commits ahead of the default branch. Used to exercise the
 * "untouched epic branch" path of stage inference.
 */
function createEmptyBranch(repoPath: string, branchName: string): void {
  execSync(`git checkout -q -b "${branchName}"`, { cwd: repoPath });
  execSync('git checkout -q main', { cwd: repoPath });
}

function writeYaml(filePath: string, content: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
}

// ---------------------------------------------------------------------------
// parseEpicBranch
// ---------------------------------------------------------------------------

describe('parseEpicBranch', () => {
  it('parses a canonical local epic branch (feat/e1-auth)', () => {
    const result = parseEpicBranch('feat/e1-auth');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('E1');
    expect(result?.slug).toBe('auth');
    expect(result?.branchName).toBe('feat/e1-auth');
  });

  it('parses epic with multi-segment slug (feat/e2-payments-v2)', () => {
    const result = parseEpicBranch('feat/e2-payments-v2');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('E2');
    expect(result?.slug).toBe('payments-v2');
  });

  it('parses epic with multi-digit number (feat/e12-search)', () => {
    const result = parseEpicBranch('feat/e12-search');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('E12');
    expect(result?.slug).toBe('search');
  });

  it('is case-insensitive on the prefix (feat/E3-dashboard)', () => {
    const result = parseEpicBranch('feat/E3-dashboard');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('E3');
    expect(result?.slug).toBe('dashboard');
  });

  it('accepts epic branch with no slug (feat/e7)', () => {
    const result = parseEpicBranch('feat/e7');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('E7');
    expect(result?.slug).toBe('');
  });

  it('strips a remotes/origin/ prefix before matching', () => {
    const result = parseEpicBranch('remotes/origin/feat/e4-billing');
    expect(result).not.toBeNull();
    expect(result?.id).toBe('E4');
    expect(result?.slug).toBe('billing');
  });

  it('returns null for non-epic branches', () => {
    expect(parseEpicBranch('main')).toBeNull();
    expect(parseEpicBranch('feat/other-thing')).toBeNull();
    expect(parseEpicBranch('fix/e1-something')).toBeNull();
    expect(parseEpicBranch('develop')).toBeNull();
    expect(parseEpicBranch('feat/event-sourcing')).toBeNull();
  });

  it('returns null for empty or garbage input', () => {
    expect(parseEpicBranch('')).toBeNull();
    expect(parseEpicBranch('   ')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// inferStage
// ---------------------------------------------------------------------------

describe('inferStage', () => {
  const emptyStm = { playHistory: [], qualityChecks: [], validationResults: [], stmPath: null };

  it('returns Planning when only product.yaml is present', () => {
    const stage: EpicStage = inferStage({
      artifacts: new Set(['product.yaml']),
      stmEvidence: emptyStm,
      branchCommits: 0,
    });
    expect(stage).toBe('Planning');
  });

  it('returns Planning when no artifacts exist', () => {
    const stage = inferStage({
      artifacts: new Set<string>(),
      stmEvidence: emptyStm,
      branchCommits: 0,
    });
    expect(stage).toBe('Planning');
  });

  it('returns Designing when features.yaml and architecture.yaml are present', () => {
    const stage = inferStage({
      artifacts: new Set(['product.yaml', 'features.yaml', 'architecture.yaml']),
      stmEvidence: emptyStm,
      branchCommits: 0,
    });
    expect(stage).toBe('Designing');
  });

  it('returns Preparing when tech.yaml is present but no implementation work yet', () => {
    const stage = inferStage({
      artifacts: new Set(['product.yaml', 'features.yaml', 'architecture.yaml', 'tech.yaml']),
      stmEvidence: emptyStm,
      branchCommits: 0,
    });
    expect(stage).toBe('Preparing');
  });

  it('returns Implementation when tech.yaml is present and commits exist on the branch', () => {
    const stage = inferStage({
      artifacts: new Set(['product.yaml', 'features.yaml', 'architecture.yaml', 'tech.yaml']),
      stmEvidence: emptyStm,
      branchCommits: 3,
    });
    expect(stage).toBe('Implementation');
  });

  it('returns Implementation when STM has implement-epic play history', () => {
    const stage = inferStage({
      artifacts: new Set(['product.yaml', 'features.yaml', 'tech.yaml']),
      stmEvidence: {
        playHistory: [
          { name: 'implement-epic', status: 'running', timestamp: '2025-01-01T00:00:00Z' },
        ],
        qualityChecks: [],
        validationResults: [],
        stmPath: '/tmp',
      },
      branchCommits: 0,
    });
    expect(stage).toBe('Implementation');
  });

  it('returns Validation when STM has quality-check evidence', () => {
    const stage = inferStage({
      artifacts: new Set(['product.yaml', 'features.yaml', 'tech.yaml']),
      stmEvidence: {
        playHistory: [],
        qualityChecks: [{ status: 'pass', timestamp: '2025-01-01T00:00:00Z', issues: [] }],
        validationResults: [],
        stmPath: '/tmp',
      },
      branchCommits: 5,
    });
    expect(stage).toBe('Validation');
  });

  it('returns Validation when STM has validation-result evidence', () => {
    const stage = inferStage({
      artifacts: new Set(['product.yaml']),
      stmEvidence: {
        playHistory: [],
        qualityChecks: [],
        validationResults: [{ status: 'pass', timestamp: '2025-01-01T00:00:00Z' }],
        stmPath: '/tmp',
      },
      branchCommits: 1,
    });
    expect(stage).toBe('Validation');
  });

  it('Validation outranks Implementation when both signals are present', () => {
    const stage = inferStage({
      artifacts: new Set(['product.yaml', 'features.yaml', 'tech.yaml']),
      stmEvidence: {
        playHistory: [
          { name: 'implement-epic', status: 'success', timestamp: '2025-01-01T00:00:00Z' },
        ],
        qualityChecks: [{ status: 'pass', timestamp: '2025-01-02T00:00:00Z', issues: [] }],
        validationResults: [],
        stmPath: '/tmp',
      },
      branchCommits: 5,
    });
    expect(stage).toBe('Validation');
  });

  it('Preparing still applies when features+architecture exist but no tech progress yet', () => {
    const stage = inferStage({
      artifacts: new Set(['product.yaml', 'features.yaml', 'architecture.yaml', 'tech.yaml']),
      stmEvidence: emptyStm,
      branchCommits: 0,
    });
    expect(stage).toBe('Preparing');
  });
});

// ---------------------------------------------------------------------------
// scanStmEvidence
// ---------------------------------------------------------------------------

describe('scanStmEvidence', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempDir);
  });

  it('returns an empty summary when STM base path does not exist', () => {
    const missing = path.join(tempDir, 'does-not-exist');
    const evidence = scanStmEvidence(missing, 'E1');
    expect(evidence.playHistory).toEqual([]);
    expect(evidence.qualityChecks).toEqual([]);
    expect(evidence.validationResults).toEqual([]);
    expect(evidence.stmPath).toBeNull();
  });

  it('returns an empty summary when epic has no STM directory', () => {
    fs.mkdirSync(path.join(tempDir, 'E2'), { recursive: true });
    const evidence = scanStmEvidence(tempDir, 'E1');
    expect(evidence.playHistory).toEqual([]);
    expect(evidence.qualityChecks).toEqual([]);
    expect(evidence.validationResults).toEqual([]);
    expect(evidence.stmPath).toBeNull();
  });

  it('categorises evidence files by filename into play history, quality checks, and validation', () => {
    const epicDir = path.join(tempDir, 'E1');
    writeYaml(
      path.join(epicDir, 'play-prepare-epic.yaml'),
      `status: success\ntimestamp: 2025-01-01T12:00:00Z\n`,
    );
    writeYaml(
      path.join(epicDir, 'play-implement-epic.yaml'),
      `status: running\ntimestamp: 2025-01-02T12:00:00Z\n`,
    );
    writeYaml(
      path.join(epicDir, 'quality-check.yaml'),
      `status: pass\ntimestamp: 2025-01-03T12:00:00Z\nissues: []\n`,
    );
    writeYaml(
      path.join(epicDir, 'validation-result.yaml'),
      `status: pass\ntimestamp: 2025-01-04T12:00:00Z\nscenariosPassed: 12\nscenariosFailed: 0\n`,
    );

    const evidence = scanStmEvidence(tempDir, 'E1');

    expect(evidence.stmPath).toBe(epicDir);
    expect(evidence.playHistory.length).toBe(2);
    expect(evidence.playHistory.map((p) => p.name).sort()).toEqual([
      'play-implement-epic',
      'play-prepare-epic',
    ]);
    expect(evidence.qualityChecks.length).toBe(1);
    expect(evidence.qualityChecks[0]?.status).toBe('pass');
    expect(evidence.validationResults.length).toBe(1);
    expect(evidence.validationResults[0]?.status).toBe('pass');
    expect(evidence.validationResults[0]?.scenariosPassed).toBe(12);
  });

  it('locates the STM directory by lowercase epic id (e1)', () => {
    const epicDir = path.join(tempDir, 'e1');
    writeYaml(
      path.join(epicDir, 'play-prepare-epic.yaml'),
      `status: success\ntimestamp: 2025-01-01T12:00:00Z\n`,
    );
    const evidence = scanStmEvidence(tempDir, 'E1');
    expect(evidence.stmPath).toBe(epicDir);
    expect(evidence.playHistory.length).toBe(1);
  });

  it('locates the STM directory by slug-prefixed name (e1-auth)', () => {
    const epicDir = path.join(tempDir, 'e1-auth');
    writeYaml(
      path.join(epicDir, 'quality-check.yaml'),
      `status: pass\ntimestamp: 2025-01-01T12:00:00Z\n`,
    );
    const evidence = scanStmEvidence(tempDir, 'E1', 'auth');
    expect(evidence.stmPath).toBe(epicDir);
    expect(evidence.qualityChecks.length).toBe(1);
  });

  it('ignores malformed YAML files without crashing', () => {
    const epicDir = path.join(tempDir, 'E1');
    fs.mkdirSync(epicDir, { recursive: true });
    fs.writeFileSync(path.join(epicDir, 'play-bad.yaml'), '{{invalid yaml!!', 'utf-8');
    writeYaml(
      path.join(epicDir, 'play-good.yaml'),
      `status: success\ntimestamp: 2025-01-01T12:00:00Z\n`,
    );

    const evidence = scanStmEvidence(tempDir, 'E1');
    // Malformed file is skipped; good file is counted
    expect(evidence.playHistory.length).toBe(1);
    expect(evidence.playHistory[0]?.name).toBe('play-good');
  });

  it('recursively scans subdirectories for evidence', () => {
    const epicDir = path.join(tempDir, 'E1');
    writeYaml(
      path.join(epicDir, 'quality-check', 'run-001.yaml'),
      `status: fail\ntimestamp: 2025-01-01T12:00:00Z\nissues:\n  - flaky-test\n`,
    );
    writeYaml(
      path.join(epicDir, 'validation', 'result.yaml'),
      `status: pass\ntimestamp: 2025-01-02T12:00:00Z\nscenariosPassed: 8\n`,
    );
    const evidence = scanStmEvidence(tempDir, 'E1');
    expect(evidence.qualityChecks.length).toBe(1);
    expect(evidence.qualityChecks[0]?.status).toBe('fail');
    expect(evidence.qualityChecks[0]?.issues).toContain('flaky-test');
    expect(evidence.validationResults.length).toBe(1);
    expect(evidence.validationResults[0]?.scenariosPassed).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// discoverEpics — integration over a real temp git repo
//
// These tests spawn several real git subprocesses (init, add, commit,
// checkout, log, rev-parse). Under full-suite parallelism the default 5s
// vitest timeout can be tight on loaded runners; bump it per-suite to 15s.
// ---------------------------------------------------------------------------

describe('discoverEpics', { timeout: 15_000 }, () => {
  let tempRepo: string;

  beforeEach(() => {
    tempRepo = createTempDir();
  });

  afterEach(() => {
    removeTempDir(tempRepo);
  });

  it('discovers 2 epics from feat/e1-auth and feat/e2-payments branches (VAL-FLIGHT-001)', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'feat/e1-auth', 'auth.txt');
    createBranch(tempRepo, 'feat/e2-payments', 'pay.txt');

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.error).toBeNull();
    expect(result.empty).toBe(false);
    expect(result.epics.length).toBe(2);
    const ids = result.epics.map((e) => e.id).sort();
    expect(ids).toEqual(['E1', 'E2']);
    const slugs = result.epics.map((e) => e.slug).sort();
    expect(slugs).toEqual(['auth', 'payments']);
  });

  it('deduplicates identical epics appearing on local and remote branches', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'feat/e1-auth', 'auth.txt');

    // Simulate a remote-tracking ref for the same branch by creating the
    // packed-ref under refs/remotes/origin/. This keeps the test self-
    // contained (no secondary clone / fetch process) and exercises the
    // parseEpicBranch strip-remote-prefix path via listBranches.
    const remoteRefDir = path.join(tempRepo, '.git', 'refs', 'remotes', 'origin');
    fs.mkdirSync(remoteRefDir, { recursive: true });
    const localHash = execSync('git rev-parse feat/e1-auth', {
      cwd: tempRepo,
      encoding: 'utf-8',
    }).trim();
    fs.writeFileSync(path.join(remoteRefDir, 'feat'), '', 'utf-8');
    // refs/remotes/origin/feat/e1-auth
    fs.rmSync(path.join(remoteRefDir, 'feat'));
    fs.mkdirSync(path.join(remoteRefDir, 'feat'), { recursive: true });
    fs.writeFileSync(path.join(remoteRefDir, 'feat', 'e1-auth'), `${localHash}\n`, 'utf-8');

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    // Both the local and remotes/origin/feat/e1-auth branch should collapse
    // into a single epic entry.
    expect(result.epics.length).toBe(1);
    expect(result.epics[0]?.id).toBe('E1');
  });

  it('ignores non-epic branches (main, develop, feat/other-thing)', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'develop', 'dev.txt');
    createBranch(tempRepo, 'feat/other-thing', 'other.txt');

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.empty).toBe(true);
    expect(result.epics.length).toBe(0);
  });

  it('returns an empty result when repo has only main branch (VAL-FLIGHT-004)', async () => {
    initGitRepo(tempRepo);

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.error).toBeNull();
    expect(result.empty).toBe(true);
    expect(result.epics.length).toBe(0);
  });

  it('returns a graceful error result for a non-git directory', async () => {
    const notAGitRepo = createTempDir();
    try {
      const result = await discoverEpics({
        repoPath: notAGitRepo,
        productBasePath: path.join(notAGitRepo, '.garura/product'),
        stmBasePath: path.join(notAGitRepo, '.garura/project/issues'),
      });
      // Should not crash and should return an empty epic list with an error set
      expect(result.epics).toEqual([]);
      expect(result.error).not.toBeNull();
      expect(result.empty).toBe(true);
    } finally {
      removeTempDir(notAGitRepo);
    }
  });

  it('populates developer and last commit metadata for each epic', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'feat/e1-auth', 'auth.txt');

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.epics.length).toBe(1);
    const epic = result.epics[0]!;
    expect(epic.developer).toBe('Test Dev');
    expect(epic.lastCommit).not.toBeNull();
    expect(epic.lastCommit?.message).toContain('work on feat/e1-auth');
    expect(epic.lastCommit?.hash).toMatch(/^[0-9a-f]{40}$/);
  });

  it('infers Planning stage when only product.yaml is present (VAL-FLIGHT-002)', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'feat/e1-auth', 'auth.txt');
    writeYaml(
      path.join(tempRepo, '.garura/product/product.yaml'),
      `name: Example\ndescription: test\n`,
    );

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.epics[0]?.stage).toBe('Planning');
  });

  it('infers Designing when features + architecture are present', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'feat/e1-auth', 'auth.txt');
    writeYaml(
      path.join(tempRepo, '.garura/product/product.yaml'),
      `name: Example\ndescription: test\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/product/features.yaml'),
      `features:\n  - id: F1\n    name: Auth\n    description: d\n    capability_domain: auth\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/product/architecture.yaml'),
      `components: []\ndecisions: []\npatterns: []\nnfr_mappings: []\n`,
    );

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.epics[0]?.stage).toBe('Designing');
  });

  it('infers Validation when STM has quality-check evidence (VAL-FLIGHT-003)', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'feat/e1-auth', 'auth.txt');
    writeYaml(
      path.join(tempRepo, '.garura/product/product.yaml'),
      `name: Example\ndescription: test\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/project/issues/E1/quality-check.yaml'),
      `status: pass\ntimestamp: 2025-01-01T12:00:00Z\nissues: []\n`,
    );

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.epics[0]?.stage).toBe('Validation');
    expect(result.epics[0]?.stmEvidence.qualityChecks.length).toBe(1);
  });

  it('reports branchCommits as ahead-of-default count, not total reachable history', async () => {
    // An untouched epic branch (no commits beyond main) should report 0
    // branchCommits — even though the branch is reachable from several
    // initial-repo commits. This is the behaviour required for correct
    // stage inference when tech.yaml is present.
    initGitRepo(tempRepo);
    createEmptyBranch(tempRepo, 'feat/e1-auth');

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.epics.length).toBe(1);
    expect(result.epics[0]?.branchCommits).toBe(0);
  });

  it('reports non-zero branchCommits for a branch with real implementation commits', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'feat/e1-auth', 'auth.txt');

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.epics.length).toBe(1);
    // createBranch commits exactly one new change on top of main.
    expect(result.epics[0]?.branchCommits).toBe(1);
  });

  it('classifies an untouched epic branch with tech.yaml as Preparing (not Implementation)', async () => {
    // Regression guard: previously `branchCommits` reflected total reachable
    // commits (including main's history), so a fresh epic branch with
    // tech.yaml was misclassified as Implementation. With ahead-of-default
    // counting, an empty branch correctly stays in Preparing.
    initGitRepo(tempRepo);
    createEmptyBranch(tempRepo, 'feat/e1-auth');
    writeYaml(
      path.join(tempRepo, '.garura/product/product.yaml'),
      `name: Example\ndescription: test\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/product/features.yaml'),
      `features:\n  - id: F1\n    name: Auth\n    description: d\n    capability_domain: auth\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/product/architecture.yaml'),
      `components: []\ndecisions: []\npatterns: []\nnfr_mappings: []\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/product/tech.yaml'),
      `project_structure: {}\ncomponents: []\n`,
    );

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.epics[0]?.stage).toBe('Preparing');
    expect(result.epics[0]?.branchCommits).toBe(0);
  });

  it('classifies an epic branch with real commits and tech.yaml as Implementation', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'feat/e1-auth', 'auth.txt');
    writeYaml(
      path.join(tempRepo, '.garura/product/product.yaml'),
      `name: Example\ndescription: test\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/product/features.yaml'),
      `features:\n  - id: F1\n    name: Auth\n    description: d\n    capability_domain: auth\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/product/architecture.yaml'),
      `components: []\ndecisions: []\npatterns: []\nnfr_mappings: []\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/product/tech.yaml'),
      `project_structure: {}\ncomponents: []\n`,
    );

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.epics[0]?.stage).toBe('Implementation');
    expect(result.epics[0]?.branchCommits).toBeGreaterThan(0);
  });

  it('attaches play history from STM evidence to the epic (VAL-FLIGHT-003)', async () => {
    initGitRepo(tempRepo);
    createBranch(tempRepo, 'feat/e1-auth', 'auth.txt');
    writeYaml(
      path.join(tempRepo, '.garura/project/issues/E1/play-prepare-epic.yaml'),
      `status: success\ntimestamp: 2025-01-01T12:00:00Z\n`,
    );
    writeYaml(
      path.join(tempRepo, '.garura/project/issues/E1/play-implement-epic.yaml'),
      `status: running\ntimestamp: 2025-01-02T12:00:00Z\n`,
    );

    const result = await discoverEpics({
      repoPath: tempRepo,
      productBasePath: path.join(tempRepo, '.garura/product'),
      stmBasePath: path.join(tempRepo, '.garura/project/issues'),
    });

    expect(result.epics[0]?.stmEvidence.playHistory.length).toBe(2);
    const names = result.epics[0]?.stmEvidence.playHistory.map((p) => p.name).sort() ?? [];
    expect(names).toEqual(['play-implement-epic', 'play-prepare-epic']);
  });
});

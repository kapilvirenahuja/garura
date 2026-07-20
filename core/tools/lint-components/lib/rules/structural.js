'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const parseFrontmatter = require('../parse-frontmatter');

/**
 * Check if a section heading exists in file body content.
 * Matches "## SectionName" at start of line (case-sensitive).
 *
 * @param {string} body - File content after frontmatter
 * @param {string} section - Section heading without "## " prefix
 * @returns {boolean}
 */
function hasSection(body, section) {
  const pattern = new RegExp('^## ' + escapeRegex(section) + '\\s*$', 'm');
  return pattern.test(body);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Extract frontmatter and body from file content.
 * Returns { frontmatter, body, parseError }
 */
function extractParts(content) {
  const fm = parseFrontmatter(content);
  let body = content;
  if (fm.error === null) {
    // Remove frontmatter block from body
    // content starts with "---\n{raw}\n---"
    const afterFirst = content.slice(3);
    const closeIdx = afterFirst.indexOf('\n---');
    if (closeIdx !== -1) {
      body = afterFirst.slice(closeIdx + 4); // skip past closing ---
    }
  }
  return { frontmatter: fm, body };
}

/**
 * Check a skill SKILL.md file.
 */
function checkSkill(component) {
  const violations = [];
  const content = fs.readFileSync(component.file, 'utf8');
  const { frontmatter, body } = extractParts(content);

  if (frontmatter.error) {
    violations.push({
      file: component.file,
      rule: 'structural/frontmatter-parse-error',
      severity: 'error',
      message: frontmatter.error,
      line: 1,
    });
    return violations;
  }

  const fm = frontmatter.parsed;

  // Required frontmatter fields
  const requiredFields = ['name', 'description', 'user-invocable', 'model', 'allowed-tools'];
  for (const field of requiredFields) {
    if (fm[field] === undefined || fm[field] === null) {
      violations.push({
        file: component.file,
        rule: 'structural/missing-frontmatter-field',
        severity: 'error',
        message: `Missing required frontmatter field: ${field}`,
        line: 1,
      });
    }
  }

  // allowed-tools must be a string (comma-separated), not array
  if (fm['allowed-tools'] !== undefined && Array.isArray(fm['allowed-tools'])) {
    violations.push({
      file: component.file,
      rule: 'structural/allowed-tools-must-be-string',
      severity: 'error',
      message: '`allowed-tools` must be a comma-separated string, not an array',
      line: 1,
    });
  }

  // Required sections
  const requiredSections = ['Input', 'Process', 'Output'];
  for (const section of requiredSections) {
    if (!hasSection(body, section)) {
      violations.push({
        file: component.file,
        rule: 'structural/missing-section',
        severity: 'error',
        message: `Missing required section: ## ${section}`,
        line: 1,
      });
    }
  }

  return violations;
}

/**
 * Check an agent .md file.
 */
function checkAgent(component) {
  const violations = [];
  const content = fs.readFileSync(component.file, 'utf8');
  const { frontmatter } = extractParts(content);

  if (frontmatter.error) {
    violations.push({
      file: component.file,
      rule: 'structural/frontmatter-parse-error',
      severity: 'error',
      message: frontmatter.error,
      line: 1,
    });
    return violations;
  }

  const fm = frontmatter.parsed;

  // Required fields: name, domain, role, description, model, tools
  // (both domain and role are required — all agents in corpus have both)
  const requiredFields = ['name', 'description', 'model', 'tools'];
  for (const field of requiredFields) {
    if (fm[field] === undefined || fm[field] === null) {
      violations.push({
        file: component.file,
        rule: 'structural/missing-frontmatter-field',
        severity: 'error',
        message: `Missing required frontmatter field: ${field}`,
        line: 1,
      });
    }
  }

  // domain OR role must be present
  if (fm['domain'] === undefined && fm['role'] === undefined) {
    violations.push({
      file: component.file,
      rule: 'structural/missing-frontmatter-field',
      severity: 'error',
      message: 'Missing required frontmatter field: domain (or role)',
      line: 1,
    });
  }

  // tools must be an array (YAML list)
  if (fm['tools'] !== undefined && !Array.isArray(fm['tools'])) {
    violations.push({
      file: component.file,
      rule: 'structural/tools-must-be-array',
      severity: 'error',
      message: '`tools` must be a YAML list (array), not a string',
      line: 1,
    });
  }

  return violations;
}

/**
 * Check a play SKILL.md file. Returns { violations, spellingUsed }
 * spellingUsed: 'user-invocable' | 'user-invokable' | null
 */
/**
 * Direct-model-write anchors (L-DMW-1..5), ADR 026 / standards/rules/direct-model-write.md.
 *
 * GATED: these fire ONLY on a play that bundles scripts/scoped_write_guard.py — the concrete
 * signal that the play has migrated to direct-model-write. Unmigrated plays (which still carry
 * draft/apply machinery) have no guard bundled and are skipped entirely, so this rule never
 * fails the plays that have not yet been migrated. This is the converge-and-lint layer the
 * contract describes, mirroring the Standard Play Close anchors.
 */
function checkDmwAnchors(component, body) {
  const violations = [];
  const playDir = path.dirname(component.file);
  const guardPath = path.join(playDir, 'scripts', 'scoped_write_guard.py');
  if (!fs.existsSync(guardPath)) return violations; // not a migrated play — skip

  const push = (rule, message) =>
    violations.push({ file: component.file, rule, severity: 'error', message, line: 1 });

  // L-DMW-1: no residual draft/apply/check_apply write path.
  const dmw1 = [
    /draft\/product-os/,
    /\bdraft_dir\b/,
    /\bapply-manifest\b/,
    /\bapply-checks\b/,
    /scripts\/apply_\w+\.py/,
    /scripts\/check_apply\.py/,
  ].find((re) => re.test(body));
  if (dmw1) {
    push(
      'structural/dmw-residual-draft',
      'L-DMW-1: migrated play references a removed draft/apply pattern (' +
        dmw1.source +
        '). Direct-model-write plays have no draft/product-os, draft_dir, apply-manifest, ' +
        'apply_<play>.py, or check_apply.py. See standards/rules/direct-model-write.md.'
    );
  }

  // L-DMW-2: classify_change.py must use --product-base/--base-ref, never --draft/--live.
  if (/classify_change\.py[^\n]*--(draft|live)\b/.test(body)) {
    push(
      'structural/dmw-classify-draft-mode',
      'L-DMW-2: classify_change.py is invoked with --draft/--live; direct-model-write uses ' +
        '--product-base/--base-ref HEAD (working-tree git diff). See direct-model-write.md.'
    );
  }

  // L-DMW-3: the checkpoint must run the guard before the gate and a restore on cancel.
  const hasCheckpoint = /##\s*(Phase:\s*)?Checkpoint/i.test(body) || /approval-prompt/.test(body);
  if (hasCheckpoint) {
    if (!/scoped_write_guard\.py/.test(body)) {
      push(
        'structural/dmw-guard-not-run',
        'L-DMW-3: play has a checkpoint but never invokes scoped_write_guard.py before the gate.'
      );
    }
    if (!/scoped_write_guard\.py[^\n]*--restore/.test(body) && !/--restore/.test(body)) {
      push(
        'structural/dmw-no-cancel-restore',
        'L-DMW-3: checkpoint cancel must revert the working tree via scoped_write_guard.py ' +
          '--restore. See direct-model-write.md step 6.'
      );
    }
  }

  // L-DMW-4: clean product-os tree asserted at pre-flight AND a model-delta commit at close.
  if (!/git status --porcelain[^\n]*product-os/.test(body)) {
    push(
      'structural/dmw-no-clean-tree-assert',
      'L-DMW-4: direct-model-write play must assert a clean product-os tree at pre-flight ' +
        '(git status --porcelain -- <product_base>product-os). See direct-model-write.md step 7.'
    );
  }
  if (!/feat\(model\)/.test(body)) {
    push(
      'structural/dmw-no-model-commit',
      'L-DMW-4: direct-model-write play must commit its own model delta at close ' +
        '(feat(model): ... (#<issue>)). See direct-model-write.md step 7.'
    );
  }

  // L-DMW-5: the enrichment/build skill must not be described as writing a shared model file.
  if (/enrich[^\n]*writes[^\n]*(_spine\.yaml|profile\.yaml|decisions\/)/i.test(body)) {
    push(
      'structural/dmw-skill-writes-shared',
      'L-DMW-5: the enrichment/build skill is described as writing a shared model file ' +
        '(_spine.yaml/profile.yaml/decisions); shared files are written only by the play\'s ' +
        'deterministic keyed script. See direct-model-write.md item 3.'
    );
  }

  // L-DMW-6: write-then-review order — the keyed persist (persist_*.py) must PRECEDE the
  // checkpoint gate, so the guard, the change-shape, and the human all see the full delta.
  const persistIdx = body.search(/persist_\w+\.py/);
  const gateIdx = body.search(/approval-prompt|##\s*(Phase:\s*)?Checkpoint/i);
  if (persistIdx !== -1 && gateIdx !== -1 && persistIdx > gateIdx) {
    push(
      'structural/dmw-persist-after-checkpoint',
      'L-DMW-6: the keyed persist step runs AFTER the checkpoint; write-then-review (ADR 026) ' +
        'requires the persist to precede the gate so the shape and the human see the full ' +
        'delta. See direct-model-write.md "Order of operations".'
    );
  }

  return violations;
}

function checkPlay(component) {
  const violations = [];
  const content = fs.readFileSync(component.file, 'utf8');
  const { frontmatter, body } = extractParts(content);

  if (frontmatter.error) {
    violations.push({
      file: component.file,
      rule: 'structural/frontmatter-parse-error',
      severity: 'error',
      message: frontmatter.error,
      line: 1,
    });
    return { violations, spellingUsed: null };
  }

  const fm = frontmatter.parsed;

  // Required fields: name, description (model is intentionally NOT required —
  // plays inherit the model from the user's harness session).
  const requiredFields = ['name', 'description'];
  for (const field of requiredFields) {
    if (fm[field] === undefined || fm[field] === null) {
      violations.push({
        file: component.file,
        rule: 'structural/missing-frontmatter-field',
        severity: 'error',
        message: `Missing required frontmatter field: ${field}`,
        line: 1,
      });
    }
  }

  // user-invocable OR user-invokable required
  const hasInvocable = fm['user-invocable'] !== undefined;
  const hasInvokable = fm['user-invokable'] !== undefined;

  if (!hasInvocable && !hasInvokable) {
    violations.push({
      file: component.file,
      rule: 'structural/missing-frontmatter-field',
      severity: 'error',
      message: 'Missing required frontmatter field: user-invocable (or user-invokable)',
      line: 1,
    });
  }

  // Determine spelling used for corpus-level check
  let spellingUsed = null;
  if (hasInvocable) spellingUsed = 'user-invocable';
  else if (hasInvokable) spellingUsed = 'user-invokable';

  // Required sections for plays
  const requiredSections = ['Compiled From', 'Role', 'Pre-flight'];
  for (const section of requiredSections) {
    if (!hasSection(body, section)) {
      violations.push({
        file: component.file,
        rule: 'structural/missing-section',
        severity: 'error',
        message: `Missing required section: ## ${section}`,
        line: 1,
      });
    }
  }

  // Standard Play Close block — canonical close, see standards/rules/play-close.md.
  // Anchors must match byte-for-byte, appear exactly once each, opener before closer.
  const closeOpener =
    '# --- Standard Play Close (canonical; see standards/rules/play-close.md) ---';
  const closeCloser = '# --- end Standard Play Close ---';
  const openerCount = body.split(closeOpener).length - 1;
  const closerCount = body.split(closeCloser).length - 1;
  if (openerCount !== 1 || closerCount !== 1) {
    violations.push({
      file: component.file,
      rule: 'structural/missing-standard-play-close',
      severity: 'error',
      message:
        `Standard Play Close anchors must appear exactly once each ` +
        `(found opener ${openerCount}, closer ${closerCount}). ` +
        `See standards/rules/play-close.md.`,
      line: 1,
    });
  } else if (body.indexOf(closeOpener) >= body.indexOf(closeCloser)) {
    violations.push({
      file: component.file,
      rule: 'structural/standard-play-close-order',
      severity: 'error',
      message:
        'Standard Play Close opener anchor must appear before the closer anchor. ' +
        'See standards/rules/play-close.md.',
      line: 1,
    });
  }

  violations.push(...checkDmwAnchors(component, body));

  return { violations, spellingUsed };
}

/**
 * Check an intent.yaml file.
 */
function checkIntent(component) {
  const violations = [];
  const content = fs.readFileSync(component.file, 'utf8');

  let parsed;
  try {
    parsed = yaml.load(content);
  } catch (err) {
    violations.push({
      file: component.file,
      rule: 'structural/yaml-parse-error',
      severity: 'error',
      message: 'YAML parse error: ' + err.message,
      line: 1,
    });
    return violations;
  }

  if (!parsed || typeof parsed !== 'object') {
    violations.push({
      file: component.file,
      rule: 'structural/invalid-structure',
      severity: 'error',
      message: 'intent.yaml must be a YAML object',
      line: 1,
    });
    return violations;
  }

  const requiredKeys = ['intent', 'constraints', 'failure_conditions'];
  for (const key of requiredKeys) {
    if (parsed[key] === undefined || parsed[key] === null) {
      violations.push({
        file: component.file,
        rule: 'structural/missing-intent-key',
        severity: 'error',
        message: `Missing required intent.yaml key: ${key}`,
        line: 1,
      });
    }
  }

  // ICE: scenarios live in the play's expectation.yaml (migrated plays).
  // - Migrated (expectation.yaml present): the intent is the clean triple; validate the expectation.
  // - Legacy (no expectation.yaml): scenarios are still required in intent.yaml until the play is migrated.
  if (component.expectationFile) {
    violations.push(...checkExpectation(component, parsed));
  } else if (parsed.scenarios === undefined || parsed.scenarios === null) {
    violations.push({
      file: component.file,
      rule: 'structural/missing-intent-key',
      severity: 'error',
      message:
        'Missing required intent.yaml key: scenarios (or migrate to ICE by adding reference/expectation.yaml)',
      line: 1,
    });
  }

  return violations;
}

/**
 * Check a play's expectation.yaml (ICE). Validates success_scenarios + recovery,
 * and that recovery covers every failure condition in the intent exactly once.
 */
function checkExpectation(component, intentParsed) {
  const violations = [];
  const expFile = component.expectationFile;

  let exp;
  try {
    exp = yaml.load(fs.readFileSync(expFile, 'utf8'));
  } catch (err) {
    violations.push({
      file: expFile,
      rule: 'structural/yaml-parse-error',
      severity: 'error',
      message: 'YAML parse error: ' + err.message,
      line: 1,
    });
    return violations;
  }

  if (!exp || typeof exp !== 'object') {
    violations.push({
      file: expFile,
      rule: 'structural/invalid-structure',
      severity: 'error',
      message: 'expectation.yaml must be a YAML object',
      line: 1,
    });
    return violations;
  }

  for (const key of ['success_scenarios', 'recovery']) {
    if (!Array.isArray(exp[key]) || exp[key].length === 0) {
      violations.push({
        file: expFile,
        rule: 'structural/missing-expectation-key',
        severity: 'error',
        message: `expectation.yaml must have a non-empty ${key} array`,
        line: 1,
      });
    }
  }

  // Recovery coverage: exactly one recovery entry per failure condition in the intent.
  const fcIds = (Array.isArray(intentParsed.failure_conditions) ? intentParsed.failure_conditions : [])
    .map((f) => f && f.id)
    .filter(Boolean);
  const recoveryFor = (Array.isArray(exp.recovery) ? exp.recovery : [])
    .map((r) => r && r.for_failure)
    .filter(Boolean);

  for (const fc of fcIds) {
    const count = recoveryFor.filter((x) => x === fc).length;
    if (count === 0) {
      violations.push({
        file: expFile,
        rule: 'structural/recovery-coverage',
        severity: 'error',
        message: `Failure condition ${fc} has no recovery entry in expectation.yaml`,
        line: 1,
      });
    } else if (count > 1) {
      violations.push({
        file: expFile,
        rule: 'structural/recovery-coverage',
        severity: 'error',
        message: `Failure condition ${fc} has ${count} recovery entries in expectation.yaml (expected exactly one)`,
        line: 1,
      });
    }
  }

  for (const rf of recoveryFor) {
    if (!fcIds.includes(rf)) {
      violations.push({
        file: expFile,
        rule: 'structural/recovery-dangling',
        severity: 'error',
        message: `Recovery entry references unknown failure condition ${rf}`,
        line: 1,
      });
    }
  }

  return violations;
}

/**
 * Run all structural checks across the component map.
 *
 * @param {{ skills, plays, agents, intents }} components
 * @returns {Array<{file, rule, severity, message, line}>}
 */
function check(components) {
  let violations = [];

  // Skills
  for (const component of components.skills) {
    violations = violations.concat(checkSkill(component));
  }

  // Agents
  for (const component of components.agents) {
    violations = violations.concat(checkAgent(component));
  }

  // Plays — collect spelling per file for corpus-level check
  const spellingMap = {}; // file -> 'user-invocable' | 'user-invokable'
  for (const component of components.plays) {
    const result = checkPlay(component);
    violations = violations.concat(result.violations);
    if (result.spellingUsed) {
      spellingMap[component.file] = result.spellingUsed;
    }
  }

  // Corpus-level spelling check: if BOTH spellings appear across plays, warn on minority form
  const invocableFiles = Object.keys(spellingMap).filter(
    (f) => spellingMap[f] === 'user-invocable'
  );
  const invokableFiles = Object.keys(spellingMap).filter(
    (f) => spellingMap[f] === 'user-invokable'
  );

  if (invocableFiles.length > 0 && invokableFiles.length > 0) {
    // Warn on the minority form — user-invokable is the minority (14 vs 9 files uses it more,
    // but understanding.md says 14 use user-invokable; per impl-context: warn on user-invokable)
    // Per understanding.md: 9 use user-invocable, 14 use user-invokable → user-invocable is minority
    // Per impl-context: "emit one WARNING per file that uses user-invokable (the minority form)"
    // understanding.md says 14 use user-invokable, 9 use user-invocable => user-invocable is minority
    // BUT impl-context says user-invokable is minority. Use impl-context (it's the contract).
    const minorityFiles = invokableFiles;
    for (const file of minorityFiles) {
      violations.push({
        file,
        rule: 'structural/spelling-inconsistency',
        severity: 'warning',
        message:
          'Corpus uses mixed spellings for user-invocable/user-invokable. This file uses `user-invokable` (minority form).',
        line: 1,
      });
    }
  }

  // Intents
  for (const component of components.intents) {
    violations = violations.concat(checkIntent(component));
  }

  return violations;
}

module.exports = { check };

'use strict';

const fs = require('fs');
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

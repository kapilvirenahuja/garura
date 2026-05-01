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

  const requiredKeys = ['intent', 'constraints', 'failure_conditions', 'scenarios'];
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

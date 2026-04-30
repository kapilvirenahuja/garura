'use strict';

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Find duplicate values in an array and return them.
 * @param {string[]} values
 * @returns {string[]} duplicate values
 */
function findDuplicates(values) {
  const seen = new Set();
  const dupes = new Set();
  for (const v of values) {
    if (seen.has(v)) dupes.add(v);
    seen.add(v);
  }
  return Array.from(dupes);
}

/**
 * Extract IDs from an array of objects that may have an `id` field.
 * @param {any} arr
 * @returns {string[]}
 */
function extractIds(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .filter((item) => item && typeof item === 'object' && item.id !== undefined)
    .map((item) => String(item.id));
}

/**
 * Collect the set of SCE-N scenario numbers covered by a play's SKILL.md.
 * Recognises explicit `SCE-N` mentions and range expressions of the form
 * `SCE-N <sep> SCE-M`, where <sep> is `through`, `to`, `..`, `–` (en dash),
 * or `—` (em dash). Ranges are expanded inclusively.
 *
 * @param {string} content
 * @returns {Set<number>}
 */
function collectCoveredScenarioNumbers(content) {
  const covered = new Set();

  const rangeRe = /SCE-(\d+)\s*(?:through|to|\.\.|–|—)\s*SCE-(\d+)/gi;
  let m;
  while ((m = rangeRe.exec(content)) !== null) {
    const start = parseInt(m[1], 10);
    const end = parseInt(m[2], 10);
    const [lo, hi] = start <= end ? [start, end] : [end, start];
    for (let n = lo; n <= hi; n++) covered.add(n);
  }

  const singleRe = /SCE-(\d+)/g;
  while ((m = singleRe.exec(content)) !== null) {
    covered.add(parseInt(m[1], 10));
  }

  return covered;
}

/**
 * Run cross-reference integrity checks.
 *
 * @param {{ skills, plays, agents, intents }} components
 * @returns {Array<{file, rule, severity, message, line}>}
 */
function check(components) {
  const violations = [];

  // Build a map from play name -> intent component
  const intentByPlay = {};
  for (const intent of components.intents) {
    intentByPlay[intent.name] = intent;
  }

  // Build a map from play name -> play component
  const playByName = {};
  for (const play of components.plays) {
    playByName[play.name] = play;
  }

  // Process each intent.yaml
  for (const intent of components.intents) {
    const intentContent = fs.readFileSync(intent.file, 'utf8');

    let parsed;
    try {
      parsed = yaml.load(intentContent);
    } catch (err) {
      // YAML parse error is reported by structural.js — skip here
      continue;
    }

    if (!parsed || typeof parsed !== 'object') {
      continue;
    }

    // Check constraint ID uniqueness
    const constraintIds = extractIds(parsed.constraints);
    const dupConstraints = findDuplicates(constraintIds);
    for (const dup of dupConstraints) {
      violations.push({
        file: intent.file,
        rule: 'cross-ref/duplicate-constraint-id',
        severity: 'error',
        message: `Duplicate constraint ID: ${dup}`,
        line: 1,
      });
    }

    // Check failure_condition ID uniqueness
    const failureIds = extractIds(parsed.failure_conditions);
    const dupFailures = findDuplicates(failureIds);
    for (const dup of dupFailures) {
      violations.push({
        file: intent.file,
        rule: 'cross-ref/duplicate-failure-condition-id',
        severity: 'error',
        message: `Duplicate failure_condition ID: ${dup}`,
        line: 1,
      });
    }

    // Check scenario ID uniqueness
    const scenarioIds = extractIds(parsed.scenarios);
    const dupScenarios = findDuplicates(scenarioIds);
    for (const dup of dupScenarios) {
      violations.push({
        file: intent.file,
        rule: 'cross-ref/duplicate-scenario-id',
        severity: 'error',
        message: `Duplicate scenario ID: ${dup}`,
        line: 1,
      });
    }

    // Check scenario coverage: for each scenario ID S{N} in intent.yaml,
    // check if SCE-{N} appears in the corresponding play's SKILL.md body.
    // Coverage is established by either an explicit `SCE-N` mention or a
    // range expression like `SCE-N through SCE-M`, `SCE-N to SCE-M`,
    // `SCE-N..SCE-M`, `SCE-N – SCE-M`, or `SCE-N — SCE-M` that includes N.
    const play = playByName[intent.name];
    if (play && scenarioIds.length > 0) {
      const playContent = fs.readFileSync(play.file, 'utf8');
      const covered = collectCoveredScenarioNumbers(playContent);

      for (const scenarioId of scenarioIds) {
        const match = scenarioId.match(/^S(\d+)$/i);
        if (!match) continue;

        const scenarioNum = parseInt(match[1], 10);
        if (!covered.has(scenarioNum)) {
          violations.push({
            file: play.file,
            rule: 'cross-ref/uncovered-scenario',
            severity: 'warning',
            message: `Scenario ${scenarioId} in intent.yaml has no corresponding SCE-${scenarioNum} entry in SKILL.md`,
            line: 1,
          });
        }
      }
    }
  }

  return violations;
}

module.exports = { check };

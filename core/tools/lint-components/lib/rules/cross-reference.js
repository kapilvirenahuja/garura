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
    // check if SCE-{N} appears in the corresponding play's SKILL.md body
    const play = playByName[intent.name];
    if (play && scenarioIds.length > 0) {
      const playContent = fs.readFileSync(play.file, 'utf8');

      for (const scenarioId of scenarioIds) {
        // scenarioId is like "S1", "S2", etc.
        const match = scenarioId.match(/^S(\d+)$/i);
        if (!match) continue;

        const scenarioNum = match[1];
        const scePattern = `SCE-${scenarioNum}`;

        if (!playContent.includes(scePattern)) {
          violations.push({
            file: play.file,
            rule: 'cross-ref/uncovered-scenario',
            severity: 'warning',
            message: `Scenario ${scenarioId} in intent.yaml has no corresponding ${scePattern} entry in SKILL.md`,
            line: 1,
          });
        }
      }
    }
  }

  return violations;
}

module.exports = { check };

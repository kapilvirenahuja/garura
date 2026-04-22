'use strict';

const fs = require('fs');

/**
 * Extract skill references from a play SKILL.md body.
 * Conservative: only match clearly structured contexts.
 *
 * @param {string} body - Play SKILL.md body text (after frontmatter)
 * @returns {Array<{name: string, line: number}>}
 */
function extractSkillRefs(body) {
  const refs = [];
  const lines = body.split('\n');

  // Track whether we're inside a Skill Pool table
  let inSkillPoolTable = false;
  let skillPoolHeaderSeen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect Skill Pool table header section
    if (/^##\s+Skill Pool/.test(line)) {
      inSkillPoolTable = true;
      skillPoolHeaderSeen = false;
      continue;
    }

    // Once inside Skill Pool, detect the table header row
    if (inSkillPoolTable) {
      if (/^\|[^|]*Skill[^|]*\|/.test(line)) {
        skillPoolHeaderSeen = true;
        continue;
      }
      // Table separator row
      if (/^\|[-| ]+\|/.test(line)) {
        continue;
      }
      // Table data row in Skill Pool
      if (skillPoolHeaderSeen && line.startsWith('|')) {
        // Extract first column value: | `skill-name` | ...
        const match = line.match(/^\|\s*`([^`]+)`\s*\|/);
        if (match) {
          refs.push({ name: match[1], line: lineNum });
        }
        continue;
      }
      // Exiting Skill Pool table on non-table line (after header seen)
      if (skillPoolHeaderSeen && !line.startsWith('|')) {
        inSkillPoolTable = false;
        skillPoolHeaderSeen = false;
      }
      // Also exit if new section header
      if (/^##\s/.test(line)) {
        inSkillPoolTable = false;
        skillPoolHeaderSeen = false;
      }
    }

    // Pattern: "Skill: <name>" or "Skill: `<name>`" at start of line
    const skillLineMatch = line.match(/^Skill:\s*`?([a-z][a-z0-9-]+)`?/);
    if (skillLineMatch) {
      refs.push({ name: skillLineMatch[1], line: lineNum });
      continue;
    }

    // Pattern: invokes/invoke `<skill-name>` skill
    // Match: Agent invokes `<skill-name>` skill, Invoke `<skill-name>` skill
    const invokesMatch = line.match(/[Ii]nvokes?\s+`([a-z][a-z0-9-]+)`\s+skill/g);
    if (invokesMatch) {
      for (const m of invokesMatch) {
        const nameMatch = m.match(/`([a-z][a-z0-9-]+)`/);
        if (nameMatch) {
          refs.push({ name: nameMatch[1], line: lineNum });
        }
      }
      continue;
    }

    // Pattern: subagent_type in JSON-like blocks — these are agent names, not skill names
    // (skip — handled by agent extraction)
  }

  return refs;
}

/**
 * Extract agent references from play SKILL.md body.
 * Looks for Agent Boundaries table rows: | `agent-name` | type | ... |
 *
 * @param {string} body
 * @returns {Array<{name: string, line: number}>}
 */
function extractAgentRefs(body) {
  const refs = [];
  const lines = body.split('\n');

  let inBoundariesTable = false;
  let boundariesHeaderSeen = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Detect Agent Boundaries section header text (inline in play body)
    if (/\*\*Agent boundaries:\*\*|## Agent Boundaries|Agent boundaries:/i.test(line)) {
      inBoundariesTable = true;
      boundariesHeaderSeen = false;
      continue;
    }

    if (inBoundariesTable) {
      // Detect table header row: | Agent | Type | ... |
      if (/^\|\s*Agent\s*\|/i.test(line)) {
        boundariesHeaderSeen = true;
        continue;
      }
      // Table separator
      if (/^\|[-| ]+\|/.test(line)) {
        continue;
      }
      // Table data rows
      if (boundariesHeaderSeen && line.startsWith('|')) {
        // Extract agent name from first column: | `agent-name` | or | `agent-name` (role) |
        const match = line.match(/^\|\s*`([a-z][a-z0-9-]+)`/);
        if (match) {
          // Strip any parenthetical role suffix from the name
          refs.push({ name: match[1], line: lineNum });
        }
        continue;
      }
      // Exit on new section
      if (/^##\s/.test(line) && boundariesHeaderSeen) {
        inBoundariesTable = false;
        boundariesHeaderSeen = false;
      }
      // Exit on blank line after table
      if (boundariesHeaderSeen && line.trim() === '') {
        inBoundariesTable = false;
        boundariesHeaderSeen = false;
      }
    }
  }

  return refs;
}

/**
 * Run semantic checks across all components.
 *
 * @param {{ skills, plays, agents, intents }} components
 * @returns {Array<{file, rule, severity, message, line}>}
 */
function check(components) {
  const violations = [];

  // Build global index of known skill names (directory names under skills/)
  const knownSkills = new Set(components.skills.map((s) => s.name));

  // Build global index of known agent names (filenames without .md)
  const knownAgents = new Set(components.agents.map((a) => a.name));

  // Check each play
  for (const play of components.plays) {
    const content = fs.readFileSync(play.file, 'utf8');

    // Strip frontmatter to get body
    let body = content;
    if (content.startsWith('---')) {
      const afterFirst = content.slice(3);
      const closeIdx = afterFirst.indexOf('\n---');
      if (closeIdx !== -1) {
        body = afterFirst.slice(closeIdx + 4);
      }
    }

    // Check skill references
    const skillRefs = extractSkillRefs(body);
    for (const ref of skillRefs) {
      if (!knownSkills.has(ref.name)) {
        violations.push({
          file: play.file,
          rule: 'semantic/skill-not-found',
          severity: 'error',
          message: `Skill reference '${ref.name}' not found in core/components/skills/`,
          line: ref.line,
        });
      }
    }

    // Check agent references
    const agentRefs = extractAgentRefs(body);
    for (const ref of agentRefs) {
      if (!knownAgents.has(ref.name)) {
        violations.push({
          file: play.file,
          rule: 'semantic/agent-not-found',
          severity: 'error',
          message: `Agent reference '${ref.name}' not found in core/components/agents/`,
          line: ref.line,
        });
      }
    }
  }

  return violations;
}

module.exports = { check };

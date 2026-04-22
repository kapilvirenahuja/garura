'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Walk a directory and return matching files.
 * @param {string} dir - Base directory
 * @param {function} predicate - Returns true if file path should be included
 * @returns {string[]} - Array of absolute file paths
 */
function walk(dir, predicate) {
  const results = [];

  if (!fs.existsSync(dir)) {
    return results;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walk(fullPath, predicate));
    } else if (entry.isFile() && predicate(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Discover all Garura components under the target directory.
 *
 * @param {string} targetDir - Absolute path to core/components/
 * @returns {{
 *   skills: Array<{file: string, name: string, type: string}>,
 *   plays: Array<{file: string, name: string, type: string}>,
 *   agents: Array<{file: string, name: string, type: string}>,
 *   intents: Array<{file: string, name: string, type: string}>
 * }}
 */
function discover(targetDir) {
  const skillsDir = path.join(targetDir, 'skills');
  const playsDir = path.join(targetDir, 'plays');
  const agentsDir = path.join(targetDir, 'agents');

  // skills: {target}/skills/*/SKILL.md (exactly one level deep)
  const skills = [];
  if (fs.existsSync(skillsDir)) {
    const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true });
    for (const entry of skillDirs) {
      if (entry.isDirectory()) {
        const skillFile = path.join(skillsDir, entry.name, 'SKILL.md');
        if (fs.existsSync(skillFile)) {
          skills.push({ file: skillFile, name: entry.name, type: 'skill' });
        }
      }
    }
  }

  // plays: {target}/plays/*/SKILL.md (exactly one level deep)
  const plays = [];
  const intents = [];
  if (fs.existsSync(playsDir)) {
    const playDirs = fs.readdirSync(playsDir, { withFileTypes: true });
    for (const entry of playDirs) {
      if (entry.isDirectory()) {
        const playFile = path.join(playsDir, entry.name, 'SKILL.md');
        if (fs.existsSync(playFile)) {
          plays.push({ file: playFile, name: entry.name, type: 'play' });
        }

        // intent.yaml: {target}/plays/*/reference/intent.yaml
        const intentFile = path.join(playsDir, entry.name, 'reference', 'intent.yaml');
        if (fs.existsSync(intentFile)) {
          intents.push({ file: intentFile, name: entry.name, type: 'intent' });
        }
      }
    }
  }

  // agents: {target}/agents/*.md (one level, no subdirs)
  const agents = [];
  if (fs.existsSync(agentsDir)) {
    const agentEntries = fs.readdirSync(agentsDir, { withFileTypes: true });
    for (const entry of agentEntries) {
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const agentName = entry.name.slice(0, -3); // strip .md
        agents.push({
          file: path.join(agentsDir, entry.name),
          name: agentName,
          type: 'agent',
        });
      }
    }
  }

  return { skills, plays, agents, intents };
}

module.exports = discover;

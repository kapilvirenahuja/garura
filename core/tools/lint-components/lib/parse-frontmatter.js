'use strict';

const yaml = require('js-yaml');

/**
 * Extract and parse YAML frontmatter from a Markdown file's content.
 *
 * @param {string} content - Full file content
 * @returns {{ parsed: object|null, raw: string, error: string|null }}
 */
function parseFrontmatter(content) {
  // Frontmatter must start at the very beginning of the file
  if (!content.startsWith('---')) {
    return { parsed: null, raw: '', error: 'No frontmatter found' };
  }

  // Find the closing ---
  const rest = content.slice(3);
  const closeIdx = rest.indexOf('\n---');
  if (closeIdx === -1) {
    return { parsed: null, raw: '', error: 'Frontmatter not closed' };
  }

  const raw = rest.slice(0, closeIdx).trim();

  try {
    const parsed = yaml.load(raw) || {};
    return { parsed, raw, error: null };
  } catch (err) {
    return { parsed: null, raw, error: 'YAML parse error: ' + err.message };
  }
}

module.exports = parseFrontmatter;

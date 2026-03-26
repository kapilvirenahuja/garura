/**
 * Meridian Brief Rendering Library
 * Shared rendering primitives for all 7 Phoenix Design System brief templates.
 * Vanilla JS — no dependencies — safe for inline <script> use.
 */

// ─── Escape ──────────────────────────────────────────────────────────────────

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Value Renderer ───────────────────────────────────────────────────────────

function renderValue(v) {
  if (v == null) return '';
  if (Array.isArray(v)) {
    if (v.length === 0) return '';
    if (typeof v[0] === 'object' && v[0] !== null) {
      // Fallback for arrays of objects — render as JSON-like list
      return '<ul class="item-list">' + v.map(function(item) {
        return '<li>' + esc(JSON.stringify(item)) + '</li>';
      }).join('') + '</ul>';
    }
    return '<ul class="item-list">' + v.map(function(item) {
      return '<li>' + esc(item) + '</li>';
    }).join('') + '</ul>';
  }
  return esc(v);
}

// ─── Badge Helpers ────────────────────────────────────────────────────────────

function badgeClass(status) {
  if (!status) return '';
  switch (String(status).toLowerCase()) {
    case 'draft':     return 'badge-draft';
    case 'validated': return 'badge-validated';
    case 'locked':    return 'badge-locked';
    case 'approved':  return 'badge-validated';
    default:          return '';
  }
}

function priorityBadge(priority) {
  if (!priority) return '';
  switch (String(priority).toLowerCase()) {
    case 'p1': return 'badge-p1';
    case 'p2': return 'badge-p2';
    case 'p3': return 'badge-p3';
    default:   return '';
  }
}

function severityBadge(severity) {
  if (!severity) return '';
  switch (String(severity).toLowerCase()) {
    case 'low':    return 'badge-low';
    case 'medium': return 'badge-medium';
    case 'high':   return 'badge-high';
    default:       return '';
  }
}

function horizonBadge(horizon) {
  if (!horizon) return '';
  switch (String(horizon).toLowerCase()) {
    case 'near': return 'badge-near';
    case 'mid':  return 'badge-mid';
    case 'long': return 'badge-long';
    default:     return '';
  }
}

// ─── Field Rendering Helpers ──────────────────────────────────────────────────

/**
 * Parse a fieldMap entry value into { type, label, extra }.
 * Entry formats:
 *   'Label Text'        → type: 'field',  label: 'Label Text'
 *   'title:'            → type: 'title'
 *   'badge:className'   → type: 'badge',  extra: 'className'  (fn name or literal class)
 *   'tags:'             → type: 'tags'
 *   'id:'               → type: 'id'
 */
function _parseFieldConfig(cfg) {
  if (!cfg) return { type: 'field', label: '' };
  var s = String(cfg);
  if (s === 'title:')            return { type: 'title' };
  if (s === 'tags:')             return { type: 'tags' };
  if (s === 'id:')               return { type: 'id' };
  if (s.indexOf('badge:') === 0) return { type: 'badge', extra: s.slice(6) };
  return { type: 'field', label: s };
}

/**
 * Render a single field entry for an object `obj` with key `key` and config `cfg`.
 */
function _renderField(obj, key, cfg) {
  var v = obj[key];
  var parsed = _parseFieldConfig(cfg);

  if (parsed.type === 'title') {
    if (v == null) return '';
    return '<div class="card-title">' + esc(v) + '</div>';
  }

  if (parsed.type === 'id') {
    if (v == null) return '';
    return '<span class="card-id">' + esc(v) + '</span>';
  }

  if (parsed.type === 'badge') {
    if (v == null) return '';
    // extra is the name of a badge-class resolver fn or a static class prefix
    var cls = '';
    var fnName = parsed.extra;
    if (fnName === 'badgeClass')     cls = badgeClass(v);
    else if (fnName === 'priorityBadge')  cls = priorityBadge(v);
    else if (fnName === 'severityBadge')  cls = severityBadge(v);
    else if (fnName === 'horizonBadge')   cls = horizonBadge(v);
    else cls = fnName + '-' + String(v).toLowerCase(); // literal prefix fallback
    return '<span class="badge ' + esc(cls) + '">' + esc(v) + '</span>';
  }

  if (parsed.type === 'tags') {
    if (!v || (Array.isArray(v) && v.length === 0)) return '';
    var tags = Array.isArray(v) ? v : [v];
    return '<div class="tag-list">' + tags.map(function(t) {
      return '<span class="tag">' + esc(t) + '</span>';
    }).join('') + '</div>';
  }

  // Default: card-field
  if (v == null) return '';
  return '<div class="card-field">' +
    '<div class="card-field-label">' + esc(parsed.label) + '</div>' +
    '<div class="card-field-value">' + renderValue(v) + '</div>' +
    '</div>';
}

// ─── renderCards ─────────────────────────────────────────────────────────────

function renderCards(containerId, items, colorClass, fieldMap) {
  var container = el(containerId);
  if (!container) return;
  if (!items || items.length === 0) return;

  var cardClass = colorClass ? 'card ' + colorClass : 'card';
  var html = '';

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (!item) continue;
    html += '<div class="' + cardClass + '">';
    for (var key in fieldMap) {
      if (fieldMap.hasOwnProperty(key)) {
        html += _renderField(item, key, fieldMap[key]);
      }
    }
    html += '</div>';
  }

  container.innerHTML = html;
}

// ─── renderTable ─────────────────────────────────────────────────────────────

function renderTable(containerId, items, columns) {
  var container = el(containerId);
  if (!container) return;
  if (!columns || columns.length === 0) return;

  var thead = '<thead><tr>';
  for (var c = 0; c < columns.length; c++) {
    thead += '<th>' + esc(columns[c].label) + '</th>';
  }
  thead += '</tr></thead>';

  var tbody = '<tbody>';
  if (items && items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      var row = items[i] || {};
      tbody += '<tr>';
      for (var j = 0; j < columns.length; j++) {
        var val = row[columns[j].key];
        tbody += '<td>' + renderValue(val) + '</td>';
      }
      tbody += '</tr>';
    }
  }
  tbody += '</tbody>';

  container.innerHTML = '<table>' + thead + tbody + '</table>';
}

// ─── renderFieldGroup ────────────────────────────────────────────────────────

function renderFieldGroup(containerId, obj, fieldMap) {
  var container = el(containerId);
  if (!container) return;
  if (!obj) return;

  var html = '<div class="card">';
  for (var key in fieldMap) {
    if (fieldMap.hasOwnProperty(key)) {
      html += _renderField(obj, key, fieldMap[key]);
    }
  }
  html += '</div>';

  container.innerHTML = html;
}

// ─── renderText ──────────────────────────────────────────────────────────────

function renderText(containerId, text, wrapperClass) {
  var container = el(containerId);
  if (!container) return;

  var inner = '';
  if (text) {
    var lines = String(text).split('\n');
    for (var i = 0; i < lines.length; i++) {
      inner += '<p>' + esc(lines[i]) + '</p>';
    }
  }

  var cls = wrapperClass ? ' class="' + esc(wrapperClass) + '"' : '';
  container.innerHTML = '<div' + cls + '>' + inner + '</div>';
}

// ─── renderList ──────────────────────────────────────────────────────────────

function renderList(containerId, items, wrapperClass) {
  var container = el(containerId);
  if (!container) return;

  var cls = wrapperClass ? ' class="' + esc(wrapperClass) + '"' : '';
  var inner = '';
  if (items && items.length > 0) {
    for (var i = 0; i < items.length; i++) {
      inner += '<li>' + esc(items[i]) + '</li>';
    }
  }
  container.innerHTML = '<ul' + cls + '>' + inner + '</ul>';
}

// ─── renderStatGrid ───────────────────────────────────────────────────────────

function renderStatGrid(containerId, stats) {
  var container = el(containerId);
  if (!container) return;
  if (!stats || stats.length === 0) return;

  var html = '<div class="stat-grid">';
  for (var i = 0; i < stats.length; i++) {
    var s = stats[i] || {};
    var cardCls = s.colorClass ? 'stat-card ' + s.colorClass : 'stat-card';
    html += '<div class="' + cardCls + '">' +
      '<div class="stat-value">' + esc(s.value) + '</div>' +
      '<div class="stat-label">' + esc(s.label) + '</div>' +
      '</div>';
  }
  html += '</div>';

  container.innerHTML = html;
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function el(id) {
  if (!id) return null;
  return document.getElementById(id) || null;
}

function populateMeta(data) {
  if (!data) return;

  var titleEl = el('brief-title');
  if (titleEl) titleEl.textContent = data.slug || '';

  var statusEl = el('brief-status');
  if (statusEl) {
    statusEl.textContent = data.status || '';
    statusEl.className = 'badge ' + badgeClass(data.status);
  }

  var genEl = el('generated-at');
  if (genEl) genEl.textContent = data.generated_at || new Date().toISOString();
}

/**
 * Garura Brief Rendering Library
 * Shared rendering primitives + SPA navigation + tab system for all Phoenix Design System brief templates.
 * Vanilla JS — no dependencies — referenced externally by all brief templates.
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

function _parseFieldConfig(cfg) {
  if (!cfg) return { type: 'field', label: '' };
  var s = String(cfg);
  if (s === 'title:')            return { type: 'title' };
  if (s === 'tags:')             return { type: 'tags' };
  if (s === 'id:')               return { type: 'id' };
  if (s.indexOf('badge:') === 0) return { type: 'badge', extra: s.slice(6) };
  return { type: 'field', label: s };
}

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
    var cls = '';
    var fnName = parsed.extra;
    if (fnName === 'badgeClass')        cls = badgeClass(v);
    else if (fnName === 'priorityBadge')  cls = priorityBadge(v);
    else if (fnName === 'severityBadge')  cls = severityBadge(v);
    else if (fnName === 'horizonBadge')   cls = horizonBadge(v);
    else cls = fnName + '-' + String(v).toLowerCase();
    return '<span class="badge ' + esc(cls) + '">' + esc(v) + '</span>';
  }

  if (parsed.type === 'tags') {
    if (!v || (Array.isArray(v) && v.length === 0)) return '';
    var tags = Array.isArray(v) ? v : [v];
    return '<div class="tag-list">' + tags.map(function(t) {
      return '<span class="tag">' + esc(t) + '</span>';
    }).join('') + '</div>';
  }

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

  var slugEl = el('meta-slug');
  if (slugEl) slugEl.textContent = data.slug || '';

  var titleEl = el('brief-title');
  if (titleEl) titleEl.textContent = data.slug || '';

  var statusEl = el('meta-status');
  if (statusEl) {
    statusEl.textContent = data.status || '';
    statusEl.className = 'badge ' + badgeClass(data.status);
  }

  var briefStatusEl = el('brief-status');
  if (briefStatusEl) {
    briefStatusEl.textContent = data.status || '';
    briefStatusEl.className = 'badge ' + badgeClass(data.status);
  }

  var genEl = el('meta-generated-at');
  if (genEl) genEl.textContent = data.generated_at || new Date().toISOString();
}

// ─── SPA Chapter Navigation ──────────────────────────────────────────────────

function initSpaNav() {
  var chapters = document.querySelectorAll('.chapter');
  var navItems = document.querySelectorAll('.sidebar-nav .nav-item');

  if (chapters.length === 0) return;

  // Show first chapter, activate first nav
  chapters[0].classList.add('active');
  if (navItems.length > 0) navItems[0].classList.add('active');

  navItems.forEach(function(item) {
    item.addEventListener('click', function(e) {
      e.preventDefault();
      var targetId = this.getAttribute('href').replace('#', '');

      // Toggle active chapter
      chapters.forEach(function(ch) { ch.classList.remove('active'); });
      navItems.forEach(function(n) { n.classList.remove('active'); });

      var target = document.getElementById(targetId);
      if (target) target.classList.add('active');
      this.classList.add('active');

      // Close mobile sidebar
      if (window.innerWidth <= 900) {
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');
      }

      // Scroll to top of content
      window.scrollTo(0, 0);
    });
  });
}

// ─── Tab System ──────────────────────────────────────────────────────────────

/**
 * Build a tab bar inside a container from an array of items.
 * Returns array of panel IDs so the caller can populate each panel.
 *
 * @param {string} containerId - ID of the wrapper element
 * @param {Array} items - Data items (one tab per item)
 * @param {string} idKey - Key for the tab ID label (e.g., 'id')
 * @param {string} labelKey - Key for the tab display label (e.g., 'name')
 * @returns {string[]} Array of panel element IDs
 */
function renderTabBar(containerId, items, idKey, labelKey) {
  var container = el(containerId);
  if (!container || !items || !items.length) return [];

  var tabsHtml = '<div class="chapter-tabs">';
  var panelsHtml = '';
  var panelIds = [];

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var panelId = containerId + '-panel-' + i;
    var cls = i === 0 ? ' active' : '';
    var label = (labelKey && item[labelKey]) ? item[labelKey] : (idKey && item[idKey]) ? item[idKey] : ('Tab ' + (i + 1));
    var idLabel = (idKey && item[idKey]) ? item[idKey] : '';

    tabsHtml += '<button class="chapter-tab' + cls + '" data-tab="' + panelId + '">';
    if (idLabel && labelKey && item[labelKey]) {
      tabsHtml += '<span style="opacity:.6;margin-right:6px;">' + esc(idLabel) + '</span>';
    }
    tabsHtml += esc(labelKey && item[labelKey] ? item[labelKey] : label);
    tabsHtml += '</button>';

    panelsHtml += '<div class="tab-panel' + cls + '" id="' + panelId + '"></div>';
    panelIds.push(panelId);
  }

  tabsHtml += '</div>';
  container.innerHTML = tabsHtml + panelsHtml;

  _wireTabClicks(container);
  return panelIds;
}

/**
 * Build a tab bar from static labels (not data-driven).
 * @param {string} containerId - wrapper element ID
 * @param {Array<{id: string, label: string}>} tabs - tab definitions
 * @returns {string[]} Array of panel element IDs
 */
function renderStaticTabs(containerId, tabs) {
  var container = el(containerId);
  if (!container || !tabs || !tabs.length) return [];

  var tabsHtml = '<div class="chapter-tabs">';
  var panelsHtml = '';
  var panelIds = [];

  for (var i = 0; i < tabs.length; i++) {
    var tab = tabs[i];
    var panelId = containerId + '-panel-' + tab.id;
    var cls = i === 0 ? ' active' : '';

    tabsHtml += '<button class="chapter-tab' + cls + '" data-tab="' + panelId + '">' + esc(tab.label) + '</button>';
    panelsHtml += '<div class="tab-panel' + cls + '" id="' + panelId + '"></div>';
    panelIds.push(panelId);
  }

  tabsHtml += '</div>';
  container.innerHTML = tabsHtml + panelsHtml;

  _wireTabClicks(container);
  return panelIds;
}

function _wireTabClicks(container) {
  var tabs = container.querySelectorAll('.chapter-tab');
  var panels = container.querySelectorAll('.tab-panel');

  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      var targetPanel = this.getAttribute('data-tab');

      tabs.forEach(function(t) { t.classList.remove('active'); });
      panels.forEach(function(p) { p.classList.remove('active'); });

      this.classList.add('active');
      var panel = document.getElementById(targetPanel);
      if (panel) panel.classList.add('active');
    });
  });
}

// ─── Shared UI Functions ─────────────────────────────────────────────────────

function setTheme(t) {
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.theme === t);
  });
  try { localStorage.setItem('phoenix-theme', t); } catch(e) {}
}

function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  if (sidebar) sidebar.classList.toggle('open');
}

function showToast(m) {
  var t = document.getElementById('toast');
  if (!t) return;
  t.textContent = m;
  t.style.display = 'block';
  setTimeout(function() { t.style.display = 'none'; }, 2000);
}

function exportAction(action, slug, artifactName) {
  var payload = {
    artifact: artifactName || 'brief',
    slug: slug || '',
    action: action,
    timestamp: new Date().toISOString()
  };
  var text = JSON.stringify(payload, null, 2);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(function() { showToast('Copied: ' + action); });
  } else {
    var x = document.createElement('textarea');
    x.value = text;
    document.body.appendChild(x);
    x.select();
    document.execCommand('copy');
    document.body.removeChild(x);
    showToast('Copied: ' + action);
  }
}

// ─── Decision Map ────────────────────────────────────────────────────────────

/**
 * Render an interactive decision map with accordion cards, driver-tagged
 * reasoning, and filter-by-driver navigation.
 *
 * @param {string} containerId - wrapper element ID
 * @param {Array} decisions - decision objects with question, answer, drivers, reasons, picked, rejected
 * @param {string} [summary] - optional TL;DR summary displayed above cards
 */
function renderDecisionMap(containerId, decisions, summary) {
  var container = el(containerId);
  if (!container || !decisions || decisions.length === 0) return;

  var driverLabels = {
    'budget': 'Budget',
    'ltm': 'LTM',
    'user-decision': 'Your Decision',
    'profile': 'Profile'
  };

  var filterLabels = {
    'budget': 'Showing decisions driven by budget constraints',
    'ltm': 'Showing decisions recommended by LTM architecture knowledge',
    'user-decision': 'Showing decisions that trace back to your choices',
    'profile': 'Showing decisions shaped by product/NFR/quality profiles'
  };

  var filterNames = {
    'budget': 'Budget drove it',
    'ltm': 'LTM recommended it',
    'user-decision': 'You decided it',
    'profile': 'Profile shaped it'
  };

  var mapId = containerId + '-dmap';
  var html = '';

  // Collect unique drivers across all decisions
  var allDrivers = {};
  for (var i = 0; i < decisions.length; i++) {
    var drivers = decisions[i].drivers || [];
    for (var d = 0; d < drivers.length; d++) allDrivers[drivers[d]] = true;
  }

  // Filter bar
  html += '<div class="decision-filter" id="' + mapId + '-filter">';
  html += '<button class="decision-filter-btn active" data-filter="all">All ' + decisions.length + ' decisions</button>';
  var driverOrder = ['budget', 'ltm', 'user-decision', 'profile'];
  for (var di = 0; di < driverOrder.length; di++) {
    var drv = driverOrder[di];
    if (allDrivers[drv]) {
      html += '<button class="decision-filter-btn" data-filter="' + drv + '">' + esc(filterNames[drv] || drv) + '</button>';
    }
  }
  html += '</div>';

  // Filter banner (hidden by default)
  html += '<div class="decision-filter-banner" id="' + mapId + '-banner">';
  html += '<span id="' + mapId + '-banner-text"></span>';
  html += '<button class="close-filter">&times;</button>';
  html += '</div>';

  // TL;DR summary
  if (summary) {
    html += '<div class="decision-map-summary">';
    html += '<h4>The one-line story</h4>';
    html += '<p>' + esc(summary) + '</p>';
    html += '</div>';
  }

  // Decision cards
  html += '<div id="' + mapId + '-cards">';
  for (var i = 0; i < decisions.length; i++) {
    var dec = decisions[i];
    var tags = (dec.drivers || []).join(',');
    var n = i + 1;
    var cardId = mapId + '-d' + n;

    html += '<div class="decision" data-drivers="' + esc(tags) + '" id="' + cardId + '">';

    // Header (clickable)
    html += '<div class="d-header" data-toggle="' + cardId + '">';
    html += '<div class="d-num">' + n + '</div>';
    html += '<div class="d-head-text">';
    html += '<div class="d-question">' + esc(dec.question) + '</div>';
    html += '<div class="d-answer">' + esc(dec.answer) + '</div>';
    html += '</div>';
    html += '<div class="d-arrow">&#9656;</div>';
    html += '</div>';

    // Body (hidden until opened)
    html += '<div class="d-body">';

    // Reasons — "Why this choice"
    if (dec.reasons && dec.reasons.length > 0) {
      html += '<div class="reason-block">';
      html += '<div class="reason-label because">Why this choice</div>';
      for (var r = 0; r < dec.reasons.length; r++) {
        var reason = dec.reasons[r];
        var dCls = reason.driver || '';
        var dLabel = driverLabels[dCls] || dCls;
        html += '<div class="reason-item">';
        html += '<span class="driver-badge ' + esc(dCls) + '">' + esc(dLabel) + '</span>';
        html += '<span class="reason-text">' + esc(reason.text) + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Picked — "We picked"
    if (dec.picked && dec.picked.length > 0) {
      html += '<div class="reason-block">';
      html += '<div class="reason-label picked">We picked</div>';
      for (var p = 0; p < dec.picked.length; p++) {
        html += '<div class="tech-chip">' + esc(dec.picked[p]) + '</div>';
      }
      html += '</div>';
    }

    // Rejected — "We rejected"
    if (dec.rejected && dec.rejected.length > 0) {
      html += '<div class="reason-block">';
      html += '<div class="reason-label not">We rejected</div>';
      for (var j = 0; j < dec.rejected.length; j++) {
        var rej = dec.rejected[j];
        html += '<div class="reject-chip">' + esc(rej.option);
        if (rej.reason) html += ' <span class="why">&mdash; ' + esc(rej.reason) + '</span>';
        html += '</div>';
      }
      html += '</div>';
    }

    html += '</div>'; // d-body
    html += '</div>'; // decision
  }
  html += '</div>'; // cards

  container.innerHTML = html;
  _wireDecisionMap(container, mapId, filterLabels);
}

function _wireDecisionMap(container, mapId, filterLabels) {
  // Accordion toggle
  var headers = container.querySelectorAll('[data-toggle]');
  headers.forEach(function(header) {
    header.addEventListener('click', function() {
      var target = document.getElementById(this.getAttribute('data-toggle'));
      if (target) target.classList.toggle('open');
    });
  });

  // Filter buttons
  var filterBtns = container.querySelectorAll('.decision-filter-btn');
  var banner = document.getElementById(mapId + '-banner');
  var bannerText = document.getElementById(mapId + '-banner-text');

  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var filter = this.getAttribute('data-filter');
      var cards = container.querySelectorAll('.decision');

      filterBtns.forEach(function(b) { b.classList.remove('active'); });
      this.classList.add('active');

      if (filter === 'all') {
        cards.forEach(function(c) { c.classList.remove('dim'); });
        if (banner) banner.style.display = 'none';
      } else {
        cards.forEach(function(c) {
          var drvs = (c.getAttribute('data-drivers') || '').split(',');
          if (drvs.indexOf(filter) >= 0) {
            c.classList.remove('dim');
            c.classList.add('open');
          } else {
            c.classList.add('dim');
            c.classList.remove('open');
          }
        });
        if (banner) {
          banner.style.display = 'flex';
          if (bannerText) bannerText.textContent = filterLabels[filter] || '';
        }
      }
    });
  });

  // Close filter banner → reset to "All"
  var closeBtns = container.querySelectorAll('.close-filter');
  closeBtns.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var allBtn = container.querySelector('.decision-filter-btn[data-filter="all"]');
      if (allBtn) allBtn.click();
    });
  });
}

// ─── Boot ────────────────────────────────────────────────────────────────────

/**
 * Initialize shared brief infrastructure. Call from each template's boot code.
 */
function initBrief() {
  try { var s = localStorage.getItem('phoenix-theme'); if (s) setTheme(s); } catch(e) {}
  initSpaNav();
}

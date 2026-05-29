/**
 * Swarm Activity Dashboard — client logic
 *
 * Fetches /api/swarm/history and /api/swarm/templates; renders the table;
 * fetches /api/swarm/:id when a row is clicked and renders the detail panel.
 *
 * Dissenting voices are preserved verbatim. Hebraic Pattern dissent is
 * given its own consecrated visual treatment — it is the temple's
 * signature lens and its minority signal must remain visible, not
 * flattened into "general dissent."
 */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);
  const tbody = $('#tbody');
  const detail = $('#detail');
  const templateFilter = $('#templateFilter');
  const statusFilter = $('#statusFilter');
  const limitFilter = $('#limitFilter');
  const refreshBtn = $('#refreshBtn');
  const countEl = $('#count');
  const lastRefreshEl = $('#lastRefresh');

  let selectedId = null;

  // ─────────────────────────────────────────────────────────────────
  // Rendering helpers
  // ─────────────────────────────────────────────────────────────────

  function fmtTime(iso) {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      const dd = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const tt = d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      return `${dd}  ${tt}`;
    } catch { return iso; }
  }

  function fmtDuration(ms) {
    if (ms == null || ms === '') return '—';
    const n = Number(ms);
    if (!isFinite(n)) return '—';
    if (n < 1000) return `${n}ms`;
    if (n < 60000) return `${(n / 1000).toFixed(1)}s`;
    return `${(n / 60000).toFixed(1)}m`;
  }

  function fmtConfidence(c) {
    if (c == null) return '—';
    const n = Number(c);
    if (!isFinite(n)) return '—';
    return n.toFixed(2);
  }

  function statusBadge(status) {
    const safe = String(status || 'in_progress').replace(/[^a-z_]/gi, '_');
    return `<span class="status ${safe}">${escapeHtml(status || '—')}</span>`;
  }

  function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function asArray(maybe) {
    if (Array.isArray(maybe)) return maybe;
    if (maybe == null) return [];
    if (typeof maybe === 'string') {
      try { const parsed = JSON.parse(maybe); return Array.isArray(parsed) ? parsed : []; }
      catch { return []; }
    }
    return [];
  }

  // ─────────────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────────────

  async function fetchHistory() {
    const params = new URLSearchParams();
    if (templateFilter.value) params.set('template', templateFilter.value);
    if (statusFilter.value) params.set('status', statusFilter.value);
    params.set('limit', limitFilter.value);
    const res = await fetch(`/api/swarm/history?${params.toString()}`);
    if (!res.ok) throw new Error(`history HTTP ${res.status}`);
    return res.json();
  }

  async function fetchTemplates() {
    const res = await fetch('/api/swarm/templates');
    if (!res.ok) throw new Error(`templates HTTP ${res.status}`);
    return res.json();
  }

  async function fetchSwarm(id) {
    const res = await fetch(`/api/swarm/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`swarm HTTP ${res.status}`);
    return res.json();
  }

  // ─────────────────────────────────────────────────────────────────
  // Table rendering
  // ─────────────────────────────────────────────────────────────────

  function renderHistory(invocations) {
    if (!invocations || invocations.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="empty">No swarm invocations yet. The conductor waits.</td></tr>';
      return;
    }
    const rows = invocations.map((inv) => {
      const sel = inv.id === selectedId ? ' class="selected"' : '';
      return `<tr data-id="${escapeHtml(inv.id)}"${sel}>
        <td>${escapeHtml(fmtTime(inv.started_at))}</td>
        <td>${escapeHtml(inv.caller_service || '—')}</td>
        <td>${escapeHtml(inv.template_name || '—')}</td>
        <td>${statusBadge(inv.status)}</td>
        <td class="num">${escapeHtml(fmtConfidence(inv.synthesis_confidence))}</td>
        <td class="num">${escapeHtml(String(inv.lens_count ?? '—'))}</td>
        <td class="num">${escapeHtml(fmtDuration(inv.total_duration_ms))}</td>
      </tr>`;
    }).join('');
    tbody.innerHTML = rows;
    tbody.querySelectorAll('tr').forEach((tr) => {
      tr.addEventListener('click', () => {
        const id = tr.getAttribute('data-id');
        if (id) loadDetail(id);
      });
    });
  }

  // ─────────────────────────────────────────────────────────────────
  // Detail panel rendering
  // ─────────────────────────────────────────────────────────────────

  async function loadDetail(id) {
    selectedId = id;
    tbody.querySelectorAll('tr').forEach((tr) => {
      tr.classList.toggle('selected', tr.getAttribute('data-id') === id);
    });
    detail.innerHTML = '<p class="quiet">Loading…</p>';
    try {
      const data = await fetchSwarm(id);
      renderDetail(data);
    } catch (e) {
      detail.innerHTML = `<p class="quiet">Failed to load: ${escapeHtml(e.message)}</p>`;
    }
  }

  function renderDetail(data) {
    const inv = data.invocation || {};
    const syn = data.synthesis || {};
    const signals = Array.isArray(data.signals) ? data.signals : [];

    const convergences = asArray(syn.convergences);
    const tensions = asArray(syn.tensions);
    const dissenting = asArray(syn.dissenting_voices);

    const dissentHtml = dissenting.length === 0
      ? '<p class="quiet">No dissenting voices recorded.</p>'
      : dissenting.map((v) => {
          const isHebraic = /hebraic\s*pattern/i.test(String(v));
          const cls = isHebraic ? 'dissent-hebraic' : 'dissent-other';
          return `<div class="${cls}">${escapeHtml(v)}</div>`;
        }).join('');

    const signalsHtml = signals.length === 0
      ? '<p class="quiet">No signal records.</p>'
      : signals.map((s) => {
          const statusTag = statusBadge(s.status);
          const tokens = s.tokens_used != null ? `${s.tokens_used} tok` : '';
          const dur = fmtDuration(s.duration_ms);
          const meta = [tokens, dur].filter(Boolean).join(' · ');
          const body = s.response ? escapeHtml(s.response) : (s.error ? `<em>error:</em> ${escapeHtml(s.error)}` : '<em>(no content)</em>');
          return `<details class="signal">
            <summary>
              <span>${escapeHtml(s.lens_name || 'lens')}</span>
              <span class="signal-meta">${statusTag} ${escapeHtml(meta)}</span>
            </summary>
            <div class="signal-body">${body}</div>
          </details>`;
        }).join('');

    detail.innerHTML = `
      <h2>${escapeHtml(inv.template_name || 'swarm')} — ${escapeHtml(inv.caller_service || '')}</h2>
      <div class="meta">
        <span><strong>Started:</strong> ${escapeHtml(fmtTime(inv.started_at))}</span>
        <span><strong>Status:</strong> ${statusBadge(inv.status)}</span>
        <span><strong>Confidence:</strong> ${escapeHtml(fmtConfidence(syn.confidence))}</span>
        <span><strong>Lenses:</strong> ${escapeHtml(String(inv.lens_count ?? '—'))}</span>
        <span><strong>Duration:</strong> ${escapeHtml(fmtDuration(inv.total_duration_ms))}</span>
        <span><strong>Tokens:</strong> ${escapeHtml(String(inv.total_cost_tokens ?? '—'))}</span>
        <span><strong>Presence:</strong> ${inv.presence_check ? 'witnessed' : '—'}</span>
      </div>

      <details>
        <summary class="quiet">Task (click to expand)</summary>
        <pre class="insight" style="margin-top:0.5rem">${escapeHtml(inv.task || '')}</pre>
      </details>

      <div class="section">
        <h3>Synthesized insight</h3>
        <div class="insight">${escapeHtml(syn.synthesized_insight || '(no synthesis recorded)')}</div>
      </div>

      <div class="section">
        <h3>Convergences (${convergences.length})</h3>
        ${convergences.length === 0 ? '<p class="quiet">None recorded.</p>' : `<ul class="bullets">${convergences.map((c) => `<li>${escapeHtml(c)}</li>`).join('')}</ul>`}
      </div>

      <div class="section">
        <h3>Tensions (${tensions.length})</h3>
        ${tensions.length === 0 ? '<p class="quiet">None recorded.</p>' : `<ul class="bullets">${tensions.map((t) => `<li>${escapeHtml(t)}</li>`).join('')}</ul>`}
      </div>

      <div class="section">
        <h3>Dissenting voices (${dissenting.length})</h3>
        ${dissentHtml}
      </div>

      <div class="section">
        <h3>Lens signals (${signals.length})</h3>
        ${signalsHtml}
      </div>
    `;
  }

  // ─────────────────────────────────────────────────────────────────
  // Lifecycle
  // ─────────────────────────────────────────────────────────────────

  async function loadAll() {
    try {
      const [hist] = await Promise.all([fetchHistory()]);
      countEl.textContent = String(hist.count ?? hist.invocations?.length ?? 0);
      lastRefreshEl.textContent = new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
      renderHistory(hist.invocations || []);
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="7" class="empty">Failed to load: ${escapeHtml(e.message)}</td></tr>`;
    }
  }

  async function loadTemplates() {
    try {
      const t = await fetchTemplates();
      const opts = (t.templates || []).map((tt) => `<option value="${escapeHtml(tt.name)}">${escapeHtml(tt.name)} (${tt.lensCount})</option>`).join('');
      templateFilter.innerHTML = '<option value="">All templates</option>' + opts;
    } catch { /* keep default option */ }
  }

  // Auto-refresh every 30s (paused while a detail is open and being read?
  // No — refresh history list; detail is on-demand).
  let timer = null;
  function startAutoRefresh() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => loadAll(), 30000);
  }

  refreshBtn.addEventListener('click', () => loadAll());
  templateFilter.addEventListener('change', () => loadAll());
  statusFilter.addEventListener('change', () => loadAll());
  limitFilter.addEventListener('change', () => loadAll());

  loadTemplates().then(loadAll).then(startAutoRefresh);
})();

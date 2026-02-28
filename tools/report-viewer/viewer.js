(() => {
  const REPORT_PATH = '../../e2e/report/report.json';

  let currentFilter = 'all';
  let report = null;

  async function loadReport() {
    try {
      const res = await fetch(REPORT_PATH);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      report = await res.json();
      render();
    } catch (err) {
      showError(`Could not load report: ${err.message}. Run "npm run test:visual:report" first.`);
    }
  }

  function showError(msg) {
    const el = document.getElementById('error-msg');
    el.textContent = msg;
    el.style.display = 'block';
  }

  function render() {
    if (!report) return;

    document.getElementById('timestamp').textContent =
      `Generated: ${new Date(report.timestamp).toLocaleString()}`;

    const content = document.getElementById('content');
    content.innerHTML = '';

    // Summary
    const summary = document.createElement('div');
    summary.className = 'summary';
    summary.innerHTML = `
      <div class="stat">
        <div class="stat-value">${report.summary.total}</div>
        <div class="stat-label">Total</div>
      </div>
      <div class="stat">
        <div class="stat-value unchanged">${report.summary.unchanged}</div>
        <div class="stat-label">Unchanged</div>
      </div>
      <div class="stat">
        <div class="stat-value changed">${report.summary.changed}</div>
        <div class="stat-label">Changed</div>
      </div>
      <div class="stat">
        <div class="stat-value new">${report.summary.new}</div>
        <div class="stat-label">New</div>
      </div>
    `;
    content.appendChild(summary);

    // Filters
    const filters = document.createElement('div');
    filters.className = 'filters';
    for (const f of ['all', 'changed', 'unchanged', 'new']) {
      const btn = document.createElement('button');
      btn.className = `filter-btn${currentFilter === f ? ' active' : ''}`;
      btn.textContent = f.charAt(0).toUpperCase() + f.slice(1);
      btn.addEventListener('click', () => {
        currentFilter = f;
        render();
      });
      filters.appendChild(btn);
    }
    content.appendChild(filters);

    // Entries
    const entries = document.createElement('div');
    entries.className = 'entries';

    const filtered =
      currentFilter === 'all'
        ? report.entries
        : report.entries.filter((e) => e.status === currentFilter);

    if (filtered.length === 0) {
      entries.innerHTML = `<div class="no-report"><p>No ${currentFilter} entries.</p></div>`;
    }

    for (const entry of filtered) {
      const el = document.createElement('div');
      el.className = 'entry';
      el.innerHTML = `
        <div class="entry-header">
          <span class="entry-title">${entry.page} &middot; ${entry.mode} &middot; ${entry.viewport}</span>
          <span class="badge ${entry.status}">${entry.status}</span>
        </div>
        <div class="comparison ${entry.status === 'unchanged' ? 'single' : ''}">
          ${entry.baseline ? `
            <div class="image-container">
              <span class="image-label">Baseline</span>
              <img src="${toRelativePath(entry.baseline)}" alt="Baseline" loading="lazy" />
            </div>
          ` : ''}
          ${entry.current ? `
            <div class="image-container">
              <span class="image-label">Current</span>
              <img src="${toRelativePath(entry.current)}" alt="Current" loading="lazy" />
            </div>
          ` : ''}
          ${entry.diff ? `
            <div class="image-container">
              <span class="image-label">Diff</span>
              <img src="${toRelativePath(entry.diff)}" alt="Diff" loading="lazy" />
            </div>
          ` : ''}
        </div>
      `;
      entries.appendChild(el);
    }

    content.appendChild(entries);
  }

  function toRelativePath(absolutePath) {
    // Convert absolute path to relative path from the viewer's location
    const projectRoot = absolutePath.split('/e2e/')[0];
    const relativePart = absolutePath.split(projectRoot + '/')[1];
    if (relativePart) return '../../' + relativePart;
    return absolutePath;
  }

  loadReport();
})();

const apiBase = "https://studio2800-api.jason-danyliw.workers.dev";
const adminTokenKey = "studio2800AdminToken";

const gate = document.querySelector("[data-dashboard-gate]");
const content = document.querySelector("[data-dashboard-content]");
const form = document.querySelector("[data-dashboard-login]");
const status = document.querySelector("[data-dashboard-status]");
const inlineStatus = document.querySelector("[data-dashboard-inline-status]");
const totalCard = document.querySelector("[data-dashboard-total]");
const summary = document.querySelector("[data-network-summary]");
const panels = document.querySelector("[data-site-panels]");
const filters = document.querySelector("[data-dashboard-filters]");

function token() {
  return sessionStorage.getItem(adminTokenKey) || "";
}

function setUnlocked(unlocked) {
  gate.hidden = unlocked;
  content.hidden = !unlocked;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function money(value) {
  return `$${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token()) headers.set("Authorization", `Bearer ${token()}`);
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed.");
  return payload;
}

function tableRows(rows, cells, empty) {
  if (!rows?.length) return `<tr><td colspan="${cells.length}">${escapeHtml(empty)}</td></tr>`;
  return rows.map((row) => `<tr>${cells.map((cell) => `<td>${cell(row)}</td>`).join("")}</tr>`).join("");
}

function renderSite(site) {
  const statusClass = site.dataStatus === "active" ? "is-active" : "is-pending";
  return `
    <article class="admin-panel dashboard-site-panel ${statusClass}">
      <div class="admin-panel-heading">
        <div>
          <p class="eyebrow">${escapeHtml(site.site)}</p>
          <h2>${escapeHtml(site.label)}</h2>
        </div>
        <a class="button secondary" href="${escapeHtml(site.url)}" target="_blank" rel="noopener">Open site</a>
      </div>
      <div class="site-kpi-grid">
        <article><span>Unique viewers</span><strong>${Number(site.uniqueVisitors || 0).toLocaleString()}</strong></article>
        <article><span>Page views</span><strong>${Number(site.totalPageViews || 0).toLocaleString()}</strong></article>
        <article><span>Ad revenue estimate</span><strong>${money(site.estimatedAdRevenue)}</strong></article>
        <article><span>Status</span><strong>${site.dataStatus === "active" ? "Tracking" : "Pending"}</strong></article>
      </div>
      <p class="dashboard-note">${escapeHtml(site.revenueStatus)}</p>
      <div class="dashboard-table-grid">
        <div class="submission-table-wrap">
          <table class="submission-table dashboard-table">
            <thead><tr><th>Region</th><th>Views</th></tr></thead>
            <tbody>${tableRows(site.topRegions, [
              (row) => escapeHtml([row.city, row.region, row.country].filter(Boolean).join(", ") || "Unknown"),
              (row) => Number(row.views || 0).toLocaleString()
            ], "No region data yet.")}</tbody>
          </table>
        </div>
        <div class="submission-table-wrap">
          <table class="submission-table dashboard-table">
            <thead><tr><th>Top page</th><th>Views</th></tr></thead>
            <tbody>${tableRows(site.topPages, [
              (row) => escapeHtml(row.path || "/"),
              (row) => Number(row.views || 0).toLocaleString()
            ], "No page data yet.")}</tbody>
          </table>
        </div>
      </div>
    </article>
  `;
}

function renderDashboard(data) {
  totalCard.innerHTML = `
    <span>Total estimated ad revenue</span>
    <strong>${money(data.totals?.estimatedAdRevenue)}</strong>
    <small>${data.ads?.enabled ? `Using $${Number(data.ads.estimatedRpm || 0).toFixed(2)} RPM estimate` : "Pending ads enablement"}</small>
  `;

  summary.innerHTML = `
    <article class="metric-card"><span>Total page views</span><strong>${Number(data.totals?.pageViews || 0).toLocaleString()}</strong></article>
    <article class="metric-card"><span>Unique viewers</span><strong>${Number(data.totals?.uniqueVisitors || 0).toLocaleString()}</strong></article>
    <article class="metric-card"><span>Estimated ad revenue</span><strong>${money(data.totals?.estimatedAdRevenue)}</strong></article>
    <article class="metric-card"><span>Tracked sites</span><strong>${Number(data.sites?.length || 0).toLocaleString()}</strong></article>
  `;

  panels.innerHTML = data.sites?.map(renderSite).join("") || `<article class="admin-panel"><p>No dashboard data returned.</p></article>`;
}

async function loadDashboard(range = "7d") {
  inlineStatus.textContent = "Loading...";
  try {
    const data = await api(`/api/admin/network-dashboard?range=${encodeURIComponent(range)}`);
    renderDashboard(data);
    inlineStatus.textContent = "Updated";
  } catch (error) {
    inlineStatus.textContent = error.message;
    if (/authorized|expired/i.test(error.message)) {
      sessionStorage.removeItem(adminTokenKey);
      setUnlocked(false);
    }
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.textContent = "Checking...";
  try {
    const { token: nextToken } = await api("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: form.elements.password.value })
    });
    sessionStorage.setItem(adminTokenKey, nextToken);
    form.elements.password.value = "";
    status.textContent = "";
    setUnlocked(true);
    await loadDashboard();
  } catch (error) {
    status.textContent = error.message;
  }
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-range]");
  if (!button) return;
  filters.querySelectorAll("[data-range]").forEach((item) => item.setAttribute("aria-pressed", "false"));
  button.setAttribute("aria-pressed", "true");
  loadDashboard(button.dataset.range);
});

setUnlocked(Boolean(token()));
if (token()) loadDashboard();

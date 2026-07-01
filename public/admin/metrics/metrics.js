const apiBase = "https://studio2800-api.jason-danyliw.workers.dev";
const adminTokenKey = "studio2800AdminToken";

const gate = document.querySelector("[data-metrics-gate]");
const content = document.querySelector("[data-metrics-content]");
const form = document.querySelector("[data-metrics-login]");
const status = document.querySelector("[data-metrics-status]");
const inlineStatus = document.querySelector("[data-metrics-status-inline]");
const cards = document.querySelector("[data-metrics-cards]");
const pagesTable = document.querySelector("[data-pages-table]");
const referrersTable = document.querySelector("[data-referrers-table]");
const weeklyReport = document.querySelector("[data-weekly-report]");
const errorsList = document.querySelector("[data-errors-list]");
const filters = document.querySelector("[data-metrics-filters]");

function token() {
  return sessionStorage.getItem(adminTokenKey) || "";
}

function setUnlocked(unlocked) {
  gate.hidden = unlocked;
  content.hidden = !unlocked;
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token()) {
    headers.set("Authorization", `Bearer ${token()}`);
  }
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function renderMetrics(data) {
  const metrics = [
    ["Total page views", data.totalPageViews],
    ["Unique visitors", data.uniqueVisitors],
    ["Published content", data.publishedContent],
    ["New accounts", data.newUsers],
    ["RSS feed hits", data.rssFeedHits],
    ["Form inquiries", data.formSubmissions]
  ];
  cards.innerHTML = metrics.map(([label, value]) => `
    <article class="metric-card"><span>${label}</span><strong>${Number(value || 0).toLocaleString()}</strong></article>
  `).join("");

  pagesTable.innerHTML = `
    <thead><tr><th>Page</th><th>Views</th></tr></thead>
    <tbody>${data.mostViewedPages?.length ? data.mostViewedPages.map((row) => `
      <tr><td>${escapeHtml(row.path)}</td><td>${Number(row.views || 0).toLocaleString()}</td></tr>
    `).join("") : `<tr><td colspan="2">No page view data yet.</td></tr>`}</tbody>
  `;

  referrersTable.innerHTML = `
    <thead><tr><th>Source</th><th>Visits</th></tr></thead>
    <tbody>${data.topReferrers?.length ? data.topReferrers.map((row) => `
      <tr><td>${escapeHtml(row.referrer)}</td><td>${Number(row.visits || 0).toLocaleString()}</td></tr>
    `).join("") : `<tr><td colspan="2">No traffic source data yet.</td></tr>`}</tbody>
  `;

  errorsList.innerHTML = data.recentErrors?.length ? data.recentErrors.map((error) => `
    <li><strong>${escapeHtml(error.path || "Unknown path")}</strong><br>${escapeHtml(error.message || "Unknown error")}</li>
  `).join("") : "<li>No recent site errors logged.</li>";

  const sourceCount = data.topReferrers?.length || 0;
  const leadRate = data.totalPageViews ? ((data.formSubmissions || 0) / data.totalPageViews) * 100 : 0;
  const topPage = data.mostViewedPages?.[0]?.path || "No clear top page yet";
  const topSource = data.topReferrers?.[0]?.referrer || "No clear source yet";
  const nextSteps = [
    "Publish one new AI video content update and link it from YouTube descriptions.",
    "Add a clear booking call-to-action near the featured video carousel.",
    "Share the RSS feed and Studio2800 links from every active channel.",
    sourceCount < 3 ? "Broaden traffic sources by posting to YouTube, X, SoundCloud, and Studio2800News this week." : "Double down on the highest-performing source and create a matching video/post variation."
  ];

  weeklyReport.innerHTML = `
    <div class="report-grid">
      <article>
        <span>Traffic read</span>
        <p>${Number(data.totalPageViews || 0).toLocaleString()} page views, ${Number(data.uniqueVisitors || 0).toLocaleString()} unique visitors, and ${Number(data.formSubmissions || 0).toLocaleString()} inquiries. Estimated inquiry rate: ${leadRate.toFixed(1)}%.</p>
      </article>
      <article>
        <span>Best signal</span>
        <p>Top page: ${escapeHtml(topPage)}. Top source: ${escapeHtml(topSource)}.</p>
      </article>
      <article>
        <span>AI evaluation</span>
        <p>${data.recentErrors?.length ? "Fix recent logged errors before driving paid traffic." : "No recent site errors are logged, so the site is ready for organic traffic pushes."}</p>
      </article>
    </div>
    <h3>Next steps to increase traffic</h3>
    <ol>${nextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}</ol>
  `;
}

async function loadMetrics(range = "7d") {
  inlineStatus.textContent = "Loading...";
  try {
    const data = await api(`/api/admin/metrics?range=${encodeURIComponent(range)}`);
    renderMetrics(data);
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
    await loadMetrics();
  } catch (error) {
    status.textContent = error.message;
  }
});

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-range]");
  if (!button) {
    return;
  }
  filters.querySelectorAll("[data-range]").forEach((item) => item.setAttribute("aria-pressed", "false"));
  button.setAttribute("aria-pressed", "true");
  loadMetrics(button.dataset.range);
});

setUnlocked(Boolean(token()));
if (token()) {
  loadMetrics();
}

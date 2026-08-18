const apiBase = "https://studio2800-api.jason-danyliw.workers.dev";
const adminTokenKey = "studio2800AdminToken";
const defaultVideoUrls = ["", "", "", "", "https://youtu.be/dJ1DPki-nQ8", "", "", "", ""];

const adminGate = document.querySelector("[data-admin-gate]");
const adminContent = document.querySelector("[data-admin-content]");
const adminLoginForm = document.querySelector("[data-admin-login]");
const adminLoginStatus = document.querySelector("[data-admin-login-status]");
const adminLogoutButton = document.querySelector("[data-admin-logout]");
const videoForm = document.querySelector("[data-video-form]");
const videoStatus = document.querySelector("[data-video-status]");
const saveVideosButton = document.querySelector("[data-save-videos]");
const clearVideosButton = document.querySelector("[data-clear-videos]");
const livestreamEnabledInput = document.querySelector("[data-livestream-enabled]");
const saveSiteSettingsButton = document.querySelector("[data-save-site-settings]");
const siteSettingsStatus = document.querySelector("[data-site-settings-status]");
const refreshSubmissionsButton = document.querySelector("[data-refresh-submissions]");
const refreshNotificationStatusButton = document.querySelector("[data-refresh-notification-status]");
const testNotificationFailoverButton = document.querySelector("[data-test-notification-failover]");
const testLeadEmailButton = document.querySelector("[data-test-lead-email]");
const testLeadSmsButton = document.querySelector("[data-test-lead-sms]");
const testLeadPushButton = document.querySelector("[data-test-lead-push]");
const notificationStatusGrid = document.querySelector("[data-notification-status]");
const notificationStatusText = document.querySelector("[data-notification-status-text]");
const submissionTable = document.querySelector("[data-submission-table]");
const submissionCount = document.querySelector("[data-submission-count]");
const submissionStatus = document.querySelector("[data-submission-status]");

function getToken() {
  return sessionStorage.getItem(adminTokenKey) || "";
}

function setAdminVisibility(unlocked = Boolean(getToken())) {
  adminGate.hidden = unlocked;
  adminContent.hidden = !unlocked;
  adminLogoutButton.hidden = !unlocked;
  if (!unlocked) adminLoginForm.elements.password.focus();
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (getToken()) headers.set("Authorization", `Bearer ${getToken()}`);
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Request failed. Please try again.");
  return payload;
}

async function loadVideoUrls() {
  try {
    const { urls = [] } = await apiRequest("/api/videos");
    [...videoForm.elements].filter((input) => input.matches("input")).forEach((input, index) => {
      input.value = urls[index] || defaultVideoUrls[index] || "";
    });
  } catch (error) {
    videoStatus.textContent = error.message;
  }
}

async function saveVideoUrls() {
  const urls = [...videoForm.elements]
    .filter((input) => input.matches("input"))
    .map((input) => input.value.trim());
  saveVideosButton.disabled = true;
  videoStatus.textContent = "Saving...";
  try {
    await apiRequest("/api/videos", { method: "PUT", body: JSON.stringify({ urls }) });
    videoStatus.textContent = "Saved. The public showcase now uses these links.";
  } catch (error) {
    videoStatus.textContent = error.message;
  } finally {
    saveVideosButton.disabled = false;
  }
}

async function loadSiteSettings() {
  if (!livestreamEnabledInput) return;
  siteSettingsStatus.textContent = "Loading...";
  try {
    const { livestreamEnabled = false } = await apiRequest("/api/admin/site-settings");
    livestreamEnabledInput.checked = Boolean(livestreamEnabled);
    siteSettingsStatus.textContent = livestreamEnabled ? "Livestream is visible." : "Livestream is hidden.";
  } catch (error) {
    siteSettingsStatus.textContent = error.message;
  }
}

async function saveSiteSettings() {
  if (!livestreamEnabledInput) return;
  saveSiteSettingsButton.disabled = true;
  siteSettingsStatus.textContent = "Saving...";
  try {
    const { livestreamEnabled = false } = await apiRequest("/api/admin/site-settings", {
      method: "PUT",
      body: JSON.stringify({ livestreamEnabled: livestreamEnabledInput.checked })
    });
    livestreamEnabledInput.checked = Boolean(livestreamEnabled);
    siteSettingsStatus.textContent = livestreamEnabled
      ? "Saved. The Livestream page and navigation can appear publicly."
      : "Saved. The Livestream page is hidden from public navigation.";
  } catch (error) {
    siteSettingsStatus.textContent = error.message;
  } finally {
    saveSiteSettingsButton.disabled = false;
  }
}

function statusLabel(status) {
  if (status === "ready") return "Ready";
  if (status === "disabled") return "Disabled";
  if (status === "blocked") return "Needs setup";
  return status || "Unknown";
}

function renderStatusCard(title, status, note, missing = []) {
  const missingText = missing.length
    ? `<small>Missing: ${missing.map(escapeHtml).join(", ")}</small>`
    : `<small>No missing secret names reported.</small>`;
  return `
    <article class="notification-status-card ${escapeHtml(status || "unknown")}">
      <span>${escapeHtml(statusLabel(status))}</span>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(note || "")}</p>
      ${missingText}
    </article>`;
}

function renderNotificationStatus(data = {}) {
  const fallback = data.fallback || {};
  notificationStatusGrid.innerHTML = [
    renderStatusCard("Lead email", "ready", "Resend is configured separately and remains the primary lead/report delivery path."),
    renderStatusCard("Twilio SMS", data.sms?.status, data.sms?.note, data.sms?.missing || []),
    renderStatusCard("App push backup", data.push?.status, data.push?.note, data.push?.missing || []),
    renderStatusCard("Automatic failover", fallback.status, fallback.twilioExpirationBehavior || fallback.activeWhen || "")
  ].join("");
  notificationStatusText.textContent = `Last checked ${new Date(data.generatedAt || Date.now()).toLocaleString()}.`;
}

async function loadNotificationStatus() {
  if (!notificationStatusGrid) return;
  if (refreshNotificationStatusButton) refreshNotificationStatusButton.disabled = true;
  notificationStatusText.textContent = "Checking notification setup...";
  try {
    renderNotificationStatus(await apiRequest("/api/admin/notification-status"));
  } catch (error) {
    if (/authorized|expired/i.test(error.message)) {
      sessionStorage.removeItem(adminTokenKey);
      setAdminVisibility(false);
    }
    notificationStatusText.textContent = error.message;
  } finally {
    if (refreshNotificationStatusButton) refreshNotificationStatusButton.disabled = false;
  }
}

function renderSubmissions(rows = []) {
  const headers = ["Received", "Name", "Email", "Video need", "Timeline", "Goal"];
  submissionTable.innerHTML = `
    <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.length ? rows.map((row) => `
        <tr>
          <td>${escapeHtml(new Date(row.created_at).toLocaleString())}</td>
          <td>${escapeHtml(row.name)}</td>
          <td>${escapeHtml(row.email)}</td>
          <td>${escapeHtml(row.project)}</td>
          <td>${escapeHtml(row.timeline)}</td>
          <td>${escapeHtml(row.goal)}</td>
        </tr>`).join("") : `<tr><td colspan="6">No inquiries have been submitted yet.</td></tr>`}
    </tbody>`;
  submissionCount.textContent = `${rows.length} ${rows.length === 1 ? "inquiry" : "inquiries"}`;
}

async function loadSubmissions() {
  refreshSubmissionsButton.disabled = true;
  submissionStatus.textContent = "Loading...";
  try {
    const { submissions = [] } = await apiRequest("/api/admin/submissions");
    renderSubmissions(submissions);
    submissionStatus.textContent = "Up to date";
  } catch (error) {
    if (/authorized|expired/i.test(error.message)) {
      sessionStorage.removeItem(adminTokenKey);
      setAdminVisibility(false);
    }
    submissionStatus.textContent = error.message;
  } finally {
    refreshSubmissionsButton.disabled = false;
  }
}

async function sendTestLeadEmail() {
  if (!testLeadEmailButton) return;
  testLeadEmailButton.disabled = true;
  submissionStatus.textContent = "Sending test email...";
  try {
    await apiRequest("/api/admin/test-lead-email", { method: "POST", body: "{}" });
    submissionStatus.textContent = "Test email sent. Check the Studio2800 inbox.";
  } catch (error) {
    submissionStatus.textContent = error.message;
  } finally {
    testLeadEmailButton.disabled = false;
  }
}

async function sendTestLeadSms() {
  if (!testLeadSmsButton) return;
  testLeadSmsButton.disabled = true;
  submissionStatus.textContent = "Sending test text...";
  try {
    await apiRequest("/api/admin/test-lead-sms", { method: "POST", body: "{}" });
    submissionStatus.textContent = "Test text sent. Check the configured phone.";
  } catch (error) {
    submissionStatus.textContent = error.message;
  } finally {
    testLeadSmsButton.disabled = false;
  }
}

async function sendTestLeadPush() {
  if (!testLeadPushButton) return;
  testLeadPushButton.disabled = true;
  submissionStatus.textContent = "Sending test push...";
  try {
    await apiRequest("/api/admin/test-lead-push", { method: "POST", body: "{}" });
    submissionStatus.textContent = "Test push sent. Check the configured phone app.";
  } catch (error) {
    submissionStatus.textContent = error.message;
  } finally {
    testLeadPushButton.disabled = false;
  }
}

async function sendTestNotificationFailover() {
  if (!testNotificationFailoverButton) return;
  testNotificationFailoverButton.disabled = true;
  notificationStatusText.textContent = "Sending failover test...";
  try {
    await apiRequest("/api/admin/test-notification-failover", { method: "POST", body: "{}" });
    notificationStatusText.textContent = "Failover test sent. Check the configured phone app.";
    await loadNotificationStatus();
  } catch (error) {
    notificationStatusText.textContent = error.message;
    await loadNotificationStatus();
  } finally {
    testNotificationFailoverButton.disabled = false;
  }
}

adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const passwordInput = adminLoginForm.elements.password;
  adminLoginStatus.textContent = "Checking...";
  try {
    const { token } = await apiRequest("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password: passwordInput.value })
    });
    sessionStorage.setItem(adminTokenKey, token);
    passwordInput.value = "";
    adminLoginStatus.textContent = "";
    setAdminVisibility(true);
    await Promise.all([loadVideoUrls(), loadSiteSettings(), loadNotificationStatus(), loadSubmissions()]);
  } catch (error) {
    adminLoginStatus.textContent = error.message;
    passwordInput.select();
  }
});

adminLogoutButton.addEventListener("click", () => {
  sessionStorage.removeItem(adminTokenKey);
  setAdminVisibility(false);
});

saveVideosButton.addEventListener("click", saveVideoUrls);
saveSiteSettingsButton?.addEventListener("click", saveSiteSettings);
refreshNotificationStatusButton?.addEventListener("click", loadNotificationStatus);
testNotificationFailoverButton?.addEventListener("click", sendTestNotificationFailover);
clearVideosButton.addEventListener("click", () => {
  [...videoForm.elements].filter((input) => input.matches("input")).forEach((input, index) => {
    input.value = defaultVideoUrls[index] || "";
  });
  videoStatus.textContent = "Defaults loaded. Select Save links to publish them.";
});
refreshSubmissionsButton.addEventListener("click", loadSubmissions);
testLeadEmailButton?.addEventListener("click", sendTestLeadEmail);
testLeadSmsButton?.addEventListener("click", sendTestLeadSms);
testLeadPushButton?.addEventListener("click", sendTestLeadPush);

setAdminVisibility();
if (getToken()) Promise.all([loadVideoUrls(), loadSiteSettings(), loadNotificationStatus(), loadSubmissions()]);

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
const refreshSubmissionsButton = document.querySelector("[data-refresh-submissions]");
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

function renderSubmissions(rows = []) {
  const headers = ["Received", "Name", "Email", "Video need", "Timeline", "Goal"];
  submissionTable.innerHTML = `
    <thead><tr>${headers.map((header) => `<th>${header}</th>`).join("")}</tr></thead>
    <tbody>
      ${rows.length ? rows.map((row) => `
        <tr>
          <td>${escapeHtml(new Date(row.created_at).toLocaleString())}</td>
          <td>${escapeHtml(row.name)}</td>
          <td><a href="mailto:${escapeHtml(row.email)}">${escapeHtml(row.email)}</a></td>
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
    await Promise.all([loadVideoUrls(), loadSubmissions()]);
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
clearVideosButton.addEventListener("click", () => {
  [...videoForm.elements].filter((input) => input.matches("input")).forEach((input, index) => {
    input.value = defaultVideoUrls[index] || "";
  });
  videoStatus.textContent = "Defaults loaded. Select Save links to publish them.";
});
refreshSubmissionsButton.addEventListener("click", loadSubmissions);

setAdminVisibility();
if (getToken()) Promise.all([loadVideoUrls(), loadSubmissions()]);

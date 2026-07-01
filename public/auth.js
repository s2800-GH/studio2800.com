(() => {
const apiBase = "https://studio2800-api.jason-danyliw.workers.dev";
const userTokenKey = "studio2800UserToken";

const signupForm = document.querySelector("[data-signup-form]");
const loginForm = document.querySelector("[data-login-form]");
const accountPanel = document.querySelector("[data-account-panel]");
const accountName = document.querySelector("[data-account-name]");
const accountSummary = document.querySelector("[data-account-summary]");
const authStatus = document.querySelector("[data-auth-status]");
const logoutButtons = document.querySelectorAll("[data-logout]");
const profileLinks = document.querySelectorAll("[data-profile-link]");

function setStatus(message) {
  if (authStatus) {
    authStatus.textContent = message;
  }
}

function getUserToken() {
  return localStorage.getItem(userTokenKey) || "";
}

function setUserToken(token) {
  localStorage.setItem(userTokenKey, token);
}

function clearUserToken() {
  localStorage.removeItem(userTokenKey);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function authRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (getUserToken()) {
    headers.set("Authorization", `Bearer ${getUserToken()}`);
  }
  const response = await fetch(`${apiBase}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || "Request failed.");
  }
  return payload;
}

function formatDate(value) {
  if (!value) {
    return "Not available";
  }
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

async function hydrateProfileLinks() {
  if (!profileLinks.length || !getUserToken()) {
    return;
  }
  try {
    const { user } = await authRequest("/api/auth/me");
    const name = user.displayName || user.email || "Profile";
    profileLinks.forEach((link) => {
      link.textContent = `Profile: ${name}`;
      link.classList.add("is-signed-in");
    });
  } catch {
    clearUserToken();
  }
}

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(signupForm);
  const payload = Object.fromEntries(formData.entries());
  if (payload.password !== payload.confirmPassword) {
    setStatus("Passwords must match.");
    return;
  }
  setStatus("Creating account...");
  try {
    const { token } = await authRequest("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setUserToken(token);
    window.location.assign("../account/");
  } catch (error) {
    setStatus(error.message);
  }
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const payload = Object.fromEntries(new FormData(loginForm).entries());
  setStatus("Signing in...");
  try {
    const { token } = await authRequest("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    setUserToken(token);
    window.location.assign("../account/");
  } catch (error) {
    setStatus(error.message);
  }
});

async function loadAccount() {
  if (!accountPanel) {
    return;
  }
  if (!getUserToken()) {
    window.location.assign("../login/");
    return;
  }
  try {
    const { user } = await authRequest("/api/auth/me");
    const displayName = user.displayName || "Studio2800 user";
    if (accountName) {
      accountName.textContent = displayName;
    }
    if (accountSummary) {
      accountSummary.textContent = `${displayName}, your Studio2800 account is active. This area will hold project notes, production status, and private client resources as the platform grows.`;
    }
    accountPanel.innerHTML = `
      <article class="profile-card profile-card-featured">
        <span>Signed in as</span>
        <strong>${escapeHtml(displayName)}</strong>
        <p>${escapeHtml(user.email)}</p>
      </article>
      <article class="profile-card">
        <span>Account role</span>
        <strong>${escapeHtml(user.role || "user")}</strong>
        <p>${user.role === "admin" ? "Admin access can open private Studio2800 tools." : "Client access is ready for future project resources."}</p>
      </article>
      <article class="profile-card">
        <span>Account created</span>
        <strong>${escapeHtml(formatDate(user.createdAt))}</strong>
        <p>Your account can be used for future Studio2800 project workflows.</p>
      </article>
      <article class="profile-card">
        <span>Profile status</span>
        <strong>Active</strong>
        <p>Login is working and your session token is valid.</p>
      </article>
    `;
  } catch (error) {
    clearUserToken();
    setStatus(error.message);
    window.location.assign("../login/");
  }
}

logoutButtons.forEach((button) => {
  button.addEventListener("click", () => {
    clearUserToken();
    window.location.assign("../login/");
  });
});

loadAccount();
hydrateProfileLinks();
})();

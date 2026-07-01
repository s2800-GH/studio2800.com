const allowedProjects = new Set([
  "AI video production project",
  "Short-form video campaign",
  "AI explainer or product video",
  "AI video editing services",
  "AI image generation",
  "AI motion graphics and titles",
  "YouTube channel management",
  "LMS video content creation",
  "Video production system",
  "Visual showcase or lead-gen asset",
  "White-glove AI video subscription",
  "Not sure yet"
]);
const allowedTimelines = new Set(["Next 30 days", "1-3 months", "Exploring options"]);
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const publishedContent = [
  {
    title: "AI Video Content Creation",
    url: "https://studio2800.com/#showcase",
    publishedAt: "2026-06-24T00:00:00.000Z",
    description: "AI video production examples, featured video players, campaign formats, LMS content creation, and Studio2800 planning visuals.",
    author: "Studio2800"
  },
  {
    title: "The AI Media Generation System",
    url: "https://studio2800.com/#process",
    publishedAt: "2026-06-24T00:00:00.000Z",
    description: "A repeatable Studio2800 process for faster, lower-cost, brand-consistent AI video production.",
    author: "Studio2800"
  },
  {
    title: "Studio2800 AI Video Services",
    url: "https://studio2800.com/#services",
    publishedAt: "2026-06-24T00:00:00.000Z",
    description: "AI video editing, image generation, motion graphics, YouTube channel management, platform management, and white-glove AI video subscription services.",
    author: "Studio2800"
  }
];

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers }
  });
}

function xml(data, status = 200, headers = {}) {
  return new Response(data, {
    status,
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", ...headers }
  });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((value) => value.trim()).filter(Boolean);
  return allowed.includes(origin) ? {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin"
  } : {};
}

async function initializeDatabase(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      project TEXT NOT NULL,
      timeline TEXT NOT NULL,
      goal TEXT NOT NULL,
      ip_hash TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS videos (
      position INTEGER PRIMARY KEY,
      url TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      display_name TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS page_views (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      path TEXT NOT NULL,
      referrer TEXT NOT NULL,
      visitor_hash TEXT NOT NULL,
      user_agent_hash TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS site_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      path TEXT NOT NULL,
      message TEXT NOT NULL,
      detail TEXT NOT NULL
    )`)
  ]);
}

function base64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  return Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64Url(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

async function createToken(secret, payload) {
  const encodedPayload = base64Url(encoder.encode(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000, ...payload })));
  return `${encodedPayload}.${await sign(encodedPayload, secret)}`;
}

async function readTokenPayload(request, secret) {
  const token = request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") || "";
  const [payload, signature] = token.split(".");
  if (!payload || !signature || signature !== await sign(payload, secret)) return null;
  try {
    const decoded = JSON.parse(decoder.decode(fromBase64Url(payload)));
    return decoded.exp > Date.now() ? decoded : null;
  } catch {
    return null;
  }
}

async function isAuthorized(request, secret) {
  const payload = await readTokenPayload(request, secret);
  return Boolean(payload?.admin || payload?.role === "admin");
}

async function hashValue(value, secret) {
  return sign(value || "unknown", secret);
}

async function hashIp(request, secret) {
  return hashValue(request.headers.get("CF-Connecting-IP") || "unknown", secret);
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

function randomSalt() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64Url(bytes);
}

async function passwordHash(password, salt) {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 120000 },
    keyMaterial,
    256
  );
  return base64Url(new Uint8Array(bits));
}

function isSafePath(path) {
  return /^\/[a-zA-Z0-9/_#?.=&%-]*$/.test(path || "/");
}

function dateClause(range) {
  if (range === "today") return "created_at >= datetime('now', 'start of day')";
  if (range === "7d") return "created_at >= datetime('now', '-7 days')";
  if (range === "30d") return "created_at >= datetime('now', '-30 days')";
  return "1 = 1";
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function rssFeed() {
  const items = [...publishedContent]
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .map((item) => `
      <item>
        <title>${escapeXml(item.title)}</title>
        <link>${escapeXml(item.url)}</link>
        <guid>${escapeXml(item.url)}</guid>
        <pubDate>${new Date(item.publishedAt).toUTCString()}</pubDate>
        <description>${escapeXml(item.description)}</description>
        <author>studio2800@gmail.com (${escapeXml(item.author)})</author>
      </item>`).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Studio2800 AI Video Content Feed</title>
    <link>https://studio2800.com/</link>
    <description>Published Studio2800 AI video production services, systems, and showcase updates.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`;
}

async function logPageView(request, env, path, referrer = "") {
  await env.DB.prepare(`INSERT INTO page_views (created_at, path, referrer, visitor_hash, user_agent_hash)
    VALUES (?, ?, ?, ?, ?)`)
    .bind(
      new Date().toISOString(),
      clean(isSafePath(path) ? path : "/", 240),
      clean(referrer, 500),
      await hashIp(request, env.AUTH_SECRET),
      await hashValue(request.headers.get("User-Agent") || "unknown", env.AUTH_SECRET)
    )
    .run();
}

async function handleSignup(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const email = clean(body.email, 160).toLowerCase();
  const displayName = clean(body.displayName, 100);
  const password = String(body.password || "");
  if (!displayName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 10) {
    return json({ error: "Enter a name, valid email, and password with at least 10 characters." }, 400, cors);
  }

  const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
  if (existing) {
    return json({ error: "An account already exists for that email." }, 409, cors);
  }

  const now = new Date().toISOString();
  const salt = randomSalt();
  const role = email === (env.ADMIN_EMAIL || "studio2800@gmail.com").toLowerCase() ? "admin" : "user";
  const result = await env.DB.prepare(`INSERT INTO users (email, display_name, password_salt, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(email, displayName, salt, await passwordHash(password, salt), role, now, now)
    .run();

  return json({
    token: await createToken(env.AUTH_SECRET, { sub: result.meta.last_row_id, role }),
    user: { email, displayName, role }
  }, 201, cors);
}

async function handleLogin(request, env, cors) {
  const body = await request.json().catch(() => ({}));
  const email = clean(body.email, 160).toLowerCase();
  const password = String(body.password || "");
  const user = await env.DB.prepare(`SELECT id, email, display_name, password_salt, password_hash, role FROM users WHERE email = ?`)
    .bind(email)
    .first();
  if (!user || await passwordHash(password, user.password_salt) !== user.password_hash) {
    return json({ error: "Email or password did not match." }, 401, cors);
  }
  return json({
    token: await createToken(env.AUTH_SECRET, { sub: user.id, role: user.role }),
    user: { email: user.email, displayName: user.display_name, role: user.role }
  }, 200, cors);
}

async function handleMe(request, env, cors) {
  const payload = await readTokenPayload(request, env.AUTH_SECRET);
  if (!payload?.sub) {
    return json({ error: "Login required." }, 401, cors);
  }
  const user = await env.DB.prepare("SELECT email, display_name, role, created_at FROM users WHERE id = ?")
    .bind(payload.sub)
    .first();
  if (!user) {
    return json({ error: "Account was not found." }, 404, cors);
  }
  return json({
    user: {
      email: user.email,
      displayName: user.display_name,
      role: user.role,
      createdAt: user.created_at
    }
  }, 200, cors);
}

async function handleMetrics(request, env, cors) {
  if (!await isAuthorized(request, env.AUTH_SECRET)) {
    return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
  }
  const range = new URL(request.url).searchParams.get("range") || "7d";
  const clause = dateClause(range);
  const [pageViews, uniqueVisitors, newUsers, rssHits, submissions, mostViewedPages, topReferrers, recentErrors] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count FROM page_views WHERE ${clause}`).first(),
    env.DB.prepare(`SELECT COUNT(DISTINCT visitor_hash) AS count FROM page_views WHERE ${clause}`).first(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM users WHERE ${clause}`).first(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM page_views WHERE path IN ('/feed.xml', '/rss.xml') AND ${clause}`).first(),
    env.DB.prepare(`SELECT COUNT(*) AS count FROM submissions WHERE ${clause}`).first(),
    env.DB.prepare(`SELECT path, COUNT(*) AS views FROM page_views WHERE ${clause} GROUP BY path ORDER BY views DESC LIMIT 10`).all(),
    env.DB.prepare(`SELECT COALESCE(NULLIF(referrer, ''), 'Direct / unknown') AS referrer, COUNT(*) AS visits
      FROM page_views WHERE ${clause} GROUP BY COALESCE(NULLIF(referrer, ''), 'Direct / unknown') ORDER BY visits DESC LIMIT 10`).all(),
    env.DB.prepare(`SELECT created_at, path, message FROM site_errors WHERE ${clause} ORDER BY id DESC LIMIT 10`).all()
  ]);

  return json({
    totalPageViews: pageViews?.count || 0,
    uniqueVisitors: uniqueVisitors?.count || 0,
    publishedContent: publishedContent.length,
    newUsers: newUsers?.count || 0,
    rssFeedHits: rssHits?.count || 0,
    formSubmissions: submissions?.count || 0,
    mostViewedPages: mostViewedPages.results || [],
    topReferrers: topReferrers.results || [],
    recentErrors: recentErrors.results || []
  }, 200, cors);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.headers.get("Origin") && !cors["Access-Control-Allow-Origin"]) return json({ error: "Origin not allowed." }, 403);

    if (url.pathname === "/api/health" && request.method === "GET") {
      return json({ ok: true, service: "studio2800-api" }, 200, cors);
    }

    if (!env.DB || !env.ADMIN_PASSWORD || !env.AUTH_SECRET) {
      return json({ error: "Service configuration incomplete." }, 503);
    }
    try {
      await initializeDatabase(env.DB);
    } catch (error) {
      return json({ error: "Database initialization failed.", detail: clean(error?.message, 500) }, 503, cors);
    }

    if ((url.pathname === "/feed.xml" || url.pathname === "/rss.xml") && request.method === "GET") {
      await logPageView(request, env, url.pathname);
      return xml(rssFeed());
    }

    if (url.pathname === "/api/config" && request.method === "GET") {
      return json({
        ads: {
          enabled: env.GOOGLE_ADS_ENABLED === "true",
          clientId: env.GOOGLE_ADS_CLIENT_ID || "",
          slotId: env.GOOGLE_ADS_SLOT_ID || ""
        }
      }, 200, cors);
    }

    if (url.pathname === "/api/metrics/visit" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      await logPageView(request, env, clean(body.path, 240), clean(body.referrer, 500));
      return json({ ok: true }, 201, cors);
    }

    if (url.pathname === "/api/errors" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      await env.DB.prepare("INSERT INTO site_errors (created_at, path, message, detail) VALUES (?, ?, ?, ?)")
        .bind(new Date().toISOString(), clean(body.path, 240), clean(body.message, 500), clean(body.detail, 1000))
        .run();
      return json({ ok: true }, 201, cors);
    }

    if (url.pathname === "/api/submissions" && request.method === "POST") {
      const body = await request.json().catch(() => ({}));
      if (clean(body["bot-field"], 100)) return json({ ok: true }, 201, cors);
      const name = clean(body.name, 100);
      const email = clean(body.email, 160).toLowerCase();
      const project = clean(body.project, 100);
      const timeline = clean(body.timeline, 50);
      const goal = clean(body.goal, 2000);
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !goal || !allowedProjects.has(project) || !allowedTimelines.has(timeline)) {
        return json({ error: "Please complete every required field with valid information." }, 400, cors);
      }
      await env.DB.prepare(`INSERT INTO submissions (created_at, name, email, project, timeline, goal, ip_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(new Date().toISOString(), name, email, project, timeline, goal, await hashIp(request, env.AUTH_SECRET))
        .run();
      return json({ ok: true }, 201, cors);
    }

    if (url.pathname === "/api/auth/signup" && request.method === "POST") {
      return handleSignup(request, env, cors);
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      return handleLogin(request, env, cors);
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      return handleMe(request, env, cors);
    }

    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      const { password = "" } = await request.json().catch(() => ({}));
      if (password !== env.ADMIN_PASSWORD) return json({ error: "Password did not match." }, 401, cors);
      return json({ token: await createToken(env.AUTH_SECRET, { admin: true, role: "admin" }) }, 200, cors);
    }

    if (url.pathname === "/api/admin/submissions" && request.method === "GET") {
      if (!await isAuthorized(request, env.AUTH_SECRET)) return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
      const result = await env.DB.prepare(`SELECT created_at, name, email, project, timeline, goal
        FROM submissions ORDER BY id DESC LIMIT 500`).all();
      return json({ submissions: result.results || [] }, 200, cors);
    }

    if (url.pathname === "/api/admin/metrics" && request.method === "GET") {
      return handleMetrics(request, env, cors);
    }

    if (url.pathname === "/api/videos" && request.method === "GET") {
      const result = await env.DB.prepare("SELECT position, url FROM videos ORDER BY position").all();
      const urls = Array(9).fill("");
      for (const row of result.results || []) urls[row.position - 1] = row.url;
      return json({ urls }, 200, cors);
    }

    if (url.pathname === "/api/videos" && request.method === "PUT") {
      if (!await isAuthorized(request, env.AUTH_SECRET)) return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
      const { urls = [] } = await request.json().catch(() => ({}));
      if (!Array.isArray(urls) || urls.length !== 9 || urls.some((value) => clean(value, 500) && !/^https:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(clean(value, 500)))) {
        return json({ error: "Enter nine valid YouTube URLs or leave unused fields blank." }, 400, cors);
      }
      const updatedAt = new Date().toISOString();
      await env.DB.batch(urls.map((value, index) => env.DB.prepare(`INSERT INTO videos (position, url, updated_at)
        VALUES (?, ?, ?) ON CONFLICT(position) DO UPDATE SET url = excluded.url, updated_at = excluded.updated_at`)
        .bind(index + 1, clean(value, 500), updatedAt)));
      return json({ ok: true }, 200, cors);
    }

    return json({ error: "Not found." }, 404, cors);
  }
};

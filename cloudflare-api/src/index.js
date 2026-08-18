const allowedProjects = new Set([
  "Studio Central design-partner pilot",
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
      user_agent_hash TEXT NOT NULL,
      site TEXT NOT NULL DEFAULT 'studio2800.com',
      country TEXT NOT NULL DEFAULT 'Unknown',
      region TEXT NOT NULL DEFAULT 'Unknown',
      city TEXT NOT NULL DEFAULT 'Unknown'
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS site_errors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT NOT NULL,
      path TEXT NOT NULL,
      message TEXT NOT NULL,
      detail TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS site_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS api_rate_limits (
      key TEXT PRIMARY KEY,
      count INTEGER NOT NULL,
      reset_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS monthly_report_runs (
      report_month TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      sent_at TEXT,
      status TEXT NOT NULL,
      message TEXT NOT NULL,
      message_id TEXT
    )`)
  ]);
  await db.prepare(`INSERT OR IGNORE INTO site_settings (key, value, updated_at) VALUES (?, ?, ?)`)
    .bind("livestream_enabled", "false", new Date().toISOString())
    .run();
  const columns = await db.prepare("PRAGMA table_info(page_views)").all();
  const names = new Set((columns.results || []).map((column) => column.name));
  const migrations = [];
  if (!names.has("site")) migrations.push(db.prepare("ALTER TABLE page_views ADD COLUMN site TEXT NOT NULL DEFAULT 'studio2800.com'"));
  if (!names.has("country")) migrations.push(db.prepare("ALTER TABLE page_views ADD COLUMN country TEXT NOT NULL DEFAULT 'Unknown'"));
  if (!names.has("region")) migrations.push(db.prepare("ALTER TABLE page_views ADD COLUMN region TEXT NOT NULL DEFAULT 'Unknown'"));
  if (!names.has("city")) migrations.push(db.prepare("ALTER TABLE page_views ADD COLUMN city TEXT NOT NULL DEFAULT 'Unknown'"));
  if (migrations.length) await db.batch(migrations);
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

async function rateLimitResponse(request, env, cors, action, limit, windowSeconds) {
  const now = Math.floor(Date.now() / 1000);
  const resetAt = now + windowSeconds;
  const ipHash = await hashIp(request, env.AUTH_SECRET);
  const key = `${action}:${ipHash}`;
  const existing = await env.DB.prepare("SELECT count, reset_at FROM api_rate_limits WHERE key = ?")
    .bind(key)
    .first();

  if (!existing || Number(existing.reset_at) <= now) {
    await env.DB.prepare(`INSERT INTO api_rate_limits (key, count, reset_at)
      VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at`)
      .bind(key, resetAt)
      .run();
    return null;
  }

  if (Number(existing.count) >= limit) {
    return json(
      { error: "Too many requests. Please wait and try again." },
      429,
      { ...cors, "Retry-After": String(Math.max(1, Number(existing.reset_at) - now)) }
    );
  }

  await env.DB.prepare("UPDATE api_rate_limits SET count = count + 1 WHERE key = ?")
    .bind(key)
    .run();
  return null;
}

function clean(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}

async function getSiteSettings(db) {
  const result = await db.prepare("SELECT key, value FROM site_settings WHERE key = ?")
    .bind("livestream_enabled")
    .all();
  const values = Object.fromEntries((result.results || []).map((row) => [row.key, row.value]));
  return {
    livestreamEnabled: values.livestream_enabled === "true"
  };
}

async function saveSiteSettings(db, settings) {
  const updatedAt = new Date().toISOString();
  await db.prepare(`INSERT INTO site_settings (key, value, updated_at)
    VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
    .bind("livestream_enabled", settings.livestreamEnabled ? "true" : "false", updatedAt)
    .run();
  return { livestreamEnabled: Boolean(settings.livestreamEnabled), updatedAt };
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

function escapeHtml(value) {
  return escapeXml(value).replaceAll("'", "&#39;");
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
        <author>${escapeXml(item.author)}</author>
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
  const geo = request.cf || {};
  let site = "studio2800.com";
  try {
    const originHost = new URL(request.headers.get("Origin") || "https://studio2800.com").hostname.replace(/^www\./, "");
    if (originHost === "studio2800news.com") site = "studio2800news.com";
  } catch {}

  await env.DB.prepare(`INSERT INTO page_views (created_at, path, referrer, visitor_hash, user_agent_hash, site, country, region, city)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      new Date().toISOString(),
      clean(isSafePath(path) ? path : "/", 240),
      clean(referrer, 500),
      await hashIp(request, env.AUTH_SECRET),
      await hashValue(request.headers.get("User-Agent") || "unknown", env.AUTH_SECRET),
      site,
      clean(geo.country || "Unknown", 80),
      clean(geo.region || "Unknown", 120),
      clean(geo.city || "Unknown", 120)
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
  const role = "user";
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

function revenueEstimate(pageViews, env) {
  const rpm = Number(env.ADS_ESTIMATED_RPM || 0);
  return Math.max(0, pageViews || 0) / 1000 * (Number.isFinite(rpm) ? rpm : 0);
}

async function siteMetrics(env, site, clause) {
  const siteClause = `${clause} AND site = ?`;
  const [pageViews, uniqueVisitors, topRegions, topPages, topReferrers] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS count FROM page_views WHERE ${siteClause}`).bind(site).first(),
    env.DB.prepare(`SELECT COUNT(DISTINCT visitor_hash) AS count FROM page_views WHERE ${siteClause}`).bind(site).first(),
    env.DB.prepare(`SELECT country, region, city, COUNT(*) AS views FROM page_views WHERE ${siteClause}
      GROUP BY country, region, city ORDER BY views DESC LIMIT 8`).bind(site).all(),
    env.DB.prepare(`SELECT path, COUNT(*) AS views FROM page_views WHERE ${siteClause}
      GROUP BY path ORDER BY views DESC LIMIT 6`).bind(site).all(),
    env.DB.prepare(`SELECT COALESCE(NULLIF(referrer, ''), 'Direct / unknown') AS referrer, COUNT(*) AS visits FROM page_views WHERE ${siteClause}
      GROUP BY COALESCE(NULLIF(referrer, ''), 'Direct / unknown') ORDER BY visits DESC LIMIT 6`).bind(site).all()
  ]);
  const views = pageViews?.count || 0;
  return {
    site,
    label: site === "studio2800news.com" ? "Studio2800News / AIVN" : "Studio2800",
    url: `https://${site}/`,
    totalPageViews: views,
    uniqueVisitors: uniqueVisitors?.count || 0,
    estimatedAdRevenue: Number(revenueEstimate(views, env).toFixed(2)),
    revenueStatus: env.GOOGLE_ADS_ENABLED === "true" ? "Estimate based on configured RPM" : "Pending AdSense/ads enablement",
    topRegions: topRegions.results || [],
    topPages: topPages.results || [],
    topReferrers: topReferrers.results || [],
    dataStatus: views ? "active" : "pending"
  };
}

async function handleNetworkDashboard(request, env, cors) {
  if (!await isAuthorized(request, env.AUTH_SECRET)) {
    return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
  }
  const range = new URL(request.url).searchParams.get("range") || "7d";
  const clause = dateClause(range);
  const sites = await Promise.all([
    siteMetrics(env, "studio2800.com", clause),
    siteMetrics(env, "studio2800news.com", clause)
  ]);
  return json({
    range,
    ads: {
      enabled: env.GOOGLE_ADS_ENABLED === "true",
      estimatedRpm: Number(env.ADS_ESTIMATED_RPM || 0),
      currency: "USD",
      note: "Revenue is an estimate until AdSense/ads reporting is connected."
    },
    sites,
    totals: {
      pageViews: sites.reduce((sum, site) => sum + site.totalPageViews, 0),
      uniqueVisitors: sites.reduce((sum, site) => sum + site.uniqueVisitors, 0),
      estimatedAdRevenue: Number(sites.reduce((sum, site) => sum + site.estimatedAdRevenue, 0).toFixed(2))
    }
  }, 200, cors);
}

function localTimeParts(date, timeZone = "America/Detroit") {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(date).map((part) => [part.type, part.value]));
  const localDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day || 0)));
  return {
    year: parts.year,
    month: parts.month,
    day: Number(parts.day || 0),
    weekday: localDate.getUTCDay(),
    hour: Number(parts.hour === "24" ? "0" : parts.hour || 0),
    minute: Number(parts.minute || 0)
  };
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function reportMonthKey(date, timeZone = "America/Detroit") {
  const parts = localTimeParts(date, timeZone);
  return `${parts.year}-${parts.month}`;
}

function reportWeekKey(date, timeZone = "America/Detroit") {
  const parts = localTimeParts(date, timeZone);
  const localDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, parts.day));
  const daysSinceMonday = (localDate.getUTCDay() + 6) % 7;
  const monday = new Date(localDate);
  monday.setUTCDate(localDate.getUTCDate() - daysSinceMonday);
  return `week-${monday.getUTCFullYear()}-${pad2(monday.getUTCMonth() + 1)}-${pad2(monday.getUTCDate())}`;
}

function reportPeriodKey(date, timeZone = "America/Detroit", frequency = "monthly") {
  return frequency === "weekly" ? reportWeekKey(date, timeZone) : reportMonthKey(date, timeZone);
}

function reportSchedule(env, now, options = {}) {
  const timeZone = env.REPORT_TIME_ZONE || "America/Detroit";
  const frequency = clean(env.REPORT_FREQUENCY || "monthly", 24).toLowerCase() === "weekly" ? "weekly" : "monthly";
  const parts = localTimeParts(now, timeZone);
  const sendHour = Number(env.REPORT_SEND_HOUR || 9);
  const legacyPeriod = options.reportMonth;
  const reportPeriod = options.reportPeriod || legacyPeriod || reportPeriodKey(now, timeZone, frequency);

  if (frequency === "weekly") {
    const sendWeekday = Number(env.REPORT_SEND_WEEKDAY || 1);
    return {
      frequency,
      label: "Weekly",
      reportPeriod,
      shouldSend: parts.weekday === sendWeekday && parts.hour >= sendHour,
      alreadySentMessage: "Weekly report already sent."
    };
  }

  const sendDay = Number(env.REPORT_SEND_DAY || 15);
  return {
    frequency,
    label: "Monthly",
    reportPeriod,
    shouldSend: parts.day === sendDay && parts.hour >= sendHour,
    alreadySentMessage: "Monthly report already sent."
  };
}

function compactNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function normalizeResults(result) {
  return result?.results || [];
}

async function trafficReportData(env) {
  const [totals, last30, last7, submissions, daily, topPaths, sourceGroups, topRegions] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) AS pageViews, COUNT(DISTINCT visitor_hash) AS uniqueVisitors,
      MIN(created_at) AS firstSeen, MAX(created_at) AS lastSeen FROM page_views`).first(),
    env.DB.prepare(`SELECT COUNT(*) AS pageViews, COUNT(DISTINCT visitor_hash) AS uniqueVisitors
      FROM page_views WHERE created_at >= datetime('now', '-30 days')`).first(),
    env.DB.prepare(`SELECT COUNT(*) AS pageViews, COUNT(DISTINCT visitor_hash) AS uniqueVisitors
      FROM page_views WHERE created_at >= datetime('now', '-7 days')`).first(),
    env.DB.prepare(`SELECT COUNT(*) AS submissions, MIN(created_at) AS firstSubmission, MAX(created_at) AS lastSubmission
      FROM submissions`).first(),
    env.DB.prepare(`SELECT date(created_at) AS day, COUNT(*) AS pageViews, COUNT(DISTINCT visitor_hash) AS uniqueVisitors
      FROM page_views WHERE created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at) ORDER BY day ASC`).all(),
    env.DB.prepare(`SELECT path, COUNT(*) AS views FROM page_views
      GROUP BY path ORDER BY views DESC LIMIT 10`).all(),
    env.DB.prepare(`SELECT
      CASE
        WHEN referrer = '' THEN 'Direct / unknown'
        WHEN referrer LIKE '%studio2800news.com%' THEN 'Studio2800News'
        WHEN referrer LIKE '%google.%' OR referrer LIKE '%bing.com%' THEN 'Search'
        WHEN referrer LIKE '%studio2800.com%' THEN 'Internal site navigation'
        ELSE 'Other external'
      END AS source,
      COUNT(*) AS visits
      FROM page_views GROUP BY source ORDER BY visits DESC`).all(),
    env.DB.prepare(`SELECT
      CASE
        WHEN country = 'Unknown' THEN 'Unknown location'
        WHEN country = 'US' AND region = 'Michigan' THEN 'Michigan, US'
        WHEN country = 'US' THEN region || ', US'
        WHEN country = 'CA' THEN 'Canada'
        ELSE country
      END AS regionGroup,
      COUNT(*) AS views,
      COUNT(DISTINCT visitor_hash) AS uniqueVisitors
      FROM page_views GROUP BY regionGroup ORDER BY views DESC LIMIT 10`).all()
  ]);

  const pageViews = Number(totals?.pageViews || 0);
  const uniqueVisitors = Number(totals?.uniqueVisitors || 0);
  return {
    generatedAt: new Date().toISOString(),
    trackingWindow: {
      firstSeen: totals?.firstSeen || null,
      lastSeen: totals?.lastSeen || null
    },
    totals: {
      pageViews,
      uniqueVisitors,
      last30PageViews: Number(last30?.pageViews || 0),
      last30UniqueVisitors: Number(last30?.uniqueVisitors || 0),
      last7PageViews: Number(last7?.pageViews || 0),
      last7UniqueVisitors: Number(last7?.uniqueVisitors || 0),
      formSubmissions: Number(submissions?.submissions || 0),
      inquiryRate: uniqueVisitors ? Number((Number(submissions?.submissions || 0) / uniqueVisitors * 100).toFixed(1)) : 0
    },
    daily: normalizeResults(daily),
    topPaths: normalizeResults(topPaths),
    sources: normalizeResults(sourceGroups),
    regions: normalizeResults(topRegions)
  };
}

function buildReportSvg(data, reportLabel = "Monthly") {
  const sources = data.sources.slice(0, 4);
  const regions = data.regions.slice(0, 4);
  const daily = data.daily.slice(-16);
  const maxSource = Math.max(1, ...sources.map((row) => Number(row.visits || 0)));
  const maxRegion = Math.max(1, ...regions.map((row) => Number(row.views || 0)));
  const maxDaily = Math.max(1, ...daily.map((row) => Number(row.pageViews || 0)));
  const bar = (value, max, width) => Math.max(8, Math.round(Number(value || 0) / max * width));
  const sourceRows = sources.map((row, index) => {
    const y = 492 + index * 44;
    const color = ["#00b8c8", "#ff6a00", "#5c934e", "#f2a02d"][index] || "#00b8c8";
    const width = bar(row.visits, maxSource, 326);
    return `<text class="bar-label" x="92" y="${y + 20}">${escapeXml(row.source)}</text>
      <rect x="294" y="${y}" width="326" height="28" rx="8" fill="#edf8fb"/>
      <rect x="294" y="${y}" width="${width}" height="28" rx="8" fill="${color}"/>
      <text class="bar-value" x="${294 + width + 14}" y="${y + 20}">${compactNumber(row.visits)}</text>`;
  }).join("");
  const regionRows = regions.map((row, index) => {
    const y = 492 + index * 44;
    const color = ["#b9d6df", "#00b8c8", "#ff6a00", "#5c934e"][index] || "#00b8c8";
    const width = bar(row.views, maxRegion, 340);
    return `<text class="bar-label" x="748" y="${y + 20}">${escapeXml(row.regionGroup)}</text>
      <rect x="954" y="${y}" width="340" height="28" rx="8" fill="#edf8fb"/>
      <rect x="954" y="${y}" width="${width}" height="28" rx="8" fill="${color}"/>
      <text class="bar-value" x="${954 + width + 14}" y="${y + 20}">${compactNumber(row.views)}</text>`;
  }).join("");
  const dailyRows = daily.map((row, index) => {
    const x = 324 + index * 58;
    const height = bar(row.pageViews, maxDaily, 90);
    const y = 826 - height;
    const dayLabel = String(row.day || "").slice(5).replace("-", "/");
    const color = Number(row.pageViews || 0) >= maxDaily ? "#ff6a00" : "#00b8c8";
    return `<rect x="${x}" y="${y}" width="32" height="${height}" fill="${color}"/>
      <text class="tiny" x="${x + 16}" y="${y - 8}" text-anchor="middle">${compactNumber(row.pageViews)}</text>
      <text class="tiny" x="${x + 16}" y="849" text-anchor="middle">${escapeXml(dayLabel)}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="920" viewBox="0 0 1400 920">
    <style>
      .bg{fill:#f8fbff}.panel{fill:#fff;stroke:#a9dde4;stroke-width:1.5}.dark{fill:#06111b}
      text{font-family:Helvetica,Arial,sans-serif}.title{font-size:56px;font-weight:700;fill:#f8fbff}.subtitle{font-size:24px;fill:#b9d6df}
      .section{font-size:28px;font-weight:700;fill:#07111f}.small{font-size:16px;fill:#506274}.metric{font-size:48px;font-weight:700;fill:#07111f}
      .metric-label{font-size:18px;fill:#506274}.bar-label{font-size:17px;fill:#07111f}.bar-value{font-size:17px;font-weight:700;fill:#07111f}.tiny{font-size:13px;fill:#506274}.footer{font-size:16px;fill:#b9d6df}
    </style>
    <rect class="bg" width="1400" height="920"/>
    <rect class="dark" x="28" y="24" width="1344" height="154" rx="22"/>
    <text class="title" x="64" y="100">STUDIO<tspan fill="#ff6a00">2800</tspan></text>
    <text class="subtitle" x="66" y="138">${escapeXml(reportLabel)} traffic report - studio2800.com</text>
    <rect x="1012" y="50" width="310" height="86" rx="15" fill="none" stroke="#00e0f0" stroke-width="2"/>
    <text class="subtitle" x="1042" y="90" fill="#00e0f0">TRACKING WINDOW</text>
    <text class="footer" x="1042" y="122">${escapeXml((data.trackingWindow.firstSeen || "").slice(0, 10))} to ${escapeXml((data.trackingWindow.lastSeen || "").slice(0, 10))}</text>
    <line x1="64" y1="166" x2="520" y2="166" stroke="#ff6a00" stroke-width="4"/><line x1="520" y1="166" x2="1322" y2="166" stroke="#00e0f0" stroke-width="3"/>
    ${[
      [64, data.totals.pageViews, "total page views", "#ff6a00"],
      [384, data.totals.uniqueVisitors, "unique visitors", "#00b8c8"],
      [704, data.totals.last7PageViews, "views in last 7 days", "#5c934e"],
      [1024, data.totals.formSubmissions, "form submissions", "#ff6a00"]
    ].map(([x, value, label, color]) => `<rect class="panel" x="${x}" y="220" width="288" height="130" rx="12"/><rect x="${x}" y="220" width="10" height="130" fill="${color}"/><text class="metric" x="${x + 26}" y="284">${compactNumber(value)}</text><text class="metric-label" x="${x + 28}" y="328">${escapeXml(label)}</text>`).join("")}
    <rect class="panel" x="64" y="390" width="620" height="282" rx="14"/><text class="section" x="92" y="444">Traffic Sources</text><text class="small" x="92" y="470">Grouped from stored referrer data.</text>${sourceRows}
    <rect class="panel" x="720" y="390" width="616" height="282" rx="14"/><text class="section" x="748" y="444">Location Breakdown</text><text class="small" x="748" y="470">Cloudflare geolocation where available.</text>${regionRows}
    <rect class="panel" x="64" y="708" width="1272" height="150" rx="14"/><text class="section" x="92" y="762">Daily Page Views</text><text class="small" x="92" y="786">Recent tracking period.</text><line x1="324" y1="826" x2="1294" y2="826" stroke="#c8e8ed"/>${dailyRows}
    <rect x="28" y="884" width="1344" height="24" rx="10" fill="#06111b"/><text class="footer" x="64" y="902">Source: Studio2800 Cloudflare D1 page_views and submissions tables.</text><text class="footer" x="1090" y="902" fill="#ff6a00">Generated ${escapeXml(data.generatedAt.slice(0, 10))}</text>
  </svg>`;
}

function buildMetricCard(label, value) {
  return `<td style="border-left:8px solid #ff6a00;border-radius:8px;border:1px solid #a9dde4;padding:18px 20px;background:#ffffff;">
    <div style="font-size:34px;font-weight:800;color:#07111f;line-height:1;">${escapeXml(compactNumber(value))}</div>
    <div style="font-size:14px;color:#506274;margin-top:10px;">${escapeXml(label)}</div>
  </td>`;
}

function buildEmailBarRow(label, value, max, color = "#00b8c8") {
  const width = Math.max(3, Math.round(Number(value || 0) / Math.max(1, max) * 100));
  return `<tr>
    <td style="font-size:14px;color:#07111f;padding:8px 10px 8px 0;width:180px;">${escapeXml(label)}</td>
    <td style="padding:8px 0;"><div style="background:#edf8fb;border-radius:8px;height:18px;"><div style="width:${width}%;height:18px;border-radius:8px;background:${color};"></div></div></td>
    <td style="font-size:14px;font-weight:700;color:#07111f;padding-left:10px;width:50px;">${escapeXml(compactNumber(value))}</td>
  </tr>`;
}

function buildReportEmail(data, reportLabel = "Monthly") {
  const sourceMax = Math.max(1, ...data.sources.map((row) => Number(row.visits || 0)));
  const regionMax = Math.max(1, ...data.regions.map((row) => Number(row.views || 0)));
  const topSource = data.sources[0]?.source || "No source data";
  const svg = buildReportSvg(data, reportLabel);
  const reportLabelLower = reportLabel.toLowerCase();
  const html = `<!doctype html><html><body style="margin:0;background:#f8fbff;font-family:Helvetica,Arial,sans-serif;color:#07111f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbff;padding:24px;"><tr><td align="center">
      <table role="presentation" width="760" cellpadding="0" cellspacing="0" style="width:760px;max-width:100%;">
        <tr><td style="background:#06111b;border-radius:18px;padding:28px 32px;border-bottom:4px solid #00e0f0;">
          <div style="font-size:42px;font-weight:800;color:#f8fbff;letter-spacing:1px;">STUDIO<span style="color:#ff6a00;">2800</span></div>
          <div style="font-size:18px;color:#b9d6df;margin-top:6px;">${escapeXml(reportLabel)} website traffic report</div>
        </td></tr>
        <tr><td style="padding:24px 0 8px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="12"><tr>
            ${buildMetricCard("total page views", data.totals.pageViews)}
            ${buildMetricCard("unique visitors", data.totals.uniqueVisitors)}
          </tr><tr>
            ${buildMetricCard("last 7 days views", data.totals.last7PageViews)}
            ${buildMetricCard("form submissions", data.totals.formSubmissions)}
          </tr></table>
        </td></tr>
        <tr><td style="background:#ffffff;border:1px solid #a9dde4;border-radius:12px;padding:22px;margin-top:12px;">
          <h2 style="margin:0 0 8px;font-size:24px;">Summary</h2>
          <p style="font-size:16px;line-height:1.5;color:#506274;margin:0;">${compactNumber(data.totals.pageViews)} page views, ${compactNumber(data.totals.uniqueVisitors)} unique visitors, and ${compactNumber(data.totals.formSubmissions)} inquiries. Inquiry rate is ${data.totals.inquiryRate}%. Top source: ${escapeXml(topSource)}.</p>
        </td></tr>
        <tr><td style="padding-top:18px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="background:#ffffff;border:1px solid #a9dde4;border-radius:12px;padding:20px;width:50%;vertical-align:top;">
              <h3 style="font-size:20px;margin:0 0 10px;">Traffic sources</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${data.sources.slice(0, 5).map((row, index) => buildEmailBarRow(row.source, row.visits, sourceMax, ["#00b8c8", "#ff6a00", "#5c934e", "#f2a02d", "#b9d6df"][index])).join("")}</table>
            </td>
            <td style="width:16px;"></td>
            <td style="background:#ffffff;border:1px solid #a9dde4;border-radius:12px;padding:20px;width:50%;vertical-align:top;">
              <h3 style="font-size:20px;margin:0 0 10px;">Locations</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${data.regions.slice(0, 5).map((row, index) => buildEmailBarRow(row.regionGroup, row.views, regionMax, ["#b9d6df", "#00b8c8", "#ff6a00", "#5c934e", "#f2a02d"][index])).join("")}</table>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="font-size:13px;color:#506274;padding:18px 4px;">Source: Studio2800 Cloudflare D1 tracker. SVG graphic is attached for reference.</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
  const text = `Studio2800 ${reportLabelLower} traffic report

Total page views: ${compactNumber(data.totals.pageViews)}
Unique visitors: ${compactNumber(data.totals.uniqueVisitors)}
Last 30 days views: ${compactNumber(data.totals.last30PageViews)}
Last 7 days views: ${compactNumber(data.totals.last7PageViews)}
Form submissions: ${compactNumber(data.totals.formSubmissions)}
Inquiry rate: ${data.totals.inquiryRate}%
Top source: ${topSource}

Source: Studio2800 Cloudflare D1 tracker.`;
  return { html, text, svg };
}

function emailConfig(env) {
  return {
    to: clean(env.LEAD_TO_EMAIL || env.REPORT_TO_EMAIL, 240),
    from: clean(env.LEAD_FROM_EMAIL || env.REPORT_FROM_EMAIL, 240)
  };
}

function buildLeadNotificationEmail(lead) {
  const adminUrl = "https://studio2800.com/admin.html";
  const rows = [
    ["Name", lead.name],
    ["Email", lead.email],
    ["Video need", lead.project],
    ["Timeline", lead.timeline],
    ["Submitted", lead.createdAt]
  ];
  const subjectDetail = lead.project || "video inquiry";
  const text = [
    `New Studio2800 ${subjectDetail}`,
    "",
    `Name: ${lead.name}`,
    `Email: ${lead.email}`,
    `Video need: ${lead.project}`,
    `Timeline: ${lead.timeline}`,
    `Submitted: ${lead.createdAt}`,
    "",
    "Project goal:",
    lead.goal,
    "",
    `Admin dashboard: ${adminUrl}`
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#f8fbff;color:#07111f;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fbff;padding:26px 12px;">
      <tr><td align="center">
        <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="width:720px;max-width:100%;font-family:Arial,Helvetica,sans-serif;border-collapse:collapse;">
          <tr><td style="background:#06111b;border-radius:18px 18px 0 0;padding:26px 30px;border-bottom:4px solid #ff6a00;">
            <div style="font-size:40px;line-height:1;font-weight:900;letter-spacing:1px;color:#f8fbff;">STUDIO<span style="color:#ff6a00;">2800</span></div>
            <div style="margin-top:8px;color:#00e0f0;font-size:13px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;">New AI video inquiry</div>
          </td></tr>
          <tr><td style="background:#ffffff;border:1px solid #a9dde4;border-top:0;border-radius:0 0 18px 18px;padding:28px 30px;box-shadow:0 18px 42px rgba(6,17,27,.10);">
            <h1 style="margin:0 0 10px;font-size:31px;line-height:1.05;color:#07111f;font-weight:900;">New project request received.</h1>
            <p style="margin:0 0 22px;font-size:16px;line-height:1.5;color:#506274;">A visitor submitted the Studio2800 contact form. The lead details are below.</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border:1px solid #a9dde4;border-radius:10px;overflow:hidden;">
              ${rows.map(([label, value], index) => `
                <tr>
                  <th style="width:33%;text-align:left;padding:12px 14px;border-bottom:${index === rows.length - 1 ? "0" : "1px solid #d4edf1"};background:#edf8fb;color:#006b78;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(label)}</th>
                  <td style="padding:12px 14px;border-bottom:${index === rows.length - 1 ? "0" : "1px solid #d4edf1"};color:#07111f;font-size:14px;font-weight:700;">${escapeHtml(value || "Not provided")}</td>
                </tr>`).join("")}
            </table>
            <h2 style="margin:24px 0 10px;font-size:20px;color:#07111f;">Project goal</h2>
            <div style="white-space:pre-wrap;padding:16px;border-left:6px solid #ff6a00;border-radius:10px;background:#fff7f0;color:#07111f;font-size:15px;line-height:1.55;">${escapeHtml(lead.goal)}</div>
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;border-collapse:collapse;">
              <tr><td><a href="${adminUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#ff6a00;color:#ffffff;text-decoration:none;border-radius:8px;padding:13px 18px;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:.04em;">Open admin dashboard</a></td></tr>
            </table>
            <p style="margin:18px 0 0;color:#506274;font-size:13px;line-height:1.5;">If the button does not open, use this link: <a href="${adminUrl}" style="color:#008a99;font-weight:800;">${adminUrl}</a></p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body></html>`;
  return { html, text };
}

async function recordSiteError(env, path, message, detail = "") {
  try {
    await env.DB.prepare("INSERT INTO site_errors (created_at, path, message, detail) VALUES (?, ?, ?, ?)")
      .bind(new Date().toISOString(), clean(path, 240), clean(message, 500), clean(detail, 1000))
      .run();
  } catch {}
}

function emailProvider(env) {
  const provider = clean(env.EMAIL_PROVIDER || "auto", 40).toLowerCase();
  if ((provider === "resend" || provider === "auto") && env.RESEND_API_KEY) return "resend";
  if ((provider === "cloudflare" || provider === "auto") && env.EMAIL) return "cloudflare";
  return provider === "resend" ? "resend-missing" : "none";
}

function resendAttachments(attachments = []) {
  return attachments
    .map((attachment) => ({
      filename: clean(attachment.filename || attachment.name, 180),
      content: attachment.content || ""
    }))
    .filter((attachment) => attachment.filename && attachment.content);
}

async function sendWithResend(env, message) {
  const payload = {
    from: message.from,
    to: Array.isArray(message.to) ? message.to : [message.to],
    subject: message.subject,
    html: message.html,
    text: message.text
  };
  const attachments = resendAttachments(message.attachments);
  if (attachments.length) payload.attachments = attachments;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = data?.message || data?.error || JSON.stringify(data || {});
    throw new Error(`Resend email error ${response.status}: ${clean(detail, 260)}`);
  }
  return { messageId: data?.id || "" };
}

async function sendTransactionalEmail(env, message) {
  const provider = emailProvider(env);
  if (provider === "resend") {
    const response = await sendWithResend(env, message);
    return { sent: true, provider, messageId: response.messageId || "" };
  }
  if (provider === "cloudflare") {
    const response = await env.EMAIL.send(message);
    return { sent: true, provider, messageId: response?.messageId || "" };
  }
  if (provider === "resend-missing") {
    throw new Error("EMAIL_PROVIDER is set to Resend but RESEND_API_KEY is missing.");
  }
  throw new Error("Email provider configuration is missing. Add RESEND_API_KEY or enable Cloudflare Email Sending.");
}

async function sendLeadNotificationEmail(env, lead) {
  const { to, from } = emailConfig(env);
  if (!to || !from) {
    return { sent: false, status: "blocked", message: "Lead email recipient or sender configuration is missing." };
  }
  const email = buildLeadNotificationEmail(lead);
  const subject = `Studio2800 inquiry: ${clean(lead.project, 90) || "New video request"}`;
  try {
    const response = await sendTransactionalEmail(env, { to, from, subject, html: email.html, text: email.text });
    return { sent: true, status: "sent", message: `Lead notification email sent through ${response.provider}.`, messageId: response.messageId || "" };
  } catch (error) {
    return { sent: false, status: "failed", message: clean(error?.message || "Unknown email send error.", 450) };
  }
}

function smsEnabled(env) {
  return clean(env.SMS_ENABLED, 12).toLowerCase() === "true";
}

function smsConfig(env) {
  const provider = clean(env.SMS_PROVIDER || "twilio", 40).toLowerCase();
  return {
    provider,
    accountSid: clean(env.TWILIO_ACCOUNT_SID, 140),
    authToken: clean(env.TWILIO_AUTH_TOKEN, 240),
    from: clean(env.TWILIO_FROM_NUMBER, 40),
    to: clean(env.SMS_TO_NUMBER, 40)
  };
}

async function sendSmsMessage(env, body) {
  if (!smsEnabled(env)) {
    return { sent: false, status: "disabled", provider: "none", message: "SMS notifications are disabled." };
  }
  const config = smsConfig(env);
  if (config.provider !== "twilio") {
    return { sent: false, status: "blocked", provider: config.provider, message: "Configured SMS provider is not supported." };
  }
  if (!config.accountSid || !config.authToken || !config.from || !config.to) {
    return { sent: false, status: "blocked", provider: config.provider, message: "Twilio SMS secrets are incomplete." };
  }

  const payload = new URLSearchParams({
    From: config.from,
    To: config.to,
    Body: clean(body, 1500)
  });

  try {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(config.accountSid)}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${config.accountSid}:${config.authToken}`)}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: payload.toString()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = data?.message || data?.error_message || JSON.stringify(data || {});
      return { sent: false, status: "failed", provider: config.provider, message: `Twilio SMS error ${response.status}: ${clean(detail, 260)}` };
    }
    return { sent: true, status: "sent", provider: config.provider, message: "SMS alert sent through Twilio.", messageId: clean(data?.sid, 180) };
  } catch (error) {
    return { sent: false, status: "failed", provider: config.provider, message: clean(error?.message || "Unknown SMS send error.", 450) };
  }
}

function pushEnabled(env) {
  return clean(env.PUSH_ENABLED, 12).toLowerCase() === "true";
}

function pushFallbackEnabled(env) {
  return clean(env.PUSH_ON_SMS_FAILURE || "true", 12).toLowerCase() !== "false";
}

function pushConfig(env) {
  const provider = clean(env.PUSH_PROVIDER || "pushover", 40).toLowerCase();
  return {
    provider,
    appToken: clean(env.PUSHOVER_APP_TOKEN, 240),
    userKey: clean(env.PUSHOVER_USER_KEY, 240)
  };
}

function notificationStatus(env) {
  const sms = smsConfig(env);
  const push = pushConfig(env);
  const smsMissing = [];
  const pushMissing = [];

  if (sms.provider === "twilio" && smsEnabled(env)) {
    if (!sms.accountSid) smsMissing.push("TWILIO_ACCOUNT_SID");
    if (!sms.authToken) smsMissing.push("TWILIO_AUTH_TOKEN");
    if (!sms.from) smsMissing.push("TWILIO_FROM_NUMBER");
    if (!sms.to) smsMissing.push("SMS_TO_NUMBER");
  }

  if (push.provider === "pushover" && pushEnabled(env)) {
    if (!push.appToken) pushMissing.push("PUSHOVER_APP_TOKEN");
    if (!push.userKey) pushMissing.push("PUSHOVER_USER_KEY");
  }

  const smsSupported = sms.provider === "twilio";
  const pushSupported = push.provider === "pushover";
  const smsReady = smsEnabled(env) && smsSupported && smsMissing.length === 0;
  const pushReady = pushEnabled(env) && pushSupported && pushMissing.length === 0;
  const fallbackReady = pushFallbackEnabled(env) && pushReady;

  return {
    generatedAt: new Date().toISOString(),
    sms: {
      provider: sms.provider || "none",
      enabled: smsEnabled(env),
      supported: smsSupported,
      configured: smsReady,
      status: !smsEnabled(env) ? "disabled" : smsSupported && smsMissing.length === 0 ? "ready" : "blocked",
      missing: smsMissing,
      note: smsReady
        ? "Twilio SMS can send lead and report alerts."
        : "Twilio SMS is not ready until sender and destination phone secrets are set."
    },
    push: {
      provider: push.provider || "none",
      enabled: pushEnabled(env),
      supported: pushSupported,
      configured: pushReady,
      status: !pushEnabled(env) ? "disabled" : pushSupported && pushMissing.length === 0 ? "ready" : "blocked",
      missing: pushMissing,
      note: pushReady
        ? "App push backup can send through Pushover."
        : "App push backup is not ready until Pushover app token and user key secrets are set."
    },
    fallback: {
      enabled: pushFallbackEnabled(env),
      configured: fallbackReady,
      status: !pushFallbackEnabled(env) ? "disabled" : fallbackReady ? "ready" : "blocked",
      activeWhen: "Runs automatically when Twilio SMS is disabled, blocked, or fails.",
      twilioExpirationBehavior: fallbackReady
        ? "If Twilio expires or returns an API error, the Worker sends the app push backup."
        : "If Twilio expires today, the backup path will not send until Pushover secrets are configured."
    }
  };
}

async function sendPushMessage(env, options = {}) {
  if (!pushEnabled(env)) {
    return { sent: false, status: "disabled", provider: "none", message: "App push notifications are disabled." };
  }
  const config = pushConfig(env);
  if (config.provider !== "pushover") {
    return { sent: false, status: "blocked", provider: config.provider, message: "Configured app push provider is not supported." };
  }
  if (!config.appToken || !config.userKey) {
    return { sent: false, status: "blocked", provider: config.provider, message: "Pushover app push secrets are incomplete." };
  }

  const payload = new URLSearchParams({
    token: config.appToken,
    user: config.userKey,
    title: clean(options.title || "Studio2800 alert", 250),
    message: clean(options.message || "", 1024)
  });
  const clickUrl = clean(options.url || "", 512);
  const urlTitle = clean(options.urlTitle || "", 100);
  if (clickUrl) payload.set("url", clickUrl);
  if (urlTitle) payload.set("url_title", urlTitle);
  if (options.priority != null) payload.set("priority", clean(options.priority, 10));

  try {
    const response = await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: payload.toString()
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.status === 0) {
      const detail = Array.isArray(data?.errors) ? data.errors.join("; ") : data?.error || JSON.stringify(data || {});
      return { sent: false, status: "failed", provider: config.provider, message: `Pushover error ${response.status}: ${clean(detail, 260)}` };
    }
    return { sent: true, status: "sent", provider: config.provider, message: "App push alert sent through Pushover.", messageId: clean(data?.request, 180) };
  } catch (error) {
    return { sent: false, status: "failed", provider: config.provider, message: clean(error?.message || "Unknown app push send error.", 450) };
  }
}

async function sendPushFallbackAfterSms(env, smsResult, options = {}) {
  if (smsResult?.sent) {
    return { sent: false, status: "skipped", provider: "pushover", message: "SMS sent; app push fallback skipped." };
  }
  if (!pushFallbackEnabled(env)) {
    return { sent: false, status: "disabled", provider: "pushover", message: "App push fallback is disabled." };
  }
  return sendPushMessage(env, options);
}

async function sendLeadSmsAlert(env, lead) {
  const body = [
    `Studio2800 lead: ${clean(lead.name, 80) || "New inquiry"}`,
    `Project: ${clean(lead.project, 100) || "Not specified"}`,
    `Timeline: ${clean(lead.timeline, 60) || "Not specified"}`,
    "Open Admin for details: https://studio2800.com/admin"
  ].join("\n");
  return sendSmsMessage(env, body);
}

async function sendLeadPushFallback(env, lead, smsResult) {
  return sendPushFallbackAfterSms(env, smsResult, {
    title: `Studio2800 lead: ${clean(lead.name, 80) || "New inquiry"}`,
    message: [
      `Project: ${clean(lead.project, 100) || "Not specified"}`,
      `Timeline: ${clean(lead.timeline, 60) || "Not specified"}`,
      `Goal: ${clean(lead.goal, 700) || "Open admin for details."}`
    ].join("\n"),
    url: "https://studio2800.com/admin",
    urlTitle: "Open Studio2800 Admin",
    priority: 1
  });
}

async function sendTrafficReportSms(env, data, reportPeriod, reportLabel = "Weekly") {
  const totals = data?.totals || {};
  const body = [
    `Studio2800 ${reportLabel.toLowerCase()} report ${reportPeriod}`,
    `${totals.pageViews || 0} views, ${totals.uniqueVisitors || 0} unique visitors, ${totals.formSubmissions || 0} forms.`,
    `Inquiry rate: ${totals.inquiryRate || 0}%.`
  ].join("\n");
  return sendSmsMessage(env, body);
}

async function sendTrafficReportPushFallback(env, data, reportPeriod, reportLabel, smsResult) {
  const totals = data?.totals || {};
  return sendPushFallbackAfterSms(env, smsResult, {
    title: `Studio2800 ${reportLabel.toLowerCase()} report`,
    message: [
      `${reportPeriod}`,
      `${totals.pageViews || 0} views`,
      `${totals.uniqueVisitors || 0} unique visitors`,
      `${totals.formSubmissions || 0} forms`,
      `Inquiry rate: ${totals.inquiryRate || 0}%`
    ].join("\n"),
    url: "https://studio2800.com/admin/metrics/",
    urlTitle: "Open Metrics"
  });
}

function base64Encode(value) {
  const bytes = encoder.encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(index, index + 0x8000));
  }
  return btoa(binary);
}

async function recordMonthlyReportRun(env, reportPeriod, status, message, messageId = "") {
  const now = new Date().toISOString();
  await env.DB.prepare(`INSERT INTO monthly_report_runs (report_month, created_at, sent_at, status, message, message_id)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(report_month) DO UPDATE SET sent_at = excluded.sent_at, status = excluded.status, message = excluded.message, message_id = excluded.message_id`)
    .bind(reportPeriod, now, status === "sent" ? now : null, status, clean(message, 500), clean(messageId, 200))
    .run();
}

async function sendTrafficReportEmail(env, data, reportPeriod, reportLabel = "Monthly") {
  const to = clean(env.REPORT_TO_EMAIL, 240);
  const from = clean(env.REPORT_FROM_EMAIL, 240);
  if (!to || !from) {
    return { sent: false, status: "blocked", message: "Report email recipient or sender configuration is missing." };
  }
  const report = buildReportEmail(data, reportLabel);
  const subject = `Studio2800 ${reportLabel.toLowerCase()} traffic report - ${reportPeriod}`;
  const attachment = {
    content: base64Encode(report.svg),
    filename: `studio2800-traffic-report-${reportPeriod}.svg`,
    type: "image/svg+xml",
    disposition: "attachment"
  };
  try {
    const response = await sendTransactionalEmail(env, { to, from, subject, html: report.html, text: report.text, attachments: [attachment] });
    return { sent: true, status: "sent", message: `Report email sent with SVG attachment through ${response.provider}.`, messageId: response.messageId || "" };
  } catch (error) {
    try {
      const response = await sendTransactionalEmail(env, { to, from, subject, html: report.html, text: report.text });
      return {
        sent: true,
        status: "sent",
        message: `Report email sent without attachment after attachment retry: ${clean(error?.message, 220)}`,
        messageId: response.messageId || ""
      };
    } catch (retryError) {
      return { sent: false, status: "failed", message: clean(retryError?.message || error?.message || "Unknown email send error.", 450) };
    }
  }
}

async function runMonthlyTrafficReport(env, options = {}) {
  if (!env.DB) return { sent: false, status: "blocked", message: "D1 database is not configured." };
  await initializeDatabase(env.DB);
  const now = options.now || new Date();
  const schedule = reportSchedule(env, now, options);
  const { reportPeriod, frequency, label } = schedule;

  if (!options.force && !schedule.shouldSend) {
    return { sent: false, status: "skipped", message: "Outside report send window.", reportPeriod, reportMonth: reportPeriod, frequency };
  }

  const existing = await env.DB.prepare("SELECT status, sent_at FROM monthly_report_runs WHERE report_month = ?")
    .bind(reportPeriod)
    .first();
  if (!options.force && existing?.status === "sent") {
    return { sent: false, status: "skipped", message: schedule.alreadySentMessage, reportPeriod, reportMonth: reportPeriod, frequency, sentAt: existing.sent_at };
  }

  const data = await trafficReportData(env);
  let result;
  let smsResult = { sent: false, status: "disabled", message: "SMS notifications are disabled." };
  let pushResult = { sent: false, status: "disabled", message: "App push notifications are disabled." };
  try {
    result = await sendTrafficReportEmail(env, data, reportPeriod, label);
  } catch (error) {
    result = {
      sent: false,
      status: "failed",
      message: `Email send failed: ${clean(error?.message || "Unknown error", 450)}`
    };
  }
  try {
    smsResult = await sendTrafficReportSms(env, data, reportPeriod, label);
    if (smsResult.status === "failed") {
      await recordSiteError(env, "/api/admin/monthly-report", "Traffic report SMS failed", smsResult.message);
    }
  } catch (error) {
    smsResult = { sent: false, status: "failed", message: clean(error?.message || "Unknown SMS report error.", 450) };
    await recordSiteError(env, "/api/admin/monthly-report", "Traffic report SMS failed", smsResult.message);
  }
  try {
    pushResult = await sendTrafficReportPushFallback(env, data, reportPeriod, label, smsResult);
    if (pushResult.status === "failed") {
      await recordSiteError(env, "/api/admin/monthly-report", "Traffic report app push failed", pushResult.message);
    }
  } catch (error) {
    pushResult = { sent: false, status: "failed", message: clean(error?.message || "Unknown app push report error.", 450) };
    await recordSiteError(env, "/api/admin/monthly-report", "Traffic report app push failed", pushResult.message);
  }
  const notificationNotes = [
    smsResult.sent ? `SMS summary sent through ${smsResult.provider}.` : "",
    pushResult.sent ? `App push fallback sent through ${pushResult.provider}.` : ""
  ].filter(Boolean);
  const combinedMessage = notificationNotes.length ? `${result.message} ${notificationNotes.join(" ")}` : result.message;
  await recordMonthlyReportRun(env, reportPeriod, result.status, combinedMessage, result.messageId || "");
  return { ...result, message: combinedMessage, reportPeriod, reportMonth: reportPeriod, frequency, totals: data.totals, sms: smsResult, push: pushResult };
}

async function handleMonthlyReport(request, env, cors) {
  if (!await isAuthorized(request, env.AUTH_SECRET)) {
    return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
  }
  const url = new URL(request.url);
  const data = await trafficReportData(env);
  const schedule = reportSchedule(env, new Date());
  if (url.searchParams.get("format") === "html") {
    return new Response(buildReportEmail(data, schedule.label).html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8", ...cors } });
  }
  if (url.searchParams.get("send") === "true") {
    const reportPeriod = url.searchParams.get("period") || url.searchParams.get("month") || schedule.reportPeriod;
    return json(await runMonthlyTrafficReport(env, { force: true, reportPeriod }), 200, cors);
  }
  return json({
    generatedAt: data.generatedAt,
    schedule: {
      frequency: schedule.frequency,
      reportPeriod: schedule.reportPeriod,
      timeZone: env.REPORT_TIME_ZONE || "America/Detroit",
      sendWeekday: env.REPORT_SEND_WEEKDAY || null,
      sendDay: env.REPORT_SEND_DAY || null,
      sendHour: env.REPORT_SEND_HOUR || "9"
    },
    trackingWindow: data.trackingWindow,
    totals: data.totals,
    sources: data.sources,
    regions: data.regions,
    topPaths: data.topPaths,
    lastRun: await env.DB.prepare("SELECT * FROM monthly_report_runs ORDER BY created_at DESC LIMIT 1").first()
  }, 200, cors);
}

export default {
  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runMonthlyTrafficReport(env, { now: new Date(controller.scheduledTime) }));
  },

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

    if (url.pathname === "/api/site-settings" && request.method === "GET") {
      return json(await getSiteSettings(env.DB), 200, cors);
    }

    if (url.pathname === "/api/metrics/visit" && request.method === "POST") {
      const limited = await rateLimitResponse(request, env, cors, "metrics-visit", 120, 600);
      if (limited) return limited;
      const body = await request.json().catch(() => ({}));
      await logPageView(request, env, clean(body.path, 240), clean(body.referrer, 500));
      return json({ ok: true }, 201, cors);
    }

    if (url.pathname === "/api/errors" && request.method === "POST") {
      const limited = await rateLimitResponse(request, env, cors, "errors", 30, 600);
      if (limited) return limited;
      const body = await request.json().catch(() => ({}));
      await env.DB.prepare("INSERT INTO site_errors (created_at, path, message, detail) VALUES (?, ?, ?, ?)")
        .bind(new Date().toISOString(), clean(body.path, 240), clean(body.message, 500), clean(body.detail, 1000))
        .run();
      return json({ ok: true }, 201, cors);
    }

    if (url.pathname === "/api/submissions" && request.method === "POST") {
      const limited = await rateLimitResponse(request, env, cors, "submissions", 5, 600);
      if (limited) return limited;
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
      const createdAt = new Date().toISOString();
      await env.DB.prepare(`INSERT INTO submissions (created_at, name, email, project, timeline, goal, ip_hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)`)
        .bind(createdAt, name, email, project, timeline, goal, await hashIp(request, env.AUTH_SECRET))
        .run();
      const lead = { createdAt, name, email, project, timeline, goal };
      const emailResult = await sendLeadNotificationEmail(env, lead);
      if (!emailResult.sent) {
        await recordSiteError(env, "/api/submissions", "Lead notification email failed", emailResult.message);
      }
      const smsResult = await sendLeadSmsAlert(env, lead);
      if (smsResult.status === "failed") {
        await recordSiteError(env, "/api/submissions", "Lead SMS alert failed", smsResult.message);
      }
      const pushResult = await sendLeadPushFallback(env, lead, smsResult);
      if (pushResult.status === "failed") {
        await recordSiteError(env, "/api/submissions", "Lead app push alert failed", pushResult.message);
      }
      return json({ ok: true, notifications: { email: emailResult.status, sms: smsResult.status, push: pushResult.status } }, 201, cors);
    }

    if (url.pathname === "/api/auth/signup" && request.method === "POST") {
      const limited = await rateLimitResponse(request, env, cors, "signup", 5, 3600);
      if (limited) return limited;
      return handleSignup(request, env, cors);
    }

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      const limited = await rateLimitResponse(request, env, cors, "user-login", 10, 900);
      if (limited) return limited;
      return handleLogin(request, env, cors);
    }

    if (url.pathname === "/api/auth/me" && request.method === "GET") {
      return handleMe(request, env, cors);
    }

    if (url.pathname === "/api/admin/login" && request.method === "POST") {
      const limited = await rateLimitResponse(request, env, cors, "admin-login", 10, 900);
      if (limited) return limited;
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

    if (url.pathname === "/api/admin/site-settings" && request.method === "GET") {
      if (!await isAuthorized(request, env.AUTH_SECRET)) return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
      return json(await getSiteSettings(env.DB), 200, cors);
    }

    if (url.pathname === "/api/admin/site-settings" && request.method === "PUT") {
      if (!await isAuthorized(request, env.AUTH_SECRET)) return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
      const body = await request.json().catch(() => ({}));
      return json(await saveSiteSettings(env.DB, { livestreamEnabled: body.livestreamEnabled === true }), 200, cors);
    }

    if (url.pathname === "/api/admin/notification-status" && request.method === "GET") {
      if (!await isAuthorized(request, env.AUTH_SECRET)) return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
      return json(notificationStatus(env), 200, cors);
    }

    if (url.pathname === "/api/admin/metrics" && request.method === "GET") {
      return handleMetrics(request, env, cors);
    }

    if (url.pathname === "/api/admin/network-dashboard" && request.method === "GET") {
      return handleNetworkDashboard(request, env, cors);
    }

    if (url.pathname === "/api/admin/monthly-report" && request.method === "GET") {
      return handleMonthlyReport(request, env, cors);
    }

    if (url.pathname === "/api/admin/test-lead-email" && request.method === "POST") {
      if (!await isAuthorized(request, env.AUTH_SECRET)) return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
      const emailResult = await sendLeadNotificationEmail(env, {
        createdAt: new Date().toISOString(),
        name: "Studio2800 Test",
        email: "test@example.com",
        project: "AI video production project",
        timeline: "Next 30 days",
        goal: "This is a test of the branded Studio2800 lead notification email."
      });
      if (!emailResult.sent) {
        await recordSiteError(env, "/api/admin/test-lead-email", "Test lead notification email failed", emailResult.message);
        return json({ ok: false, status: emailResult.status, error: emailResult.message }, 502, cors);
      }
      return json({ ok: true, status: emailResult.status, message: emailResult.message, messageId: emailResult.messageId || "" }, 200, cors);
    }

    if (url.pathname === "/api/admin/test-lead-sms" && request.method === "POST") {
      if (!await isAuthorized(request, env.AUTH_SECRET)) return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
      const smsResult = await sendLeadSmsAlert(env, {
        createdAt: new Date().toISOString(),
        name: "Studio2800 Test",
        project: "AI video production project",
        timeline: "Next 30 days",
        goal: "This is a test of the Studio2800 SMS lead notification."
      });
      if (!smsResult.sent) {
        if (smsResult.status === "failed") await recordSiteError(env, "/api/admin/test-lead-sms", "Test lead SMS failed", smsResult.message);
        const status = smsResult.status === "disabled" || smsResult.status === "blocked" ? 409 : 502;
        return json({ ok: false, status: smsResult.status, error: smsResult.message }, status, cors);
      }
      return json({ ok: true, status: smsResult.status, message: smsResult.message, messageId: smsResult.messageId || "" }, 200, cors);
    }

    if (url.pathname === "/api/admin/test-lead-push" && request.method === "POST") {
      if (!await isAuthorized(request, env.AUTH_SECRET)) return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
      const pushResult = await sendPushMessage(env, {
        title: "Studio2800 test push",
        message: "This is a test of the Studio2800 app push fallback notification.",
        url: "https://studio2800.com/admin",
        urlTitle: "Open Studio2800 Admin"
      });
      if (!pushResult.sent) {
        if (pushResult.status === "failed") await recordSiteError(env, "/api/admin/test-lead-push", "Test lead app push failed", pushResult.message);
        const status = pushResult.status === "disabled" || pushResult.status === "blocked" ? 409 : 502;
        return json({ ok: false, status: pushResult.status, error: pushResult.message }, status, cors);
      }
      return json({ ok: true, status: pushResult.status, message: pushResult.message, messageId: pushResult.messageId || "" }, 200, cors);
    }

    if (url.pathname === "/api/admin/test-notification-failover" && request.method === "POST") {
      if (!await isAuthorized(request, env.AUTH_SECRET)) return json({ error: "Admin session is not authorized or has expired." }, 401, cors);
      const pushResult = await sendPushFallbackAfterSms(env, {
        sent: false,
        status: "failed",
        provider: "twilio",
        message: "Simulated Twilio failure for Studio2800 failover test."
      }, {
        title: "Studio2800 failover test",
        message: "Twilio SMS was simulated as failed. This confirms app push backup behavior.",
        url: "https://studio2800.com/admin",
        urlTitle: "Open Studio2800 Admin",
        priority: 1
      });
      if (!pushResult.sent) {
        if (pushResult.status === "failed") await recordSiteError(env, "/api/admin/test-notification-failover", "Test notification failover failed", pushResult.message);
        const status = pushResult.status === "disabled" || pushResult.status === "blocked" ? 409 : 502;
        return json({ ok: false, status: pushResult.status, error: pushResult.message }, status, cors);
      }
      return json({ ok: true, status: pushResult.status, message: pushResult.message, messageId: pushResult.messageId || "" }, 200, cors);
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

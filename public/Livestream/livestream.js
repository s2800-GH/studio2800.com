const stream = document.querySelector("#studio2800LiveStream");
const frameBox = document.querySelector("[data-livestream-frame]");
const titleNode = document.querySelector("[data-livestream-title]");
const publicSections = [...document.querySelectorAll("[data-livestream-public]")];

let player = null;
let currentSource = "";
let pointerInside = false;

const defaultConfig = {
  title: "LiveStream 1",
  status: "preview",
  sourceType: "youtube",
  sourceUrl: "https://youtu.be/2XrSSts2okQ"
};

function youtubeId(url) {
  const value = String(url || "").trim();
  let match = value.match(/youtu[.]be[/]([A-Za-z0-9_-]{6,})/);
  if (match) return match[1];
  match = value.match(/[?&]v=([A-Za-z0-9_-]{6,})/);
  if (match) return match[1];
  match = value.match(/youtube[.]com[/]embed[/]([A-Za-z0-9_-]{6,})/);
  return match ? match[1] : "";
}

function isFile(url) {
  return /[.](mp4|mov)([?#]|$)/i.test(String(url || ""));
}

function isImage(url) {
  return /[.](jpg|jpeg|png|gif|webp|avif|svg)([?#]|$)/i.test(String(url || ""));
}

function safeUrl(value) {
  return String(value || "").trim().replace(/"/g, "%22").replace(/'/g, "%27").replace(/</g, "%3C");
}

function youtubeBase(id) {
  const origin = encodeURIComponent(window.location.origin || "https://studio2800.com");
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?enablejsapi=1&autoplay=0&mute=1&controls=0&disablekb=1&fs=0&cc_load_policy=0&modestbranding=1&rel=0&playsinline=1&iv_load_policy=3&loop=1&playlist=${encodeURIComponent(id)}&origin=${origin}`;
}

function renderPlayer(config) {
  if (!frameBox) return;
  const url = config?.sourceUrl || defaultConfig.sourceUrl;
  const sourceType = String(config?.sourceType || "auto").toLowerCase();
  if (url === currentSource && player?.sourceType === sourceType) return;

  currentSource = url;
  const forceImage = sourceType === "image" || sourceType === "gif";
  const forceFile = sourceType === "file";
  const forceYoutube = sourceType === "youtube";
  const id = forceImage ? "" : youtubeId(url);

  if (id && (forceYoutube || sourceType === "auto" || sourceType === "youtube")) {
    const base = youtubeBase(id);
    frameBox.innerHTML = `<iframe id="studio2800LiveStreamFrame" src="${safeUrl(base)}" allow="autoplay" loading="eager" tabindex="-1" aria-hidden="true"></iframe>`;
    player = { type: "youtube", sourceType, base, el: frameBox.querySelector("iframe") };
    return;
  }

  if (forceImage || isImage(url)) {
    frameBox.innerHTML = `<img id="studio2800LiveStreamImage" src="${safeUrl(url)}" alt="Studio2800 livestream media">`;
    player = { type: "image", sourceType, el: frameBox.querySelector("img") };
    return;
  }

  if (forceFile || isFile(url)) {
    frameBox.innerHTML = `<video id="studio2800LiveStreamVideo" muted playsinline loop preload="metadata"><source src="${safeUrl(url)}"></video>`;
    player = { type: "file", sourceType, el: frameBox.querySelector("video") };
    return;
  }

  frameBox.innerHTML = '<div class="livestream-empty" aria-hidden="true"></div>';
  player = { type: "empty", sourceType };
}

function applyConfig(config) {
  const cfg = { ...defaultConfig, ...(config || {}) };
  if (titleNode) titleNode.textContent = cfg.title || "LiveStream 1";
  renderPlayer(cfg);
}

function setLivestreamVisible(isVisible) {
  document.body.dataset.livestreamPublished = isVisible ? "true" : "false";
  publicSections.forEach((section) => {
    section.hidden = !isVisible;
  });
  if (!isVisible) {
    pause();
  }
}

async function initLivestreamVisibility() {
  const isLocalPreview = ["127.0.0.1", "localhost", "::1"].includes(window.location.hostname);
  if (isLocalPreview || new URLSearchParams(window.location.search).has("preview")) {
    setLivestreamVisible(true);
    return;
  }

  try {
    const response = await fetch("https://studio2800-api.jason-danyliw.workers.dev/api/site-settings", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Livestream setting unavailable");
    }
    const { livestreamEnabled = false } = await response.json();
    setLivestreamVisible(Boolean(livestreamEnabled));
  } catch {
    setLivestreamVisible(false);
  }
}

function yt(func, args = []) {
  if (player?.type === "youtube" && player.el?.contentWindow) {
    player.el.contentWindow.postMessage(JSON.stringify({ event: "command", func, args }), "https://www.youtube-nocookie.com");
  }
}

function play() {
  if (!player) return;
  if (player.type === "youtube") {
    setTimeout(() => yt("mute"), 250);
    setTimeout(() => yt("playVideo"), 350);
  } else if (player.type === "file" && player.el) {
    player.el.muted = true;
    player.el.loop = true;
    player.el.play().catch(() => {});
  }
}

function pause() {
  if (player?.type === "youtube") yt("pauseVideo");
  else if (player?.el?.pause) player.el.pause();
}

function initPreviewEvents() {
  if (!frameBox) return;
  const setPreviewing = (value) => {
    frameBox.setAttribute("data-previewing", value ? "true" : "false");
    stream?.classList.toggle("is-previewing", Boolean(value));
  };

  setPreviewing(false);
  frameBox.addEventListener("mouseenter", () => {
    pointerInside = true;
    setPreviewing(true);
    play();
  });
  frameBox.addEventListener("mouseleave", () => {
    pointerInside = false;
    setPreviewing(false);
    pause();
  });
  frameBox.addEventListener("touchstart", () => {
    pointerInside = true;
    setPreviewing(true);
    play();
  }, { passive: true });
}

applyConfig(defaultConfig);
fetch("https://studio2800-api.jason-danyliw.workers.dev/api/livestream-config", { cache: "no-store" })
  .then((response) => response.ok ? response.json() : defaultConfig)
  .then(applyConfig)
  .catch(() => {});
initPreviewEvents();
initLivestreamVisibility();

const navToggle = document.querySelector("[data-nav-toggle]");
const mobileNav = document.querySelector("[data-mobile-nav]");

navToggle?.addEventListener("click", () => {
  const isOpen = mobileNav.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
  navToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
});

mobileNav?.addEventListener("click", (event) => {
  if (event.target.matches("a")) {
    mobileNav.classList.remove("is-open");
    navToggle?.setAttribute("aria-expanded", "false");
    navToggle?.setAttribute("aria-label", "Open navigation");
  }
});

const videoStorageKey = "studio2800VideoUrls";
const defaultVideoUrl = "https://youtu.be/E18RGsfK7-Y";
const defaultVideoUrls = Array(9).fill(defaultVideoUrl);
const temporaryVideoOverrideUrl = "https://youtu.be/E18RGsfK7-Y";
const apiBase = "https://studio2800-api.jason-danyliw.workers.dev";
let carouselVideos = [];
let activeVideoIndex = 0;

function getYouTubeId(url) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url.trim());
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "").split("/")[0];
    }
    if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) {
      return parsed.pathname.split("/")[2] || "";
    }
    return parsed.searchParams.get("v") || "";
  } catch {
    return "";
  }
}

async function applySavedVideoUrls() {
  const carousel = document.querySelector("[data-video-carousel]");
  if (!carousel) {
    return;
  }

  let urls = [];
  try {
    const response = await fetch(`${apiBase}/api/videos`);
    if (!response.ok) throw new Error("Video service unavailable");
    ({ urls = [] } = await response.json());
  } catch {
    try {
      urls = JSON.parse(localStorage.getItem(videoStorageKey) || "[]");
    } catch {
      urls = [];
    }
  }

  const selectors = [...carousel.querySelectorAll("[data-video-selector]")];
  carouselVideos = selectors.map((selector, index) => {
    const title = selector.textContent.trim() || `Video ${index + 1}`;
    const url = temporaryVideoOverrideUrl || urls[index] || defaultVideoUrls[index] || "";
    return {
      title,
      url,
      id: getYouTubeId(url)
    };
  });
}

function getActiveFrame() {
  return document.querySelector("[data-video-frame] iframe");
}

function setPlayerState(isPlaying) {
  const shell = document.querySelector(".video-player-shell");
  if (!shell) {
    return;
  }

  shell.dataset.videoState = isPlaying ? "playing" : "paused";
}

function postYouTubeCommand(frame, command) {
  frame?.contentWindow?.postMessage(JSON.stringify({
    event: "command",
    func: command,
    args: []
  }), "*");
}

function renderActiveVideo(index, shouldAutoplay = false) {
  const carousel = document.querySelector("[data-video-carousel]");
  const frame = document.querySelector("[data-video-frame]");
  const title = document.querySelector("[data-video-title]");
  const count = document.querySelector("[data-video-count]");
  const note = document.querySelector("[data-video-note]");
  const shell = document.querySelector(".video-player-shell");
  const selectors = [...document.querySelectorAll("[data-video-selector]")];
  const video = carouselVideos[index];
  if (!carousel || !frame || !title || !count || !note || !shell || !video) {
    return;
  }

  activeVideoIndex = index;
  selectors.forEach((selector, selectorIndex) => {
    const isActive = selectorIndex === index;
    selector.classList.toggle("is-active", isActive);
    selector.setAttribute("aria-selected", String(isActive));
  });

  title.textContent = video.title;
  count.textContent = `${String(index + 1).padStart(2, "0")} / ${String(carouselVideos.length).padStart(2, "0")}`;
  shell.dataset.videoReady = video.id ? "true" : "false";
  setPlayerState(false);

  if (!video.id) {
    frame.innerHTML = `<img class="video-poster" src="assets/s2800-logo.jpeg" alt="${video.title} video preview">`;
    note.textContent = "Add a YouTube URL in the admin page to load this featured player.";
    return;
  }

  const thumbnailUrl = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  const autoplay = shouldAutoplay ? 1 : 0;
  frame.innerHTML = `
    <iframe
      src="https://www.youtube-nocookie.com/embed/${video.id}?enablejsapi=1&autoplay=${autoplay}&mute=1&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0&loop=1&playlist=${video.id}&cc_load_policy=0&showinfo=0"
      title="${video.title}"
      loading="lazy"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    ></iframe>
    <img class="video-cover" src="${thumbnailUrl}" alt="" aria-hidden="true" loading="lazy">
  `;
  note.textContent = "Autoplay preview is active. Use the video buttons to switch the featured player.";
  if (shouldAutoplay) {
    setPlayerState(true);
    const activeFrame = getActiveFrame();
    activeFrame?.addEventListener("load", () => {
      postYouTubeCommand(activeFrame, "mute");
      postYouTubeCommand(activeFrame, "playVideo");
    }, { once: true });
  }
}

function initVideoShowcase() {
  const carousel = document.querySelector("[data-video-carousel]");
  const selectors = [...document.querySelectorAll("[data-video-selector]")];
  if (!carousel || !selectors.length || !carouselVideos.length) {
    return;
  }

  selectors.forEach((selector) => {
    selector.addEventListener("click", () => {
      const index = Number(selector.dataset.videoIndex || 0);
      renderActiveVideo(index, true);
    });

    selector.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) {
        return;
      }
      event.preventDefault();
      const current = Number(selector.dataset.videoIndex || 0);
      const next = event.key === "ArrowRight"
        ? (current + 1) % selectors.length
        : (current - 1 + selectors.length) % selectors.length;
      selectors[next].focus();
      renderActiveVideo(next, true);
    });
  });

  carousel.addEventListener("click", (event) => {
    if (!event.target.closest("[data-video-frame]")) {
      return;
    }
    const frame = getActiveFrame();
    const shell = document.querySelector(".video-player-shell");
    if (!frame || !shell || !carouselVideos[activeVideoIndex]?.id) {
      return;
    }
    const isPlaying = shell.dataset.videoState === "playing";
    postYouTubeCommand(frame, isPlaying ? "pauseVideo" : "playVideo");
    setPlayerState(!isPlaying);
  });

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const frame = getActiveFrame();
      if (!frame) {
        return;
      }
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          postYouTubeCommand(frame, "mute");
          postYouTubeCommand(frame, "playVideo");
          setPlayerState(true);
        } else {
          postYouTubeCommand(frame, "pauseVideo");
          setPlayerState(false);
        }
      });
    }, { threshold: 0.35 });
    observer.observe(carousel);
  }

  renderActiveVideo(0, true);
}

const contactForm = document.querySelector("[data-contact-form]");
const contactStatus = document.querySelector("[data-form-status]");

contactForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = contactForm.querySelector("button[type='submit']");
  const formData = new FormData(contactForm);
  const payload = Object.fromEntries(formData.entries());
  submitButton.disabled = true;
  submitButton.textContent = "Sending...";
  contactStatus.textContent = "";

  try {
    const response = await fetch(`${apiBase}/api/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Unable to send your inquiry.");
    window.location.assign("thanks.html");
  } catch (error) {
    contactStatus.textContent = error.message;
    submitButton.disabled = false;
    submitButton.textContent = "Send video inquiry";
  }
});

async function trackPageView() {
  try {
    await fetch(`${apiBase}/api/metrics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname || "/",
        referrer: document.referrer || ""
      }),
      keepalive: true
    });
  } catch {
    // Metrics should never interrupt the public website.
  }
}

async function initAdPlaceholders() {
  try {
    const response = await fetch(`${apiBase}/api/config`);
    if (!response.ok) {
      return;
    }
    const { ads = {} } = await response.json();
    if (!ads.enabled || !ads.clientId) {
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ads.clientId)}`;
    script.crossOrigin = "anonymous";
    document.head.append(script);
    document.querySelectorAll("[data-ad-slot]").forEach((slot) => {
      slot.hidden = false;
      slot.dataset.adsReady = "true";
    });
  } catch {
    // Ads are disabled by default and fail closed.
  }
}

function logClientError(message, detail = "") {
  try {
    fetch(`${apiBase}/api/errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: window.location.pathname || "/",
        message,
        detail
      }),
      keepalive: true
    }).catch(() => {});
  } catch {
    // Error logging cannot become another user-facing error.
  }
}

window.addEventListener("error", (event) => {
  logClientError(event.message || "Browser error", `${event.filename || ""}:${event.lineno || ""}`);
});

window.addEventListener("unhandledrejection", (event) => {
  logClientError("Unhandled browser promise rejection", String(event.reason || ""));
});

trackPageView();
initAdPlaceholders();
applySavedVideoUrls().then(initVideoShowcase);

const root = document.documentElement;
const body = document.body;
const header = document.querySelector(".site-header");
const hero = document.querySelector(".hero");
const heroVideo = document.querySelector("[data-cinematic-video]");
const heroVideoSources = Array.from(heroVideo?.querySelectorAll("source[data-src]") || []);
const heroContent = document.querySelector(".hero-content");
const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const themeToggle = document.querySelector(".theme-toggle");
const ambientToggle = document.querySelector(".ambient-toggle");
const scrollProgress = document.querySelector(".scroll-progress");
const openingSkip = document.querySelector(".opening-skip");
const installation = document.querySelector(".installation");
const roomCamera = document.querySelector("[data-room-camera]");
const manifesto = document.querySelector(".manifesto");
const wartrobeStage = document.querySelector("[data-wartrobe-stage]");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".site-nav a[href^='#']");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxTitle = document.querySelector(".lightbox-caption strong");
const lightboxCaption = document.querySelector(".lightbox-caption span");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxPrev = document.querySelector(".lightbox-prev");
const lightboxNext = document.querySelector(".lightbox-next");
const lightboxTriggers = Array.from(document.querySelectorAll(".js-lightbox-trigger"));
const cookieConsent = document.querySelector("[data-cookie-consent]");
const cookieAccept = document.querySelector("[data-cookie-accept]");
const cookieReject = document.querySelector("[data-cookie-reject]");
const instagramSection = document.querySelector("#instagram");
const instagramWidgetPanel = document.querySelector(".instagram-widget-panel");
const pageMain = document.querySelector("main");
const pageFooter = document.querySelector(".site-footer");
const privateRoomStage = document.querySelector("[data-private-room-stage]");
const privateRoomStatus = document.querySelector(".private-room-loader small");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileNavigation = window.matchMedia("(max-width: 1120px)");
const emptyImageSrc = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

let lastScrollY = window.scrollY;
let scrollTicking = false;
let openingFinished = false;
let openingTimers = [];
let activeLightboxIndex = -1;
let activeLightboxTrigger = null;
let lightboxCloseTimer = null;
let ambientContext = null;
let ambientMaster = null;
let ambientIsOn = false;
let privateRoomController = null;
let privateRoomImportObserver = null;

const storage = {
  get(key, session = false) {
    try {
      return (session ? window.sessionStorage : window.localStorage).getItem(key);
    } catch (error) {
      return null;
    }
  },
  set(key, value, session = false) {
    try {
      (session ? window.sessionStorage : window.localStorage).setItem(key, value);
    } catch (error) {
      // The experience remains functional when browser storage is unavailable.
    }
  },
};

if ((navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 4)) {
  root.classList.add("low-power");
}

const applyTheme = (theme) => {
  const nextTheme = theme === "light" ? "light" : "dark";
  body.dataset.theme = nextTheme;
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", nextTheme === "dark" ? "#090909" : "#eee9df");

  if (themeToggle) {
    const isLight = nextTheme === "light";
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", `Switch to ${isLight ? "dark" : "light"} gallery theme`);
    themeToggle.querySelector(".control-label").textContent = isLight ? "Dark" : "Light";
  }

  privateRoomController?.setTheme?.(nextTheme);
};

applyTheme(storage.get("dha-theme") || body.dataset.theme);

const clearOpeningTimers = () => {
  openingTimers.forEach((timer) => window.clearTimeout(timer));
  openingTimers = [];
};

const setOpeningPhase = (phase) => {
  body.dataset.openingPhase = phase;
  const hidesInterface = phase !== "identity" && body.classList.contains("opening-active");
  if (header) header.inert = hidesInterface;
  if (heroContent) heroContent.inert = hidesInterface;
  document.querySelectorAll("[data-opening-label]").forEach((label) => {
    label.classList.toggle("is-active", label.dataset.openingLabel === phase);
  });
};

const finishOpening = (remember = true) => {
  if (openingFinished) return;
  openingFinished = true;
  clearOpeningTimers();
  setOpeningPhase("identity");
  body.classList.remove("opening-pending", "opening-active");
  body.classList.add("opening-complete");
  if (header) header.inert = false;
  if (heroContent) heroContent.inert = false;
  if (openingSkip) openingSkip.inert = true;
  heroVideo?.pause();
  heroVideo?.classList.remove("is-playing");
  if (remember) storage.set("dha-opening-seen", "true", true);
};

const shouldSkipOpening = () => {
  const forceOpening = new URLSearchParams(window.location.search).get("intro") === "1";
  return reducedMotion.matches || window.location.hash || (storage.get("dha-opening-seen", true) && !forceOpening);
};

const playCinematicOpening = () => {
  if (!heroVideo || !body.classList.contains("opening-active")) return;
  heroVideo.currentTime = 0;
  heroVideo.play().then(() => {
    heroVideo.classList.add("is-playing");
    body.classList.add("cinematic-video-active");
  }).catch(() => {
    body.classList.remove("cinematic-video-active");
  });
};

const prepareCinematicOpening = () => {
  if (!heroVideo || !heroVideoSources.length || shouldSkipOpening()) return;
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const canUseFilm = window.innerWidth > 760
    && !reducedMotion.matches
    && !connection?.saveData;

  if (!canUseFilm) return;

  heroVideoSources.forEach((source) => {
    source.src = source.dataset.src;
  });
  heroVideo.addEventListener("canplay", () => {
    body.classList.add("cinematic-video-ready");
    playCinematicOpening();
  }, { once: true });
  heroVideo.addEventListener("ended", () => finishOpening(), { once: true });
  heroVideo.addEventListener("error", () => {
    body.classList.remove("cinematic-video-ready", "cinematic-video-active");
    heroVideo.classList.remove("is-playing");
  }, { once: true });
  heroVideo.load();
};

const startOpening = () => {
  if (shouldSkipOpening()) {
    finishOpening(false);
    return;
  }

  body.classList.add("opening-active");
  if (header) header.inert = true;
  if (openingSkip) openingSkip.inert = false;
  setOpeningPhase("surface");
  playCinematicOpening();
  openingTimers.push(window.setTimeout(() => setOpeningPhase("work"), 1200));
  openingTimers.push(window.setTimeout(() => setOpeningPhase("room"), 3200));
  openingTimers.push(window.setTimeout(() => setOpeningPhase("identity"), 5400));
  openingTimers.push(window.setTimeout(() => finishOpening(), 7200));
};

openingSkip?.addEventListener("click", () => finishOpening());

const skipOpeningOnIntent = () => {
  if (body.classList.contains("opening-active")) finishOpening();
};

window.addEventListener("wheel", skipOpeningOnIntent, { passive: true, once: true });
window.addEventListener("touchmove", skipOpeningOnIntent, { passive: true, once: true });
window.addEventListener("keydown", (event) => {
  if (["ArrowDown", "PageDown", " ", "Enter"].includes(event.key) && body.classList.contains("opening-active")) {
    finishOpening();
  }
});

const setMenuState = (isOpen, returnFocus = false) => {
  if (!menuToggle || !header) return;
  header.classList.toggle("is-menu-open", isOpen);
  body.classList.toggle("is-menu-open", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
  menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
  if (siteNav) siteNav.inert = mobileNavigation.matches && !isOpen;

  if (isOpen) {
    siteNav?.querySelector("a")?.focus({ preventScroll: true });
  } else if (returnFocus) {
    menuToggle.focus({ preventScroll: true });
  }
};

const focusableWithin = (element) => Array.from(element.querySelectorAll("a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex='-1'])"))
  .filter((item) => item.offsetParent !== null);

const trapFocus = (event, container) => {
  const focusable = focusableWithin(container);
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!first || !last) return;

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
};

menuToggle?.addEventListener("click", () => setMenuState(!header.classList.contains("is-menu-open")));
mobileNavigation.addEventListener?.("change", (event) => {
  if (!event.matches) setMenuState(false);
  else if (siteNav) siteNav.inert = !header?.classList.contains("is-menu-open");
});

if (siteNav) siteNav.inert = mobileNavigation.matches;

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header?.classList.remove("is-hidden");
    setMenuState(false);
  });
});

const pageSections = Array.from(navLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

const updateActiveNavigation = () => {
  if (!pageSections.length) return;
  const marker = window.innerHeight * 0.42;
  const current = pageSections.reduce((active, section) => section.getBoundingClientRect().top <= marker ? section : active, null);
  navLinks.forEach((link) => link.classList.toggle("is-active", Boolean(current) && link.getAttribute("href") === `#${current.id}`));
};

const updateScrollProgress = () => {
  if (!scrollProgress) return;
  const maximum = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress.style.setProperty("--progress", maximum > 0 ? String(window.scrollY / maximum) : "0");
};

const updateHeader = () => {
  if (!header) return;
  const currentY = window.scrollY;
  header.classList.toggle("is-scrolled", currentY > 30);
  header.classList.toggle("is-hidden", !mobileNavigation.matches && currentY > lastScrollY && currentY > window.innerHeight * 0.7);
  lastScrollY = currentY;
};

const updateHero = () => {
  if (!hero || reducedMotion.matches) return;
  const progress = clamp(window.scrollY / Math.max(hero.offsetHeight, 1), 0, 1);
  hero.style.setProperty("--hero-scroll", progress.toFixed(4));
};

const updateManifesto = () => {
  if (!manifesto || reducedMotion.matches) return;
  const rect = manifesto.getBoundingClientRect();
  const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height * 0.35), 0, 1);
  manifesto.style.setProperty("--manifesto-progress", progress.toFixed(4));
};

const updateRoom = () => {
  if (!roomCamera || reducedMotion.matches) return;
  const rect = roomCamera.getBoundingClientRect();
  const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
  roomCamera.style.setProperty("--room-progress", progress.toFixed(4));
  roomCamera.style.setProperty("--room-scale", (0.94 + progress * 0.06).toFixed(4));
  roomCamera.style.setProperty("--room-y", `${((0.5 - progress) * 24).toFixed(1)}px`);
};

const updateScrollEffects = () => {
  updateHeader();
  updateHero();
  updateManifesto();
  updateRoom();
  updateScrollProgress();
  updateActiveNavigation();
  scrollTicking = false;
};

const requestScrollUpdate = () => {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollEffects);
};

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);

if ("IntersectionObserver" in window && !document.hidden) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        if (entry.target.classList.contains("wartrobe-object")) {
          document.querySelector(".wartrobe-detail")?.classList.add("is-visible");
        }
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.05, rootMargin: "0px 0px -5%" });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

const setPointerPosition = (element, event, strength = 1) => {
  const rect = element.getBoundingClientRect();
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  element.style.setProperty("--pointer-x", `${(x * 100).toFixed(2)}%`);
  element.style.setProperty("--pointer-y", `${(y * 100).toFixed(2)}%`);
  element.style.setProperty("--shift-x", `${((x - 0.5) * strength).toFixed(2)}px`);
  element.style.setProperty("--shift-y", `${((y - 0.5) * strength).toFixed(2)}px`);
};

if (finePointer.matches && !reducedMotion.matches) {
  hero?.addEventListener("pointermove", (event) => setPointerPosition(hero, event, 24));
  roomCamera?.addEventListener("pointermove", (event) => setPointerPosition(roomCamera, event, 10));
  wartrobeStage?.addEventListener("pointermove", (event) => setPointerPosition(wartrobeStage, event, 12));
  document.querySelectorAll("[data-art-light]").forEach((artwork) => {
    artwork.addEventListener("pointermove", (event) => setPointerPosition(artwork, event, 7));
  });
  document.querySelectorAll("[data-surface-light]").forEach((surface) => {
    surface.addEventListener("pointermove", (event) => setPointerPosition(surface, event));
  });
}

const updateLightbox = (index) => {
  if (!lightboxImage || !lightboxTitle || !lightboxCaption || !lightboxTriggers.length) return;
  activeLightboxIndex = (index + lightboxTriggers.length) % lightboxTriggers.length;
  const trigger = lightboxTriggers[activeLightboxIndex];
  lightboxImage.src = trigger.dataset.lightboxSrc || trigger.href;
  lightboxImage.alt = trigger.dataset.lightboxTitle || "Artwork by Danny Hirsch";
  lightboxTitle.textContent = trigger.dataset.lightboxTitle || "Danny Hirsch Arts";
  lightboxCaption.textContent = trigger.dataset.lightboxCaption || "";
};

const openLightbox = (trigger) => {
  if (!lightbox) return;
  window.clearTimeout(lightboxCloseTimer);
  activeLightboxTrigger = trigger;
  updateLightbox(lightboxTriggers.indexOf(trigger));
  [header, pageMain, pageFooter].forEach((element) => { if (element) element.inert = true; });
  lightbox.inert = false;
  lightbox.setAttribute("aria-hidden", "false");
  body.classList.add("is-lightbox-open");
  lightbox.classList.add("is-open");
  lightboxClose?.focus({ preventScroll: true });
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.inert = true;
  body.classList.remove("is-lightbox-open");
  [header, pageMain, pageFooter].forEach((element) => { if (element) element.inert = false; });
  lightboxCloseTimer = window.setTimeout(() => {
    lightboxImage.src = emptyImageSrc;
    lightboxImage.alt = "";
  }, 420);
  activeLightboxTrigger?.focus({ preventScroll: true });
};

lightboxTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openLightbox(trigger);
  });
});

lightboxClose?.addEventListener("click", closeLightbox);
lightboxPrev?.addEventListener("click", () => updateLightbox(activeLightboxIndex - 1));
lightboxNext?.addEventListener("click", () => updateLightbox(activeLightboxIndex + 1));
lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("is-open")) {
    closeLightbox();
    return;
  }
  if (event.key === "ArrowLeft" && lightbox?.classList.contains("is-open")) updateLightbox(activeLightboxIndex - 1);
  if (event.key === "ArrowRight" && lightbox?.classList.contains("is-open")) updateLightbox(activeLightboxIndex + 1);
  if (event.key === "Tab" && lightbox?.classList.contains("is-open")) trapFocus(event, lightbox);

  if (event.key === "Escape" && header?.classList.contains("is-menu-open")) setMenuState(false, true);
  if (event.key === "Tab" && header?.classList.contains("is-menu-open")) trapFocus(event, header);
});

const updateAmbientButton = () => {
  if (!ambientToggle) return;
  ambientToggle.setAttribute("aria-pressed", String(ambientIsOn));
  ambientToggle.setAttribute("aria-label", ambientIsOn ? "Stop ambient gallery sound" : "Start ambient gallery sound");
  ambientToggle.querySelector(".control-label").textContent = ambientIsOn ? "Sound on" : "Sound";
};

const createNoiseSource = (context, seconds, brown = false) => {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let low = 0;
  for (let index = 0; index < channel.length; index += 1) {
    const white = Math.random() * 2 - 1;
    low = (low + 0.025 * white) / 1.025;
    channel[index] = brown ? low * 3.5 : white;
  }
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
};

const createAmbientSound = () => {
  const master = ambientContext.createGain();
  master.gain.value = 0;

  const air = createNoiseSource(ambientContext, 7, true);
  const airFilter = ambientContext.createBiquadFilter();
  const airGain = ambientContext.createGain();
  airFilter.type = "lowpass";
  airFilter.frequency.value = 310;
  airGain.gain.value = 0.035;
  air.connect(airFilter).connect(airGain).connect(master);

  const texture = createNoiseSource(ambientContext, 5);
  const textureFilter = ambientContext.createBiquadFilter();
  const textureGain = ambientContext.createGain();
  textureFilter.type = "bandpass";
  textureFilter.frequency.value = 1180;
  textureFilter.Q.value = 0.35;
  textureGain.gain.value = 0.004;
  texture.connect(textureFilter).connect(textureGain).connect(master);

  const pulse = ambientContext.createOscillator();
  const pulseGain = ambientContext.createGain();
  pulse.frequency.value = 0.052;
  pulseGain.gain.value = 42;
  pulse.connect(pulseGain).connect(airFilter.frequency);

  master.connect(ambientContext.destination);
  air.start();
  texture.start();
  pulse.start();
  return master;
};

const toggleAmbient = async () => {
  if (!ambientToggle) return;
  if (!ambientContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    ambientContext = new AudioContext();
    ambientMaster = createAmbientSound();
  }

  ambientIsOn = !ambientIsOn;
  const now = ambientContext.currentTime;
  ambientMaster.gain.cancelScheduledValues(now);
  ambientMaster.gain.setTargetAtTime(ambientIsOn ? 0.05 : 0, now, ambientIsOn ? 0.8 : 0.25);
  if (ambientIsOn) await ambientContext.resume().catch(() => {});
  updateAmbientButton();
};

themeToggle?.addEventListener("click", () => {
  const nextTheme = body.dataset.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  storage.set("dha-theme", nextTheme);
});

ambientToggle?.addEventListener("click", toggleAmbient);

const hideCookieConsent = () => cookieConsent?.classList.add("is-hidden");
const loadInstagramWidget = () => {
  if (document.querySelector("script[data-elfsight-platform]")) return;
  const script = document.createElement("script");
  script.src = "https://elfsightcdn.com/platform.js";
  script.async = true;
  script.dataset.elfsightPlatform = "true";
  script.onload = () => instagramWidgetPanel?.classList.add("is-connected");
  document.body.append(script);
};

const thirdPartyConsent = storage.get("dha-third-party-consent");
if (thirdPartyConsent === "accepted") {
  hideCookieConsent();
  loadInstagramWidget();
} else if (thirdPartyConsent === "rejected") {
  hideCookieConsent();
} else if (cookieConsent && instagramSection) {
  if ("IntersectionObserver" in window) {
    const consentObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      cookieConsent.classList.remove("is-hidden");
      observer.disconnect();
    }, { rootMargin: "220px 0px" });
    consentObserver.observe(instagramSection);
  } else {
    cookieConsent.classList.remove("is-hidden");
  }
}

cookieAccept?.addEventListener("click", () => {
  storage.set("dha-third-party-consent", "accepted");
  hideCookieConsent();
  loadInstagramWidget();
});

cookieReject?.addEventListener("click", () => {
  storage.set("dha-third-party-consent", "rejected");
  hideCookieConsent();
});

reducedMotion.addEventListener?.("change", () => {
  if (reducedMotion.matches) {
    finishOpening(false);
    privateRoomController?.destroy?.();
  }
  requestScrollUpdate();
});

const setPrivateRoomFallback = (reason = "fallback") => {
  if (!installation) return;
  installation.classList.remove("private-room--3d-idle", "private-room--3d-loading", "private-room--3d-ready");
  installation.classList.add("private-room--3d-skipped");
  installation.dataset.privateRoom3d = "skipped";
  installation.dataset.privateRoomFallback = reason;
};

const loadPrivateRoomExperience = async () => {
  if (!installation || !privateRoomStage || privateRoomController) return;
  privateRoomImportObserver?.disconnect();

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const compactViewport = window.matchMedia("(max-width: 760px)").matches;
  if (reducedMotion.matches || connection?.saveData || compactViewport) {
    const reason = reducedMotion.matches
      ? "reduced-motion"
      : connection?.saveData
        ? "save-data"
        : "compact-curated-fallback";
    setPrivateRoomFallback(reason);
    return;
  }

  try {
    const { initPrivateRoom3D } = await import("./DannyHirschArts3D.js?v=20260721-threshold-6");
    privateRoomController = initPrivateRoom3D({
      root: installation,
      stage: privateRoomStage,
      modelUrl: "assets/cinematic/threshold-room.glb",
      minimumDeviceMemory: 3,
      minimumHardwareConcurrency: 4,
      pixelRatioCap: finePointer.matches ? 1.5 : 1,
      cameraTravel: 0.018,
      pointerRotation: 0.014,
      scrollRotation: 0.01,
      onLoading: ({ progress }) => {
        if (!privateRoomStatus) return;
        privateRoomStatus.textContent = progress === null
          ? "Preparing spatial room"
          : `Preparing spatial room · ${Math.round(progress * 100)}%`;
      },
      onReady: () => {
        if (privateRoomStatus) privateRoomStatus.textContent = "Spatial room ready";
      },
      onSkip: ({ reason }) => setPrivateRoomFallback(reason),
      onError: () => setPrivateRoomFallback("load-error")
    });
  } catch (error) {
    setPrivateRoomFallback("module-error");
  }
};

if (installation && privateRoomStage) {
  if ("IntersectionObserver" in window) {
    privateRoomImportObserver = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) loadPrivateRoomExperience();
    }, { rootMargin: "500px 0px", threshold: 0.01 });
    privateRoomImportObserver.observe(installation);
  } else {
    loadPrivateRoomExperience();
  }
}

window.addEventListener("pagehide", () => privateRoomController?.destroy?.(), { once: true });

prepareCinematicOpening();
startOpening();
updateScrollEffects();
window.requestAnimationFrame(() => body.classList.add("site-ready"));

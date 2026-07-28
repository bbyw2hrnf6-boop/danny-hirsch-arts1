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
const roomEnter = document.querySelector("[data-room-enter]");
const roomExperience = document.querySelector("[data-room-experience]");
const roomExperienceStage = document.querySelector("[data-room-experience-stage]");
const roomExperienceClose = document.querySelector("[data-room-close]");
const roomExperiencePrev = document.querySelector("[data-room-prev]");
const roomExperienceNext = document.querySelector("[data-room-next]");
const roomExperienceLabel = document.querySelector("[data-room-view-label]");
const roomExperienceViews = ["left", "center", "right"].map((view) => [
  document.querySelector(`.room-experience__view--${view}`),
  document.querySelector(`.room-experience__view--light-${view}`)
].filter(Boolean));
const roomExperienceTheme = document.querySelector("[data-room-theme]");
const roomExperienceKicker = roomExperience?.querySelector(".room-experience__header p");
const roomExperienceHeading = document.querySelector("#room-experience-title");
const roomExperienceFallbackControls = document.querySelector("[data-room-fallback-controls]");
const galleryMount = document.querySelector("[data-gallery-webgl]");
const galleryLoading = document.querySelector("[data-gallery-loading]");
const galleryLoadingTitle = document.querySelector("[data-gallery-loading-title]");
const galleryLoadingPercent = document.querySelector("[data-gallery-loading-percent]");
const galleryLoadingStatus = document.querySelector("[data-gallery-loading-status]");
const galleryLoadingPhase = document.querySelector("[data-gallery-loading-phase]");
const galleryLoadingDetail = document.querySelector("[data-gallery-loading-detail]");
const galleryLoadingLive = document.querySelector("[data-gallery-loading-live]");
const galleryLoadingProgress = document.querySelector("[data-gallery-progress]");
const galleryLoadingContinue = document.querySelector("[data-gallery-loading-continue]");
const galleryControls = document.querySelector("[data-gallery-controls]");
const galleryViewPrev = document.querySelector("[data-gallery-view-prev]");
const galleryViewNext = document.querySelector("[data-gallery-view-next]");
const galleryReset = document.querySelector("[data-gallery-reset]");
const galleryArtKicker = document.querySelector("[data-gallery-art-kicker]");
const galleryArtTitle = document.querySelector("[data-gallery-art-title]");
const galleryArtDetail = document.querySelector("[data-gallery-art-detail]");
const galleryArtCard = document.querySelector("[data-gallery-art-card]");
const galleryArtImage = document.querySelector("[data-gallery-art-image]");
const galleryArtIndex = document.querySelector("[data-gallery-art-index]");
const galleryArtFacts = document.querySelector("[data-gallery-art-facts]");
const galleryArtYear = document.querySelector("[data-gallery-art-year]");
const galleryArtMedium = document.querySelector("[data-gallery-art-medium]");
const galleryArtDimensions = document.querySelector("[data-gallery-art-dimensions]");
const galleryArtAvailability = document.querySelector("[data-gallery-art-availability]");
const galleryArtInspect = document.querySelector("[data-gallery-art-inspect]");
const gallerySurfaceLens = document.querySelector("[data-gallery-surface-lens]");
const gallerySurfaceLensView = document.querySelector("[data-gallery-surface-lens-view]");
const galleryLensImage = document.querySelector("[data-gallery-lens-image]");
const galleryScale = document.querySelector("[data-gallery-scale]");
const galleryScaleCopy = document.querySelector("[data-gallery-scale-copy]");
const galleryGuided = document.querySelector("[data-gallery-guided]");
const galleryMemoryStatus = document.querySelector("[data-gallery-memory-status]");
const galleryMemoryCount = document.querySelector("[data-gallery-memory-count]");
const galleryTransition = document.querySelector("[data-gallery-transition]");
const galleryTransitionLabel = document.querySelector("[data-gallery-transition-label]");
const gallerySitePanel = document.querySelector("[data-gallery-site-panel]");
const gallerySiteKicker = document.querySelector("[data-gallery-site-kicker]");
const gallerySiteTitle = document.querySelector("[data-gallery-site-title]");
const gallerySiteBody = document.querySelector("[data-gallery-site-body]");
const gallerySiteLink = document.querySelector("[data-gallery-site-link]");
const gallerySiteClose = document.querySelector("[data-gallery-site-close]");
const galleryDemoNav = document.querySelector("[data-gallery-demo-nav]");
const galleryDemoArt = document.querySelector("[data-gallery-demo-art]");
const galleryDemoRooms = [...document.querySelectorAll("[data-gallery-demo-room]")];
const galleryDemoPanels = [...document.querySelectorAll("[data-gallery-demo-panel]")];
const galleryMotionLook = document.querySelector("[data-gallery-motion-look]");
const galleryAmbientToggle = document.querySelector("[data-gallery-ambient]");
const galleryAmbientLabel = document.querySelector("[data-gallery-ambient-label]");
const experienceChoice = document.querySelector("[data-experience-choice]");
const experienceClassic = document.querySelector("[data-experience-classic]");
const experienceSpatial = document.querySelector("[data-experience-3d]");
const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileNavigation = window.matchMedia("(max-width: 1120px)");
const mobileSpatialHud = window.matchMedia("(max-width: 760px), (max-height: 560px) and (pointer: coarse)");
const emptyImageSrc = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

let lastScrollY = window.scrollY;
let scrollTicking = false;
let openingFinished = false;
let experienceChoiceResolved = false;
let openingTimers = [];
let activeLightboxIndex = -1;
let activeLightboxTrigger = null;
let lightboxCloseTimer = null;
let ambientContext = null;
let ambientMaster = null;
let ambientIsOn = false;
let ambientStartedFromRoom = false;
let ambientDisposeTimer = null;
let ambientSources = [];
let ambientNodes = [];
let ambientLounge = null;
let privateRoomController = null;
let privateRoomImportObserver = null;
let galleryRoomController = null;
let galleryRoomLoadingPromise = null;
let galleryLoadingHideTimer = null;
let galleryLoadingAnnouncementBand = -1;
let galleryFocusedArtwork = null;
let galleryDemoActive = false;
let galleryLensOpen = false;
let galleryFocusMode = false;
let spatialAudio = null;
let lastSpatialAudioSnapshot = null;
let roomInteractionUntil = 0;
let roomExperienceIndex = 1;
let roomExperienceTrigger = null;
let roomExperiencePointer = null;
let roomExperiencePointerFrame = 0;

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
  galleryRoomController?.setTheme?.(nextTheme);
  if (roomExperienceTheme) {
    const roomIsLight = nextTheme === "light";
    roomExperienceTheme.setAttribute("aria-label", `Switch room to ${roomIsLight ? "dark" : "light"} theme`);
    const label = roomExperienceTheme.querySelector("b");
    if (label) label.textContent = roomIsLight ? "Dark" : "Light";
  }
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

const setExperienceBackgroundInert = (inert) => {
  [header, pageMain, pageFooter].forEach((element) => {
    if (element) element.inert = inert;
  });
};

const hideExperienceChoice = () => {
  if (!experienceChoice) return;
  experienceChoice.hidden = true;
  body.classList.remove("experience-choice-open");
  setExperienceBackgroundInert(false);
};

const showExperienceChoice = () => {
  if (!experienceChoice || experienceChoiceResolved || window.location.hash) return;
  const requestedView = new URLSearchParams(window.location.search).get("view");
  if (requestedView === "classic") {
    experienceChoiceResolved = true;
    hideExperienceChoice();
    return;
  }
  experienceChoice.hidden = false;
  body.classList.add("experience-choice-open");
  setExperienceBackgroundInert(true);
  window.requestAnimationFrame(() => experienceClassic?.focus({ preventScroll: true }));
};

const resolveOpeningDestination = () => {
  const requestedView = new URLSearchParams(window.location.search).get("view");
  if (requestedView === "3d" && !reducedMotion.matches) {
    experienceChoiceResolved = true;
    hideExperienceChoice();
    window.setTimeout(() => openRoomExperience({ trigger: experienceSpatial, spatial: true }), 80);
    return;
  }
  showExperienceChoice();
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
  resolveOpeningDestination();
};

const shouldSkipOpening = () => {
  const introPreference = new URLSearchParams(window.location.search).get("intro");
  return reducedMotion.matches || introPreference === "0" || Boolean(window.location.hash);
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
  roomCamera.style.setProperty("--room-scale", (0.91 + progress * 0.13).toFixed(4));
  roomCamera.style.setProperty("--room-y", `${((0.5 - progress) * 34).toFixed(1)}px`);
  if (performance.now() > roomInteractionUntil) {
    const lateral = clamp((progress - 0.5) * 1.25, -0.62, 0.62);
    roomCamera.style.setProperty("--room-view-left", Math.max(0, -lateral).toFixed(3));
    roomCamera.style.setProperty("--room-view-right", Math.max(0, lateral).toFixed(3));
  }
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

const setRoomCinematicPosition = (event) => {
  if (!roomCamera || reducedMotion.matches) return;
  const rect = roomCamera.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  const lateral = (x - 0.5) * 1.55;
  roomInteractionUntil = performance.now() + 2400;
  roomCamera.style.setProperty("--pointer-x", `${(x * 100).toFixed(2)}%`);
  roomCamera.style.setProperty("--pointer-y", `${(y * 100).toFixed(2)}%`);
  roomCamera.style.setProperty("--shift-x", `${((x - 0.5) * (finePointer.matches ? 11 : 18)).toFixed(2)}px`);
  roomCamera.style.setProperty("--shift-y", `${((y - 0.5) * (finePointer.matches ? 8 : 12)).toFixed(2)}px`);
  roomCamera.style.setProperty("--room-view-left", Math.max(0, -lateral).toFixed(3));
  roomCamera.style.setProperty("--room-view-right", Math.max(0, lateral).toFixed(3));
};

roomCamera?.addEventListener("pointerdown", setRoomCinematicPosition, { passive: true });
roomCamera?.addEventListener("pointermove", setRoomCinematicPosition, { passive: true });

const setRoomExperienceView = (index) => {
  if (!roomExperienceStage) return;
  roomExperienceIndex = clamp(index, 0, roomExperienceViews.length - 1);
  roomExperienceViews.forEach((views, viewIndex) => {
    views.forEach((view) => view.classList.toggle("is-active", viewIndex === roomExperienceIndex));
  });
  roomExperienceStage.style.setProperty("--experience-pan", String(roomExperienceIndex - 1));
  if (roomExperienceLabel) {
    const names = ["Left · 01", "Center · 02", "Right · 03"];
    roomExperienceLabel.textContent = names[roomExperienceIndex];
  }
  if (roomExperiencePrev) roomExperiencePrev.disabled = roomExperienceIndex === 0;
  if (roomExperienceNext) roomExperienceNext.disabled = roomExperienceIndex === roomExperienceViews.length - 1;
};

const setRoomExperiencePosition = (event) => {
  if (!roomExperienceStage || reducedMotion.matches || roomExperience?.classList.contains("is-webgl-ready")) return;
  const rect = roomExperienceStage.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  roomExperienceStage.style.setProperty("--experience-x", `${(x * 100).toFixed(2)}%`);
  roomExperienceStage.style.setProperty("--experience-y", `${(y * 100).toFixed(2)}%`);
  roomExperienceStage.style.setProperty("--experience-shift-x", `${((x - 0.5) * (finePointer.matches ? 24 : 34)).toFixed(2)}px`);
  roomExperienceStage.style.setProperty("--experience-shift-y", `${((y - 0.5) * (finePointer.matches ? 15 : 22)).toFixed(2)}px`);
};

const queueRoomExperiencePosition = (event) => {
  if (roomExperiencePointerFrame) return;
  const point = { clientX: event.clientX, clientY: event.clientY };
  roomExperiencePointerFrame = window.requestAnimationFrame(() => {
    roomExperiencePointerFrame = 0;
    setRoomExperiencePosition(point);
  });
};

const syncGalleryNavAvailability = () => {
  if (!galleryDemoNav) return;
  const overlayActive = roomExperience?.classList.contains("has-site-panel-focus");
  galleryDemoNav.inert = Boolean(mobileSpatialHud.matches && overlayActive);
};
mobileSpatialHud.addEventListener?.("change", syncGalleryNavAvailability);

const galleryArtworkAccents = {
  "artwork-01": "#b9a53b",
  "artwork-02": "#9e6875",
  "artwork-03": "#b77d50",
  "artwork-04": "#527d86",
  "artwork-05": "#3f82a1",
  "artwork-06": "#8c745f",
  "gallery-04": "#4e8b8c",
};

const galleryAssetStem = (path = "") => path.split("/").pop()?.replace(/\.[^.]+$/, "").toLowerCase() || "";

const galleryOptimizedAsset = (path = "") => {
  if (!path) return "assets/cinematic/threshold-room-center.webp";
  if (path.startsWith("assets/optimized/")) return path;
  const match = path.match(/^assets\/(artworks|gallery)\/([^/]+)\.[^.]+$/i);
  return match ? `assets/optimized/${match[1].toLowerCase()}/${match[2]}.webp` : path;
};

const setGalleryLensOpen = (open) => {
  galleryLensOpen = Boolean(open && galleryFocusedArtwork && !gallerySurfaceLens?.disabled);
  if (gallerySurfaceLens) gallerySurfaceLens.setAttribute("aria-pressed", String(galleryLensOpen));
  if (gallerySurfaceLensView) {
    gallerySurfaceLensView.hidden = !galleryLensOpen;
    gallerySurfaceLensView.setAttribute("aria-hidden", String(!galleryLensOpen));
  }
  galleryArtCard?.classList.toggle("has-surface-lens", galleryLensOpen);
};

const updateGalleryLensPosition = (event) => {
  if (!galleryLensOpen || !gallerySurfaceLensView) return;
  const rect = gallerySurfaceLensView.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const x = clamp((event.clientX - rect.left) / rect.width, 0, 1);
  const y = clamp((event.clientY - rect.top) / rect.height, 0, 1);
  gallerySurfaceLensView.style.setProperty("--lens-x", `${(x * 100).toFixed(1)}%`);
  gallerySurfaceLensView.style.setProperty("--lens-y", `${(y * 100).toFixed(1)}%`);
};

gallerySurfaceLens?.addEventListener("click", () => setGalleryLensOpen(!galleryLensOpen));
gallerySurfaceLensView?.addEventListener("pointermove", updateGalleryLensPosition, { passive: true });
gallerySurfaceLensView?.addEventListener("pointerdown", updateGalleryLensPosition, { passive: true });

const setGalleryArtworkVisual = (artwork, isDetail = false) => {
  const stem = galleryAssetStem(artwork?.source);
  if (galleryArtImage) {
    galleryArtImage.src = galleryOptimizedAsset(artwork?.source);
    galleryArtImage.alt = artwork
      ? `${isDetail ? "Magnified surface study from" : "Preview of"} ${artwork.title || "a Danny Hirsch artwork"}`
      : "";
  }
  if (galleryArtIndex) {
    const workNumber = stem.match(/artwork-(\d+)/)?.[1];
    galleryArtIndex.textContent = isDetail
      ? "Surface study"
      : /wartrobe|gallery-04/i.test(`${stem} ${artwork?.title || ""}`)
        ? "Art object"
        : workNumber
          ? `Work ${workNumber.padStart(2, "0")}`
          : "Original work";
  }
  if (galleryArtCard) {
    if (artwork) galleryArtCard.style.setProperty("--room-art-accent", galleryArtworkAccents[stem] || "#c6a36b");
    else {
      galleryArtCard.style.removeProperty("--room-art-accent");
      galleryArtCard.dataset.proximity = "ambient";
    }
  }
};

const setGalleryArtwork = (artwork) => {
  galleryFocusedArtwork = artwork;
  roomExperience?.classList.toggle("has-artwork-focus", Boolean(artwork));
  syncGalleryNavAvailability();
  if (!galleryArtTitle || !galleryArtDetail || !galleryArtInspect) return;

  if (!artwork) {
    setGalleryLensOpen(false);
    setGalleryArtworkVisual(null);
    if (galleryArtKicker) galleryArtKicker.textContent = "Spatial gallery";
    if (galleryArtIndex) galleryArtIndex.textContent = "Room view";
    galleryArtTitle.textContent = "Move through the gallery";
    galleryArtDetail.textContent = "Turn toward a surface. The dossier will respond when a genuine work enters your view.";
    if (galleryArtFacts) galleryArtFacts.hidden = true;
    galleryArtInspect.disabled = true;
    galleryArtInspect.dataset.galleryTrigger = "";
    if (gallerySurfaceLens) gallerySurfaceLens.disabled = true;
    if (galleryScale) galleryScale.hidden = true;
    return;
  }

  const isDetail = /detail|surface/i.test(artwork.representation || artwork.detail || "");
  setGalleryArtworkVisual(artwork, isDetail);
  setGalleryLensOpen(false);
  const sourceStem = galleryAssetStem(artwork.source);
  if (galleryLensImage) {
    galleryLensImage.src = galleryOptimizedAsset(artwork.source);
    galleryLensImage.style.setProperty(
      "--relief-map",
      sourceStem.match(/^artwork-\d+$/)
        ? `url("assets/materials/pbr/${sourceStem}-height.webp")`
        : `url("${galleryOptimizedAsset(artwork.source)}")`
    );
  }
  if (gallerySurfaceLens) gallerySurfaceLens.disabled = !artwork.source;
  if (galleryScale && galleryScaleCopy) {
    galleryScale.hidden = !artwork.dimensions;
    galleryScaleCopy.textContent = artwork.dimensions
      ? `${artwork.dimensions} · physical reference`
      : "Catalogue scale";
  }
  if (galleryArtKicker) galleryArtKicker.textContent = isDetail ? "Genuine surface detail" : "In view";
  galleryArtTitle.textContent = artwork.title || "Danny Hirsch artwork";
  galleryArtDetail.textContent = isDetail
    ? `Magnified surface study · not shown to scale.${artwork.description ? ` ${artwork.description}` : " Genuine surface photography from the collection."}`
    : artwork.description || (
      /wartrobe/i.test(`${artwork.id || ""} ${artwork.title || ""}`)
        ? "Genuine wARTrobe photography in a modeled gallery."
        : "Genuine artwork photography in a modeled gallery.");
  const setFact = (node, value) => {
    if (!node) return;
    node.textContent = value || "—";
    node.closest("div")?.toggleAttribute("hidden", !value);
  };
  setFact(galleryArtYear, artwork.year);
  setFact(galleryArtMedium, artwork.medium);
  setFact(galleryArtDimensions, artwork.dimensions);
  setFact(galleryArtAvailability, artwork.availability);
  if (galleryArtFacts) galleryArtFacts.hidden = ![artwork.year, artwork.medium, artwork.dimensions, artwork.availability].some(Boolean);

  const expected = galleryAssetStem(artwork.source);
  const trigger = lightboxTriggers.find((item) => {
    const source = item.dataset.lightboxSrc || item.getAttribute("href") || "";
    return expected && galleryAssetStem(source) === expected;
  });
  if (trigger?.dataset.lightboxTitle) {
    galleryArtTitle.textContent = isDetail
      ? `${trigger.dataset.lightboxTitle} · detail`
      : trigger.dataset.lightboxTitle;
  }
  galleryArtInspect.disabled = !trigger;
  galleryArtInspect.dataset.galleryTrigger = trigger ? String(lightboxTriggers.indexOf(trigger)) : "";
};

const setGallerySitePanel = (panel) => {
  roomExperience?.classList.toggle("has-site-panel-focus", Boolean(panel));
  syncGalleryNavAvailability();
  if (!gallerySitePanel) return;
  if (!panel) {
    gallerySitePanel.hidden = true;
    return;
  }
  gallerySitePanel.hidden = false;
  if (gallerySiteKicker) gallerySiteKicker.textContent = panel.kicker || "Spatial exhibition";
  if (gallerySiteTitle) gallerySiteTitle.textContent = panel.title || "Room information";
  if (gallerySiteBody) gallerySiteBody.textContent = panel.body || "";
  if (gallerySiteLink) {
    gallerySiteLink.href = panel.link || "#about";
    gallerySiteLink.firstChild.textContent = `${panel.linkLabel || "Open information"} `;
  }
};

const setGalleryDemo = (active) => {
  galleryDemoActive = Boolean(active);
  roomExperience?.classList.toggle("is-demo-mode", galleryDemoActive);
  if (roomExperienceKicker) roomExperienceKicker.textContent = galleryDemoActive
    ? "Interactive 3D Gallery · Spatial site"
    : "Private Room · 360° gallery";
  if (roomExperienceHeading) roomExperienceHeading.textContent = galleryDemoActive
    ? "Walk into the art."
    : "Walk into the work.";
  roomExperienceClose?.setAttribute("aria-label", galleryDemoActive ? "Return to the classic site" : "Leave private room");
  if (galleryDemoNav) galleryDemoNav.hidden = !galleryDemoActive;
  if (!galleryDemoActive) setGallerySitePanel(null);
  galleryRoomController?.setDemoMode?.(galleryDemoActive);
  if (galleryDemoActive) galleryRoomController?.goToDemoRoom?.("gallery-hall");
};

const updateGalleryLoading = ({
  state = "loading",
  percent = null,
  title = "Opening the spatial exhibition",
  status = "Preparing the entrance",
  phase = "01 / 03",
  detail = "The gallery is loading its architecture, genuine artwork photography, and light.",
  announce = false,
} = {}) => {
  if (!galleryLoading) return;
  const hasPercent = Number.isFinite(percent);
  const safePercent = hasPercent ? Math.round(clamp(Number(percent), 0, 100)) : null;

  galleryLoading.hidden = false;
  galleryLoading.dataset.state = state;
  galleryLoading.style.setProperty("--gallery-load-progress", `${safePercent ?? 0}%`);
  if (galleryLoadingTitle) galleryLoadingTitle.textContent = title;
  if (galleryLoadingStatus) galleryLoadingStatus.textContent = status;
  if (galleryLoadingPhase) galleryLoadingPhase.textContent = phase;
  if (galleryLoadingDetail) galleryLoadingDetail.textContent = detail;
  if (galleryLoadingPercent) {
    galleryLoadingPercent.textContent = hasPercent ? `${safePercent}%` : "—";
  }
  if (galleryLoadingProgress) {
    if (hasPercent) {
      galleryLoadingProgress.setAttribute("aria-valuenow", String(safePercent));
      galleryLoadingProgress.setAttribute("aria-valuetext", `${safePercent} percent. ${status}`);
    } else {
      galleryLoadingProgress.removeAttribute("aria-valuenow");
      galleryLoadingProgress.setAttribute("aria-valuetext", status);
    }
    galleryLoadingProgress.toggleAttribute("data-indeterminate", !hasPercent);
  }
  if (galleryLoadingContinue) galleryLoadingContinue.hidden = state !== "fallback";

  const announcementBand = hasPercent ? Math.floor(safePercent / 25) : -1;
  const crossedMilestone = state === "loading"
    && announcementBand > galleryLoadingAnnouncementBand
    && safePercent > 0;
  if (crossedMilestone) galleryLoadingAnnouncementBand = announcementBand;
  if (galleryLoadingLive && (announce || crossedMilestone)) {
    galleryLoadingLive.textContent = announce
      ? `${title}. ${status}.`
      : `Interactive gallery ${Math.min(announcementBand * 25, 100)} percent loaded.`;
  }
};

const beginGalleryLoading = () => {
  if (!roomExperience || !galleryLoading) return;
  window.clearTimeout(galleryLoadingHideTimer);
  galleryLoadingAnnouncementBand = -1;
  roomExperience.classList.remove("is-gallery-fallback", "is-gallery-load-error", "is-webgl-ready");
  roomExperience.classList.add("is-gallery-loading");
  roomExperience.setAttribute("aria-busy", "true");
  updateGalleryLoading({
    state: "loading",
    percent: 0,
    title: "Opening the spatial exhibition",
    status: "Loading the gallery engine",
    phase: "01 / 03",
    detail: "A detailed spatial scene is being prepared for this device.",
    announce: true,
  });
};

const completeGalleryLoading = () => {
  if (!roomExperience || !galleryLoading) return;
  roomExperience.setAttribute("aria-busy", "false");
  updateGalleryLoading({
    state: "ready",
    percent: 100,
    title: "The gallery is ready",
    status: "Entering the exhibition",
    phase: "03 / 03",
    detail: "Architecture, artwork, light, and movement are now live.",
    announce: true,
  });
  window.clearTimeout(galleryLoadingHideTimer);
  galleryLoadingHideTimer = window.setTimeout(() => {
    roomExperience.classList.remove("is-gallery-loading");
    galleryLoading.hidden = true;
  }, reducedMotion.matches ? 80 : 620);
};

const dismissGalleryFallbackNotice = () => {
  if (!galleryLoading || !roomExperience) return;
  roomExperience.classList.remove("is-gallery-load-error");
  roomExperience.setAttribute("aria-busy", "false");
  galleryLoading.hidden = true;
  roomExperienceClose?.focus({ preventScroll: true });
};

const setGalleryFallback = (reason = "fallback") => {
  if (!roomExperience) return;
  const requestedSpatialExperience = galleryDemoActive;
  if (requestedSpatialExperience) setGalleryDemo(false);
  roomExperience.classList.remove("is-gallery-loading", "is-webgl-ready");
  roomExperience.classList.add("is-gallery-fallback", "is-gallery-load-error");
  roomExperience.setAttribute("aria-busy", "false");
  if (galleryControls) galleryControls.hidden = true;
  if (roomExperienceFallbackControls) roomExperienceFallbackControls.hidden = false;
  const fallbackCopy = reason === "reduced-motion"
    ? {
        title: "A calmer room is ready",
        status: "Reduced-motion preference respected",
        detail: "The cinematic still gallery is available without live camera movement.",
      }
    : reason === "save-data"
      ? {
          title: "A lighter room is ready",
          status: "Data-saving preference respected",
          detail: "The high-resolution 3D scene stayed unloaded; the curated still gallery remains available.",
        }
      : reason === "webgl2-unavailable"
        ? {
            title: "The still gallery is ready",
            status: "Live 3D is unavailable in this browser",
            detail: "You can continue through the complete curated room without WebGL.",
          }
        : {
            title: "The still gallery is ready",
            status: "The live room could not finish loading",
            detail: "Nothing is lost—the curated room and the complete classic exhibition remain available.",
          };
  updateGalleryLoading({
    state: "fallback",
    percent: null,
    phase: "Alternative view",
    announce: true,
    ...fallbackCopy,
  });
  if (requestedSpatialExperience) {
    setGalleryArtwork(null);
    if (galleryArtKicker) galleryArtKicker.textContent = "Classic fallback";
    if (galleryArtTitle) galleryArtTitle.textContent = "Curated room view";
    if (galleryArtDetail) galleryArtDetail.textContent = "The live 3D gallery is unavailable on this device. The classic exhibition remains fully accessible.";
  }
};

const ensureGalleryRoom = () => {
  if (!roomExperience || !galleryMount) return Promise.resolve(null);
  if (galleryRoomController) return Promise.resolve(galleryRoomController);
  if (galleryRoomLoadingPromise) return galleryRoomLoadingPromise;
  if (reducedMotion.matches) {
    setGalleryFallback("reduced-motion");
    return Promise.resolve(null);
  }

  if (!roomExperience.classList.contains("is-gallery-loading")) beginGalleryLoading();
  setGalleryArtwork(null);
  galleryRoomLoadingPromise = import("./DannyHirschArtsGallery3D.js?v=20260728-memory-02")
    .then(({ initWalkableGallery3D }) => {
      galleryRoomController = initWalkableGallery3D({
        root: roomExperience,
        mount: galleryMount,
        modelUrl: "assets/cinematic/danny-gallery-360-ktx2.glb?v=20260728-memory-02",
        theme: body.dataset.theme,
        onLoading: ({ progress, percent, loaded, total, phase: loadingPhase }) => {
          const actualPercent = Number.isFinite(percent)
            ? percent
            : Number.isFinite(progress)
              ? progress * 100
              : null;
          const transferred = Number.isFinite(loaded) && Number.isFinite(total) && total > 0
            ? `${(loaded / 1048576).toFixed(1)} of ${(total / 1048576).toFixed(1)} MB received`
            : "The room is travelling securely to this device.";
          const compiling = loadingPhase === "compiling";
          const assembling = loadingPhase === "assembling" || compiling;
          updateGalleryLoading({
            state: "loading",
            percent: actualPercent,
            title: compiling ? "Warming light and reflections" : assembling ? "Composing the room" : "Loading architecture and artwork",
            status: compiling ? "Preparing compressed surfaces and the room memory" : assembling ? "Applying materials, light, and movement" : "Receiving the Blender-built gallery",
            phase: assembling ? "03 / 03" : "02 / 03",
            detail: compiling ? "The final shader and reflection pass prevents stutter on your first steps." : assembling ? "The scene is downloaded. Its spatial layers are now being prepared by the graphics processor." : transferred,
            announce: assembling,
          });
        },
        onReady: () => {
          roomExperience.classList.remove("is-gallery-fallback", "is-gallery-load-error");
          roomExperience.classList.add("is-webgl-ready");
          if (galleryControls) galleryControls.hidden = false;
          if (roomExperienceFallbackControls) roomExperienceFallbackControls.hidden = true;
          galleryRoomController?.setTheme?.(body.dataset.theme);
          galleryRoomController?.setDemoMode?.(galleryDemoActive);
          if (galleryDemoActive) galleryRoomController?.goToDemoRoom?.("gallery-hall");
          galleryRoomController?.setActive?.(roomExperience.open);
          completeGalleryLoading();
        },
        onSkip: ({ reason }) => setGalleryFallback(reason),
        onError: () => {
          galleryRoomController = null;
          galleryRoomLoadingPromise = null;
          setGalleryFallback("load-error");
        },
        onArtworkFocus: setGalleryArtwork,
        onFocusMode: ({ active }) => {
          galleryFocusMode = Boolean(active);
          roomExperience?.classList.toggle("is-museum-focus", galleryFocusMode);
          if (ambientContext && ambientMaster && ambientIsOn) {
            const now = ambientContext.currentTime;
            ambientMaster.gain.setTargetAtTime(galleryFocusMode ? 0.034 : 0.05, now, 0.55);
          }
        },
        onMemoryChange: ({ count, ready: memoryReady }) => {
          if (galleryMemoryStatus) galleryMemoryStatus.hidden = !galleryDemoActive && count === 0;
          if (galleryMemoryCount) galleryMemoryCount.textContent = memoryReady ? "Memory formed" : `${count} / 3`;
          galleryMemoryStatus?.classList.toggle("is-complete", Boolean(memoryReady));
        },
        onSpatialAudio: (snapshot) => {
          lastSpatialAudioSnapshot = snapshot;
          spatialAudio?.update?.(snapshot);
        },
        onTransition: ({ active, label }) => {
          galleryTransition?.classList.toggle("is-active", Boolean(active));
          if (galleryTransitionLabel && label) galleryTransitionLabel.textContent = label;
        },
        onGuidedTour: ({ active }) => {
          galleryGuided?.setAttribute("aria-pressed", String(Boolean(active)));
          if (galleryGuided) galleryGuided.textContent = active ? "Pause tour" : "Guided exhibition";
        },
        onSitePanelFocus: setGallerySitePanel,
        onDemoModeChange: ({ active }) => {
          galleryDemoActive = Boolean(active);
          roomExperience?.classList.toggle("is-demo-mode", galleryDemoActive);
        },
        onNavigationChange: ({ id }) => {
          [...galleryDemoRooms, ...galleryDemoPanels, galleryDemoArt].filter(Boolean).forEach((button) => {
            const buttonId = button.dataset.galleryDemoRoom
              || button.dataset.galleryDemoPanel
              || (button.hasAttribute("data-gallery-demo-art") ? "artworks" : "");
            const current = buttonId === id;
            if (current) button.setAttribute("aria-current", "location");
            else button.removeAttribute("aria-current");
            button.classList.toggle("is-active", current);
          });
        },
        onMotionState: ({ granted, supported }) => {
          if (!galleryMotionLook) return;
          galleryMotionLook.setAttribute("aria-pressed", String(Boolean(granted)));
          galleryMotionLook.toggleAttribute("data-motion-unsupported", supported === false);
        },
        onViewChange: ({ label }) => {
          if (!label || galleryFocusedArtwork) return;
          if (galleryArtKicker) galleryArtKicker.textContent = "Curated viewpoint";
          if (galleryArtTitle) galleryArtTitle.textContent = label;
        }
      });
      return galleryRoomController;
    })
    .catch(() => {
      galleryRoomController = null;
      galleryRoomLoadingPromise = null;
      setGalleryFallback("module-error");
      return null;
    });
  return galleryRoomLoadingPromise;
};

const openRoomExperience = ({ trigger = null, spatial = false } = {}) => {
  if (!roomExperience) return;
  roomExperienceTrigger = trigger || document.activeElement || roomEnter;
  if (!galleryRoomController && !galleryRoomLoadingPromise) beginGalleryLoading();
  setGalleryDemo(spatial);
  setRoomExperienceView(1);
  body.classList.add("room-experience-open");
  if (typeof roomExperience.showModal === "function") roomExperience.showModal();
  else roomExperience.setAttribute("open", "");
  roomExperienceClose?.focus({ preventScroll: true });
  if (!spatial) galleryRoomController?.resetView?.();
  galleryRoomController?.setActive?.(true);
  ensureGalleryRoom();
};

const closeRoomExperience = () => {
  if (!roomExperience?.open) return;
  body.classList.remove("room-experience-open");
  if (ambientStartedFromRoom) stopAmbient({ dispose: true });
  galleryRoomController?.setActive?.(false);
  setGalleryDemo(false);
  if (typeof roomExperience.close === "function") roomExperience.close();
  else {
    roomExperience.removeAttribute("open");
  }
  const returnTarget = roomExperienceTrigger?.offsetParent !== null
    ? roomExperienceTrigger
    : roomEnter || heroContent?.querySelector("a, button");
  returnTarget?.focus({ preventScroll: true });
};

roomEnter?.addEventListener("click", () => openRoomExperience({ trigger: roomEnter, spatial: false }));
experienceClassic?.addEventListener("click", () => {
  experienceChoiceResolved = true;
  hideExperienceChoice();
  heroContent?.querySelector("a, button")?.focus({ preventScroll: true });
});
experienceSpatial?.addEventListener("click", () => {
  experienceChoiceResolved = true;
  hideExperienceChoice();
  openRoomExperience({ trigger: experienceSpatial, spatial: true });
});
experienceChoice?.addEventListener("keydown", (event) => {
  if (event.key === "Tab") trapFocus(event, experienceChoice);
});
galleryLoadingContinue?.addEventListener("click", dismissGalleryFallbackNotice);
roomExperienceClose?.addEventListener("click", closeRoomExperience);
roomExperiencePrev?.addEventListener("click", () => setRoomExperienceView(roomExperienceIndex - 1));
roomExperienceNext?.addEventListener("click", () => setRoomExperienceView(roomExperienceIndex + 1));
galleryViewPrev?.addEventListener("click", () => galleryRoomController?.goToPreviousView?.());
galleryViewNext?.addEventListener("click", () => galleryRoomController?.goToNextView?.());
galleryReset?.addEventListener("click", () => galleryRoomController?.resetView?.());
galleryGuided?.addEventListener("click", () => galleryRoomController?.toggleGuidedTour?.());
galleryDemoArt?.addEventListener("click", () => galleryRoomController?.goToNextView?.());
galleryDemoRooms.forEach((button) => {
  button.addEventListener("click", () => galleryRoomController?.goToDemoRoom?.(button.dataset.galleryDemoRoom));
});
galleryDemoPanels.forEach((button) => {
  button.addEventListener("click", () => galleryRoomController?.goToSitePanel?.(button.dataset.galleryDemoPanel));
});
galleryMotionLook?.addEventListener("click", async () => {
  const controller = galleryRoomController || await ensureGalleryRoom();
  const result = await controller?.requestMotionControl?.();
  const enabled = Boolean(result?.granted);
  galleryMotionLook.setAttribute("aria-pressed", String(enabled));
  const title = galleryMotionLook.querySelector("b");
  const detail = galleryMotionLook.querySelector("small");
  if (title) title.textContent = enabled ? "Motion active" : "Motion look";
  if (detail) {
    detail.textContent = enabled
      ? "Move phone to look"
      : result?.reason === "denied"
        ? "Permission declined"
        : result?.reason === "secure-context-required"
          ? "HTTPS required"
          : "Not available here";
  }
});
gallerySiteClose?.addEventListener("click", () => setGallerySitePanel(null));
gallerySiteLink?.addEventListener("click", () => {
  if (gallerySiteLink.getAttribute("href")?.startsWith("#")) closeRoomExperience();
});
roomExperienceTheme?.addEventListener("click", () => {
  const nextTheme = body.dataset.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  storage.set("dha-theme", nextTheme);
});
galleryArtInspect?.addEventListener("click", () => {
  const index = Number(galleryArtInspect.dataset.galleryTrigger);
  const trigger = Number.isInteger(index) ? lightboxTriggers[index] : null;
  if (!trigger) return;
  closeRoomExperience();
  window.setTimeout(() => openLightbox(trigger), 80);
});
roomExperienceStage?.addEventListener("pointermove", queueRoomExperiencePosition, { passive: true });
roomExperienceStage?.addEventListener("pointerdown", (event) => {
  if (roomExperience?.classList.contains("is-webgl-ready") || event.target.closest("button, a, [role='slider']")) return;
  roomExperiencePointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
  roomExperienceStage.setPointerCapture?.(event.pointerId);
  setRoomExperiencePosition(event);
});
roomExperienceStage?.addEventListener("pointerup", (event) => {
  if (!roomExperiencePointer || event.pointerId !== roomExperiencePointer.id) return;
  const movement = event.clientX - roomExperiencePointer.x;
  if (Math.abs(movement) > 46) setRoomExperienceView(roomExperienceIndex + (movement < 0 ? 1 : -1));
  roomExperienceStage.releasePointerCapture?.(event.pointerId);
  roomExperiencePointer = null;
});
roomExperienceStage?.addEventListener("pointercancel", () => { roomExperiencePointer = null; });
roomExperience?.addEventListener("close", () => {
  body.classList.remove("room-experience-open");
  if (ambientStartedFromRoom) stopAmbient({ dispose: true });
  galleryRoomController?.setActive?.(false);
  // Escape/native dialog dismissal should match the visible close control.
  setGalleryDemo(false);
  const returnTarget = roomExperienceTrigger?.offsetParent !== null
    ? roomExperienceTrigger
    : roomEnter || heroContent?.querySelector("a, button");
  returnTarget?.focus({ preventScroll: true });
});
roomExperience?.addEventListener("click", (event) => {
  if (event.target === roomExperience) closeRoomExperience();
});

window.addEventListener("keydown", (event) => {
  if (!roomExperience?.open) return;
  if (event.key === "Escape" && galleryLensOpen) {
    event.preventDefault();
    setGalleryLensOpen(false);
    gallerySurfaceLens?.focus();
    return;
  }
  if (event.key === "Tab") trapFocus(event, roomExperience);
  if (roomExperience.classList.contains("is-webgl-ready")) return;
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    setRoomExperienceView(roomExperienceIndex - 1);
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    setRoomExperienceView(roomExperienceIndex + 1);
  }
  if (event.key === "Home") setRoomExperienceView(0);
  if (event.key === "End") setRoomExperienceView(roomExperienceViews.length - 1);
});

setRoomExperienceView(1);

if (finePointer.matches && !reducedMotion.matches) {
  hero?.addEventListener("pointermove", (event) => setPointerPosition(hero, event, 24));
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
  if (ambientToggle) {
    ambientToggle.setAttribute("aria-pressed", String(ambientIsOn));
    ambientToggle.setAttribute("aria-label", ambientIsOn ? "Stop gallery lounge ambience" : "Start gallery lounge ambience");
    const label = ambientToggle.querySelector(".control-label");
    if (label) label.textContent = ambientIsOn ? "Sound on" : "Sound";
  }
  if (galleryAmbientToggle) {
    galleryAmbientToggle.setAttribute("aria-pressed", String(ambientIsOn));
    galleryAmbientToggle.setAttribute("aria-label", ambientIsOn ? "Stop lounge ambience" : "Start lounge ambience");
  }
  if (galleryAmbientLabel) galleryAmbientLabel.textContent = ambientIsOn ? "Lounge on" : "Lounge";
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

const setAudioPosition = (node, position, now) => {
  if (!node || !position) return;
  if (node.positionX) {
    node.positionX.setTargetAtTime(position[0], now, 0.08);
    node.positionY.setTargetAtTime(position[1], now, 0.08);
    node.positionZ.setTargetAtTime(position[2], now, 0.08);
  } else node.setPosition(...position);
};

const createSpatialGallerySound = (context, destination) => {
  const makeZone = ({ position, frequency, level, brown = false }) => {
    const source = createNoiseSource(context, 4, brown);
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createPanner();
    filter.type = brown ? "lowpass" : "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = brown ? 0.45 : 1.2;
    gain.gain.value = level;
    panner.panningModel = "HRTF";
    panner.distanceModel = "inverse";
    panner.refDistance = 1.2;
    panner.maxDistance = 22;
    panner.rolloffFactor = 1.25;
    setAudioPosition(panner, position, context.currentTime);
    source.connect(filter).connect(panner).connect(gain).connect(destination);
    source.start();
    return { source, filter, gain, panner };
  };
  const water = makeZone({ position: [5.9, 1.25, 11.4], frequency: 1180, level: 0.055 });
  const seating = makeZone({ position: [-4.1, 1.2, 12.0], frequency: 260, level: 0.025, brown: true });
  const artwork = makeZone({ position: [0, 1.8, 0], frequency: 1780, level: 0.008 });
  return {
    update(snapshot) {
      if (!snapshot) return;
      const now = context.currentTime;
      const listener = context.listener;
      setAudioPosition(listener, snapshot.position, now);
      const forward = snapshot.forward || [0, 0, -1];
      if (listener.forwardX) {
        listener.forwardX.setTargetAtTime(forward[0], now, 0.06);
        listener.forwardY.setTargetAtTime(forward[1], now, 0.06);
        listener.forwardZ.setTargetAtTime(forward[2], now, 0.06);
        listener.upX.setValueAtTime(0, now);
        listener.upY.setValueAtTime(1, now);
        listener.upZ.setValueAtTime(0, now);
      } else listener.setOrientation(...forward, 0, 1, 0);
      if (snapshot.focusPosition) setAudioPosition(artwork.panner, snapshot.focusPosition, now);
      artwork.gain.gain.setTargetAtTime(snapshot.focused ? 0.011 : 0.002, now, 0.28);
    },
    dispose() {
      [water, seating, artwork].forEach((zone) => {
        try { zone.source.stop(); } catch (error) { /* Already stopped. */ }
        [zone.source, zone.filter, zone.panner, zone.gain].forEach((node) => {
          try { node.disconnect(); } catch (error) { /* Already disconnected. */ }
        });
      });
    }
  };
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
  if (window.DHAGalleryLounge?.create) {
    ambientLounge = window.DHAGalleryLounge.create(ambientContext, master, {
      level: 0.72,
      cutoff: 1420
    });
    ambientLounge.start({ fade: 3.2 }).catch(() => {});
  }
  ambientSources = [air, texture, pulse];
  ambientNodes = [airFilter, airGain, textureFilter, textureGain, pulseGain, master];
  spatialAudio = createSpatialGallerySound(ambientContext, master);
  spatialAudio.update(lastSpatialAudioSnapshot);
  return master;
};

const disposeAmbientSound = () => {
  window.clearTimeout(ambientDisposeTimer);
  ambientDisposeTimer = null;
  ambientLounge?.dispose?.();
  ambientLounge = null;
  spatialAudio?.dispose?.();
  spatialAudio = null;
  ambientSources.forEach((source) => {
    try { source.stop(); } catch (error) { /* Source may already be stopped. */ }
    try { source.disconnect(); } catch (error) { /* A disconnected node is harmless. */ }
  });
  ambientNodes.forEach((node) => {
    try { node.disconnect(); } catch (error) { /* A disconnected node is harmless. */ }
  });
  ambientContext?.close?.().catch?.(() => {});
  ambientSources = [];
  ambientNodes = [];
  ambientMaster = null;
  ambientContext = null;
  ambientIsOn = false;
  ambientStartedFromRoom = false;
  updateAmbientButton();
};

const stopAmbient = ({ dispose = true } = {}) => {
  ambientIsOn = false;
  ambientStartedFromRoom = false;
  if (ambientContext && ambientMaster) {
    const now = ambientContext.currentTime;
    ambientMaster.gain.cancelScheduledValues(now);
    ambientMaster.gain.setTargetAtTime(0, now, 0.16);
  }
  updateAmbientButton();
  window.clearTimeout(ambientDisposeTimer);
  if (dispose) {
    ambientDisposeTimer = window.setTimeout(() => {
      if (!ambientIsOn) disposeAmbientSound();
    }, 520);
  } else ambientContext?.suspend?.().catch?.(() => {});
};

const toggleAmbient = async (origin = "page") => {
  if (!ambientToggle && !galleryAmbientToggle) return;
  if (ambientIsOn) {
    stopAmbient({ dispose: true });
    return;
  }
  window.clearTimeout(ambientDisposeTimer);
  ambientDisposeTimer = null;
  if (!ambientContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    ambientContext = new AudioContext();
    ambientMaster = createAmbientSound();
  }

  ambientIsOn = true;
  ambientStartedFromRoom = origin === "room";
  const now = ambientContext.currentTime;
  ambientMaster.gain.cancelScheduledValues(now);
  ambientMaster.gain.setTargetAtTime(0.05, now, 0.8);
  await ambientContext.resume().catch(() => {});
  updateAmbientButton();
};

themeToggle?.addEventListener("click", () => {
  const nextTheme = body.dataset.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  storage.set("dha-theme", nextTheme);
});

ambientToggle?.addEventListener("click", () => toggleAmbient("page"));
galleryAmbientToggle?.addEventListener("click", () => toggleAmbient("room"));
updateAmbientButton();

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
    }, { rootMargin: "0px" });
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
    galleryRoomController?.destroy?.();
    galleryRoomController = null;
    galleryRoomLoadingPromise = null;
    setGalleryFallback("reduced-motion");
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

const setPrivateRoomRendered = () => {
  if (!installation) return;
  installation.classList.remove("private-room--3d-idle", "private-room--3d-loading", "private-room--3d-ready", "private-room--3d-skipped");
  installation.classList.add("private-room--rendered");
  installation.dataset.privateRoom3d = "rendered";
  installation.dataset.privateRoomFallback = "blender-view-sequence";
  if (privateRoomStatus) privateRoomStatus.textContent = "Spatial room ready";
};

const loadPrivateRoomExperience = async () => {
  if (!installation || !privateRoomStage || privateRoomController) return;
  privateRoomImportObserver?.disconnect();

  const realtimeRequested = new URLSearchParams(window.location.search).get("webgl") === "1";
  if (!realtimeRequested) {
    setPrivateRoomRendered();
    return;
  }

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
    const { initPrivateRoom3D } = await import("./DannyHirschArts3D.js?v=20260722-gallery-25");
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

window.addEventListener("pagehide", () => {
  disposeAmbientSound();
  privateRoomController?.destroy?.();
  galleryRoomController?.destroy?.();
}, { once: true });

prepareCinematicOpening();
startOpening();
updateScrollEffects();
window.requestAnimationFrame(() => body.classList.add("site-ready"));

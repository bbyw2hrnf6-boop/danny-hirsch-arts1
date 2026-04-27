const header = document.querySelector(".site-header");
const heroImage = document.querySelector(".hero-image");
const hero = document.querySelector(".hero");
const atmosphere = document.querySelector(".art-atmosphere");
const scrollProgress = document.querySelector(".scroll-progress");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".site-nav a[href^='#']");
const themeToggle = document.querySelector(".theme-toggle");
const ambientToggle = document.querySelector(".ambient-toggle");
const installation = document.querySelector(".installation");
const pageSections = Array.from(navLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxTitle = document.querySelector(".lightbox-caption strong");
const lightboxCaption = document.querySelector(".lightbox-caption span");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxTriggers = document.querySelectorAll(".js-lightbox-trigger");
let lightboxCloseTimer;
let activeLightboxTrigger;
let scrollTicking = false;
let lastScrollY = window.scrollY;
let ambientContext;
let ambientMaster;
let ambientNodes;
let ambientIsOn = false;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobileHeaderQuery = window.matchMedia("(max-width: 900px)");
const storedTheme = window.localStorage.getItem("dha-theme");
const emptyImageSrc = "data:image/gif;base64,R0lGODlhAQABAAAAACw=";

// Theme state is persisted so returning visitors keep their preferred gallery mode.
const applyTheme = (theme) => {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.body.dataset.theme = nextTheme;
  document.querySelector("meta[name='theme-color']")?.setAttribute("content", nextTheme === "dark" ? "#090a0a" : "#f4f0e8");

  if (themeToggle) {
    const isLight = nextTheme === "light";
    themeToggle.setAttribute("aria-pressed", String(isLight));
    themeToggle.setAttribute("aria-label", `Switch to ${isLight ? "dark luxury" : "light gallery"} theme`);
    const themeToggleText = themeToggle.querySelector("span");
    if (themeToggleText) {
      themeToggleText.textContent = isLight ? "Dark" : "Light";
    }
  }
};

if (storedTheme) {
  applyTheme(storedTheme);
} else {
  applyTheme(document.body.dataset.theme);
}

const setHeaderState = () => {
  if (!header) return;

  const currentScrollY = window.scrollY;
  header.classList.toggle("is-scrolled", currentScrollY > 24);
  header.classList.toggle("is-hidden", !mobileHeaderQuery.matches && currentScrollY > lastScrollY && currentScrollY > 460);
  lastScrollY = currentScrollY;
};

// Subtle scroll motion adds depth without moving layout-critical elements.
const setHeroMotion = () => {
  if (!heroImage || prefersReducedMotion) return;
  const shift = Math.min(window.scrollY * 0.12, 70);
  const fade = Math.max(1 - window.scrollY / 620, 0.35);
  heroImage.style.setProperty("--hero-shift", `${shift}px`);
  hero?.style.setProperty("--hero-grain-shift", `${Math.min(window.scrollY * 0.04, 24)}px`);
  hero?.style.setProperty("--hero-content-shift", `${Math.min(window.scrollY * 0.05, 38)}px`);
  hero?.style.setProperty("--hero-fade", fade.toFixed(3));
};

const setAtmosphereMotion = () => {
  if (prefersReducedMotion) return;

  const ambientShift = Math.min(window.scrollY * 0.035, 180);
  const sectionShift = Math.min(window.scrollY * 0.018, 96);

  atmosphere?.style.setProperty("--ambient-y", `${ambientShift}px`);
  document.documentElement.style.setProperty("--section-art-y", `${sectionShift}px`);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const setRoomMotion = () => {
  if (!installation || prefersReducedMotion) return;

  const rect = installation.getBoundingClientRect();
  const progress = clamp((window.innerHeight - rect.top) / (window.innerHeight + rect.height), 0, 1);
  const centered = progress - 0.5;

  installation.style.setProperty("--room-turn", `${(-7 + progress * 14).toFixed(2)}deg`);
  installation.style.setProperty("--room-tilt", `${(2.2 - progress * 3).toFixed(2)}deg`);
  installation.style.setProperty("--room-lift", `${(centered * -34).toFixed(1)}px`);
  installation.style.setProperty("--room-spin", `${(progress * 220).toFixed(1)}deg`);
  installation.style.setProperty("--room-light-shift", `${(centered * 38).toFixed(1)}px`);
};

const setScrollProgress = () => {
  if (!scrollProgress) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  scrollProgress.style.setProperty("--scroll-progress", progress.toFixed(4));
};

const setActiveNav = () => {
  if (!pageSections.length) return;

  const offset = window.innerHeight * 0.38;
  const activeSection = pageSections.reduce((current, section) => {
    const rect = section.getBoundingClientRect();
    return rect.top - offset <= 0 ? section : current;
  }, pageSections[0]);

  navLinks.forEach((link) => {
    link.classList.toggle("is-active", link.getAttribute("href") === `#${activeSection.id}`);
  });
};

const updateScrollEffects = () => {
  setHeaderState();
  setHeroMotion();
  setAtmosphereMotion();
  setRoomMotion();
  setScrollProgress();
  setActiveNav();
  scrollTicking = false;
};

const requestScrollUpdate = () => {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollEffects);
};

// Shared artwork lightbox for collection and gallery images.
const openLightbox = (trigger) => {
  if (!lightbox || !lightboxImage || !lightboxTitle || !lightboxCaption) return;

  window.clearTimeout(lightboxCloseTimer);
  activeLightboxTrigger = trigger;

  const src = trigger.dataset.lightboxSrc || trigger.getAttribute("href");
  const title = trigger.dataset.lightboxTitle || "Danny Hirsch Arts";
  const caption = trigger.dataset.lightboxCaption || "";

  lightboxImage.src = src;
  lightboxImage.alt = title;
  lightboxTitle.textContent = title;
  lightboxCaption.textContent = caption;
  lightbox.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-lightbox-open");

  window.requestAnimationFrame(() => {
    lightbox.classList.add("is-open");
    lightboxClose?.focus({ preventScroll: true });
  });
};

const closeLightbox = () => {
  if (!lightbox || !lightboxImage) return;

  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-lightbox-open");

  lightboxCloseTimer = window.setTimeout(() => {
    lightboxImage.src = emptyImageSrc;
    lightboxImage.alt = "";
  }, 320);

  activeLightboxTrigger?.focus({ preventScroll: true });
};

if ("IntersectionObserver" in window) {
  // Reveal items once, keeping scroll work light.
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

lightboxTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openLightbox(trigger);
  });
});

lightboxClose?.addEventListener("click", closeLightbox);

lightbox?.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && lightbox?.classList.contains("is-open")) {
    closeLightbox();
  }
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header?.classList.remove("is-hidden");

    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    // Re-align after dynamic embeds, especially the Instagram widget, finish resizing.
    window.setTimeout(() => target.scrollIntoView({ block: "start" }), 700);
    window.setTimeout(() => target.scrollIntoView({ block: "start" }), 1600);
  });
});

const updateAmbientButton = () => {
  if (!ambientToggle) return;

  ambientToggle.setAttribute("aria-pressed", String(ambientIsOn));
  ambientToggle.setAttribute("aria-label", ambientIsOn ? "Stop ambient gallery sound" : "Start ambient gallery sound");
  const label = ambientToggle.querySelector("span");
  if (label) {
    label.textContent = ambientIsOn ? "Quiet" : "Sound";
  }
};

const createNoiseSource = (context, seconds = 4, color = "white") => {
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const channel = buffer.getChannelData(0);
  let low = 0;
  let lower = 0;

  for (let i = 0; i < channel.length; i += 1) {
    const white = Math.random() * 2 - 1;

    if (color === "brown") {
      low = (low + 0.025 * white) / 1.025;
      channel[i] = low * 3.5;
    } else if (color === "wave") {
      lower = lower * 0.995 + white * 0.005;
      low = low * 0.94 + lower * 0.06;
      channel[i] = low * 5.4;
    } else {
      channel[i] = white;
    }
  }

  const source = context.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
};

const createAmbientNodes = () => {
  const context = ambientContext;
  const master = context.createGain();
  master.gain.value = 0;

  const wind = createNoiseSource(context, 7, "brown");
  const windFilter = context.createBiquadFilter();
  const windGain = context.createGain();
  windFilter.type = "lowpass";
  windFilter.frequency.value = 360;
  windFilter.Q.value = 0.8;
  windGain.gain.value = 0.032;
  wind.connect(windFilter).connect(windGain).connect(master);

  const waves = createNoiseSource(context, 9, "wave");
  const waveFilter = context.createBiquadFilter();
  const waveGain = context.createGain();
  const waveLfo = context.createOscillator();
  const waveLfoGain = context.createGain();
  waveFilter.type = "lowpass";
  waveFilter.frequency.value = 180;
  waveGain.gain.value = 0.014;
  waveLfo.frequency.value = 0.075;
  waveLfoGain.gain.value = 0.008;
  waves.connect(waveFilter).connect(waveGain).connect(master);
  waveLfo.connect(waveLfoGain).connect(waveGain.gain);

  const rain = createNoiseSource(context, 5, "brown");
  const rainFilter = context.createBiquadFilter();
  const rainSoften = context.createBiquadFilter();
  const rainGain = context.createGain();
  rainFilter.type = "bandpass";
  rainFilter.frequency.value = 1250;
  rainFilter.Q.value = 0.38;
  rainSoften.type = "lowpass";
  rainSoften.frequency.value = 1900;
  rainGain.gain.value = 0.005;
  rain.connect(rainFilter).connect(rainSoften).connect(rainGain).connect(master);

  const lfo = context.createOscillator();
  const lfoGain = context.createGain();
  lfo.frequency.value = 0.04;
  lfoGain.gain.value = 58;
  lfo.connect(lfoGain).connect(windFilter.frequency);

  master.connect(context.destination);
  wind.start();
  waves.start();
  rain.start();
  waveLfo.start();
  lfo.start();

  return { master, wind, waves, rain, waveLfo, lfo };
};

// Ambient audio is opt-in because browsers block autoplay and quiet pages should stay quiet.
const toggleAmbient = async () => {
  if (!ambientToggle) return;

  if (!ambientContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    ambientContext = new AudioContext();
    ambientNodes = createAmbientNodes();
    ambientMaster = ambientNodes.master;
  }

  ambientIsOn = !ambientIsOn;
  const now = ambientContext.currentTime;
  ambientMaster.gain.cancelScheduledValues(now);
  ambientMaster.gain.setTargetAtTime(ambientIsOn ? 0.052 : 0, now, ambientIsOn ? 0.9 : 0.35);
  updateAmbientButton();

  if (ambientIsOn) {
    ambientContext.resume().catch(() => {});
  }
};

ambientToggle?.addEventListener("click", toggleAmbient);

themeToggle?.addEventListener("click", () => {
  const nextTheme = document.body.dataset.theme === "light" ? "dark" : "light";
  applyTheme(nextTheme);
  window.localStorage.setItem("dha-theme", nextTheme);
});

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);

updateScrollEffects();

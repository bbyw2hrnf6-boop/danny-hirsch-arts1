const header = document.querySelector(".site-header");
const heroImage = document.querySelector(".hero-image");
const hero = document.querySelector(".hero");
const atmosphere = document.querySelector(".art-atmosphere");
const scrollProgress = document.querySelector(".scroll-progress");
const revealItems = document.querySelectorAll(".reveal");
const navLinks = document.querySelectorAll(".site-nav a[href^='#']");
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
let scrollTicking = false;
let lastScrollY = window.scrollY;

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const setHeaderState = () => {
  if (!header) return;

  const currentScrollY = window.scrollY;
  header.classList.toggle("is-scrolled", currentScrollY > 24);
  header.classList.toggle("is-hidden", currentScrollY > lastScrollY && currentScrollY > 460);
  lastScrollY = currentScrollY;
};

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
  setScrollProgress();
  setActiveNav();
  scrollTicking = false;
};

const requestScrollUpdate = () => {
  if (scrollTicking) return;
  scrollTicking = true;
  window.requestAnimationFrame(updateScrollEffects);
};

const openLightbox = (trigger) => {
  if (!lightbox || !lightboxImage || !lightboxTitle || !lightboxCaption) return;

  window.clearTimeout(lightboxCloseTimer);

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
    lightboxImage.src = "";
    lightboxImage.alt = "";
  }, 320);
};

if ("IntersectionObserver" in window) {
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
  });
});

window.addEventListener("scroll", requestScrollUpdate, { passive: true });
window.addEventListener("resize", requestScrollUpdate);

updateScrollEffects();

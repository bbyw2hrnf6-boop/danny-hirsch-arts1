const header = document.querySelector(".site-header");
const heroImage = document.querySelector(".hero-image");
const revealItems = document.querySelectorAll(".reveal");
const lightbox = document.querySelector(".lightbox");
const lightboxImage = document.querySelector(".lightbox-image");
const lightboxTitle = document.querySelector(".lightbox-caption strong");
const lightboxCaption = document.querySelector(".lightbox-caption span");
const lightboxClose = document.querySelector(".lightbox-close");
const lightboxTriggers = document.querySelectorAll(".js-lightbox-trigger");
let lightboxCloseTimer;
let scrollTicking = false;

const setHeaderState = () => {
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 24);
};

const setHeroMotion = () => {
  if (!heroImage) return;
  const shift = Math.min(window.scrollY * 0.12, 70);
  heroImage.style.setProperty("--hero-shift", `${shift}px`);
};

const updateScrollEffects = () => {
  setHeaderState();
  setHeroMotion();
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

updateScrollEffects();

window.addEventListener("scroll", requestScrollUpdate, { passive: true });

(() => {
  const players = document.querySelectorAll(".js-sequence");
  if (!players.length) return;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  const parseFrames = (value) => value
    .split(",")
    .map((frame) => frame.trim())
    .filter(Boolean)
    .slice(0, 65);

  players.forEach((player) => {
    const frames = parseFrames(player.dataset.frames || "");
    const scrollArea = player.querySelector(".sequence-scroll");
    const spacer = player.querySelector(".sequence-spacer");
    const image = player.querySelector(".sequence-frame");
    const current = player.querySelector(".sequence-current");
    const frameHeight = clamp(Number(player.dataset.frameHeight || 78), 36, 180);

    if (!frames.length || !scrollArea || !spacer || !image) return;

    let activeIndex = -1;
    let ticking = false;
    const cache = new Map();

    player.style.setProperty("--sequence-count", String(frames.length));
    scrollArea.style.setProperty("--sequence-frame-height", `${frameHeight}px`);
    spacer.style.height = `${Math.max(frames.length - 1, 1) * frameHeight}px`;

    const preloadFrame = (index) => {
      if (index < 0 || index >= frames.length || cache.has(index)) return;
      const preload = new Image();
      preload.decoding = "async";
      preload.src = frames[index];
      cache.set(index, preload);
    };

    const preloadAround = (index) => {
      for (let offset = -1; offset <= 3; offset += 1) {
        preloadFrame(index + offset);
      }
    };

    const preloadRest = () => {
      let nextIndex = 0;

      const loadChunk = (deadline) => {
        let loaded = 0;

        while (
          nextIndex < frames.length
          && loaded < 3
          && (!deadline || deadline.timeRemaining() > 8 || deadline.didTimeout)
        ) {
          preloadFrame(nextIndex);
          nextIndex += 1;
          loaded += 1;
        }

        if (nextIndex >= frames.length) return;

        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(loadChunk, { timeout: 1200 });
        } else {
          window.setTimeout(() => loadChunk(), 160);
        }
      };

      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(loadChunk, { timeout: 1200 });
      } else {
        window.setTimeout(() => loadChunk(), 160);
      }
    };

    const setFrame = (index) => {
      if (index === activeIndex) return;
      activeIndex = index;
      image.src = frames[index];

      if (current) {
        current.textContent = String(index + 1).padStart(2, "0");
      }

      preloadAround(index);
    };

    const updateFrame = () => {
      const maxScroll = Math.max(scrollArea.scrollHeight - scrollArea.clientHeight, 1);
      const progress = clamp(scrollArea.scrollTop / maxScroll, 0, 1);
      const nextIndex = clamp(Math.round(progress * (frames.length - 1)), 0, frames.length - 1);
      setFrame(nextIndex);
      ticking = false;
    };

    const requestUpdate = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(updateFrame);
    };

    image.src = frames[0];
    preloadAround(0);
    preloadRest();
    updateFrame();
    scrollArea.addEventListener("scroll", requestUpdate, { passive: true });
  });
})();

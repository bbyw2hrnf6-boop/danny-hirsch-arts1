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

    let activeIndex = 0;

    player.style.setProperty("--sequence-count", String(frames.length));
    scrollArea.style.setProperty("--sequence-frame-height", `${frameHeight}px`);
    spacer.style.height = `${Math.max(frames.length - 1, 1) * frameHeight}px`;

    frames.forEach((src) => {
      const preload = new Image();
      preload.src = src;
    });

    const setFrame = (index) => {
      if (index === activeIndex) return;
      activeIndex = index;
      image.src = frames[index];
      image.style.setProperty("--sequence-zoom", (1 + index * 0.004).toFixed(3));

      if (current) {
        current.textContent = String(index + 1).padStart(2, "0");
      }
    };

    const updateFrame = () => {
      const maxScroll = Math.max(scrollArea.scrollHeight - scrollArea.clientHeight, 1);
      const progress = clamp(scrollArea.scrollTop / maxScroll, 0, 1);
      const nextIndex = clamp(Math.round(progress * (frames.length - 1)), 0, frames.length - 1);
      setFrame(nextIndex);
    };

    image.src = frames[0];
    updateFrame();
    scrollArea.addEventListener("scroll", updateFrame, { passive: true });
  });
})();

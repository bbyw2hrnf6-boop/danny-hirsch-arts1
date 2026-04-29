<?php
$artworks = [
    [
        'image' => 'assets/artworks/artwork-01.jpg',
        'title' => 'Yellow Field, Veined',
        'year' => '2026',
        'medium' => 'Mixed Media on Canvas',
        'description' => 'A charged botanical trace held inside a saturated field of light.',
    ],
    [
        'image' => 'assets/artworks/artwork-02.jpg',
        'title' => 'Black Current',
        'year' => '2026',
        'medium' => 'Acrylic on Canvas',
        'description' => 'Dark movement breaks into mineral gold, fluid and deliberate.',
    ],
    [
        'image' => 'assets/artworks/artwork-03.jpg',
        'title' => 'Soft Terrain',
        'year' => '2026',
        'medium' => 'Mixed Media on Canvas',
        'description' => 'Color drifts across the surface like atmosphere settling into matter.',
    ],
    [
        'image' => 'assets/artworks/artwork-04.jpg',
        'title' => 'Oxide Drift',
        'year' => '2026',
        'medium' => 'Acrylic and Mineral Pigment on Canvas',
        'description' => 'A low, metallic landscape shaped by pressure, reflection, and restraint.',
    ],
    [
        'image' => 'assets/artworks/artwork-05.jpg',
        'title' => 'Blue Aperture',
        'year' => '2026',
        'medium' => 'Acrylic on Canvas',
        'description' => 'Cool blues and silver tones open into a deep, architectural field.',
    ],
    [
        'image' => 'assets/artworks/artwork-06.jpg',
        'title' => 'Nocturne Relic',
        'year' => '2026',
        'medium' => 'Mixed Media Assemblage',
        'description' => 'Raw material interrupts a luminous ground with sculptural tension.',
    ],
];

$galleryImages = [
    [
        'image' => 'assets/gallery/gallery-01.jpg',
        'title' => 'Surface Study I',
        'caption' => 'A close reading of black, gold, and mineral movement.',
    ],
    [
        'image' => 'assets/gallery/gallery-02.jpg',
        'title' => 'Surface Study II',
        'caption' => 'Fine organic structure held against a quiet grey field.',
    ],
    [
        'image' => 'assets/gallery/gallery-03.jpg',
        'title' => 'Surface Study III',
        'caption' => 'Raw fibers and shadowed pigment create a tactile relief.',
    ],
    [
        'image' => 'assets/gallery/gallery-04.jpg',
        'title' => 'Surface Study IV',
        'caption' => 'Linear fragments drift across a deep earth-toned ground.',
    ],
    [
        'image' => 'assets/gallery/gallery-05.jpg',
        'title' => 'Surface Study V',
        'caption' => 'Blue, gold, and carved material meet in a dense color field.',
    ],
    [
        'image' => 'assets/gallery/gallery-06.jpg',
        'title' => 'Surface Study VI',
        'caption' => 'An intimate vertical composition of pressure, texture, and light.',
    ],
    [
        'image' => 'assets/gallery/gallery-07.jpg',
        'title' => 'Surface Study VII',
        'caption' => 'Dark atmospheric marks suspended over a quiet canvas plane.',
    ],
    [
        'image' => 'assets/gallery/gallery-08.jpg',
        'title' => 'Surface Study VIII',
        'caption' => 'A controlled metallic surface with depth and quiet abrasion.',
    ],
];

$processFrames = array_map(
    fn ($index) => sprintf('assets/process/process-%02d.jpg', $index),
    range(1, 40)
);

?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Danny Hirsch Arts | Contemporary Abstract Art</title>
    <meta
      name="description"
      content="Danny Hirsch Arts presents contemporary abstract works shaped by material, movement, atmosphere, and emotional depth."
    >
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://bbyw2hrnf6-boop.github.io/danny-hirsch-arts1/">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Danny Hirsch Arts">
    <meta property="og:title" content="Danny Hirsch Arts | Contemporary Abstract Art">
    <meta
      property="og:description"
      content="Contemporary abstract artworks shaped by material, movement, atmosphere, and emotional depth."
    >
    <meta property="og:url" content="https://bbyw2hrnf6-boop.github.io/danny-hirsch-arts1/">
    <meta property="og:image" content="https://bbyw2hrnf6-boop.github.io/danny-hirsch-arts1/assets/images/hero.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Danny Hirsch Arts | Contemporary Abstract Art">
    <meta
      name="twitter:description"
      content="Contemporary abstract artworks shaped by material, movement, atmosphere, and emotional depth."
    >
    <meta name="twitter:image" content="https://bbyw2hrnf6-boop.github.io/danny-hirsch-arts1/assets/images/hero.jpg">
    <meta name="theme-color" content="#11100f">
    <link rel="icon" href="favicon.svg" type="image/svg+xml">
    <link rel="preload" as="image" href="assets/images/hero.jpg" fetchpriority="high">
    <link rel="stylesheet" href="style.css">
  </head>
  <body data-theme="dark">
    <header class="site-header" aria-label="Site header">
      <a class="brand" href="#top" aria-label="Danny Hirsch Arts home">
        <img src="assets/brand/logo.png" alt="Danny Hirsch Arts">
      </a>
      <div class="site-controls" aria-label="Display and sound controls">
        <button class="theme-toggle" type="button" aria-label="Switch to light gallery theme" aria-pressed="false">
          <span>Light</span>
        </button>
        <button class="ambient-toggle" type="button" aria-label="Start ambient gallery sound" aria-pressed="false">
          <span>Sound</span>
        </button>
      </div>
      <nav class="site-nav" aria-label="Primary navigation">
        <a href="#installation">Rooms</a>
        <a href="#collection">Collection</a>
        <a href="#process">Process</a>
        <a href="#gallery">Gallery</a>
        <a href="#wartrobe">wARTrobe</a>
        <a href="#about">About</a>
        <a href="#instagram">Instagram</a>
        <a href="#inquiry">Inquiry</a>
      </nav>
    </header>
    <div class="scroll-progress" aria-hidden="true"></div>

    <main id="top">
      <section class="hero" aria-labelledby="hero-title">
        <img class="hero-image" src="assets/images/hero.jpg" alt="Textured abstract artwork by Danny Hirsch" fetchpriority="high">
        <div class="hero-shade" aria-hidden="true"></div>
        <div class="hero-grain" aria-hidden="true"></div>
        <div class="hero-frame" aria-hidden="true"></div>
        <div class="hero-content reveal">
          <p class="kicker">Contemporary Abstract Art</p>
          <h1 id="hero-title">Danny Hirsch Arts</h1>
          <div class="hero-actions" aria-label="Hero actions">
            <a class="button button-primary" href="#collection">View Collection</a>
            <a class="text-link" href="#about">About</a>
          </div>
        </div>
        <a class="hero-cue" href="#collection" aria-label="Scroll to collection">
          <span></span>
        </a>
      </section>

      <div class="art-atmosphere" aria-hidden="true">
        <span class="texture-wash texture-wash-one"></span>
        <span class="texture-wash texture-wash-two"></span>
        <span class="texture-wash texture-wash-three"></span>
        <span class="background-art background-art-one"></span>
        <span class="background-art background-art-two"></span>
        <span class="background-art background-art-three"></span>
        <span class="background-art background-art-four"></span>
        <span class="floating-leaf leaf-one"></span>
        <span class="floating-leaf leaf-two"></span>
        <span class="floating-leaf leaf-three"></span>
        <span class="floating-leaf leaf-four"></span>
        <span class="floating-leaf leaf-five"></span>
        <span class="floating-leaf leaf-six"></span>
      </div>

      <section class="intro section-pad reveal" aria-label="Artist introduction">
        <p>
          Abstraction becomes a physical language: pigment, embedded fragments, and shifting fields of darkness gather
          into atmospheres that feel both unsettled and composed. Each work holds movement in suspension, inviting the
          eye to read texture as memory, pressure, and emotional weather.
        </p>
      </section>

      <section class="process-sequence section-pad reveal" id="process" aria-labelledby="process-title">
        <div class="process-sequence-copy">
          <p class="eyebrow">Studio Process</p>
          <h2 id="process-title">Forty quiet stages. One finished surface.</h2>
          <p>Scroll inside the frame.</p>
        </div>
        <div
          class="sequence-player js-sequence"
          data-frame-height="78"
          data-frames="<?php echo htmlspecialchars(implode(',', $processFrames)); ?>"
        >
          <div class="sequence-scroll" tabindex="0" aria-label="Scroll through artwork creation frames">
            <div class="sequence-sticky">
              <img
                class="sequence-frame"
                src="assets/process/process-01.jpg"
                width="3840"
                height="3200"
                alt="Artwork creation process"
                loading="lazy"
                decoding="async"
              >
              <div class="sequence-shade" aria-hidden="true"></div>
              <div class="sequence-counter" aria-hidden="true">
                <span class="sequence-current">01</span>
                <span>40</span>
              </div>
            </div>
            <div class="sequence-spacer" aria-hidden="true"></div>
          </div>
        </div>
      </section>

      <section class="installation section-pad reveal" id="installation" aria-labelledby="installation-title">
        <div class="installation-copy">
          <p class="eyebrow">Private Room</p>
          <h2 id="installation-title">Art installed like atmosphere.</h2>
          <p>Soft light. Dark stone. Quiet movement.</p>
        </div>
        <div class="room-stage" aria-label="Digital gallery room">
          <div class="room-ceiling" aria-hidden="true">
            <span></span>
            <span></span>
          </div>
          <div class="room-wall" aria-hidden="true"></div>
          <div class="room-window-light" aria-hidden="true"></div>
          <div class="room-spot room-spot-one" aria-hidden="true"></div>
          <div class="room-spot room-spot-two" aria-hidden="true"></div>
          <a
            class="room-art room-art-one js-lightbox-trigger"
            href="assets/artworks/artwork-04.jpg"
            aria-label="View Oxide Drift in room setting"
            data-lightbox-src="assets/artworks/artwork-04.jpg"
            data-lightbox-title="Oxide Drift"
            data-lightbox-caption="Installed in a private gallery room"
          >
            <img src="assets/artworks/artwork-04.jpg" alt="Oxide Drift artwork in digital gallery setting" loading="lazy" decoding="async">
            <span class="room-art-label">Oxide Drift</span>
          </a>
          <a
            class="room-art room-art-two js-lightbox-trigger"
            href="assets/artworks/artwork-06.jpg"
            aria-label="View Nocturne Relic in room setting"
            data-lightbox-src="assets/artworks/artwork-06.jpg"
            data-lightbox-title="Nocturne Relic"
            data-lightbox-caption="Installed in a private gallery room"
          >
            <img src="assets/artworks/artwork-06.jpg" alt="Nocturne Relic artwork in digital gallery setting" loading="lazy" decoding="async">
            <span class="room-art-label">Nocturne Relic</span>
          </a>
          <div class="room-console" aria-hidden="true">
            <span></span>
          </div>
          <div class="room-vase" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="room-plinth" aria-hidden="true"></div>
          <div class="room-sculpture" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="room-floor" aria-hidden="true"></div>
        </div>
      </section>

      <section class="collection section-pad" id="collection" aria-labelledby="collection-title">
        <div class="section-heading reveal">
          <p class="eyebrow">Featured Artworks</p>
          <h2 id="collection-title">Statement works for quiet rooms and powerful spaces.</h2>
        </div>

        <div class="art-grid">
          <?php foreach ($artworks as $index => $artwork): ?>
            <article class="art-card reveal">
              <a
                class="art-image-link js-lightbox-trigger"
                href="<?php echo htmlspecialchars($artwork['image']); ?>"
                aria-label="View <?php echo htmlspecialchars($artwork['title']); ?>"
                data-lightbox-src="<?php echo htmlspecialchars($artwork['image']); ?>"
                data-lightbox-title="<?php echo htmlspecialchars($artwork['title']); ?>"
                data-lightbox-caption="<?php echo htmlspecialchars($artwork['year'] . ' / ' . $artwork['medium']); ?>"
              >
                <img
                  src="<?php echo htmlspecialchars($artwork['image']); ?>"
                  alt="<?php echo htmlspecialchars($artwork['title']); ?> abstract artwork"
                  decoding="async"
                  loading="<?php echo $index === 0 ? 'eager' : 'lazy'; ?>"
                >
              </a>
              <div class="art-meta">
                <div>
                  <h3><?php echo htmlspecialchars($artwork['title']); ?></h3>
                  <p><?php echo htmlspecialchars($artwork['year']); ?> / <?php echo htmlspecialchars($artwork['medium']); ?></p>
                </div>
                <p><?php echo htmlspecialchars($artwork['description']); ?></p>
                <span>Available on request</span>
              </div>
            </article>
          <?php endforeach; ?>
        </div>
      </section>

      <section class="gallery section-pad" id="gallery" aria-labelledby="gallery-title">
        <div class="gallery-heading reveal">
          <p class="eyebrow">Image Gallery</p>
          <h2 id="gallery-title">Close surfaces, layered marks, and material atmosphere.</h2>
          <p>
            A curated sequence of additional works and details selected for texture, movement, and architectural mood.
          </p>
        </div>

        <div class="gallery-grid">
          <?php foreach ($galleryImages as $index => $image): ?>
            <a
              class="gallery-item reveal js-lightbox-trigger"
              href="<?php echo htmlspecialchars($image['image']); ?>"
              aria-label="Open <?php echo htmlspecialchars($image['title']); ?>"
              data-lightbox-src="<?php echo htmlspecialchars($image['image']); ?>"
              data-lightbox-title="<?php echo htmlspecialchars($image['title']); ?>"
              data-lightbox-caption="<?php echo htmlspecialchars($image['caption']); ?>"
            >
              <img
                src="<?php echo htmlspecialchars($image['image']); ?>"
                alt="<?php echo htmlspecialchars($image['title']); ?> by Danny Hirsch Arts"
                decoding="async"
                loading="lazy"
              >
              <span>
                <strong><?php echo htmlspecialchars($image['title']); ?></strong>
                <em><?php echo htmlspecialchars($image['caption']); ?></em>
              </span>
            </a>
          <?php endforeach; ?>
        </div>
      </section>

      <section class="wartrobe section-pad reveal" id="wartrobe" aria-labelledby="wartrobe-title">
        <div class="wartrobe-visual">
          <img src="assets/images/wartrobe.jpg" alt="wARTrobe painted wardrobe installation by Danny Hirsch Arts" loading="lazy" decoding="async">
        </div>
        <div class="wartrobe-copy">
          <p class="eyebrow">wARTrobe</p>
          <h2 id="wartrobe-title">A functional object turned into a private artwork.</h2>
          <p>
            The wARTrobe project transforms wardrobe doors into a large painted surface for the home. What begins as
            storage becomes atmosphere: color, leaves, fluid movement, and found material bring art into everyday space.
          </p>
          <p>
            It sits between painting, interior object, and personal memory, made for rooms where art is not only viewed,
            but lived with.
          </p>
        </div>
      </section>

      <section class="about section-pad reveal" id="about" aria-labelledby="about-title">
        <div>
          <p class="eyebrow">About</p>
          <h2 id="about-title">Material works with architectural presence.</h2>
        </div>
        <div class="about-copy">
          <p>
            Danny Hirsch creates contemporary abstract works that operate between painting, surface, and object. Built
            through layers of pigment, organic impressions, and controlled disruption, the pieces carry a sense of
            depth that changes with distance and light.
          </p>
          <p>
            Their scale and atmosphere make them natural companions to modern interiors: private residences, hospitality
            spaces, architectural projects, and collections seeking work with emotional weight rather than decoration.
          </p>
        </div>
      </section>

      <section class="instagram-flow section-pad reveal" id="instagram" aria-labelledby="instagram-title">
        <div class="instagram-heading">
          <p class="eyebrow">Instagram</p>
          <h2 id="instagram-title">Live from the studio.</h2>
          <a class="text-link instagram-heading-link" href="https://www.instagram.com/dannyhirsch.arts/" target="_blank" rel="noopener noreferrer">
            <svg class="instagram-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2"></rect>
              <circle cx="12" cy="12" r="4.1"></circle>
              <path d="M17.4 6.9h.1"></path>
            </svg>
            <span>@dannyhirsch.arts</span>
          </a>
        </div>
        <div class="instagram-widget-panel">
          <div class="instagram-widget-copy">
            <span class="instagram-profile-mark">
              <svg class="instagram-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <rect x="2.8" y="2.8" width="18.4" height="18.4" rx="5.2"></rect>
                <circle cx="12" cy="12" r="4.1"></circle>
                <path d="M17.4 6.9h.1"></path>
              </svg>
            </span>
            <div>
              <p class="eyebrow">Live Feed</p>
              <h3>New works, close surfaces, and studio moments.</h3>
              <p>
                Enable Instagram to view the live feed, or open the profile directly.
              </p>
            </div>
          </div>
          <div class="instagram-widget-mount">
            <div class="elfsight-app-33a958e6-feff-4490-a474-fe5a2f8f935a" data-elfsight-app-lazy></div>
          </div>
        </div>
      </section>

      <section class="inquiry section-pad reveal" id="inquiry" aria-labelledby="inquiry-title">
        <div class="inquiry-copy">
          <p class="eyebrow">Collector Inquiry</p>
          <h2 id="inquiry-title">For private viewings, commissions, or acquisition inquiries.</h2>
          <a class="button button-primary" href="mailto:dannyhirscharts@protonmail.com">Request Information</a>
        </div>

        <form class="inquiry-form" action="mailto:dannyhirscharts@protonmail.com" method="post" enctype="text/plain">
          <label>
            <span>Name</span>
            <input type="text" name="name" autocomplete="name" required>
          </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" autocomplete="email" required>
          </label>
          <label>
            <span>Message</span>
            <textarea name="message" rows="5" required></textarea>
          </label>
          <p class="form-note">Your data will only be used to respond to your request.</p>
          <button class="button button-secondary" type="submit">Send Inquiry</button>
        </form>
      </section>
    </main>

    <footer class="site-footer">
      <span>&copy; <?php echo date('Y'); ?> Danny Hirsch Arts</span>
      <nav aria-label="Footer navigation">
        <a href="https://www.instagram.com/dannyhirsch.arts/" target="_blank" rel="noopener noreferrer">Instagram</a>
        <a href="mailto:dannyhirscharts@protonmail.com">Contact</a>
        <a href="privacy.html">Privacy</a>
        <a href="imprint.html">Imprint</a>
      </nav>
    </footer>

    <div class="lightbox" role="dialog" aria-modal="true" aria-label="Artwork preview" aria-hidden="true">
      <button class="lightbox-close" type="button" aria-label="Close image preview">X</button>
      <figure class="lightbox-figure">
        <img class="lightbox-image" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="">
        <figcaption class="lightbox-caption">
          <strong></strong>
          <span></span>
        </figcaption>
      </figure>
    </div>

    <div class="cookie-consent" data-cookie-consent role="region" aria-label="Privacy choices">
      <p>Instagram uses Elfsight, a third-party service. Enable it only if you agree to external content.</p>
      <div class="cookie-consent-actions">
        <button class="button button-secondary" type="button" data-cookie-reject>Keep off</button>
        <button class="button button-primary" type="button" data-cookie-accept>Enable Instagram</button>
      </div>
    </div>

    <script src="assets/js/sequence.js"></script>
    <script src="script.js"></script>
  </body>
</html>

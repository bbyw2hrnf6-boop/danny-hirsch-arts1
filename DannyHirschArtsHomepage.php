<?php
$artworks = [
    [
        'image' => 'assets/artworks/artwork-01.jpg',
        'optimized' => 'assets/optimized/artworks/artwork-01.webp',
        'title' => 'Yellow Field, Veined',
        'year' => '2026',
        'medium' => 'Mixed Media on Canvas',
        'dimensions' => '40 × 50 cm',
        'status' => 'Available',
        'description' => 'A charged botanical trace held inside a saturated field of light.',
        'palette' => '#b8aa20',
    ],
    [
        'image' => 'assets/artworks/artwork-02.jpg',
        'optimized' => 'assets/optimized/artworks/artwork-02.webp',
        'title' => 'Black Current',
        'year' => '2026',
        'medium' => 'Acrylic on Canvas',
        'dimensions' => '40 × 50 cm',
        'status' => 'Available',
        'description' => 'Dark movement breaks into mineral gold, fluid and deliberate.',
        'palette' => '#84545f',
    ],
    [
        'image' => 'assets/artworks/artwork-03.jpg',
        'optimized' => 'assets/optimized/artworks/artwork-03.webp',
        'title' => 'Soft Terrain',
        'year' => '2026',
        'medium' => 'Mixed Media on Canvas',
        'dimensions' => '40 × 50 cm',
        'status' => 'Available',
        'description' => 'Color drifts across the surface like atmosphere settling into matter.',
        'palette' => '#9b6a3f',
    ],
    [
        'image' => 'assets/artworks/artwork-04.jpg',
        'optimized' => 'assets/optimized/artworks/artwork-04.webp',
        'title' => 'Oxide Drift',
        'year' => '2026',
        'medium' => 'Acrylic and Mineral Pigment on Canvas',
        'dimensions' => '40 × 50 cm',
        'status' => 'Available',
        'description' => 'A low, metallic landscape shaped by pressure, reflection, and restraint.',
        'palette' => '#18799d',
    ],
    [
        'image' => 'assets/artworks/artwork-05.jpg',
        'optimized' => 'assets/optimized/artworks/artwork-05.webp',
        'title' => 'Blue Aperture',
        'year' => '2026',
        'medium' => 'Acrylic on Canvas',
        'dimensions' => '40 × 50 cm',
        'status' => 'Available',
        'description' => 'Cool blues and silver tones open into a deep, architectural field.',
        'palette' => '#6f3f59',
    ],
    [
        'image' => 'assets/artworks/artwork-06.jpg',
        'optimized' => 'assets/optimized/artworks/artwork-06.webp',
        'title' => 'Nocturne Relic',
        'year' => '2026',
        'medium' => 'Mixed Media Assemblage',
        'dimensions' => '40 × 50 cm',
        'status' => 'Available',
        'description' => 'Raw material interrupts a luminous ground with sculptural tension.',
        'palette' => '#8b6336',
    ],
];

$galleryImages = [
    ['image' => 'assets/gallery/gallery-01.jpg', 'optimized' => 'assets/optimized/gallery/gallery-01.webp', 'title' => 'Found Material', 'caption' => 'A loose painted fragment, held between object and surface.'],
    ['image' => 'assets/gallery/gallery-02.jpg', 'optimized' => 'assets/optimized/gallery/gallery-02.webp', 'title' => 'Pigment Field', 'caption' => 'Black pigment, mineral gold, and fine organic structure.'],
    ['image' => 'assets/gallery/gallery-03.jpg', 'optimized' => 'assets/optimized/gallery/gallery-03.webp', 'title' => 'Fiber Relief', 'caption' => 'Raw fibers and shadowed pigment create a tactile relief.'],
    ['image' => 'assets/gallery/gallery-04.jpg', 'optimized' => 'assets/optimized/gallery/gallery-04.webp', 'title' => 'wARTrobe · Front', 'caption' => 'The complete three-panel painted frontage, photographed directly.'],
    ['image' => 'assets/gallery/gallery-05.jpg', 'optimized' => 'assets/optimized/gallery/gallery-05.webp', 'title' => 'Mineral Fault', 'caption' => 'A close reading of black, white, and mineral gold.'],
    ['image' => 'assets/gallery/gallery-06.jpg', 'optimized' => 'assets/optimized/gallery/gallery-06.webp', 'title' => 'Botanical Vein', 'caption' => 'A vertical study of leaf structure, pressure, and colour.'],
    ['image' => 'assets/gallery/gallery-07.jpg', 'optimized' => 'assets/optimized/gallery/gallery-07.webp', 'title' => 'Work in Space', 'caption' => 'An original work seen at room scale in a lived interior.'],
    ['image' => 'assets/gallery/gallery-08.jpg', 'optimized' => 'assets/optimized/gallery/gallery-08.webp', 'title' => 'wARTrobe · Handle', 'caption' => 'Painted panels and hand-formed handles at intimate range.'],
];

function imageSizeAttributes(string $path): string
{
    $size = @getimagesize(__DIR__ . '/' . $path);
    if (!$size) {
        return '';
    }

    return ' width="' . (int) $size[0] . '" height="' . (int) $size[1] . '"';
}
?>
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Danny Hirsch Arts | Contemporary Abstract Art</title>
    <meta name="description" content="Danny Hirsch Arts presents contemporary abstract works shaped by material, movement, atmosphere, and emotional depth.">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="https://www.dannyhirscharts.com/">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Danny Hirsch Arts">
    <meta property="og:title" content="Danny Hirsch Arts | Contemporary Abstract Art">
    <meta property="og:description" content="Contemporary abstract artworks shaped by material, movement, atmosphere, and emotional depth.">
    <meta property="og:url" content="https://www.dannyhirscharts.com/">
    <meta property="og:image" content="https://www.dannyhirscharts.com/assets/images/hero.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="Danny Hirsch Arts | Contemporary Abstract Art">
    <meta name="twitter:description" content="Contemporary abstract artworks shaped by material, movement, atmosphere, and emotional depth.">
    <meta name="twitter:image" content="https://www.dannyhirscharts.com/assets/images/hero.jpg">
    <meta name="theme-color" content="#090909">
    <link rel="icon" href="favicon.svg" type="image/svg+xml">
    <link rel="preload" as="font" href="assets/fonts/instrument-serif-400.woff2" type="font/woff2" crossorigin>
    <link rel="preload" as="font" href="assets/fonts/manrope-variable.woff2" type="font/woff2" crossorigin>
    <link rel="preload" as="image" href="assets/optimized/images/hero.webp" type="image/webp" fetchpriority="high">
    <script>document.documentElement.classList.add('has-js');</script>
    <link rel="stylesheet" href="DannyHirschArtsHomepage.css?v=20260722-gallery-25">
    <link rel="stylesheet" href="DannyHirschArtsCinematic.css?v=20260722-gallery-25">
    <script type="importmap">
      {"imports":{"three":"./assets/vendor/three/three.module.min.js","three/addons/":"./assets/vendor/three/addons/"}}
    </script>
  </head>
  <body data-theme="dark" class="opening-pending">
    <a class="skip-link" href="#collection">Skip to collection</a>

    <header class="site-header" aria-label="Site header">
      <a class="brand" href="#top" aria-label="Danny Hirsch Arts home">
        <img src="assets/optimized/brand/logo.webp" alt="Danny Hirsch Arts" width="400" height="178">
      </a>

      <nav class="site-nav" id="primary-navigation" aria-label="Primary navigation">
        <a href="#installation">Private Room</a>
        <a href="#collection">Collection</a>
        <a href="#gallery">Gallery</a>
        <a href="#wartrobe">wARTrobe</a>
        <a href="#about">About</a>
        <a href="#inquiry">Inquiry</a>
      </nav>

      <div class="site-controls" aria-label="Display and sound controls">
        <button class="theme-toggle" type="button" aria-label="Switch to light gallery theme" aria-pressed="false">
          <span class="control-glyph theme-glyph" aria-hidden="true"></span>
          <span class="control-label">Light</span>
        </button>
        <button class="ambient-toggle" type="button" aria-label="Start ambient gallery sound" aria-pressed="false">
          <span class="control-glyph sound-glyph" aria-hidden="true"><i></i></span>
          <span class="control-label">Sound</span>
        </button>
      </div>

      <button class="menu-toggle" type="button" aria-controls="primary-navigation" aria-expanded="false" aria-label="Open navigation">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>
    </header>

    <div class="scroll-progress" aria-hidden="true"></div>

    <main id="top">
      <section class="hero" aria-labelledby="hero-title" data-cinematic-hero data-chapter="00 · Threshold">
        <div class="hero-cinematic" aria-hidden="true">
          <img class="hero-cinematic__poster" src="assets/cinematic/threshold-poster.webp" alt="" width="1600" height="900" fetchpriority="high">
          <video class="hero-cinematic__film" muted playsinline preload="none" poster="assets/cinematic/threshold-poster.webp" data-cinematic-video>
            <source data-src="assets/cinematic/threshold-intro.mp4" type="video/mp4">
            <source data-src="assets/cinematic/threshold-intro.webm" type="video/webm">
          </video>
          <img class="hero-cinematic__botanical" src="assets/cinematic/threshold-botanical.webp" alt="" width="900" height="1400" decoding="async" fetchpriority="low">
          <span class="hero-cinematic__veil"></span>
          <span class="hero-cinematic__light"></span>
        </div>

        <div class="hero-scene hero-scene--fallback">
          <div class="hero-room" aria-hidden="true">
            <span class="hero-room__ceiling"></span>
            <span class="hero-room__wall"></span>
            <span class="hero-room__light"></span>
            <span class="hero-room__floor"></span>
            <span class="hero-room__bench"></span>
          </div>

          <figure class="hero-artwork">
            <img src="assets/optimized/images/hero.webp" alt="Close detail of layered pigment and textured material by Danny Hirsch" width="2000" height="1500" fetchpriority="high">
          </figure>

          <div class="hero-film" aria-hidden="true"></div>
        </div>

        <div class="hero-content">
          <p class="kicker"><span>Contemporary Abstract Art</span><span>Material · Memory · Space</span></p>
          <h1 id="hero-title"><span>Danny Hirsch</span><em>Arts</em></h1>
          <p class="hero-statement">Material becomes movement.<br>Movement becomes memory.</p>
          <div class="hero-actions" aria-label="Hero actions">
            <a class="button button-primary" href="#collection"><span>Discover the works</span><i aria-hidden="true">↘</i></a>
            <a class="button button-line" href="#installation">Enter the room</a>
          </div>
        </div>

        <div class="hero-exhibition-mark" aria-hidden="true"><span>Digital exhibition</span><i></i><span>01 / 07</span></div>

        <div class="opening-chapters" aria-hidden="true">
          <span data-opening-label="surface">01&nbsp; Surface</span>
          <span data-opening-label="work">02&nbsp; Work</span>
          <span data-opening-label="room">03&nbsp; Room</span>
          <span data-opening-label="identity">04&nbsp; Identity</span>
        </div>

        <button class="opening-skip" type="button">Skip intro</button>
        <a class="hero-scroll" href="#manifesto" aria-label="Continue to artist statement"><span></span><small>Continue</small></a>
      </section>

      <section class="manifesto" id="manifesto" aria-label="Artist introduction" data-chapter="01 · Material">
        <div class="manifesto-index" aria-hidden="true">01 / 07</div>
        <p class="manifesto-copy" data-line-reveal>
          Pigment and fragments turn surface into atmosphere—holding movement, memory, and emotional weather.
        </p>
        <p class="manifesto-note">Works are built slowly, layer over layer. The closer one looks, the more the surface begins to move.</p>
      </section>

      <section class="installation private-room private-room--3d-idle" id="installation" aria-labelledby="installation-title" data-chapter="02 · Space">
        <div class="installation-heading reveal">
          <p class="eyebrow">Private Room</p>
          <h2 id="installation-title"><span>Enter the</span><span>material.</span></h2>
          <p>A curated spatial study. Move gently; light and perspective answer.</p>
        </div>

        <div class="room-camera" data-room-camera>
          <div class="private-room-stage" data-private-room-stage aria-label="Curated digital room featuring genuine Danny Hirsch artwork photography">
            <div class="private-room-fallback" aria-hidden="true">
              <div class="private-room-render" data-room-render>
                <img class="private-room-render__view private-room-render__view--center" src="assets/cinematic/threshold-room-center.webp" alt="" loading="lazy" decoding="async" fetchpriority="low" width="1800" height="1125">
                <img class="private-room-render__view private-room-render__view--left" src="assets/cinematic/threshold-room-left.webp" alt="" loading="lazy" decoding="async" width="1800" height="1125">
                <img class="private-room-render__view private-room-render__view--right" src="assets/cinematic/threshold-room-right.webp" alt="" loading="lazy" decoding="async" width="1800" height="1125">
                <img class="private-room-render__view private-room-render__view--light private-room-render__view--light-center" src="assets/cinematic/threshold-room-light-center.webp" alt="" loading="lazy" decoding="async" width="1800" height="1125">
                <img class="private-room-render__view private-room-render__view--light private-room-render__view--light-left" src="assets/cinematic/threshold-room-light-left.webp" alt="" loading="lazy" decoding="async" width="1800" height="1125">
                <img class="private-room-render__view private-room-render__view--light private-room-render__view--light-right" src="assets/cinematic/threshold-room-light-right.webp" alt="" loading="lazy" decoding="async" width="1800" height="1125">
                <span class="private-room-render__spotlight"></span>
              </div>
              <span class="private-room-fallback__ceiling"></span>
              <span class="private-room-fallback__light"></span>
              <span class="private-room-fallback__floor"></span>
              <span class="private-room-fallback__bench"></span>
              <figure class="private-room-fallback__object">
                <img src="assets/optimized/gallery/gallery-04.webp" alt="" loading="eager" decoding="async" fetchpriority="low" width="1440" height="1920">
              </figure>
            </div>

            <div class="private-room-atmosphere" aria-hidden="true"><i></i><i></i><i></i></div>

            <div class="private-room-hud">
              <div class="private-room-hud__index" aria-hidden="true"><span>Spatial study</span><i></i><span>02 / 07</span></div>
              <div class="private-room-hud__copy">
                <p>Modelled from genuine wARTrobe photography</p>
                <div class="private-room-hud__actions">
                  <button class="room-enter" type="button" data-room-enter>Explore 360° <span aria-hidden="true">↗</span></button>
                  <a class="room-inspect js-lightbox-trigger" href="assets/gallery/gallery-04.jpg" aria-label="Inspect the genuine wARTrobe front photograph" data-lightbox-src="assets/gallery/gallery-04.jpg" data-lightbox-title="wARTrobe · Front" data-lightbox-caption="Genuine photograph of the complete three-panel painted frontage.">Inspect object <span aria-hidden="true">↗</span></a>
                </div>
              </div>
            </div>

            <div class="private-room-loader" role="status" aria-live="polite"><span></span><small>Preparing spatial room</small></div>
          </div>
        </div>

        <div class="room-caption" aria-hidden="true"><span>Curated camera</span><span>Original surface</span><span>Blender-lit architecture</span></div>
      </section>

      <section class="collection" id="collection" aria-labelledby="collection-title" data-chapter="03 · Works">
        <header class="section-heading reveal">
          <div>
            <p class="eyebrow">Selected Works · 2026</p>
            <h2 id="collection-title">Six material<br>encounters.</h2>
          </div>
          <p>Each work carries its own weather. The photographs here move close to the surface; complete documentation is available on request.</p>
        </header>

        <div class="art-chapters">
          <?php foreach ($artworks as $index => $artwork): ?>
            <article class="art-chapter art-chapter--<?php echo ($index % 3) + 1; ?> reveal" style="--art-color: <?php echo htmlspecialchars($artwork['palette']); ?>">
              <div class="art-chapter__visual" data-art-light>
                <a class="art-image-link js-lightbox-trigger" href="<?php echo htmlspecialchars($artwork['image']); ?>" aria-label="View <?php echo htmlspecialchars($artwork['title']); ?> in detail" data-lightbox-src="<?php echo htmlspecialchars($artwork['image']); ?>" data-lightbox-title="<?php echo htmlspecialchars($artwork['title']); ?>" data-lightbox-caption="<?php echo htmlspecialchars($artwork['year'] . ' / ' . $artwork['medium'] . ' / ' . $artwork['dimensions'] . ' / ' . $artwork['status']); ?>">
                  <img src="<?php echo htmlspecialchars($artwork['optimized']); ?>" alt="Surface detail from <?php echo htmlspecialchars($artwork['title']); ?> by Danny Hirsch" loading="lazy" decoding="async"<?php echo imageSizeAttributes($artwork['optimized']); ?>>
                  <span class="art-light" aria-hidden="true"></span>
                  <span class="art-view" aria-hidden="true">Explore surface ↗</span>
                </a>
                <span class="art-chapter__macro" aria-hidden="true"><img src="<?php echo htmlspecialchars($artwork['optimized']); ?>" alt="" loading="lazy" decoding="async"<?php echo imageSizeAttributes($artwork['optimized']); ?>></span>
              </div>

              <div class="art-chapter__copy">
                <div class="art-number"><span><?php echo str_pad((string)($index + 1), 2, '0', STR_PAD_LEFT); ?></span><i></i><span>06</span></div>
                <p class="art-year"><?php echo htmlspecialchars($artwork['year']); ?></p>
                <h3><?php echo htmlspecialchars($artwork['title']); ?></h3>
                <p class="art-description"><?php echo htmlspecialchars($artwork['description']); ?></p>
                <dl class="art-facts">
                  <div><dt>Material</dt><dd><?php echo htmlspecialchars($artwork['medium']); ?></dd></div>
                  <div><dt>Dimensions</dt><dd><?php echo htmlspecialchars($artwork['dimensions']); ?></dd></div>
                  <div><dt>Status</dt><dd class="art-status"><?php echo htmlspecialchars($artwork['status']); ?></dd></div>
                </dl>
                <a class="text-link" href="mailto:dannyhirscharts@protonmail.com?subject=<?php echo rawurlencode('Inquiry — ' . $artwork['title']); ?>">Request information <span aria-hidden="true">↗</span></a>
              </div>
            </article>
          <?php endforeach; ?>
        </div>
      </section>

      <section class="gallery" id="gallery" aria-labelledby="gallery-title" data-chapter="04 · Archive">
        <header class="gallery-heading reveal">
          <div class="gallery-heading__intro">
            <p class="eyebrow">Surface Archive</p>
            <p>Material studies, close details, and works in lived space.</p>
          </div>
          <h2 id="gallery-title"><span>Near enough</span><span>to feel it.</span></h2>
        </header>

        <div class="gallery-grid">
          <?php foreach ($galleryImages as $index => $image): ?>
            <a class="gallery-item gallery-item--<?php echo ($index % 5) + 1; ?> reveal js-lightbox-trigger" href="<?php echo htmlspecialchars($image['image']); ?>" aria-label="Open <?php echo htmlspecialchars($image['title']); ?>" data-lightbox-src="<?php echo htmlspecialchars($image['image']); ?>" data-lightbox-title="<?php echo htmlspecialchars($image['title']); ?>" data-lightbox-caption="<?php echo htmlspecialchars($image['caption']); ?>">
              <span class="gallery-image" data-surface-light>
                <img src="<?php echo htmlspecialchars($image['optimized']); ?>" alt="<?php echo htmlspecialchars($image['title']); ?> by Danny Hirsch Arts" loading="lazy" decoding="async"<?php echo imageSizeAttributes($image['optimized']); ?>>
              </span>
              <span class="gallery-caption">
                <i><?php echo str_pad((string)($index + 1), 2, '0', STR_PAD_LEFT); ?></i>
                <strong><?php echo htmlspecialchars($image['title']); ?></strong>
                <em><?php echo htmlspecialchars($image['caption']); ?></em>
              </span>
            </a>
          <?php endforeach; ?>
        </div>
      </section>

      <section class="wartrobe" id="wartrobe" aria-labelledby="wartrobe-title" data-chapter="05 · Object">
        <div class="wartrobe-stage" data-wartrobe-stage>
          <div class="wartrobe-shadow" aria-hidden="true"></div>
          <figure class="wartrobe-object reveal">
            <img src="assets/optimized/images/wartrobe.webp" alt="Original wARTrobe painted wardrobe installation by Danny Hirsch" loading="lazy" decoding="async" width="1050" height="1400">
          </figure>
          <figure class="wartrobe-detail reveal" aria-label="Close detail of the painted wARTrobe surface">
            <img src="assets/optimized/gallery/gallery-08.webp" alt="Painted panels and hand-formed handles on the wARTrobe" loading="lazy" decoding="async" width="1440" height="1080">
          </figure>
          <div class="wartrobe-stage__legend" aria-hidden="true"><span>Object</span><span>Surface</span><span>Room</span></div>
        </div>

        <div class="wartrobe-copy reveal">
          <p class="eyebrow">wARTrobe · One-of-one object</p>
          <h2 id="wartrobe-title">Furniture<br>becomes art.</h2>
          <p>Painted across wardrobe doors, wARTrobe turns an everyday object into a one-of-one artwork—made for the room, and lived with every day.</p>
          <p class="wartrobe-model-note">The spatial room above is an artistic 3D interpretation from real photographs—not a forensic scan.</p>
          <div class="wartrobe-actions">
            <a class="text-link js-lightbox-trigger" href="assets/gallery/gallery-04.jpg" data-lightbox-src="assets/gallery/gallery-04.jpg" data-lightbox-title="wARTrobe · Front" data-lightbox-caption="Genuine photograph of the complete three-panel painted frontage.">Inspect the surface <span aria-hidden="true">↗</span></a>
            <a class="text-link" href="#inquiry">Discuss a commission <span aria-hidden="true">↗</span></a>
          </div>
        </div>
      </section>

      <section class="about" id="about" aria-labelledby="about-title" data-chapter="06 · Practice">
        <div class="about-copy reveal">
          <p class="eyebrow">About · Material Practice</p>
          <h2 id="about-title"><span>I paint what</span><span>cannot be said.</span></h2>
          <div class="about-text">
            <p>My work begins with a feeling before it has an image. I am drawn to the tension between control and accident—the moment material begins to choose its own direction.</p>
            <p>Nature, weathered surfaces, architecture, and memory guide a slow process of layering, covering, and revealing. From afar the works are quiet; up close, tactile and unsettled.</p>
          </div>
          <ol class="process-compass" aria-label="Material process">
            <li><span>01</span><strong>Ground</strong></li>
            <li><span>02</span><strong>Layer</strong></li>
            <li><span>03</span><strong>Pressure</strong></li>
            <li><span>04</span><strong>Reveal</strong></li>
          </ol>
        </div>

        <div class="material-study reveal" aria-label="Material studies from original Danny Hirsch artworks">
          <figure class="material-study__feature" data-surface-light>
            <img src="assets/optimized/gallery/gallery-03.webp" alt="Close detail of raised fibers and shadowed pigment in a Danny Hirsch artwork" loading="lazy" decoding="async" width="1440" height="929">
            <figcaption><span>Material study · 01</span><strong>Layer</strong></figcaption>
          </figure>
          <div class="material-study__details">
            <figure data-surface-light>
              <img src="assets/optimized/gallery/gallery-02.webp" alt="Close detail of fine organic structure on a grey painted surface" loading="lazy" decoding="async" width="1440" height="1080">
              <figcaption><span>02</span><strong>Cover</strong></figcaption>
            </figure>
            <figure data-surface-light>
              <img src="assets/optimized/gallery/gallery-08.webp" alt="Close detail of a metallic painted surface with quiet abrasion" loading="lazy" decoding="async" width="1440" height="1080">
              <figcaption><span>03</span><strong>Reveal</strong></figcaption>
            </figure>
          </div>
          <p class="material-study__note"><span aria-hidden="true">↳</span> Real surface details, shown at a scale that preserves their texture.</p>
        </div>
      </section>

      <section class="instagram-flow" id="instagram" aria-labelledby="instagram-title" data-chapter="Studio signal">
        <div class="instagram-heading reveal">
          <p class="eyebrow">Studio Signal</p>
          <h2 id="instagram-title">Live from<br>the studio.</h2>
          <a class="text-link" href="https://www.instagram.com/dannyhirsch.arts/" target="_blank" rel="noopener noreferrer">@dannyhirsch.arts <span aria-hidden="true">↗</span></a>
        </div>
        <div class="instagram-widget-panel reveal">
          <div class="instagram-widget-copy">
            <span class="instagram-mark" aria-hidden="true"></span>
            <div>
              <p class="eyebrow">Optional live feed</p>
              <h3>New works, close surfaces, and studio moments.</h3>
              <p>Enable Instagram to view the live feed, or open the profile directly.</p>
            </div>
          </div>
          <div class="instagram-widget-mount"><div class="elfsight-app-33a958e6-feff-4490-a474-fe5a2f8f935a" data-elfsight-app-lazy></div></div>
        </div>
      </section>

      <section class="inquiry" id="inquiry" aria-labelledby="inquiry-title" data-chapter="07 · Contact">
        <div class="inquiry-atmosphere" aria-hidden="true"></div>
        <div class="inquiry-copy reveal">
          <p class="eyebrow">Collector Inquiry</p>
          <h2 id="inquiry-title">Begin a private<br>conversation.</h2>
          <p>Viewings. Commissions. Acquisitions.</p>
          <a class="direct-email" href="mailto:dannyhirscharts@protonmail.com">dannyhirscharts@protonmail.com</a>
        </div>

        <form class="inquiry-form reveal" action="mailto:dannyhirscharts@protonmail.com" method="post" enctype="text/plain">
          <label><span>Name</span><input type="text" name="name" autocomplete="name" required></label>
          <label><span>Email</span><input type="email" name="email" autocomplete="email" required></label>
          <label><span>Message</span><textarea name="message" rows="5" required></textarea></label>
          <p class="form-note">Your data will only be used to respond to your request.</p>
          <button class="button button-primary" type="submit"><span>Send inquiry</span><i aria-hidden="true">↗</i></button>
          <p class="response-note">Response usually within 24–48 hours.</p>
        </form>
      </section>
    </main>

    <footer class="site-footer">
      <div class="footer-intro">
        <a class="footer-brand" href="#top">Danny Hirsch Arts</a>
        <p>Contemporary abstract works shaped by material, memory, and light.</p>
      </div>
      <div class="footer-group"><p>Explore</p><nav aria-label="Footer navigation"><a href="#collection">Collection</a><a href="#gallery">Gallery</a><a href="#about">About</a></nav></div>
      <div class="footer-group"><p>Follow</p><a href="https://www.instagram.com/dannyhirsch.arts/" target="_blank" rel="noopener noreferrer">Instagram ↗</a></div>
      <div class="footer-group"><p>Legal</p><a href="privacy.html">Privacy</a><a href="imprint.html">Imprint</a></div>
      <div class="footer-bottom"><span>&copy; <?php echo date('Y'); ?> Danny Hirsch Arts</span><span>All rights reserved</span></div>
    </footer>

    <dialog class="room-experience" data-room-experience aria-labelledby="room-experience-title" aria-describedby="room-experience-description">
      <div class="room-experience__stage" data-room-experience-stage>
        <div class="room-experience__fallback" data-room-fallback aria-hidden="true">
          <img class="room-experience__view room-experience__view--center is-active" src="assets/cinematic/threshold-room-center.webp" alt="" width="1800" height="1125" decoding="async">
          <img class="room-experience__view room-experience__view--left" src="assets/cinematic/threshold-room-left.webp" alt="" width="1800" height="1125" loading="lazy" decoding="async">
          <img class="room-experience__view room-experience__view--right" src="assets/cinematic/threshold-room-right.webp" alt="" width="1800" height="1125" loading="lazy" decoding="async">
          <img class="room-experience__view room-experience__view--light room-experience__view--light-center is-active" src="assets/cinematic/threshold-room-light-center.webp" alt="" width="1800" height="1125" loading="lazy" decoding="async">
          <img class="room-experience__view room-experience__view--light room-experience__view--light-left" src="assets/cinematic/threshold-room-light-left.webp" alt="" width="1800" height="1125" loading="lazy" decoding="async">
          <img class="room-experience__view room-experience__view--light room-experience__view--light-right" src="assets/cinematic/threshold-room-light-right.webp" alt="" width="1800" height="1125" loading="lazy" decoding="async">
        </div>
        <div class="room-experience__webgl" data-gallery-webgl aria-hidden="true"></div>
        <span class="room-experience__light" aria-hidden="true"></span>
        <span class="room-experience__grain" aria-hidden="true"></span>
        <span class="room-experience__reticle" aria-hidden="true"></span>
        <div class="room-experience__loading" data-gallery-loading role="status" aria-live="polite"><span></span><small>Preparing the 360° gallery</small></div>
        <header class="room-experience__header">
          <div><p>Private Room · 360° gallery</p><h2 id="room-experience-title">Walk into the work.</h2></div>
          <div class="room-experience__header-actions">
            <button class="room-experience__demo" type="button" data-room-demo aria-pressed="false"><span aria-hidden="true"></span><b>3D site demo</b></button>
            <button class="room-experience__theme" type="button" data-room-theme aria-label="Switch room to light theme"><span aria-hidden="true"></span><b>Light</b></button>
            <button class="room-experience__close" type="button" data-room-close aria-label="Leave private room"><span aria-hidden="true"></span></button>
          </div>
        </header>
        <p class="room-experience__description" id="room-experience-description">Drag to look around. Use W A S D, arrow keys, or the movement controls to walk. The room is a Blender-built spatial interpretation using genuine artwork photography.</p>

        <aside class="room-experience__art" data-gallery-art-card aria-live="polite">
          <p data-gallery-art-kicker>In view</p>
          <strong data-gallery-art-title>Enter the gallery</strong>
          <span data-gallery-art-detail>Turn toward a surface to discover it.</span>
          <dl class="room-experience__facts" data-gallery-art-facts hidden>
            <div><dt>Year</dt><dd data-gallery-art-year></dd></div>
            <div><dt>Material</dt><dd data-gallery-art-medium></dd></div>
            <div><dt>Dimensions</dt><dd data-gallery-art-dimensions></dd></div>
            <div><dt>Availability</dt><dd data-gallery-art-availability></dd></div>
          </dl>
          <button type="button" data-gallery-art-inspect disabled>View artwork <i aria-hidden="true">↗</i></button>
        </aside>

        <aside class="room-experience__site-panel" data-gallery-site-panel aria-live="polite" hidden>
          <button type="button" class="room-experience__site-close" data-gallery-site-close aria-label="Close room information">×</button>
          <p data-gallery-site-kicker>3D Site Demo</p>
          <h3 data-gallery-site-title>Room information</h3>
          <p data-gallery-site-body></p>
          <a href="#about" data-gallery-site-link>Open information <span aria-hidden="true">↗</span></a>
        </aside>

        <nav class="room-experience__demo-nav" data-gallery-demo-nav aria-label="3D website rooms" hidden>
          <span>Room site</span>
          <button type="button" data-gallery-demo-art>Artworks</button>
          <button type="button" data-gallery-demo-panel="about">About</button>
          <button type="button" data-gallery-demo-panel="process">Process</button>
          <button type="button" data-gallery-demo-panel="inquiry">Inquiry</button>
          <button type="button" data-gallery-demo-panel="privacy">Privacy</button>
          <button type="button" data-gallery-demo-panel="imprint">Imprint</button>
        </nav>

        <div class="room-experience__walk-controls" data-gallery-controls aria-label="Walkable gallery controls" hidden>
          <div class="room-experience__dpad" role="group" aria-label="Move through gallery">
            <button type="button" data-gallery-move="forward" aria-label="Walk forward">↑</button>
            <button type="button" data-gallery-move="left" aria-label="Step left">←</button>
            <button type="button" data-gallery-move="backward" aria-label="Walk backward">↓</button>
            <button type="button" data-gallery-move="right" aria-label="Step right">→</button>
          </div>
          <div class="room-experience__tour" role="group" aria-label="Curated artwork views">
            <button type="button" data-gallery-view-prev aria-label="Previous curated artwork view">Previous work</button>
            <button type="button" data-gallery-reset aria-label="Return to gallery entrance">Entrance</button>
            <button type="button" data-gallery-view-next aria-label="Next curated artwork view">Next work</button>
          </div>
        </div>

        <div class="room-experience__controls" data-room-fallback-controls role="group" aria-label="Room camera controls">
          <button type="button" data-room-prev aria-label="Previous room viewpoint">←</button>
          <span><i aria-hidden="true"></i><output data-room-view-label aria-live="polite">Center · 02</output></span>
          <button type="button" data-room-next aria-label="Next room viewpoint">→</button>
        </div>
      </div>
    </dialog>

    <div class="lightbox" role="dialog" aria-modal="true" aria-labelledby="lightbox-title" aria-describedby="lightbox-description" aria-hidden="true" inert>
      <button class="lightbox-close" type="button" aria-label="Close artwork preview"><span aria-hidden="true"></span></button>
      <button class="lightbox-nav lightbox-prev" type="button" aria-label="View previous image">←</button>
      <figure class="lightbox-figure">
        <div class="lightbox-media"><img class="lightbox-image" src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt=""></div>
        <figcaption class="lightbox-caption"><strong id="lightbox-title"></strong><span id="lightbox-description"></span></figcaption>
      </figure>
      <button class="lightbox-nav lightbox-next" type="button" aria-label="View next image">→</button>
    </div>

    <div class="cookie-consent is-hidden" data-cookie-consent role="region" aria-label="Privacy choices">
      <p>Instagram uses Elfsight, a third-party service. Enable it only if you agree to external content.</p>
      <div class="cookie-consent-actions">
        <button class="button button-line" type="button" data-cookie-reject>Keep off</button>
        <button class="button button-primary" type="button" data-cookie-accept>Enable Instagram</button>
      </div>
    </div>

    <script src="DannyHirschArtsHomepage.js?v=20260722-gallery-25" defer></script>
  </body>
</html>

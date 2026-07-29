# DannyHirschArtsHomepage

Premium static artist homepage for Danny Hirsch Arts. The site is built with plain HTML, CSS, and JavaScript and is ready for GitHub Pages.

## Structure

- `index.html` - static GitHub Pages entry file
- `DannyHirschArtsHomepage.php` - editable PHP source version
- `DannyHirschArtsHomepage.css` - base visual system, responsive layouts, and theme styles
- `DannyHirschArtsCinematic.css` - cinematic editorial layer, collision-safe type, and responsive refinements
- `DannyHirschArtsHomepage.js` - navigation, theme, sound, intro, scroll effects, lightbox, and progressive 3D loading
- `DannyHirschArtsLoungeAudio.js` - original procedural lounge score; opt-in Web Audio with no samples or external music
- `DannyHirschArts3D.js` - lightweight Three.js renderer for the inline room teaser
- `DannyHirschArtsGallery3D.js` - lazy-loaded bounded 360° gallery controller with desktop and touch movement
- `blender/create_material_threshold.py` - reproducible Blender scene, GLB, poster, and film generator
- `blender/create_walkable_gallery.py` - reproducible closed gallery, navigation anchors, collision data, plants, lights, and 360° GLB
- `assets/cinematic/` - Blender GLB, poster, MP4, and WebM intro assets
- `assets/fonts/` - self-hosted Instrument Serif and Manrope fonts with licenses
- `assets/vendor/three/` - pinned local Three.js runtime; no CDN is required
- `assets/brand/` - logo
- `assets/images/` - hero and feature images
- `assets/artworks/` - main artwork images
- `assets/gallery/` - gallery/detail images
- `assets/process/` - archived studio process sequence (kept as source material, not loaded by the current page)
- `assets/optimized/` - lightweight WebP delivery assets; originals remain the source of truth

## Run Locally

Run a local server that supports byte-range requests so the cinematic video can seek correctly:

```bash
npx http-server . -p 8000 -c-1
```

Then visit `http://localhost:8000`.

## Deploy

GitHub Pages serves `index.html` from the repository root.

1. Push changes to `main`.
2. In GitHub, open `Settings` -> `Pages`.
3. Use `Deploy from a branch`, branch `main`, folder `/root`.

## Replacing Images

Keep the original filenames when swapping genuine artwork images, then update or regenerate their matching files in `assets/optimized/`. Artwork titles, media, dimensions, availability, and descriptions live in the PHP arrays at the top of `DannyHirschArtsHomepage.php`.

Update matching paths in:

- `index.html`
- `DannyHirschArtsHomepage.php`
- `DannyHirschArtsHomepage.css`

If you edit `DannyHirschArtsHomepage.php`, regenerate the static page before publishing:

```bash
php DannyHirschArtsHomepage.php > index.html
```

## Rebuilding the Blender experience

Blender 5.2 LTS was used to create the room from genuine local wARTrobe photographs. The room is an artistic spatial interpretation, not a forensic 3D scan.

```bash
/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python blender/create_material_threshold.py

/Applications/Blender.app/Contents/MacOS/Blender --background --factory-startup --python blender/create_walkable_gallery.py
```

Add `-- --render-video` to the threshold command to also rebuild both browser film formats. After the opening, visitors can choose the Classic site or enter the full Interactive Gallery. The 360° gallery is lazy-loaded behind an accessible, byte-accurate loading screen and supports drag-look, W A S D / arrow-key movement, mouse-wheel and + / − zoom, bounded collision, curated camera rails, artwork dossiers, an opt-in lounge ambience, and equal dark/light interaction. Mobile receives two virtual joysticks, a collapsible spatial map, optional device-orientation look and light haptic feedback. Reduced-motion, data-saver, and unsupported devices retain the matching three-view Blender still sequence.

The exported scene includes subtle looping foliage and waterfall motion plus a floor-level bronze route toward the inquiry area. Its material board is authored in `MATERIAL_BOARD_PRESETS`: rough plaster `#3A3631`, dark walnut `#4A3222`, dark leather `#1E1B19`, clear-coated black marble `#0F0F10`, brushed bronze `#B08A4E`, matte black metal, clear glass, and concrete planters. `assets/cinematic/danny-gallery-360.glb` is the editable Blender export; `assets/cinematic/danny-gallery-360-optimized.glb` is the production runtime build with Meshopt geometry compression and embedded WebP textures.

The interactive version keeps the artwork itself untouched while nearby architectural light borrows a restrained hint from the viewed work. The HTML dossier includes a genuine-photography surface lens, a clear physical-size reference, museum focus, a guided exhibition, touch-floor auto-walk, gyroscope look, haptics, adaptive pixel density and opt-in listener-relative sound zones.

Generate photographic relief interpretations for the runtime material pass, then rebuild the compressed delivery model after a Blender export:

```bash
python3 blender/generate_pbr_maps.py
scripts/optimize-gallery-ktx2.sh
```

The relief, normal and roughness maps are derived from the approved local photographs; they are not represented as measured laboratory scans. The KTX pipeline requires KTX-Software 4.x (`ktx` and `toktx` on `PATH`) and uses glTF Transform 4.3.0. Capable desktop devices receive the higher-detail normal/roughness pass and a one-time room reflection probe. Compact and lower-power devices retain KTX2 artwork and material colour, the authored Blender lighting, subtle ambient motion, capped pixel density and the lighter procedural micro-normal fallback. The renderer targets full-rate input while visitors move and a lower idle frame rate while the room is simply being viewed.

The six side-room surfaces use genuine local macro/detail photographs and are labelled as details, not simulated full paintings. Replace them with straight-on complete-work photography later if realistic framed scale is required. The wARTrobe focal object uses its genuine complete front photograph.

## Instagram

The live Instagram feed uses Elfsight:

```html
<div class="elfsight-app-33a958e6-feff-4490-a474-fe5a2f8f935a" data-elfsight-app-lazy></div>
```

The Elfsight script is loaded only after the visitor enables Instagram in the consent prompt.

## Lounge Sound

The sound control combines very quiet architectural room tone with an original 64-second procedural lounge cycle. It is opt-in, low volume, contains no samples or third-party music, and never autoplays.

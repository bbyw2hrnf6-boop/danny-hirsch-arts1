# DannyHirschArtsHomepage

Premium static artist homepage for Danny Hirsch Arts. The site is built with plain HTML, CSS, and JavaScript and is ready for GitHub Pages.

## Structure

- `index.html` - static GitHub Pages entry file
- `DannyHirschArtsHomepage.php` - editable PHP source version
- `DannyHirschArtsHomepage.css` - base visual system, responsive layouts, and theme styles
- `DannyHirschArtsCinematic.css` - cinematic editorial layer, collision-safe type, and responsive refinements
- `DannyHirschArtsHomepage.js` - navigation, theme, sound, intro, scroll effects, lightbox, and progressive 3D loading
- `DannyHirschArts3D.js` - lightweight Three.js Private Room renderer
- `blender/create_material_threshold.py` - reproducible Blender scene, GLB, poster, and film generator
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
```

Add `-- --render-video` to also rebuild both browser film formats. The WebGL room is requested only near the Private Room section and is skipped for reduced motion, data-saver, low-memory, or unsupported devices; the cinematic poster/CSS room remains the fallback.

## Instagram

The live Instagram feed uses Elfsight:

```html
<div class="elfsight-app-33a958e6-feff-4490-a474-fe5a2f8f935a" data-elfsight-app-lazy></div>
```

The Elfsight script is loaded only after the visitor enables Instagram in the consent prompt.

## Ambient Sound

The sound control uses browser-generated Web Audio. It is opt-in, low volume, and does not require audio files.

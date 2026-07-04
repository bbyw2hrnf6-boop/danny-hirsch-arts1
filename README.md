# DannyHirschArtsHomepage

Premium static artist homepage for Danny Hirsch Arts. The site is built with plain HTML, CSS, and JavaScript and is ready for GitHub Pages.

## Structure

- `index.html` - static GitHub Pages entry file
- `DannyHirschArtsHomepage.php` - editable PHP source version
- `DannyHirschArtsHomepage.css` - visual system, responsive layouts, theme styles
- `DannyHirschArtsHomepage.js` - navigation, theme, sound, scroll effects, reveal animation, lightbox
- `assets/js/DannyHirschArtsHomepageSequence.js` - process sequence player
- `assets/brand/` - logo
- `assets/images/` - hero and feature images
- `assets/artworks/` - main artwork images
- `assets/gallery/` - gallery/detail images

## Run Locally

Open `index.html` directly, or run a local server:

```bash
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Deploy

GitHub Pages serves `index.html` from the repository root.

1. Push changes to `main`.
2. In GitHub, open `Settings` -> `Pages`.
3. Use `Deploy from a branch`, branch `main`, folder `/root`.

## Replacing Images

Keep the same filenames when swapping images, or update every matching path in:

- `index.html`
- `DannyHirschArtsHomepage.php`
- `DannyHirschArtsHomepage.css`

If you edit `DannyHirschArtsHomepage.php`, regenerate the static page before publishing:

```bash
php DannyHirschArtsHomepage.php > index.html
```

## Instagram

The live Instagram feed uses Elfsight:

```html
<div class="elfsight-app-33a958e6-feff-4490-a474-fe5a2f8f935a" data-elfsight-app-lazy></div>
```

The Elfsight script is loaded only after the visitor enables Instagram in the consent prompt.

## Ambient Sound

The sound control uses browser-generated Web Audio. It is opt-in, low volume, and does not require audio files.

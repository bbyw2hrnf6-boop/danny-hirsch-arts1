# Danny Hirsch Arts

Premium static artist homepage for Danny Hirsch Arts. The site is built with plain HTML, CSS, and JavaScript and is ready for GitHub Pages.

## Structure

- `index.html` - static GitHub Pages entry file
- `index.php` - editable PHP source version
- `style.css` - visual system, responsive layouts, theme styles
- `script.js` - theme toggle, ambient sound, scroll effects, reveal animation, lightbox
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
- `index.php`
- `style.css`

If you edit `index.php`, regenerate the static page before publishing:

```bash
php index.php > index.html
```

## Instagram

The live Instagram feed uses Elfsight:

```html
<div class="elfsight-app-33a958e6-feff-4490-a474-fe5a2f8f935a" data-elfsight-app-lazy></div>
```

The Elfsight script is loaded only after the visitor enables Instagram in the consent prompt.

## Ambient Sound

The sound control uses browser-generated Web Audio. It is opt-in, low volume, and does not require audio files.

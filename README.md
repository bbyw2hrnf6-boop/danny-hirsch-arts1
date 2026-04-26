# Danny Hirsch Arts Homepage

Premium static artist homepage for Danny Hirsch Arts, ready for GitHub Pages.

## GitHub Pages Entry File

GitHub Pages uses:

- `index.html`

Keep `index.php` as the editable PHP source version. If you change `index.php`, regenerate `index.html` before publishing:

```bash
php index.php > index.html
```

## Project Structure

- `index.html` - static version for GitHub Pages
- `index.php` - PHP page with editable artwork data
- `style.css` - responsive gallery styling
- `script.js` - subtle header, reveal, hero motion, and lightbox behavior
- `assets/` - logo, optimized hero image, featured artworks, and gallery images
- `.nojekyll` - tells GitHub Pages to serve files directly
- `.gitignore` - ignores local system files

## Current Features

- Fullscreen artwork hero with subtle motion
- Dark luxury and light gallery theme system using CSS variables
- Glass-style header with refined logo treatment on scroll
- Featured artwork grid with fullscreen lightbox preview
- Additional image gallery with curated local artwork/detail images
- Live Elfsight Instagram feed embedded for `@dannyhirsch.arts`
- Lightbox close via X button, ESC key, or outside click
- Scroll reveal animations and responsive layouts
- Animated post-hero atmosphere with layered artwork texture and subtle leaf movement
- GitHub Pages-ready static build

## Live Instagram Widget

The page uses this Elfsight embed:

```html
<script src="https://elfsightcdn.com/platform.js" async></script>
<div class="elfsight-app-33a958e6-feff-4490-a474-fe5a2f8f935a" data-elfsight-app-lazy></div>
```

If the widget code changes later, replace it in `index.php`, then regenerate the static page:

```bash
php index.php > index.html
```

## Placeholder Details To Replace

- Artwork years, final titles, dimensions, and availability
- Inquiry email: `studio@example.com`
- Imprint/legal page link

## Run Locally

For the GitHub Pages version, open `index.html` directly in a browser.

For the PHP source version, use any PHP-enabled local server and open the project root. For example:

```bash
php -S localhost:8000
```

Then visit `http://localhost:8000`.

## Upload To GitHub

Recommended repository name:

```text
danny-hirsch-arts1
```

The local project folder is:

```bash
~/Documents/homepagecodextest
```

This folder is already a local git repository with an initial commit.

## Create The Repo Yourself From The Folder

If you use GitHub Desktop:

1. Open GitHub Desktop.
2. Click `File`.
3. Click `Add Local Repository`.
4. Choose this folder: `~/Documents/homepagecodextest`.
5. Click `Add Repository`.
6. Click `Publish repository`.
7. Repository name: `danny-hirsch-arts1`.
8. For free GitHub Pages, leave `Keep this code private` unchecked so the repo is public.
9. Click `Publish Repository`.

If you use GitHub in the browser plus terminal:

1. On GitHub, create a new repository named `danny-hirsch-arts1`.
2. Choose `Public` if you want free GitHub Pages hosting.
3. Do not add a README, `.gitignore`, or license on GitHub because this project already has local files.
4. Then run:

```bash
cd ~/Documents/homepagecodextest
git remote add origin https://github.com/YOUR-USERNAME/danny-hirsch-arts1.git
git push -u origin main
```

## Enable GitHub Pages

1. Open the GitHub repository named `danny-hirsch-arts1`.
2. Choose `Public` if you want free GitHub Pages hosting.
3. In the GitHub repo, open `Settings`.
4. Open `Pages`.
5. Under `Build and deployment`, choose `Deploy from a branch`.
6. Under `Branch`, select `main`.
7. Select folder `/root`.
8. Click `Save`.

Your site will be available at:

```text
https://YOUR-USERNAME.github.io/danny-hirsch-arts1/
```

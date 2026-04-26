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
- Glass-style header with refined logo treatment on scroll
- Featured artwork grid with fullscreen lightbox preview
- Additional image gallery with curated local artwork/detail images
- Lightbox close via X button, ESC key, or outside click
- Scroll reveal animations and responsive layouts
- Animated post-hero atmosphere with layered artwork texture and subtle leaf movement
- GitHub Pages-ready static build

## Placeholder Details To Replace

- Artwork years, final titles, dimensions, and availability
- Inquiry email: `studio@example.com`
- Instagram link
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
danny-hirsch-arts
```

Basic terminal workflow:

```bash
cd ~/Documents/homepagecodextest
git init
git add .
git commit -m "Initial Danny Hirsch Arts homepage"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/danny-hirsch-arts.git
git push -u origin main
```

## Enable GitHub Pages

1. Create a new GitHub repository named `danny-hirsch-arts`.
2. Choose `Public` if you want free GitHub Pages hosting.
3. Do not add a README, `.gitignore`, or license on GitHub because this project already includes local files.
4. Push this folder to the new repository.
5. In the GitHub repo, open `Settings`.
6. Open `Pages`.
7. Under `Build and deployment`, choose `Deploy from a branch`.
8. Under `Branch`, select `main`.
9. Select folder `/root`.
10. Click `Save`.

Your site will be available at:

```text
https://YOUR-USERNAME.github.io/danny-hirsch-arts/
```

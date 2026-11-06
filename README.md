# Avijit Saha Asru: personal website

A static academic website with no build step and no dependencies. It works on any host that serves plain files.

```
index.html                     all page content
assets/css/style.css           design: colors and fonts are defined at the top
assets/js/main.js              theme toggle, nav highlighting, BibTeX copy, Pareto animation
assets/img/                    headshot, Golden Gate photo, research figures (metadata stripped)
assets/Avijit_Saha_Asru_CV.pdf the CV visitors download (includes your phone number)
.nojekyll                      tells GitHub Pages to serve the files as they are
```

## Preview on your computer

From this folder:

```bash
python -m http.server 8000
```

Then open http://localhost:8000. In a local preview, placeholders appear with a dashed gold outline.
On the live site they are hidden automatically until you fill them in.

## Fill in the placeholders

1. **Profile links** (Contact section, near the end of `index.html`): Google Scholar, ORCID and GitHub.
   Paste your URL into `href="#"` and remove the word `todo` from that line's `class`.
   To drop a link entirely, delete its line.
2. **Under-review paper** (Publications → U1): add the co-authors and the journal, then delete the
   `<span class="todo-note">…</span>`.

## Common updates

- **News:** add a new `<li>` at the top of `<ol class="news">`.
- **New paper:** copy an existing `<li class="pub">…</li>` block and edit it. Keys follow the pattern
  J = journal, U = under review, P = presentation, T = thesis.
- **New CV:** replace `assets/Avijit_Saha_Asru_CV.pdf` with a file of the same name.
- **Colors:** edit the `--accent` (USF green) and `--gold-fill` values at the top of `style.css`.

## Publish for free with GitHub Pages

The site is set up for **https://avijitcoding.github.io**, from the repository
`avijitcoding/avijitcoding.github.io`. To update it, edit the files, then run
`git add -A`, `git commit -m "Update site"` and `git push` in this folder.
The steps below are for setting it up from scratch.

1. Sign in to GitHub and create a **public** repository named exactly `USERNAME.github.io`,
   where USERNAME is your GitHub username.
2. Upload `index.html`, the `assets` folder, `.nojekyll` and this README
   (Add file → Upload files).
3. Open **Settings → Pages**. Under *Build and deployment*, choose *Deploy from a branch*, then `main` and `/ (root)`.
4. After a minute or two the site is live at `https://USERNAME.github.io`.
5. Optional: in `index.html`, change the `og:image` value to the full URL
   (`https://USERNAME.github.io/assets/img/avijit-saha-asru.jpg`) so link previews show your photo.

If you prefer the command line:

```bash
git init
git add index.html assets .nojekyll README.md
git commit -m "Personal website"
git branch -M main
git remote add origin https://github.com/USERNAME/USERNAME.github.io.git
git push -u origin main
```

Other free hosts work too, such as Netlify Drop (drag this folder onto the page) or Cloudflare Pages.

## Use your own domain

The site works at `avijitcoding.github.io` without one. To use a domain you own instead
(written `example.com` below), do these steps in order:

1. At the company you bought the domain from, open its DNS settings. Add four `A` records
   with the host left blank (or `@`) pointing to `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153` and `185.199.111.153`, plus a `CNAME` record for `www` pointing to
   `avijitcoding.github.io`. Remove any older `A` records first.
2. Once those records work, open **Settings → Pages → Custom domain** in the repository,
   enter `example.com` and save. GitHub adds a `CNAME` file to the repository.
3. When the domain shows as verified, tick **Enforce HTTPS**.
4. In `index.html`, change the `og:image` and `og:url` values to start with `https://example.com/`.

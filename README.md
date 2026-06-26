# Splendid Engines website

Static site for [splendidengines.com](https://splendidengines.com). Hosted on Cloudflare Pages, auto-deployed from `main`.

## Stack

- HTML + Bootstrap 5 (loaded locally, not from CDN)
- Vanilla JavaScript where needed
- No build step. No CMS. No static site generator.
- Plausible for analytics
- Calendly for booking

## Editing the site

Every change happens by talking to Claude Code. You ask, Claude edits, commits, and pushes. Cloudflare Pages picks up the push and the change is live in under a minute.

## Repo layout

All public-facing files live under `public/`.

```
public/
├── index.html                        # homepage
├── about/index.html
├── case-study/index.html
├── contact/index.html
├── sales/index.html                  # for sales leaders
├── marketing/index.html              # for marketing leaders
├── experts/index.html                # for subject matter experts
├── expert-application/index.html     # expert signup form
├── offers/
│   └── share-your-take/index.html    # Calendly booking page
├── our-brand/
│   ├── index.html                    # brand guidelines (noindex)
│   ├── modules/index.html            # writing module gallery (noindex)
│   └── splendid-visual-brand/
│       ├── SKILL.md                  # machine-readable brand skill
│       └── icons/v2/                 # icon gallery
├── writing/
│   ├── index.html                    # list of all pieces
│   ├── MODULES.md                    # the writing module library (registry)
│   ├── _template/index.html          # reference template for new pieces
│   └── [slug]/index.html             # each piece, hand-built
├── assets/
│   ├── css/                          # bootstrap.min.css + custom.css + modules.css
│   ├── js/                           # bootstrap.bundle.min.js, nav.js, reveal.js, talking-head.js, charts.js
│   └── img/
└── _includes/
    ├── header.html                   # canonical header (copy into each page)
    ├── footer.html                   # canonical footer (copy into each page)
    └── analytics.html                # canonical tracking tag (copy into each page, before </body>)
```

## Header and footer

There is no build step, so the header and footer are duplicated into every page. The canonical versions live in `_includes/`. When changing them, update every page that uses them.

This is a deliberate tradeoff: a tiny bit of duplication maintenance in exchange for zero build complexity.

## Analytics and tracking

Site-wide tracking tags go right before `</body>` on every page. Same as the
header and footer, there is no build step, so they are copied into each page by
hand. The canonical copy is `_includes/analytics.html`.

Today that is the Clay web-intent script (Claydar). It identifies the companies
visiting the site and feeds the web-intent monitor in the operator console.

Add a page, add the tag. (Copying the writing template handles this for writing
pieces, since the template already carries it.) To change the id or swap
trackers, edit `_includes/analytics.html`, then update every page. Find them all:

```
grep -rl "static.claydar.com" public --include=*.html
```

## Adding a writing piece

1. Copy `public/writing/_template/` to `public/writing/[your-slug]/`
2. Fill in the title, date, summary, and body
3. Build the body from the module library (see below)
4. Add a link to it in `public/writing/index.html`

Each piece can have its own bespoke layout. The template is a starting point, not a straitjacket.

## Writing modules

Articles are built from a shared library of layout modules: hero, pull-quote,
stat band, ranked bars, charts, timeline, talking-head, CTA, and more. Two
references stay in sync because the gallery renders the real modules:

- **Registry:** `public/writing/MODULES.md` lists every module with its purpose,
  exact markup, and brand rules. The shared vocabulary.
- **Live gallery:** `/our-brand/modules/` renders each module next to a
  copy-paste snippet. Linked from the brand page.

A module's look (`assets/css/modules.css` and `custom.css`) and behavior
(`assets/js/`) are shared, so changing one updates every article at once. No
per-article edits, because the files are linked, not copied. The interactive
chart module (`assets/js/charts.js`) is data-driven: the article carries only a
small JSON block and the shared renderer draws it, so even a behavior change
propagates everywhere.

## Local preview

No build step - any static file server works. Serve from inside `public/`:

```
cd public && python3 -m http.server 8001
```

Then open `http://localhost:8001`. Opening HTML files directly with `file://` mostly works, but absolute asset paths (`/assets/...`) will not resolve, so use a local server.

### Preview a page in Claude

To review a page as a self-contained Claude Artifact, bundle it into one file
(CSS, JS, and local images inlined; trackers stripped; web fonts fall back to
system stacks because Artifacts block external hosts):

```
node scripts/preview.mjs writing/[your-slug]
```

Add `--fragment` to emit content ready to drop straight into a Claude Artifact.
The module gallery itself (`/our-brand/modules/`) is also a live preview of every
module.

## Deploying

Pushing to `main` deploys automatically via Cloudflare Pages. There is no manual deploy step.

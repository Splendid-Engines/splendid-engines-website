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
│   └── splendid-visual-brand/
│       ├── SKILL.md                  # machine-readable brand skill
│       └── icons/v2/                 # icon gallery
├── writing/
│   ├── index.html                    # list of all pieces
│   ├── _template/index.html          # reference template for new pieces
│   └── [slug]/index.html             # each piece, hand-built
├── assets/
│   ├── css/                          # bootstrap.min.css + custom.css
│   ├── js/                           # bootstrap.bundle.min.js + nav.js
│   └── img/
└── _includes/
    ├── header.html                   # canonical header (copy into each page)
    └── footer.html                   # canonical footer (copy into each page)
```

## Header and footer

There is no build step, so the header and footer are duplicated into every page. The canonical versions live in `_includes/`. When changing them, update every page that uses them.

This is a deliberate tradeoff: a tiny bit of duplication maintenance in exchange for zero build complexity.

## Adding a writing piece

1. Copy `public/writing/_template/` to `public/writing/[your-slug]/`
2. Fill in the title, date, summary, and body
3. Add a link to it in `public/writing/index.html`

Each piece can have its own bespoke layout. The template is a starting point, not a straitjacket.

## Local preview

No build step - any static file server works. Serve from inside `public/`:

```
cd public && python3 -m http.server 8001
```

Then open `http://localhost:8001`. Opening HTML files directly with `file://` mostly works, but absolute asset paths (`/assets/...`) will not resolve, so use a local server.

## Deploying

Pushing to `main` deploys automatically via Cloudflare Pages. There is no manual deploy step.

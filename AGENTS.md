# Splendid Engines website: working notes

Static marketing site for splendidengines.com. HTML + Bootstrap 5, vanilla JS.
**No build step, no CMS, no static site generator.** Hosted on Cloudflare Pages,
auto-deploys from `main`. All public files live under `public/`.

Because there is no build step, anything that must appear on every page is copied
into every page by hand. The canonical copies live in `public/_includes/`.

## Hard rules

- **Every page must include the analytics / tracking tag right before `</body>`.**
  This is the Clay web-intent (Claydar) script. The canonical copy is
  `public/_includes/analytics.html`. This applies to every new page too, even when
  it is not explicitly requested. To audit:
  `grep -rl "static.claydar.com" public --include=*.html`
- **Header and footer are duplicated into every page.** Canonical copies are
  `public/_includes/header.html` and `public/_includes/footer.html`. When you
  change either, update every page that uses it.
- **New writing piece:** copy `public/writing/_template/` (it already carries the
  header, footer, and the analytics tag), fill it in, and link it from
  `public/writing/index.html`.
- **Build the body from the module library.** Articles are assembled from named,
  reusable modules (hero, pull-quote, stat band, charts, timeline, talking-head,
  CTA). The registry is `public/writing/MODULES.md`; the live gallery is
  `/our-brand/modules/`. A module's look (`assets/css/modules.css`, `custom.css`)
  and behavior (`assets/js/`) are shared, so editing one updates every article at
  once. Preview a piece as a Claude Artifact with
  `node scripts/preview.mjs writing/<slug>`.

See `README.md` for the full repo layout, local preview, and deploy workflow.

# Writing module library

The shared toolbox for building articles under `/writing/`. Every module here is
a named, reusable pattern with a fixed markup shape. Pick modules, fill them with
content, and the look and behavior come from shared CSS and JS.

The live, rendered version of this catalog is the **module gallery** at
`/our-brand/modules/`. This file is the spec; the gallery is the showroom.

## How a "module" works here (and how changes propagate)

The site has no build step. Each article is a standalone HTML file, so a module's
**markup** is copied into the article. But the parts that matter most are shared:

- **Look (CSS)** lives in `assets/css/custom.css` and `assets/css/modules.css`.
- **Behavior and motion (JS)** live in `assets/js/*.js`.

So changing how a module **looks or behaves** is a one-file edit that updates
**every** article at once. Only a change to a module's **HTML structure** has to
be swept across articles by hand (there are about a dozen, and Claude does the
sweep). Two consequences worth designing around:

1. Keep article markup thin. Push styling into CSS, behavior into JS.
2. The data-driven modules (chart, talking-head) carry only **data** in the
   article. The rendering is shared, so even a structural or behavioral change to
   those propagates everywhere with no per-article edit.

**Load order in every article:** `bootstrap.min.css` -> `custom.css` ->
`modules.css`. Scripts are `defer`-loaded before the analytics tag.

---

## Page scaffold

Start from `writing/_template/`. It already carries the header, footer, the
analytics tag, and the font links. Body content sits inside:

```html
<main class="longform">
  <section class="section bg-snow">
    <div class="container container-narrow">
      <!-- modules go here -->
    </div>
  </section>
</main>
```

- `.longform` sets editorial body type (18px Mulish, 1.65 line-height).
- `.section` is the vertical rhythm wrapper. Backgrounds: `.bg-snow` (default),
  `.bg-ash`, `.bg-ash-warm`, `.bg-lagoon` (dark, use sparingly for gravity).
  `.section-sm` tightens the padding.
- Containers: `.container-narrow` (reading width, the default for prose),
  `.container-medium` (wider, for stat rows and charts), `.container` (full).

Brand rule: blog posts use **Full Light** (Snow / Ash / Ash Warm). Lagoon is
reserved for one pull-quote bookend or a flagship-report cover.

---

## Text and structure

### Eyebrow
The structural label above every heading. Poppy, uppercase. Required on each section.
```html
<span class="eyebrow">Part 01 &middot; Vendor distrust</span>
```

### Headings + body
Plain `<h2>` / `<h3>` and `<p>` inside `.longform`. No classes needed.

### Thesis paragraph
A weightier lead paragraph for the opening of a section.
```html
<p class="thesis mb-4">The one-sentence premise of the piece.</p>
```

### Daffodil highlighter
Marks a single load-bearing word. **Max two per page. Light surfaces only.**
On a Lagoon surface use `.accent-dark` (Poppy text) instead.
```html
<p>It is the <span class="hl">permission</span> that earns the read.</p>
```

---

## Hero and fold

### Article fold (two-column)
Title + byline left, feature image right. The standard opener for an article.
```html
<section class="article-fold bg-snow">
  <div class="container">
    <div class="row align-items-center g-4 g-lg-5">
      <div class="col-lg-6 article-fold-text">
        <span class="eyebrow">Essay</span>
        <h1 class="article-fold-title">Piece title</h1>
        <p class="article-fold-sub">One-sentence summary.</p>
        <div class="article-byline">
          <img class="article-byline-avatar" src="..." alt="Author" />
          <div>
            <div class="article-byline-name">Author name</div>
            <div class="article-byline-meta">Title &middot; Month DD, YYYY</div>
          </div>
        </div>
      </div>
      <div class="col-lg-6 article-fold-media"><img src="..." alt="..." /></div>
    </div>
  </div>
</section>
```

### Centered hero
A simpler, centered opener (used by the flagship report and demo pages).
```html
<section class="hero text-center bg-snow">
  <div class="container container-narrow">
    <span class="eyebrow">Flagship report</span>
    <h1 class="hero-headline">The B2B Trust Gap</h1>
    <p class="hero-body">The deck on one line.</p>
  </div>
</section>
```

### Full-bleed hero image
```html
<div class="article-hero-image"><img src="..." alt="..." /></div>
```

---

## Quotes and people

### Pull quote (Lagoon bookend)
The banked line. Earns its own surface.
```html
<section class="section bg-lagoon">
  <div class="container container-narrow text-center">
    <span class="eyebrow">The headline</span>
    <p class="pull-quote" style="color:#fff;">A line worth sitting on its own surface.</p>
  </div>
</section>
```

### Inline blockquote + attribution
Interview pull-quotes within body copy.
```html
<p class="pull-quote">&ldquo;The quote.&rdquo;</p>
<div class="testimonial-attr d-flex align-items-center mt-3">
  <img src="..." alt="Name" loading="lazy" />
  <div>
    <div class="testimonial-attr-name">Name</div>
    <div class="testimonial-attr-role">Title, Company</div>
  </div>
</div>
```

### Talking-head quote (`talking-head.js`)
A short clip of the person plays on hover or tap while the quote lights up
word-by-word. Data-driven: the article holds the quote text + a timings JSON.
Full how-to is in `_template/index.html`; live demo at `/writing/talking-head-demo/`.
```html
<figure class="talking-head" data-th data-timings="/assets/video/<slug>/clip.timings.json">
  <div class="th-media">
    <video class="th-video" preload="metadata" playsinline muted poster="..." src="...mp4"></video>
    <span class="th-affordance" aria-hidden="true">Tap for sound</span>
  </div>
  <blockquote class="th-quote">
    <p class="th-text">The exact quote, as plain readable prose.</p>
    <figcaption class="testimonial-attr d-flex align-items-center th-attr">...name / role...</figcaption>
  </blockquote>
</figure>
```
Needs `<script src="/assets/js/talking-head.js" defer></script>`.

---

## Lists, navigation, and offers

### Parts map (report table of contents)
```html
<nav aria-label="Report contents">
  <ul class="parts-map">
    <li><a href="#part-1"><span class="num">01</span>Vendor distrust</a></li>
  </ul>
</nav>
```

### Five-moves list (inline brand icons)
A list where each item leads with a stroked SVG icon. Icons follow the brand spec
(2.5px stroke, square caps, miter joins).
```html
<ul class="move-list">
  <li>
    <span class="move-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><!-- paths --></svg></span>
    <span><strong>Lead with peers.</strong> The point of the move.</span>
  </li>
</ul>
```

### Offer card
The report or article CTA in a bordered card.
```html
<div class="offer-card">
  <span class="eyebrow">Free for senior B2B revenue leaders</span>
  <h2>Get your free Market Map.</h2>
  <p class="offer-pitch">One 30-minute working session...</p>
  <div class="offer-cta"><a href="/contact/" class="btn-se-primary">Book a call</a></div>
</div>
```

### Closing CTA
End every piece with one Poppy CTA (`.btn-se-primary`). One per page.

---

## Data visualization

The brand palette for data viz: **Lagoon primary, Poppy and Lake as accents,
Daffodil sparingly.** Color names below map to those tokens.

### Stat band (`reveal.js` count-up)
Big numbers that count up on scroll. Use a 2- or 3-column grid.
```html
<div class="row g-4 text-center">
  <div class="col-md-4 reveal-stat" data-reveal-delay="1">
    <span class="longform stat-feature">47<span class="stat-unit">%</span></span>
    <p class="text-muted-se">name <strong>industry peers</strong> as most trusted.</p>
  </div>
</div>
```

### Population grid (`.pop-viz`)
A unit/waffle grid of dots for "N people, segmented." Dots are `.dot`, `.dot.poppy`,
`.dot.daffodil`. Pair with `.pop-legend`. (Hand-authored dots today; a generator
is a candidate for a future data-driven version.)

### Ratio icons (`.ratio-icons`)
An "X to 1" people-icon comparison. `.ratio-person` (+ `.poppy`), split by `.ratio-vs`.

### Ranked bars (`.rank-list`)
A 1/2/3 podium with a proportional fill behind each row, set with `--bar-width`.
```html
<ol class="rank-list">
  <li class="rank-1" style="--bar-width: 100%"><span class="rank-num">1</span><span class="rank-label">Feeling understood</span></li>
  <li class="rank-2" style="--bar-width: 46%"><span class="rank-num">2</span><span class="rank-label">Pricing</span></li>
</ol>
```

### Chart (`charts.js`) - NEW, interactive
A data-driven SVG chart: bar, line, or area. Animates in on scroll, supports
multiple series with a legend of toggle chips (click to show or hide a series),
and shows a value readout on hover or keyboard focus. A screen-reader data table
is generated automatically; an optional `<noscript>` table is honored as the
no-JS fallback. The article carries only the data.
```html
<figure class="se-chart" data-se-chart>
  <figcaption class="se-chart-title">Most trusted source for upskilling</figcaption>
  <script type="application/json" class="se-chart-data">
  {
    "type": "bar",
    "format": "percent",
    "categories": ["Industry peers", "Vendor content", "Trade journalists"],
    "series": [
      { "name": "All buyers", "color": "lagoon", "values": [47, 15, 13] }
    ]
  }
  </script>
</figure>
```
Multi-series (toggleable) example:
```json
{
  "type": "line",
  "format": "percent",
  "categories": ["$40-60k", "$60-100k", "$100k+"],
  "series": [
    { "name": "Peer content matters", "color": "poppy", "values": [56, 60, 68] },
    { "name": "Feel understood",      "color": "lake",  "values": [51, 58, 64] }
  ]
}
```
Options: `type` (`bar`|`line`|`area`), `format` (`percent`|`number`), `prefix`,
`suffix`, `yLabel`, `max` (axis ceiling override). `color` is a token name
(`lagoon`/`poppy`/`lake`/`daffodil`/`mate`) or a hex.
Needs `<script src="/assets/js/charts.js" defer></script>`.

### Timeline (`.se-timeline`) - NEW
A vertical, editorial timeline. CSS-only; add `.reveal` to each item for the
fade-in. No JS beyond `reveal.js`.
```html
<ol class="se-timeline">
  <li class="se-timeline-item reveal">
    <span class="se-timeline-marker" aria-hidden="true"></span>
    <div class="se-timeline-content">
      <span class="se-timeline-date">2021</span>
      <h3 class="se-timeline-title">What happened</h3>
      <p>One or two lines of detail.</p>
    </div>
  </li>
</ol>
```

---

## Expressive

### ASCII art (`.se-ascii`) - NEW
Detailed ASCII art from any image, on-brand and scaled to fit any screen. Generate
it with the helper, then paste the markup it prints.

```
node scripts/asciify.mjs photo.png --cols 110 --figure --label "Portrait" --out art.html
```

```html
<figure class="se-ascii" role="img" aria-label="Portrait">
  <pre class="se-ascii-art" aria-hidden="true">...art...</pre>
  <figcaption class="se-ascii-caption">Portrait</figcaption>
</figure>
```

`ascii.js` scales the glyphs so the longest line fits the container, so detailed
(wide) art never overflows or wraps. Generator flags: `--cols N` (more columns =
more detail), `--ramp short|long`, and `--invert` + `--on-lagoon` for light art on
a dark Lagoon panel. Use it sparingly: a wink, per the brand's imagery rules.
Needs `<script src="/assets/js/ascii.js" defer></script>`.

---

## Animation

Opt in per element. Driven by `reveal.js` (an IntersectionObserver).
- `.reveal` - subtle fade + rise as the element scrolls into view.
- `.reveal-stat` - the same, plus a small scale/spring; counts up the first number.
- `data-reveal-delay="1|2|3"` - stagger siblings.
- All animation is disabled under `prefers-reduced-motion`.

---

## Previewing an article in Claude

Two ways to see a piece before it ships:

1. **Interactive (Artifact):** `node scripts/preview.mjs writing/<slug>` produces
   a single self-contained HTML file (CSS + module JS inlined, web fonts swapped
   for close system fallbacks because Claude Artifacts block external hosts).
   Claude publishes that as an Artifact you can click around in.
2. **Pixel-true:** serve locally (`cd public && python3 -m http.server 8001`) and
   screenshot the real page. Use this to confirm an exact match to production.

The gallery at `/our-brand/modules/` is itself a live preview of every module.

---

## File map

| Module group | Markup | CSS | JS |
|---|---|---|---|
| Scaffold, text, hero, quotes, lists, offer | this file + `_template/` | `custom.css` | `nav.js` |
| Stat band, ranked bars, scroll reveals | this file | `custom.css` | `reveal.js` |
| Talking-head quote | `_template/` | `custom.css` | `talking-head.js` |
| Chart (NEW) | this file | `modules.css` | `charts.js` |
| Timeline (NEW) | this file | `modules.css` | (reveal.js) |
| ASCII art (NEW) | this file | `modules.css` | `ascii.js` (generate with `scripts/asciify.mjs`) |

When you add a new module: add its styles to `modules.css`, its behavior to a new
`assets/js/<module>.js` (the `data-*` hook + IIFE pattern, like `charts.js`), a
catalog entry here, and a live example to the gallery page.

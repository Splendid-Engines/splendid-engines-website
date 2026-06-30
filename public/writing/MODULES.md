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

### Prompt block (`.se-prompt`, copy + expand)
A ready-to-paste prompt (or full skill) for the reader's own AI assistant. The
shape, top to bottom: an eyebrow-only head, a title, a row of **requirement
lozenges**, a one-line pitch, then a clamped **peek window** holding the prompt
body with an in-box Copy button, an Expand/Collapse toggle, and an optional CTA.

- **Copy** (`.se-prompt-copy[data-copy]`) sits in the top-right corner of the
  window. It copies the `[data-copy-text]` element's `textContent` (so it grabs
  the whole prompt even while the window is clamped) and flashes "Copied". It is
  delegated, so any number of blocks work with no per-element wiring.
  `data-copy-target="#id"` copies a specific element instead of the in-block body.
- **Peek window** (`.se-prompt-window[data-prompt-window]`) clamps the body to a
  few lines with a fade at the bottom. **Expand** (`.se-prompt-expand[data-expand]`)
  toggles `.is-open` to reveal the rest and flips its own label to "Collapse".
- **Requirement lozenges** (`.se-prompt-reqs` > `.se-lozenge`): small pills, each
  with one or two service logos / brand icons, a label, and an `<em>` state.
  Add `.opt` for a dashed, optional pill.
- **CTA** (optional): a `.se-prompt-cta-lead` lead-in line + a `.se-prompt-link`
  outlined button.

```html
<div class="se-prompt" data-se-prompt>
  <div class="se-prompt-head">
    <span class="eyebrow eyebrow-ico"><img src="/our-brand/splendid-visual-brand/icons/v2/poppy/conversation.svg" alt="" />Try it now</span>
  </div>
  <h2 class="se-prompt-title">Skill: Run 1:1 connection workshop</h2>
  <div class="se-prompt-reqs">
    <span class="se-lozenge"><img src="/assets/img/writing/logo-google-calendar.svg" alt="" />Google Calendar <em>required</em></span>
    <span class="se-lozenge"><img src="/assets/img/writing/logo-hubspot.svg" alt="" /><img src="/assets/img/writing/logo-salesforce.svg" alt="" />CRM connection <em>required</em></span>
    <span class="se-lozenge opt"><img src="/our-brand/splendid-visual-brand/icons/v2/lagoon/globe.svg" alt="" />Web access <em>optional</em></span>
  </div>
  <p class="se-prompt-pitch">One line on what the reader gets.</p>
  <div class="se-prompt-window" data-prompt-window>
    <button type="button" class="se-prompt-copy" data-copy><img src="/our-brand/splendid-visual-brand/icons/v2/lagoon/copy.svg" alt="" /><span class="se-prompt-copy-label">Copy</span></button>
    <pre class="se-prompt-body" data-copy-text>...the prompt or skill text...</pre>
  </div>
  <button type="button" class="se-prompt-expand" data-expand aria-expanded="false">Expand</button>
  <p class="se-prompt-cta-lead">Optional lead-in line.</p>
  <a class="se-prompt-link" href="/tools/voice-profile/">Build your voice profile &rarr;</a>
</div>
```
Needs `<script src="/assets/js/copy.js" defer></script>` (it handles both
`[data-copy]` and `[data-expand]`).

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

### Framework matrix (`.se-matrix`) - NEW
A labeled 2-axis grid. Hover, tap, or keyboard-focus a cell to reveal its detail
in the panel below. Data-driven, like the charts.

```html
<figure class="se-matrix" data-se-matrix>
  <figcaption class="se-matrix-title">Every content type, mapped</figcaption>
  <script type="application/json" class="se-matrix-data">
  {
    "xLabel": "Time", "yLabel": "Stance",
    "columns": ["Past", "Present", "Future"],
    "rows": ["Analytical", "Opinion"],
    "cells": [
      { "row": 0, "col": 0, "title": "Case study", "detail": "What happened, and why it worked." }
    ]
  }
  </script>
</figure>
```

`cells` takes the flat `{row, col, title, detail, tag}` form above or a 2D array.
Each cell needs a `title`; `detail` and `tag` are optional. Needs
`<script src="/assets/js/matrix.js" defer></script>`.

### Comparison table (`.se-compare`) - NEW
A two-column "this vs that" table. Each row leads with a dimension label
(`<th scope="row">`); the two `<td>` hold the contrasting values. The header row
marks one side negative (`.se-compare-neg`, muted) and one positive
(`.se-compare-pos`, Poppy), each with an inline brand icon; the positive column
carries a faint Poppy tint. For a trend / value row, drop a `.se-tbl-arrow` inline
SVG before the word (red down for falling, green up for rising). CSS-only. Wrap it
in `.se-compare-wrap` so it scrolls on narrow screens.
```html
<div class="se-compare-wrap">
  <table class="se-compare">
    <thead>
      <tr>
        <th scope="col"></th>
        <th scope="col" class="se-compare-neg"><img src="/our-brand/splendid-visual-brand/icons/v2/lagoon/engine.svg" alt="" />Personalized</th>
        <th scope="col" class="se-compare-pos"><img src="/our-brand/splendid-visual-brand/icons/v2/poppy/relationship.svg" alt="" />Personal</th>
      </tr>
    </thead>
    <tbody>
      <tr><th scope="row">Humanity</th><td>A machine filled in a variable</td><td>A person spent real time on you</td></tr>
      <tr>
        <th scope="row">Value</th>
        <td><svg class="se-tbl-arrow" viewBox="0 0 24 24" fill="none" stroke="#C0392B" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M12 4v15"/><path d="M19 12l-7 7-7-7"/></svg>Falling</td>
        <td><svg class="se-tbl-arrow" viewBox="0 0 24 24" fill="none" stroke="#1F9E5A" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M12 20V5"/><path d="M5 12l7-7 7 7"/></svg>Rising</td>
      </tr>
    </tbody>
  </table>
</div>
```

### Two-axis plot (`.se-quadrant`) - NEW
A positioning plot (scatter), distinct from the **Framework matrix**: the matrix
is a labeled grid of cells, this places each item freely on two continuous axes.
Every marker is a `.se-q-point` positioned by inline `left` / `bottom` percentages,
carrying a brand icon (`.se-q-ico`) and a label set to one side (`.se-q-label.right`
or `.left`). Each point is `tabindex="0"` with a `data-detail` string that shows as
a tooltip on hover or keyboard focus. Optional corner badges (`.se-q-value` +
`.se-q-value-up` / `.se-q-value-down`) call out the direction of travel. The axes
are a rotated `.se-quadrant-ylab` and an `.se-quadrant-xlab` whose ends are
`.se-q-axis-end`. CSS-only (no JS); give the `<figure>` a thorough `aria-label`
since the placement is the message.
```html
<figure class="se-quadrant" role="img" aria-label="Formats plotted by human effort (x) and human evidence (y); cheap, fakeable formats sit low-left, costly human ones high-right.">
  <div class="se-quadrant-grid">
    <div class="se-quadrant-ylab">Human evidence</div>
    <div class="se-quadrant-plot">
      <span class="se-q-value se-q-value-up" style="top:10px; right:12px;"><svg viewBox="0 0 24 24" fill="none" stroke="#1F9E5A" stroke-width="3" stroke-linecap="square" stroke-linejoin="miter"><path d="M12 20V5"/><path d="M5 12l7-7 7 7"/></svg>Rising value</span>
      <span class="se-q-point" tabindex="0" data-detail="Quick to record, but unmistakably your voice." style="left:26%; bottom:66%;"><img class="se-q-ico" src="/our-brand/splendid-visual-brand/icons/v2/lagoon/mic.svg" alt="" /><span class="se-q-label right">Voice memo</span></span>
      <!-- ...more points... -->
    </div>
    <div class="se-quadrant-xlab"><span class="se-q-axis-end">low</span><span>Human effort</span><span class="se-q-axis-end">high</span></div>
  </div>
</figure>
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
more detail), `--ramp short|long`, `--contrast N` (boost contrast before sampling, -1..1), `--color brand` (tint the glyphs with the brand palette), and `--invert` + `--on-lagoon` for light art on
a dark Lagoon panel. Use it sparingly: a wink, per the brand's imagery rules.
Needs `<script src="/assets/js/ascii.js" defer></script>`.

**Build-on-load reveal (optional).** Add two attributes to the `<figure>` and the
art animates itself in when it scrolls into view instead of just appearing:

```html
<figure class="se-ascii" role="img" aria-label="Portrait"
        data-reveal="typewriter" data-reveal-drift>
  <pre class="se-ascii-art" aria-hidden="true">...art...</pre>
</figure>
```

- `data-reveal="typewriter"` types the art out left to right, line by line, with a
  cursor sweeping to the bottom. (`"matrix"` rains it in top to bottom; `"decode"`
  starts scrambled and each character lands on its final glyph.)
- `data-reveal-drift` keeps it alive after it settles: a few characters quietly
  shift on a slow loop, so it never looks like a frozen screenshot. Pauses in
  background tabs.
- Honors `prefers-reduced-motion`: shows the finished art at once, no drift. The
  Xbox hero uses `typewriter` + drift.

### Subscribe / mailing list (`.se-subscribe`) - NEW
A one-field email capture that posts straight to a HubSpot form, so the address
lands in HubSpot and fires whatever follow-up or list you set up there. One email
field, one Subscribe button. Works on a light band, or add `.on-lagoon` for a dark
Lagoon CTA band. On success the field is swapped for a confirmation line.

```html
<section class="section bg-lagoon">
  <div class="container container-narrow">
    <form class="se-subscribe on-lagoon" data-portal-id="46343543" data-form-guid="PASTE-FORM-ID">
      <p class="se-subscribe-eyebrow">Newsletter</p>
      <h2 class="se-subscribe-title">Get new posts in your inbox</h2>
      <p class="se-subscribe-sub">No spam, ever.</p>
      <div class="se-subscribe-row">
        <label class="se-visually-hidden" for="se-sub">Email address</label>
        <input class="se-subscribe-input" id="se-sub" type="email" name="email" required placeholder="you@company.com" autocomplete="email">
        <button class="se-subscribe-btn" type="submit">Subscribe</button>
      </div>
      <p class="se-subscribe-msg" role="status" aria-live="polite"></p>
    </form>
  </div>
</section>
```

The optional `.se-subscribe-sub` paragraph sits just under the title for a
one-line reassurance ("No spam, ever.").

**One-time HubSpot setup.** In HubSpot: Marketing > Forms > Create form > Embedded
form, add a single Email field, publish, then copy the Form ID (a GUID) into
`data-form-guid`. `data-portal-id` is the Splendid Engines portal (`46343543`).
Needs `<script src="/assets/js/subscribe.js" defer></script>`.

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
| Framework matrix (NEW) | this file | `modules.css` | `matrix.js` |
| Comparison table (NEW) | this file | `modules.css` | (none, CSS-only) |
| Two-axis plot (NEW) | this file | `modules.css` | (none, CSS-only) |
| Prompt block (NEW) | this file | `modules.css` | `copy.js` (copy + expand) |

When you add a new module: add its styles to `modules.css`, its behavior to a new
`assets/js/<module>.js` (the `data-*` hook + IIFE pattern, like `charts.js`), a
catalog entry here, and a live example to the gallery page.

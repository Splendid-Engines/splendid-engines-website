#!/usr/bin/env node
// asciify.mjs - turn an image into detailed ASCII art for the se-ascii module.
//
// Detailed ASCII is just an image sampled onto a character grid: each cell picks
// a glyph by brightness from a density ramp. More columns = more detail. The
// se-ascii display module (assets/js/ascii.js) scales the art to fit any screen,
// so go wide here for richness and let the page handle sizing.
//
// Usage:
//   node scripts/asciify.mjs photo.jpg --cols 120
//   node scripts/asciify.mjs photo.jpg --cols 110 --figure --label "Xbox controller"
//   node scripts/asciify.mjs photo.jpg --color brand --figure   # tint glyphs with the brand palette
//   node scripts/asciify.mjs hero.jpg --invert                  # light art for a Lagoon surface
//
// Flags:
//   --cols N      character columns (detail). Default 110.
//   --ramp long|short   density ramp. Default long (70 levels).
//   --invert      map for light-on-dark (e.g. white art on a Lagoon surface).
//   --color brand maps each glyph to the nearest Splendid brand color (emits
//                 colored spans; only meaningful with --figure).
//   --figure      emit the full <figure class="se-ascii"> markup (HTML-escaped).
//   --label TEXT  aria-label + caption for --figure mode.
//   --on-lagoon   add the Lagoon surface modifier class (implies a dark surface).
//   --out FILE    write to FILE (default: stdout).

import fs from 'node:fs';
import path from 'node:path';
import Jimp from 'jimp';

// Density ramps, densest glyph first (maps to the darkest pixel on a light page).
const RAMPS = {
  long: "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ",
  short: "@%#*+=-:. "
};

// Splendid palette. Glyphs in --color brand snap to the nearest of these.
const BRAND = [
  { hex: '#FFFFFF', r: 255, g: 255, b: 255 }, // snow
  { hex: '#153047', r: 21,  g: 48,  b: 71  }, // lagoon
  { hex: '#DB4937', r: 219, g: 73,  b: 55  }, // poppy
  { hex: '#377BDB', r: 55,  g: 123, b: 219 }, // lake
  { hex: '#F2ED44', r: 242, g: 237, b: 68  }, // daffodil
  { hex: '#575C45', r: 87,  g: 92,  b: 69  }  // mate
];
function nearestBrand(r, g, b) {
  let best = BRAND[0], bd = Infinity;
  for (const c of BRAND) {
    const d = (r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2;
    if (d < bd) { bd = d; best = c; }
  }
  return best.hex;
}

function parseArgs(argv) {
  const a = { cols: 110, ramp: 'long', _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--cols') a.cols = Math.max(16, parseInt(argv[++i], 10) || 110);
    else if (t === '--ramp') a.ramp = argv[++i] === 'short' ? 'short' : 'long';
    else if (t === '--invert') a.invert = true;
    else if (t === '--color') a.color = argv[++i];
    else if (t === '--figure') a.figure = true;
    else if (t === '--on-lagoon') a.onLagoon = true;
    else if (t === '--label') a.label = argv[++i];
    else if (t === '--out') a.out = argv[++i];
    else a._.push(t);
  }
  return a;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Returns a grid of cells: { ch, hex }. hex is the nearest brand color for the
// source pixel (used only in --color brand mode).
async function asciify(file, opts) {
  const img = await Jimp.read(file);
  const w = img.bitmap.width, h = img.bitmap.height;
  const cols = opts.cols;
  const rows = Math.max(1, Math.round(cols * (h / w) * 0.5));   // chars are ~2x tall
  img.resize(cols, rows);

  const ramp = RAMPS[opts.ramp];
  const last = ramp.length - 1;
  const data = img.bitmap.data;
  const grid = [];
  for (let y = 0; y < rows; y++) {
    const line = [];
    for (let x = 0; x < cols; x++) {
      const idx = (y * cols + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], alpha = data[idx + 3] / 255;
      // Composite over white so transparency reads as blank page.
      const rr = r * alpha + 255 * (1 - alpha);
      const gg = g * alpha + 255 * (1 - alpha);
      const bb = b * alpha + 255 * (1 - alpha);
      const lum = 0.299 * rr + 0.587 * gg + 0.114 * bb;
      const t = opts.invert ? (255 - lum) / 255 : lum / 255;   // 0 = densest glyph
      line.push({ ch: ramp[Math.round(t * last)], hex: nearestBrand(rr, gg, bb) });
    }
    grid.push(line);
  }
  return grid;
}

function toText(grid) {
  return grid.map((row) => {
    let s = row.map((c) => c.ch).join('');
    return s.replace(/\s+$/, '');
  }).join('\n');
}

// Group consecutive same-color glyph runs into spans; spaces stay uncolored.
function toColoredHtml(grid) {
  return grid.map((row) => {
    let end = row.length;
    while (end > 0 && row[end - 1].ch === ' ') end--;   // trim trailing blanks
    let html = '', cur = '__init__', buf = '';
    const flush = () => {
      if (buf === '') return;
      html += cur === null ? esc(buf) : `<span style="color:${cur}">${esc(buf)}</span>`;
      buf = '';
    };
    for (let i = 0; i < end; i++) {
      const cell = row[i];
      const col = cell.ch === ' ' ? null : cell.hex;
      if (col !== cur) { flush(); cur = col; }
      buf += cell.ch;
    }
    flush();
    return html;
  }).join('\n');
}

(async () => {
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (!opts._[0]) throw new Error('Pass an image path. See the header for usage.');
    const file = path.resolve(opts._[0]);
    const grid = await asciify(file, opts);
    const brand = opts.color === 'brand';
    const body = brand ? toColoredHtml(grid) : (opts.figure ? esc(toText(grid)) : toText(grid));

    let output;
    if (opts.figure) {
      const label = opts.label || 'ASCII art';
      const cls = 'se-ascii reveal' + (opts.onLagoon ? ' on-lagoon' : '');
      output =
        `<figure class="${cls}" role="img" aria-label="${esc(label)}">\n` +
        `  <pre class="se-ascii-art" aria-hidden="true">${body}</pre>\n` +
        `  <figcaption class="se-ascii-caption">${esc(label)}</figcaption>\n` +
        `</figure>\n`;
    } else {
      output = brand ? body : toText(grid);   // brand without --figure still emits spans
    }

    if (opts.out) { fs.writeFileSync(path.resolve(opts.out), output); console.error('wrote ' + opts.out); }
    else process.stdout.write(output + '\n');
  } catch (e) {
    console.error('asciify.mjs error:', e.message);
    process.exit(1);
  }
})();

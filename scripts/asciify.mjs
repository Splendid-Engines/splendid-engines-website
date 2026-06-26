#!/usr/bin/env node
// asciify.mjs - turn an image into detailed ASCII art for the se-ascii module.
//
// Detailed ASCII is just an image sampled onto a character grid: each cell picks
// a glyph by brightness from a density ramp. More columns = more detail. The
// se-ascii display module (assets/js/ascii.js) scales the art to fit any screen,
// so go wide here for richness and let the page handle sizing.
//
// Usage:
//   node scripts/asciify.mjs assets/img/b2b-trust-gap/lomit-patel.png --cols 120
//   node scripts/asciify.mjs logo.png --cols 100 --figure --label "Splendid mark" --out art.html
//   node scripts/asciify.mjs hero.jpg --invert            # light art for a Lagoon surface
//
// Flags:
//   --cols N      character columns (detail). Default 110.
//   --ramp long|short   density ramp. Default long (70 levels).
//   --invert      map for light-on-dark (e.g. white art on a Lagoon surface).
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

function parseArgs(argv) {
  const a = { cols: 110, ramp: 'long', _: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--cols') a.cols = Math.max(16, parseInt(argv[++i], 10) || 110);
    else if (t === '--ramp') a.ramp = argv[++i] === 'short' ? 'short' : 'long';
    else if (t === '--invert') a.invert = true;
    else if (t === '--figure') a.figure = true;
    else if (t === '--on-lagoon') a.onLagoon = true;
    else if (t === '--label') a.label = argv[++i];
    else if (t === '--out') a.out = argv[++i];
    else a._.push(t);
  }
  return a;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function asciify(file, opts) {
  const img = await Jimp.read(file);
  const w = img.bitmap.width, h = img.bitmap.height;
  const cols = opts.cols;
  // Characters are about twice as tall as wide, so squash the row count to keep aspect.
  const rows = Math.max(1, Math.round(cols * (h / w) * 0.5));
  img.resize(cols, rows);

  const ramp = RAMPS[opts.ramp];
  const last = ramp.length - 1;
  const data = img.bitmap.data;             // RGBA, row-major
  const lines = [];
  for (let y = 0; y < rows; y++) {
    let line = '';
    for (let x = 0; x < cols; x++) {
      const idx = (y * cols + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], alpha = data[idx + 3] / 255;
      // Luminance, then composite over a white page so transparency reads as blank.
      let lum = 0.299 * r + 0.587 * g + 0.114 * b;
      lum = lum * alpha + 255 * (1 - alpha);
      const t = opts.invert ? (255 - lum) / 255 : lum / 255;   // 0 = densest glyph
      line += ramp[Math.round(t * last)];
    }
    lines.push(line.replace(/\s+$/, ''));    // trim trailing blanks, keep leading shape
  }
  return lines.join('\n');
}

(async () => {
  try {
    const opts = parseArgs(process.argv.slice(2));
    if (!opts._[0]) throw new Error('Pass an image path. See the header for usage.');
    const file = path.resolve(opts._[0]);
    const art = await asciify(file, opts);

    let output = art;
    if (opts.figure) {
      const label = opts.label || 'ASCII art';
      const cls = 'se-ascii reveal' + (opts.onLagoon ? ' on-lagoon' : '');
      output =
        `<figure class="${cls}" role="img" aria-label="${esc(label)}">\n` +
        `  <pre class="se-ascii-art" aria-hidden="true">${esc(art)}</pre>\n` +
        `  <figcaption class="se-ascii-caption">${esc(label)}</figcaption>\n` +
        `</figure>\n`;
    }

    if (opts.out) { fs.writeFileSync(path.resolve(opts.out), output); console.error('wrote ' + opts.out); }
    else process.stdout.write(output + '\n');
  } catch (e) {
    console.error('asciify.mjs error:', e.message);
    process.exit(1);
  }
})();

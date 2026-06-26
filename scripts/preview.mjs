#!/usr/bin/env node
// preview.mjs - bundle a static page into ONE self-contained HTML file.
//
// Why: Claude Artifacts render HTML in claude.ai but block every external host
// (no CDN, no Google Fonts, no tracking pixels, no same-origin asset fetch). This
// script inlines the local CSS, JS, and images so a writing piece (or the module
// gallery) previews faithfully as an Artifact. Web fonts fall back to the system
// stacks already declared in custom.css; the Claydar tag is stripped. Charts work
// fully because their data lives inline in the page.
//
// Usage:
//   node scripts/preview.mjs writing/b2b-trust-gap
//   node scripts/preview.mjs our-brand/modules --out /tmp/modules.preview.html
//   node scripts/preview.mjs writing/xbox-controller/index.html
//
// Output: a single .html file. Path is printed on the last line of stdout.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.resolve(__dirname, '..', 'public');

const MIME = {
  '.css': 'text/css', '.js': 'text/javascript',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.webm': 'video/webm'
};
const MEDIA_CAP = 4 * 1024 * 1024; // skip inlining assets larger than 4 MB

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--out') { args.out = argv[++i]; }
    else if (argv[i] === '--fragment') { args.fragment = true; }
    else args._.push(argv[i]);
  }
  return args;
}

// Claude Artifacts wrap content in their own <!doctype>/<head>/<body> skeleton,
// so a full document double-wraps. --fragment emits just the <style> blocks plus
// the body's inner HTML (scripts included), ready to drop into an Artifact.
function toFragment(html) {
  const styles = [...html.matchAll(/<style[\s\S]*?<\/style>/gi)].map((m) => m[0]).join('\n');
  const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  return `${styles}\n${body ? body[1] : html}`;
}

function resolveInput(arg) {
  if (!arg) throw new Error('Pass a page path, e.g. "writing/b2b-trust-gap".');
  let p = path.resolve(PUBLIC, arg);
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'index.html');
  if (!p.endsWith('.html')) p = path.join(p, 'index.html');
  if (!fs.existsSync(p)) throw new Error('No HTML at ' + p);
  return p;
}

function dataUri(absPath) {
  try {
    if (!fs.existsSync(absPath)) return null;
    const stat = fs.statSync(absPath);
    if (!stat.isFile() || stat.size > MEDIA_CAP) return null;
    const ext = path.extname(absPath).toLowerCase();
    const mime = MIME[ext] || 'application/octet-stream';
    if (ext === '.svg') {
      const svg = fs.readFileSync(absPath, 'utf8');
      return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
    }
    return `data:${mime};base64,` + fs.readFileSync(absPath).toString('base64');
  } catch { return null; }
}

// Map a site-absolute asset path (/assets/...) to a file on disk.
function assetFile(href) {
  const clean = href.split('?')[0].split('#')[0];
  if (!clean.startsWith('/')) return null;
  return path.join(PUBLIC, clean);
}

function bundle(htmlPath, outPath) {
  let html = fs.readFileSync(htmlPath, 'utf8');
  const notes = [];

  // 1) Drop external <link> (preconnect + Google Fonts) - fonts fall back to system.
  html = html.replace(/<link\b[^>]*href="https?:\/\/[^"]*"[^>]*>\s*/gi, () => {
    notes.push('removed an external <link> (fonts/preconnect)');
    return '';
  });

  // 2) Inline local stylesheets.
  html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="(\/[^"]+\.css)"[^>]*>/gi, (m, href) => {
    const file = assetFile(href);
    if (!file || !fs.existsSync(file)) return m;
    return `<style>/* inlined ${href} */\n` + fs.readFileSync(file, 'utf8') + '\n</style>';
  });

  // 3) Remove external scripts (tracking, CDNs).
  html = html.replace(/<script\b[^>]*src="https?:\/\/[^"]*"[^>]*>\s*<\/script>\s*/gi, () => {
    notes.push('removed an external <script> (tracking/CDN)');
    return '';
  });

  // 4) Inline local scripts.
  html = html.replace(/<script\b([^>]*)src="(\/[^"]+\.js)"([^>]*)>\s*<\/script>/gi, (m, pre, src, post) => {
    const file = assetFile(src);
    if (!file || !fs.existsSync(file)) return m;
    // Escape any literal </script> inside the JS (string or comment) so it does
    // not close the inline <script> block early. Harmless to JS semantics.
    const js = fs.readFileSync(file, 'utf8').replace(/<\/(script)/gi, '<\\/$1');
    return `<script>/* inlined ${src} */\n` + js + '\n</script>';
  });

  // 5) Inline local media referenced via src / href / poster.
  let inlined = 0, skipped = 0;
  html = html.replace(/\b(src|href|poster)="(\/[^"]+\.(?:png|jpe?g|gif|webp|svg|mp4|webm))"/gi, (m, attr, url) => {
    const file = assetFile(url);
    const uri = file ? dataUri(file) : null;
    if (uri) { inlined++; return `${attr}="${uri}"`; }
    skipped++;
    return m;
  });
  if (skipped) notes.push(`${skipped} media asset(s) left as links (missing or over ${Math.round(MEDIA_CAP / 1024 / 1024)} MB)`);

  // 6) Banner so it is obvious this is a preview build.
  const banner = `<!-- SELF-CONTAINED PREVIEW of ${path.relative(PUBLIC, htmlPath)} -->\n` +
    `<!-- Generated for a Claude Artifact. Web fonts use system fallbacks; tracking removed. -->\n` +
    `<!-- ${inlined} media asset(s) inlined. ${notes.join('; ') || 'no notes'}. -->\n`;
  html = html.replace(/<!DOCTYPE html>/i, '<!DOCTYPE html>\n' + banner);

  return { html, inlined, notes };
}

// --- main ---
try {
  const args = parseArgs(process.argv.slice(2));
  const input = resolveInput(args._[0]);
  const slug = path.basename(path.dirname(input)) || 'page';
  const ext = args.fragment ? 'fragment.html' : 'preview.html';
  const out = args.out ? path.resolve(args.out) : path.resolve(process.cwd(), `${slug}.${ext}`);
  const { html, inlined, notes } = bundle(input);
  const output = args.fragment ? toFragment(html) : html;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, output);
  console.error(`Bundled ${path.relative(PUBLIC, input)}${args.fragment ? ' (fragment)' : ''}  (${inlined} assets inlined; ${notes.length} note(s))`);
  console.log(out);
} catch (e) {
  console.error('preview.mjs error:', e.message);
  process.exit(1);
}

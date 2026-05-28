// Bakes Lucide source SVGs into Splendid spec-compliant variants.
//
// Reads lucide-static SVGs, rewrites stroke attributes to spec
// (2.5px, square caps, miter joins), and writes Lagoon / Poppy / white
// color variants to ./lagoon/ ./poppy/ ./white/ .
//
// Run from repo root: npm run icons:build

import { readFile, writeFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..', '..', '..');
const LUCIDE_ICONS_DIR = join(REPO_ROOT, 'node_modules', 'lucide-static', 'icons');

const COLORS = {
  lagoon: '#153047',
  poppy: '#DB4937',
  white: '#FFFFFF',
};

// v2 icon name -> lucide source name.
// Domain concepts keep Splendid vocabulary; generic UI uses Lucide names.
const MAPPING = {
  // Splendid domain concepts (remapped from v1)
  'account': 'square-user',
  'pipeline': 'workflow',
  'signal': 'radio-tower',
  'discovery': 'compass',
  'conversion': 'repeat-2',
  'trust': 'shield-check',
  'engagement': 'message-circle-heart',
  'motion': 'trending-up',
  'operator': 'settings',
  'engine': 'cpu',
  'conversation': 'messages-square',
  'contact': 'user-round',
  'connection': 'link',
  'relationship': 'users-round',
  'segment': 'users',
  'offer': 'gift',
  'campaign': 'megaphone',
  'monitor': 'monitor',
  'growth': 'trending-up',
  'interaction': 'mouse-pointer-click',
  'enrollment': 'user-plus',
  'client': 'handshake',
  'campaign-event': 'calendar-clock',
  'industry-event': 'calendar-days',
  'content-program': 'folder-open',
  'content-project': 'file-text',
  'post': 'message-square',
  'team-member': 'user-round',
  'check': 'check',
  'arrow-right': 'arrow-right',
  'file': 'file',

  // Generic UI primitives (Lucide names preserved)
  'x': 'x',
  'plus': 'plus',
  'minus': 'minus',
  'menu': 'menu',
  'search': 'search',
  'settings': 'settings',
  'mail': 'mail',
  'calendar': 'calendar',
  'eye': 'eye',
  'lock': 'lock',
  'lock-open': 'lock-open',
  'info': 'info',
  'circle-alert': 'circle-alert',
  'circle-check': 'circle-check',
  'chevron-up': 'chevron-up',
  'chevron-down': 'chevron-down',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'arrow-left': 'arrow-left',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',
  'external-link': 'external-link',
  'download': 'download',
  'building': 'building',
  'briefcase': 'briefcase',
  'target': 'target',
  'zap': 'zap',
};

function coerceSvg(src, strokeColor) {
  let out = src;
  out = out.replace(/<!--[\s\S]*?-->\n?/g, '');
  out = out.replace(/\s*class="lucide[^"]*"/, '');
  out = out.replace(/stroke-width="[^"]*"/, 'stroke-width="2.5"');
  out = out.replace(/stroke-linecap="[^"]*"/, 'stroke-linecap="square"');
  out = out.replace(/stroke-linejoin="[^"]*"/, 'stroke-linejoin="miter"');
  out = out.replace(/stroke="[^"]*"/, `stroke="${strokeColor}"`);
  return out.trim() + '\n';
}

async function emptyDir(dir) {
  if (!existsSync(dir)) return;
  for (const f of await readdir(dir)) {
    if (f.endsWith('.svg')) await unlink(join(dir, f));
  }
}

async function main() {
  const stats = { built: 0, missing: [] };
  for (const tone of Object.keys(COLORS)) {
    const outDir = join(__dirname, tone);
    await mkdir(outDir, { recursive: true });
    await emptyDir(outDir);
  }

  const entries = Object.entries(MAPPING).sort(([a], [b]) => a.localeCompare(b));
  for (const [v2Name, lucideName] of entries) {
    const srcPath = join(LUCIDE_ICONS_DIR, `${lucideName}.svg`);
    if (!existsSync(srcPath)) {
      stats.missing.push(`${v2Name} -> ${lucideName}`);
      continue;
    }
    const src = await readFile(srcPath, 'utf8');
    for (const [tone, color] of Object.entries(COLORS)) {
      const coerced = coerceSvg(src, color);
      await writeFile(join(__dirname, tone, `${v2Name}.svg`), coerced);
    }
    stats.built++;
  }

  console.log(`Built ${stats.built} icons x 3 color variants = ${stats.built * 3} files.`);
  if (stats.missing.length) {
    console.warn('Missing Lucide sources for:');
    for (const m of stats.missing) console.warn('  -', m);
    process.exitCode = 1;
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

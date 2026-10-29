// PWA checks: manifest contents, real icon files, service-worker precache
// integrity, and the HTML wiring that makes it installable.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const exists = (p) => fs.existsSync(path.join(root, p));

/* ------------------------------------------------------------ manifest */
const manifest = JSON.parse(read('manifest.webmanifest'));

assert.ok(manifest.name && manifest.name.length > 3, 'manifest has a name');
assert.ok(manifest.short_name && manifest.short_name.length <= 12, 'short_name fits a home screen');
assert.equal(manifest.display, 'standalone', 'launches standalone (no browser chrome)');
assert.equal(manifest.orientation, 'portrait', 'locks portrait');
assert.equal(manifest.start_url, './', 'start_url is relative so it works on any host/path');
assert.equal(manifest.scope, './', 'scope is relative');
assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i, 'theme_color set');
assert.match(manifest.background_color, /^#[0-9a-f]{6}$/i, 'background_color set');
assert.ok(Array.isArray(manifest.icons) && manifest.icons.length >= 3, 'at least three icons');

/* --------------------------------------------------------------- icons */
const sizes = manifest.icons.map((i) => i.sizes);
assert.ok(sizes.includes('192x192'), 'has a 192x192 icon');
assert.ok(sizes.includes('512x512'), 'has a 512x512 icon');
assert.ok(
  manifest.icons.some((i) => (i.purpose || '').includes('maskable')),
  'has a maskable icon for Android adaptive shapes'
);

function checkPng(p, expectSize) {
  assert.ok(exists(p), `icon exists: ${p}`);
  const buf = fs.readFileSync(path.join(root, p));
  assert.equal(buf.slice(1, 4).toString('ascii'), 'PNG', `${p} is a real PNG`);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  assert.equal(`${w}x${h}`, expectSize, `${p} is ${expectSize}`);
  return buf;
}

for (const icon of manifest.icons) {
  checkPng(icon.src.replace(/^\.\//, ''), icon.sizes);
}
checkPng('icons/apple-touch-icon-180.png', '180x180');

/* ------------------------------------------------------- HTML wiring */
const html = read('index.html');
assert.match(html, /<link[^>]+rel="manifest"[^>]+href="manifest\.webmanifest"/, 'manifest is linked');
assert.match(html, /rel="apple-touch-icon"[^>]+href="icons\/apple-touch-icon-180\.png"/, 'iOS touch icon linked');
assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/, 'iOS standalone meta');
assert.match(html, /name="apple-mobile-web-app-status-bar-style"/, 'iOS translucent status bar');
assert.match(html, /name="apple-mobile-web-app-title"/, 'iOS home-screen title');
assert.match(html, /viewport-fit=cover/, 'viewport opts into the notch area');
assert.match(html, /id="btn-install"/, 'install button present');
assert.match(html, /id="install-hint"/, 'iOS install hint present');
assert.match(html, /id="intro"/, 'cold open is in the shell');
assert.match(html, /css\/intro\.css/, 'cold open stylesheet is linked');

/* --------------------------------------------------- service worker */
const sw = read('sw.js');
const block = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
assert.ok(block, 'PRECACHE list found in sw.js');

const entries = [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
assert.ok(entries.length >= 10, `precache lists the shell (${entries.length} entries)`);

for (const entry of entries) {
  const rel = entry.replace(/^\.\//, '');
  if (rel === '') {
    assert.ok(exists('index.html'), 'precached root maps to index.html');
    continue;
  }
  assert.ok(exists(rel), `precached file exists: ${rel}`);
}

for (const f of ['js/main.js', 'js/match.js', 'js/art.js', 'js/data.js', 'js/audio.js', 'js/crest.js', 'css/style.css', 'css/intro.css']) {
  assert.ok(entries.some((e) => e.replace(/^\.\//, '') === f), `precache covers ${f}`);
}

assert.match(sw, /self\.addEventListener\('install'/, 'install handler');
assert.match(sw, /self\.addEventListener\('activate'/, 'activate handler');
assert.match(sw, /self\.addEventListener\('fetch'/, 'fetch handler');
assert.match(sw, /skipWaiting/, 'new worker takes over');
assert.match(sw, /cache\.match\('\.\/index\.html'\)/, 'offline navigation falls back to the shell');

/* --------------------------------------------------------- app wiring */
const main = read('js/main.js');
assert.match(main, /serviceWorker\.register\('\.\/sw\.js'\)/, 'app registers the worker');
assert.match(main, /beforeinstallprompt/, 'app handles the Android install prompt');

/* ------------------------------------------------------ vercel config */
const vercel = JSON.parse(read('vercel.json'));
assert.ok(Array.isArray(vercel.headers), 'vercel headers configured');
const swHeader = vercel.headers.find((h) => h.source === '/sw.js');
assert.ok(swHeader, 'vercel sets cache headers for sw.js');
assert.ok(
  swHeader.headers.some((h) => /must-revalidate/.test(h.value)),
  'sw.js is never served stale from a CDN'
);
assert.ok(exists('.vercelignore'), '.vercelignore keeps dev tooling out of the deploy');

console.log(`pwa: OK — ${entries.length} precached files, ${manifest.icons.length} manifest icons`);
process.exit(0);

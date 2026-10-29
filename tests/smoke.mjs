// End-to-end smoke test in jsdom with a stubbed 2D context.
// Verifies boot, the cold open, navigation, tutorial, a full tilt, and the armory.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const SAVE_KEY = 'joustline-the-first-v1';
const LEGACY_SAVE_KEY = 'lance-and-crown-v1';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { url: 'http://localhost:3000/' });
const { window } = dom;

/* ---- stub a 2D context: every method is a no-op, gradients are inert ---- */
function makeCtx() {
  const grad = { addColorStop() {} };
  const ctx = {
    canvas: window.document.createElement('canvas'),
    createLinearGradient: () => grad,
    createRadialGradient: () => grad,
    createPattern: () => null,
    measureText: () => ({ width: 10 }),
  };
  const methods = [
    'save', 'restore', 'translate', 'scale', 'rotate', 'setTransform', 'resetTransform',
    'clearRect', 'fillRect', 'strokeRect', 'beginPath', 'moveTo', 'lineTo', 'quadraticCurveTo',
    'bezierCurveTo', 'arc', 'arcTo', 'ellipse', 'closePath', 'fill', 'stroke', 'clip',
    'drawImage', 'fillText', 'strokeText', 'rect', 'roundRect', 'setLineDash',
  ];
  for (const m of methods) ctx[m] = () => {};
  return ctx;
}
window.HTMLCanvasElement.prototype.getContext = function () {
  return makeCtx();
};

/* ---- globals main.js expects ---- */
let now = 1000;
const rafQueue = [];
globalThis.window = window;
globalThis.document = window.document;
globalThis.localStorage = window.localStorage;
globalThis.performance = { now: () => now };
globalThis.requestAnimationFrame = (cb) => {
  rafQueue.push(cb);
  return rafQueue.length;
};
globalThis.cancelAnimationFrame = () => {};

function step(ms = 16) {
  now += ms;
  const q = rafQueue.splice(0, rafQueue.length);
  for (const cb of q) cb(now);
}

const $ = (id) => window.document.getElementById(id);
const active = () => {
  const el = window.document.querySelector('.screen.active');
  return el ? el.id : null;
};
const stored = () => JSON.parse(window.localStorage.getItem(SAVE_KEY));

/* ---- seed a purse so the armory path is reachable, tutorial still unseen.
   Written under the OLD key on purpose: boot has to migrate it. ---- */
window.localStorage.setItem(
  LEGACY_SAVE_KEY,
  JSON.stringify({ gold: 600, up: { lance: 0, armor: 0, horse: 0 }, beaten: [], runs: 0, seenTutorial: false })
);

await import('../js/main.js');
step(16);

/* ---- the cold open plays first, and a tap gets out of it ---- */
assert.equal($('intro').hidden, false, 'the branded cold open plays before anything else');
assert.equal(active(), 'scr-title', 'the title is assembled underneath it');
$('intro').dispatchEvent(new window.Event('pointerdown'));
assert.equal($('intro').hidden, true, 'a tap skips the cold open');

const dismissStory = () => {
  let n = 0;
  while (active() === 'scr-story' && n < 16) {
    $('btn-story-next').click();
    n++;
  }
};

dismissStory();
assert.equal(active(), 'scr-title', 'boots on the title screen, after the prologue');
assert.equal(stored().seenPrologue, true, 'prologue is marked as read');
assert.equal($('title-gold').textContent, '600', 'title reads the saved purse');

$('btn-play').click();
assert.equal(active(), 'scr-ladder', 'play opens the lists');

const rows = window.document.querySelectorAll('.rival-row');
assert.equal(rows.length, 6, 'six rivals on the ladder');
assert.equal(rows[1].disabled, true, 'second rival starts locked');

rows[0].click();
assert.equal(active(), 'scr-story', 'a first meeting opens the rival\u2019s story');

dismissStory();
assert.equal(active(), 'scr-help', 'first run shows the tutorial');

$('btn-help-start').click();
assert.ok(window.document.body.classList.contains('in-match'), 'match begins after the tutorial');
assert.equal(active(), null, 'no screen overlays the tilt');

/* ---- play: tap every frame so every phase resolves ---- */
const canvas = $('stage');
const tap = () => canvas.dispatchEvent(new window.Event('pointerdown'));

const youBar = $('hp-you');
let frames = 0;
let sawDamage = false;
let sawPassTwo = false;
while (frames < 20000) {
  step(16);
  frames++;
  tap();
  if (youBar.style.width && parseFloat(youBar.style.width) < 100) sawDamage = true;
  if ($('passnum').textContent === 'PASS 2') sawPassTwo = true;
  const a = active();
  if (a === 'scr-result' || a === 'scr-champion') break;
  assert.equal(a, null, 'no unexpected screen during the tilt');
}

const end = active();
assert.ok(end === 'scr-result' || end === 'scr-champion', `tilt reached a result screen (got ${end})`);
assert.ok(sawDamage, 'health bars reacted to hits');
assert.ok(sawPassTwo, 'the tilt ran more than one pass');
assert.ok(frames < 20000, 'the tilt finished inside the simulated window');
assert.ok(!window.document.body.classList.contains('in-match'), 'HUD leaves with the match');
assert.ok($('res-story').textContent.length > 20, 'the rival gets a story beat after the tilt');

const afterMatch = stored();
assert.equal(afterMatch.runs, 1, 'run counted');
assert.equal(afterMatch.seenTutorial, true, 'tutorial marked as seen');
assert.ok(afterMatch.gold >= 600, 'purse never goes backwards');
assert.equal(typeof afterMatch.tokens, 'number', 'Glow is tracked');
assert.ok(afterMatch.knight && afterMatch.squire && afterMatch.lady, 'retinue choices persist');
assert.ok(afterMatch.coat && afterMatch.coat.field && afterMatch.coat.charge, 'coat of arms persists');

/* ---- armory purchase path ---- */
$('btn-res-armory').click();
assert.equal(active(), 'scr-armory', 'result screen leads to the armory');

const buy = window.document.querySelector('[data-buy="lance"]');
assert.ok(buy, 'lance upgrade card rendered');
assert.equal(buy.disabled, false, 'lance upgrade is affordable');

const before = stored();
buy.click();
const after = stored();
assert.equal(after.up.lance, 1, 'upgrade applied');
assert.equal(before.gold - after.gold, 70, 'first lance upgrade costs 70 gold');

/* ---- retinue: pick a knight, a squire, and a lady you have to earn ---- */
$('scr-armory').querySelector('[data-back]').click();
assert.equal(active(), 'scr-ladder', 'armory back returns to the lists');
$('scr-ladder').querySelector('[data-back]').click();
assert.equal(active(), 'scr-title', 'lists back returns to the title');

$('btn-retinue').click();
assert.equal(active(), 'scr-retinue', 'retinue screen opens');
assert.equal($('knight-list').querySelectorAll('.pick').length, 3, 'three knights to choose from');
assert.equal($('squire-list').querySelectorAll('.pick').length, 3, 'three squires to choose from');

const ladies = $('lady-list').querySelectorAll('.pick');
assert.equal(ladies.length, 4, 'four ladies to ride for');
assert.equal(ladies[0].disabled, false, 'the first lady is waiting at the gate');
assert.equal(
  ladies[1].disabled,
  stored().beaten.length < 1,
  'later ladies are gated on rivals beaten'
);

const knights = $('knight-list').querySelectorAll('.pick');
knights[1].click();
assert.equal(stored().knight, 'baron', 'choosing a knight sticks');

/* ---- heraldry: charges are earned, never bought ---- */
const chips = $('heraldry-list').querySelectorAll('.chip');
assert.equal(chips.length, 12, 'six fields and six charges');
const lockedChips = [...chips].filter((c) => c.disabled).length;
assert.equal(lockedChips > 0, stored().beaten.length < 6, 'earned symbols stay locked until rivals fall');

const tiers = $('barding-list').querySelectorAll('.pick');
assert.equal(tiers.length, 5, 'five barding tiers');
assert.equal(tiers[0].disabled, true, 'worn barding cannot be re-bought');

$('btn-retinue-done').click();
assert.equal(active(), 'scr-title', 'retinue done returns to the title');

console.log(
  `smoke: OK — ${frames} frames, ${after.gold} purse, ${afterMatch.tokens} glow, ` +
    `${afterMatch.runs} run(s), result screen "${end}"`
);
process.exit(0);

// Bootstrap: save state, screens, ladder/armory, and the render loop.

import * as Art from './art.js';
import { Match } from './match.js';
import { PROLOGUE, STORY } from './story.js';
import {
  RIVALS,
  UPGRADES,
  MAX_LEVEL,
  KNIGHTS,
  SQUIRES,
  LADIES,
  FIELDS,
  CHARGES,
  BARDING,
  playerStats,
  rivalStats,
  upgradeCost,
  loadSave,
  saveGame,
  emptySave,
  knightOf,
  squireOf,
  ladyOf,
  ladyUnlocked,
  fieldUnlocked,
  chargeUnlocked,
  chargeOf,
  heroPal,
  goldEarn,
  tokenEarn,
} from './data.js';
import { Sfx, unlock, setMuted, vibrate } from './audio.js';

const $ = (id) => document.getElementById(id);
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

let save = loadSave();
let match = null;
let currentRival = null;
let pendingRival = null;
let helpReturn = 'scr-title';
let armoryReturn = 'scr-ladder';
let W = 1;
let H = 1;
let idleT = 0;

const canvas = $('stage');
const ctx = canvas.getContext('2d', { alpha: false });

/* ------------------------------------------------------------- screens */

function show(id) {
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === id));
}

function hideScreens() {
  document.querySelectorAll('.screen').forEach((s) => s.classList.remove('active'));
}

/* ---------------------------------------------------------------- HUD */

const ui = {
  setPass(n) {
    $('passnum').textContent = 'PASS ' + n;
  },
  prompt(main, sub = '', tone = '') {
    const m = $('callout-main');
    const s = $('callout-sub');
    m.textContent = main;
    s.textContent = sub || '';
    m.style.color = tone === 'gold' ? '#ffe6a8' : tone === 'dim' ? '#c7b79c' : '#fff6e2';
    m.classList.remove('pop');
    s.classList.remove('pop');
    void m.offsetWidth;
    m.classList.add('pop');
    s.classList.add('pop');
  },
  toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.remove('pop');
    void t.offsetWidth;
    t.classList.add('pop');
  },
};

function setBar(el, frac) {
  const key = Math.round(frac * 400);
  if (el.dataset.k !== String(key)) {
    el.dataset.k = key;
    el.style.width = (Math.max(0, Math.min(1, frac)) * 100).toFixed(1) + '%';
  }
}

function setPlates(el, fighter) {
  const kids = el.children;
  for (let i = 0; i < kids.length; i++) {
    const z = kids[i].dataset.z;
    const max = fighter.maxPlates[z] || 1;
    const cur = fighter.plates[z] || 0;
    const frac = cur / max;
    const state = frac <= 0.02 ? 'broken' : frac < 0.45 ? 'low' : 'ok';
    if (kids[i].dataset.state !== state) kids[i].dataset.state = state;
  }
}

function syncHUD() {
  if (!match) return;
  setBar($('hp-you'), match.you.hp / match.you.maxHP);
  setBar($('hp-foe'), match.foe.hp / match.foe.maxHP);
  setPlates($('plates-you'), match.you);
  setPlates($('plates-foe'), match.foe);
}

/* -------------------------------------------------------------- screens */

function updateTitle() {
  $('title-gold').textContent = save.gold;
  $('title-tokens').textContent = save.tokens;
  $('title-wins').textContent = save.beaten.length + '/' + RIVALS.length;
  $('you-who').textContent = knightOf(save).name.split(' ').slice(-1)[0].toUpperCase();
  const foot = document.querySelector('.title-foot .fine');
  if (foot) foot.textContent = knightOf(save).name + ' rides for ' + ladyOf(save).name;
}

/** Push the player's heraldry + barding into the art module. */
function applyStyle() {
  Art.setHeroStyle({ pal: heroPal(save), barding: save.barding || 0, charge: chargeOf(save).id });
}

function isUnlocked(i) {
  return i === 0 || save.beaten.includes(RIVALS[i - 1].id);
}

function renderLadder() {
  $('ladder-gold').textContent = save.gold;
  const list = $('ladder-list');
  list.innerHTML = '';
  RIVALS.forEach((r, i) => {
    const unlocked = isUnlocked(i);
    const beaten = save.beaten.includes(r.id);
    const el = document.createElement('button');
    el.className = 'rival-row' + (beaten ? ' beaten' : '') + (unlocked ? '' : ' locked');
    el.disabled = !unlocked;
    el.innerHTML = `
      <span class="rank" style="color:${beaten ? '#7fd07f' : r.pal.cloth2}">${beaten ? '&#10003;' : ROMAN[i]}</span>
      <div class="body">
        <div class="nm">${r.name}</div>
        <div class="hs">${r.house}</div>
      </div>
      <div class="rw">${unlocked ? r.reward : '\u2014'}<small>${beaten ? 'defeated' : unlocked ? 'purse' : 'locked'}</small></div>`;
    el.addEventListener('click', () => {
      unlock();
      Sfx.ui();
      beginRival(r);
    });
    list.appendChild(el);
  });
}

function renderArmory() {
  $('armory-gold').textContent = save.gold;
  $('armory-tokens').textContent = save.tokens;
  const wrap = $('armory-list');
  wrap.innerHTML = '';
  Object.keys(UPGRADES).forEach((key) => {
    const lvl = save.up[key] || 0;
    const maxed = lvl >= MAX_LEVEL;
    const cost = upgradeCost(key, lvl);
    const afford = cost !== null && save.gold >= cost;
    const pips = Array.from({ length: MAX_LEVEL }, (_, i) => `<i class="${i < lvl ? 'on' : ''}"></i>`).join('');
    const card = document.createElement('div');
    card.className = 'up-card';
    card.innerHTML = `
      <h3>${UPGRADES[key].name} <span style="color:var(--ink-dim);font-size:12px;letter-spacing:.1em">LV ${lvl}/${MAX_LEVEL}</span></h3>
      <p>${maxed ? UPGRADES[key].blurbMax : UPGRADES[key].blurb}</p>
      <div class="pips">${pips}</div>
      <div class="up-row">
        <span class="cost">${maxed ? 'Masterwork' : '\u25C6 ' + cost}</span>
        <button class="btn primary" data-buy="${key}" ${maxed || !afford ? 'disabled' : ''}>${maxed ? 'Maxed' : afford ? 'Upgrade' : 'Need gold'}</button>
      </div>`;
    wrap.appendChild(card);
  });

  wrap.querySelectorAll('[data-buy]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.buy;
      const lvl = save.up[key] || 0;
      const cost = upgradeCost(key, lvl);
      if (cost === null || lvl >= MAX_LEVEL || save.gold < cost) return;
      save.gold -= cost;
      save.up[key] = lvl + 1;
      saveGame(save);
      Sfx.upgrade();
      renderArmory();
      updateTitle();
    });
  });

  renderBarding();
  renderHeraldry();
}

/* ------------------------------------------------------------ retinue */

function pickList(el, items, currentId, opts) {
  el.innerHTML = '';
  items.forEach((item) => {
    const locked = opts.locked ? !!opts.locked(item) : false;
    const btn = document.createElement('button');
    btn.className = 'pick' + (item.id === currentId ? ' selected' : '') + (locked ? ' locked' : '');
    btn.disabled = locked;
    const swatch = item.pal ? `<span class="swatch" style="background:${item.pal.cloth}"></span>` : '';
    const line = locked ? opts.lockedNote(item) : opts.note(item);
    btn.innerHTML = `${swatch}<span class="body"><span class="nm">${item.name}</span><span class="bl">${item.blurb || ''}</span><span class="boon">${line}</span></span>`;
    btn.addEventListener('click', () => {
      if (locked) return;
      Sfx.ui();
      opts.pick(item);
    });
    el.appendChild(btn);
  });
}

function renderRetinue() {
  pickList($('knight-list'), KNIGHTS, save.knight, {
    note: (k) => k.boon,
    pick: (k) => {
      save.knight = k.id;
      saveGame(save);
      applyStyle();
      renderRetinue();
      updateTitle();
    },
  });

  pickList($('squire-list'), SQUIRES, save.squire, {
    note: (s) => s.perk,
    pick: (s) => {
      save.squire = s.id;
      saveGame(save);
      renderRetinue();
    },
  });

  pickList($('lady-list'), LADIES, save.lady, {
    locked: (l) => !ladyUnlocked(save, l),
    lockedNote: (l) => `Ride for her after ${l.unlock} rival${l.unlock === 1 ? '' : 's'}`,
    note: (l) => l.boon,
    pick: (l) => {
      save.lady = l.id;
      saveGame(save);
      renderRetinue();
      updateTitle();
    },
  });
}

/* ---------------------------------------------------------- heraldry */

function chipRow(labelText, items, currentId, isUnlocked, onPick, dotStyle) {
  const row = document.createElement('div');
  const label = document.createElement('div');
  label.className = 'row-label';
  label.textContent = labelText;
  const chips = document.createElement('div');
  chips.className = 'chip-row';

  items.forEach((item) => {
    const ok = isUnlocked(item);
    const chip = document.createElement('button');
    chip.className = 'chip' + (item.id === currentId ? ' selected' : '') + (ok ? '' : ' locked');
    chip.disabled = !ok;
    chip.innerHTML =
      (dotStyle ? `<span class="dot" style="${dotStyle(item)}"></span>` : '') +
      `<span>${item.name}</span>` +
      (ok ? '' : `<span class="need">${item.unlock} rivals</span>`);
    chip.addEventListener('click', () => {
      if (!ok) return;
      Sfx.ui();
      onPick(item);
    });
    chips.appendChild(chip);
  });

  row.appendChild(label);
  row.appendChild(chips);
  return row;
}

function renderHeraldry() {
  const wrap = $('heraldry-list');
  wrap.innerHTML = '';
  wrap.appendChild(
    chipRow(
      'Field',
      FIELDS,
      save.coat.field,
      (f) => fieldUnlocked(save, f),
      (f) => {
        save.coat.field = f.id;
        saveGame(save);
        applyStyle();
        renderHeraldry();
      },
      (f) => `background:${f.color}`
    )
  );
  wrap.appendChild(
    chipRow(
      'Charge',
      CHARGES,
      save.coat.charge,
      (c) => chargeUnlocked(save, c),
      (c) => {
        save.coat.charge = c.id;
        saveGame(save);
        applyStyle();
        renderHeraldry();
      },
      () => 'background:var(--gold);opacity:.9'
    )
  );
}

function renderBarding() {
  const el = $('barding-list');
  el.innerHTML = '';
  const worn = save.barding || 0;

  BARDING.forEach((tier) => {
    const owned = tier.level <= worn;
    const current = tier.level === worn;
    const next = tier.level === worn + 1;
    const afford = save.tokens >= tier.cost;
    const btn = document.createElement('button');
    btn.className = 'pick' + (current ? ' selected' : '') + (!owned && !(next && afford) ? ' locked' : '');
    btn.disabled = current || !(owned || (next && afford));
    const state = current ? 'Worn now' : owned ? 'Owned' : next ? (afford ? 'Unlock' : 'Not enough Glow') : 'Later';
    btn.innerHTML =
      `<span class="body"><span class="nm">${tier.name}</span><span class="bl">${tier.blurb}</span>` +
      `<span class="boon">${state}</span></span>` +
      `<span class="cost">${owned ? '\u2014' : tier.cost + ' Glow'}</span>`;
    btn.addEventListener('click', () => {
      if (current) return;
      if (!owned) {
        if (!next || save.tokens < tier.cost) return;
        save.tokens -= tier.cost;
      }
      save.barding = Math.max(worn, tier.level);
      saveGame(save);
      Sfx.upgrade();
      applyStyle();
      renderArmory();
      updateTitle();
    });
    el.appendChild(btn);
  });
}

/* --------------------------------------------------------------- story */

let storyRun = null;

function renderStory() {
  const { panels, i } = storyRun;
  const panel = panels[i];
  $('story-kicker').textContent = panel.kicker || '';
  $('story-title').textContent = panel.title || '';
  $('story-text').textContent = panel.text;
  $('story-progress').textContent = i + 1 + ' / ' + panels.length;
  $('btn-story-next').textContent = i === panels.length - 1 ? 'Continue' : 'Next';
}

function showStory(panels, done) {
  storyRun = { panels, i: 0, done };
  renderStory();
  hideScreens();
  show('scr-story');
}

/** First meeting with a rival gets its story panels; later meetings go straight in. */
function beginRival(rival) {
  save.story = save.story || {};
  const enter = () => {
    show('scr-ladder');
    maybeKnot(rival, () => startMatch(rival));
  };
  const chapter = STORY[rival.id];
  if (chapter && !save.story[rival.id]) {
    save.story[rival.id] = true;
    saveGame(save);
    showStory(chapter.intro, enter);
    return;
  }
  enter();
}

/* ------------------------------------------------------- work the knot */

// The Bart-horse: his leg seizes at the worst moment, and the squire's job was
// always to rub the knot out before he topples off Tancrede.
let knotHits = 0;
let knotTimer = null;
let knotDeadline = 0;
let knotAfter = null;
const KNOT_TAPS = 10;
const KNOT_MS = 3500;

function maybeKnot(rival, next) {
  // Only before Bart's fight, and only once: after that he "stretches first".
  if (rival.id !== 'bart' || save.knotDone) {
    next();
    return;
  }
  knotHits = 0;
  knotAfter = next;
  $('knot-fill').style.width = '0%';
  $('knot-sub').textContent =
    'His leg has seized mid-toast. Ten quick rubs before he topples off Tancrede.';
  $('knot-clock').textContent = '3.5s';
  show('scr-knot');
  knotDeadline = performance.now() + KNOT_MS;
  clearInterval(knotTimer);
  knotTimer = setInterval(() => {
    const left = knotDeadline - performance.now();
    $('knot-clock').textContent = left > 0 ? (left / 1000).toFixed(1) + 's' : '0.0s';
    if (left <= 0) endKnot(false);
  }, 100);
}

function rubKnot() {
  if (!knotTimer) return;
  Sfx.tap();
  vibrate(8);
  knotHits += 1;
  $('knot-fill').style.width = Math.min(100, (knotHits / KNOT_TAPS) * 100) + '%';
  if (knotHits >= KNOT_TAPS) endKnot(true);
}

function endKnot(worked) {
  clearInterval(knotTimer);
  knotTimer = null;
  if (worked) {
    save.knotDone = true;
    save.tokens += 1;
    saveGame(save);
    Sfx.perfect();
    updateTitle();
    $('knot-sub').textContent =
      'The knot gives. Bart toasts the ceiling, credits himself, and climbs onto a horse he should not be on.';
    $('knot-clock').textContent = '+1 Glow';
  } else {
    $('knot-sub').textContent =
      'He rides it out anyway. WINNING! The court physician calls it a most unusual horse-cramp.';
    $('knot-clock').textContent = '';
  }
  const go = knotAfter;
  knotAfter = null;
  setTimeout(() => {
    if (go) go();
  }, 1500);
}

/* --------------------------------------------------------------- match */

function startMatch(rival) {
  if (!save.seenTutorial) {
    pendingRival = rival;
    helpReturn = 'scr-ladder';
    show('scr-help');
    return;
  }
  launch(rival);
}

function launch(rival) {
  currentRival = rival;
  pendingRival = null;
  unlock();
  hideScreens();
  document.body.classList.add('in-match');

  const stats = playerStats(save.up, save);
  const foeStats = rivalStats(rival);
  applyStyle();
  match = new Match({
    rival,
    stats,
    foeStats,
    ui,
    onFinish: endMatch,
  });
  match.layout(W, H);
  match.start();

  $('foe-who').textContent = rival.name;
  $('hp-you').dataset.k = '';
  $('hp-foe').dataset.k = '';
  syncHUD();
}

function endMatch(res) {
  match = null;
  document.body.classList.remove('in-match');
  const ps = playerStats(save.up, save);

  const firstClear = !!res.win && !save.beaten.includes(res.rival.id);
  const gold = goldEarn(save, {
    win: res.win,
    youHP: res.youHP,
    maxHP: ps.maxHP,
    reward: res.rival.reward,
  });
  const tokens = tokenEarn(save, {
    win: res.win,
    youHP: res.youHP,
    maxHP: ps.maxHP,
    firstClear,
  });
  if (firstClear) save.beaten.push(res.rival.id);
  save.gold += gold;
  save.tokens += tokens;
  save.runs += 1;
  saveGame(save);
  Sfx.coin();
  updateTitle();

  if (res.win && save.beaten.length >= RIVALS.length) {
    $('champ-gold').textContent = save.gold;
    $('champ-tokens').textContent = save.tokens;
    $('champ-runs').textContent = save.runs;
    show('scr-champion');
    return;
  }

  $('res-kicker').textContent = res.win ? 'PASS ' + res.rival.name.split(' ').slice(-1)[0] : 'THE SAND';
  $('res-title').textContent = res.win ? 'Victory' : 'Unhorsed';
  $('res-sub').textContent = res.win
    ? 'You put ' + res.rival.name + ' in the dirt.'
    : 'You hit the sand. ' + res.rival.name + ' rides on.';
  $('res-gold').textContent = '+' + gold;
  $('res-tokens').textContent = '+' + tokens;
  $('res-passes').textContent = res.passes;
  $('res-hp').textContent = Math.max(0, Math.round(res.youHP));
  const chapter = STORY[res.rival.id];
  $('res-story').textContent = chapter ? (res.win ? chapter.win : chapter.loss) : '';
  document.querySelector('.result-card').classList.toggle('lose', !res.win);
  show('scr-result');
}

/* ---------------------------------------------------------------- loop */

function renderIdle(t) {
  ctx.clearRect(0, 0, W, H);
  const groundY = H * 0.72;
  Art.drawArena(ctx, { W, H, t, scroll: t * 64, groundY });
  const k = Math.min((H * 0.19) / Art.ART_H, (W * 0.3) / 104);
  Art.drawKnight(ctx, {
    x: W * 0.24,
    y: groundY,
    k,
    facing: 1,
    pal: Art.HERO_PAL,
    t,
    gait: t * 3.4 + 0.4,
    couch: 0.12,
  });
  Art.drawKnight(ctx, {
    x: W * 0.78,
    y: groundY,
    k,
    facing: -1,
    pal: RIVALS[5].pal,
    t: t + 1.7,
    gait: t * 3.4,
    couch: 0.12,
  });
}

let last = performance.now();
let idleAcc = 0;
function loop(now) {
  // Clamp high enough that a janky frame rate still advances game time at
  // roughly real speed: at 0.05 a 12fps phone ran the whole tilt in slow motion.
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  // Keep a local handle: update() can end the tilt and clear `match`, and the
  // finished match still needs one final frame drawn.
  const m = match;
  if (m) {
    if (!m.paused) m.update(dt);
    m.render(ctx);
    if (match === m) syncHUD();
  } else {
    // Menus sit over a mostly still scene. Painting it at full rate burns the
    // frame budget on the layer the player is not touching, which is what makes
    // taps feel late on a phone; 20fps behind a screen looks identical.
    idleAcc += dt;
    const menuOpen = !!document.querySelector('.screen.active');
    if (!menuOpen || idleAcc >= 0.05) {
      idleT += idleAcc;
      idleAcc = 0;
      renderIdle(idleT);
    }
  }
  requestAnimationFrame(loop);
}

/* -------------------------------------------------------------- resize */

function resize() {
  W = Math.max(1, window.innerWidth);
  H = Math.max(1, window.innerHeight);
  // Full-screen canvas is fill-rate bound on phones; 2.5 was ~44% more pixels
  // than 2 for no visible gain on a 3x display.
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  Art.prepare(W, H, dpr);
  if (match) match.layout(W, H);
}

/* --------------------------------------------------------------- input */

canvas.addEventListener(
  'pointerdown',
  (e) => {
    unlock();
    if (!match || match.paused) return;
    e.preventDefault();
    match.tap();
  },
  { passive: false }
);

document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('dblclick', (e) => e.preventDefault());

/* -------------------------------------------------------------- wiring */

$('btn-play').addEventListener('click', () => {
  unlock();
  Sfx.ui();
  renderLadder();
  show('scr-ladder');
});

$('btn-armory').addEventListener('click', () => {
  Sfx.ui();
  armoryReturn = 'scr-title';
  renderArmory();
  show('scr-armory');
});

$('btn-retinue').addEventListener('click', () => {
  unlock();
  Sfx.ui();
  renderRetinue();
  show('scr-retinue');
});

$('btn-retinue-back').addEventListener('click', () => {
  Sfx.ui();
  updateTitle();
  show('scr-title');
});

$('btn-retinue-done').addEventListener('click', () => {
  Sfx.ui();
  updateTitle();
  show('scr-title');
});

$('btn-knot').addEventListener('click', rubKnot);

$('btn-story-next').addEventListener('click', () => {
  Sfx.ui();
  if (!storyRun) return;
  if (storyRun.i < storyRun.panels.length - 1) {
    storyRun.i += 1;
    renderStory();
    return;
  }
  const done = storyRun.done;
  storyRun = null;
  if (done) done();
});

$('btn-ladder-armory').addEventListener('click', () => {
  Sfx.ui();
  armoryReturn = 'scr-ladder';
  renderArmory();
  show('scr-armory');
});

$('btn-armory-back').addEventListener('click', () => {
  Sfx.ui();
  if (armoryReturn === 'scr-title') {
    updateTitle();
    show('scr-title');
  } else {
    renderLadder();
    show('scr-ladder');
  }
});

$('btn-help').addEventListener('click', () => {
  Sfx.ui();
  helpReturn = 'scr-title';
  pendingRival = null;
  $('btn-help-start').textContent = 'Understood';
  show('scr-help');
});

$('btn-help-back').addEventListener('click', () => {
  Sfx.ui();
  pendingRival = null;
  show(helpReturn);
});

$('btn-help-start').addEventListener('click', () => {
  Sfx.ui();
  if (pendingRival) {
    save.seenTutorial = true;
    saveGame(save);
    const r = pendingRival;
    pendingRival = null;
    launch(r);
  } else {
    show(helpReturn);
  }
});

document.querySelectorAll('[data-back]').forEach((btn) => {
  btn.addEventListener('click', () => {
    Sfx.ui();
    updateTitle();
    renderLadder();
    show(btn.dataset.back);
  });
});

$('btn-pause').addEventListener('click', () => {
  if (!match) return;
  Sfx.ui();
  match.paused = true;
  show('scr-pause');
});

$('btn-resume').addEventListener('click', () => {
  Sfx.ui();
  if (match) match.paused = false;
  hideScreens();
});

$('btn-forfeit').addEventListener('click', () => {
  Sfx.ui();
  match = null;
  document.body.classList.remove('in-match');
  renderLadder();
  show('scr-ladder');
});

$('btn-res-again').addEventListener('click', () => {
  Sfx.ui();
  if (currentRival) launch(currentRival);
});

$('btn-res-armory').addEventListener('click', () => {
  Sfx.ui();
  armoryReturn = 'scr-ladder';
  renderArmory();
  show('scr-armory');
});

$('btn-res-ladder').addEventListener('click', () => {
  Sfx.ui();
  renderLadder();
  show('scr-ladder');
});

$('btn-champ-keep').addEventListener('click', () => {
  Sfx.ui();
  renderLadder();
  show('scr-ladder');
});

$('btn-champ-reset').addEventListener('click', () => {
  Sfx.ui();
  const muted = save.muted;
  save = emptySave();
  save.seenTutorial = true;
  save.muted = muted;
  saveGame(save);
  updateTitle();
  show('scr-title');
});

$('btn-sound').addEventListener('click', () => {
  save.muted = !save.muted;
  setMuted(save.muted);
  $('btn-sound').style.opacity = save.muted ? '0.45' : '1';
  saveGame(save);
  if (!save.muted) {
    unlock();
    Sfx.ui();
  }
});

/* ------------------------------------------------------ install & offline */

const installBtn = $('btn-install');
let installPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  if (installBtn) installBtn.hidden = false;
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  if (installBtn) installBtn.hidden = true;
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!installPrompt) return;
    Sfx.ui();
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } catch {
      /* dismissed */
    }
    installPrompt = null;
    installBtn.hidden = true;
  });
}

// iOS has no install prompt: point at Share -> Add to Home Screen instead.
const installed =
  (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
  window.navigator.standalone === true;
if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !installed) {
  const hint = $('install-hint');
  if (hint) hint.hidden = false;
}

function registerWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (!/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('./sw.js').catch(() => {
    /* offline support is a bonus; never block the game on it */
  });
}

if (document.readyState === 'complete') registerWorker();
else window.addEventListener('load', registerWorker, { once: true });

/* ---------------------------------------------------------------- boot */

setMuted(!!save.muted);
$('btn-sound').style.opacity = save.muted ? '0.45' : '1';
applyStyle();
resize();

// The story opens the game once, over the title. Afterwards the title leads.
if (!save.seenPrologue) {
  save.seenPrologue = true;
  saveGame(save);
  showStory(PROLOGUE, () => show('scr-title'));
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 140));
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
updateTitle();
requestAnimationFrame(loop);

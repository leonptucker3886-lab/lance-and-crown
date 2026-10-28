// Core game data + pure combat maths (no DOM here, so it stays testable).

export const SAVE_KEY = 'lance-and-crown-v1';

export const UPGRADES = {
  lance: {
    name: 'Lance',
    blurb: 'Ash shaft, steel vamplate. Every hit lands harder.',
    blurbMax: 'Masterwork lance. Nothing on the lists can match it.',
    costs: [70, 140, 240, 380, 560],
  },
  armor: {
    name: 'Harness',
    blurb: 'Full plate and tournament helm. Take more before you fall.',
    blurbMax: 'Gilded plate from Milan. You are a fortress.',
    costs: [70, 140, 240, 380, 560],
  },
  horse: {
    name: 'Destrier',
    blurb: 'Warhorse with wind to spare. Faster run, wider perfect strike.',
    blurbMax: 'The finest destrier in the kingdom.',
    costs: [70, 140, 240, 380, 560],
  },
};

export const MAX_LEVEL = 5;

export const ZONES = [
  { id: 'helm', label: 'HELM', mult: 2.0, note: 'shatters the helm' },
  { id: 'chest', label: 'CHEST', mult: 1.1, note: 'armoured but steady' },
  { id: 'shield', label: 'SHIELD', mult: 0.45, note: 'chips the guard' },
];

export const ZONE_BY_ID = ZONES.reduce((m, z) => ((m[z.id] = z), m), {});

export const STRIKE_MULT = { perfect: 1.75, good: 1.0, poor: 0.35 };

export const STRIKE_LABEL = {
  perfect: 'PERFECT STRIKE',
  good: 'CLEAN HIT',
  poor: 'GLANCING BLOW',
};

export const GALLOP_LABEL = [
  [0.92, 'FULL GALLOP'],
  [0.7, 'STRONG RUN'],
  [0.4, 'STEADY TROT'],
  [0, 'HALF-HEARTED'],
];

/** Player combat stats for a given upgrade spread. */
export function playerStats(up = {}) {
  const lance = up.lance || 0;
  const armor = up.armor || 0;
  const horse = up.horse || 0;
  return {
    lance: 22 + lance * 5.5,
    maxHP: 100 + armor * 20,
    deflect: 0.06 + armor * 0.015,
    plates: {
      helm: 20 + armor * 4,
      chest: 38 + armor * 8,
      shield: 28 + armor * 6,
    },
    perfectWindow: 0.055 + horse * 0.016,
    gallopSweep: 1.0 + horse * 0.05,
  };
}

/** Rival combat stats derived from ladder data. */
export function rivalStats(rival) {
  return {
    lance: rival.lance,
    maxHP: rival.hp,
    deflect: 0.05 + rival.skill * 0.12,
    plates: {
      helm: rival.hp * 0.17,
      chest: rival.hp * 0.36,
      shield: rival.hp * 0.28,
    },
    perfectWindow: 0.05 + rival.skill * 0.03,
    gallopSweep: 1.0,
  };
}

export function upgradeCost(key, level) {
  const l = Math.max(0, Math.min(MAX_LEVEL, level));
  return UPGRADES[key].costs[l] || null;
}

export function zoneOf(ret, zid) {
  return ZONE_BY_ID[zid] || ZONES[1];
}

/**
 * Raw damage before armour absorption.
 * speed 0..1 gallop power, strikeQ key of STRIKE_MULT, aimQ 1..1.15
 */
export function computeDamage({ lance, speed, zoneMult, aimQ, strikeQ, deflect }) {
  const spd = 0.72 + speed * 0.55;
  return Math.max(1, lance * spd * zoneMult * aimQ * (STRIKE_MULT[strikeQ] ?? 1) * (1 - deflect));
}

/**
 * Apply damage to a fighter's plates and body. Mutates fighter.plates/hp.
 * Returns a small report used for hit sparks, toasts and audio.
 */
export function applyHit(fighter, zoneId, raw) {
  const plates = fighter.plates;
  const key = plates[zoneId] !== undefined ? zoneId : 'chest';
  const plate = plates[key];
  let absorbed = 0;
  if (plate > 0) {
    absorbed = Math.min(plate, raw * 0.55);
    plates[key] = plate - absorbed;
  }
  const dealt = raw - absorbed;
  fighter.hp = Math.max(0, fighter.hp - dealt);
  return {
    zone: key,
    dealt,
    absorbed,
    broke: plate > 0 && plates[key] <= 0.001,
    dead: fighter.hp <= 0,
  };
}

export const RIVALS = [
  {
    id: 'montfort',
    name: 'Sir Renault de Montfort',
    house: 'House Montfort',
    hp: 108,
    lance: 18,
    skill: 0.16,
    reward: 65,
    taunt: 'A farmer with a long stick. How charming.',
    pal: { horse: '#4a3a33', horseDark: '#2c211d', cloth: '#2f5aa8', cloth2: '#e6dcc0', plate: '#c8d3e0', plateDark: '#77839a', plume: '#dfe8ff' },
  },
  {
    id: 'varga',
    name: 'Dame Isolde Varga',
    house: 'House Varga',
    hp: 126,
    lance: 20,
    skill: 0.3,
    reward: 95,
    taunt: 'Mind the splinters, little rider.',
    pal: { horse: '#3c3a30', horseDark: '#232118', cloth: '#2f7a4e', cloth2: '#e8c96a', plate: '#c2ccc8', plateDark: '#6f7a76', plume: '#f4e29a' },
  },
  {
    id: 'ash',
    name: 'Sir Corvin Ash',
    house: 'The Ash Company',
    hp: 136,
    lance: 22,
    skill: 0.42,
    reward: 130,
    taunt: 'I have broken better riders than you. Twice.',
    pal: { horse: '#2f2a2c', horseDark: '#1a1618', cloth: '#3a3a42', cloth2: '#b8352f', plate: '#9aa0a8', plateDark: '#5a5f66', plume: '#d9524a' },
  },
  {
    id: 'delacroix',
    name: 'Dame Aliénor Delacroix',
    house: 'House Delacroix',
    hp: 162,
    lance: 25,
    skill: 0.55,
    reward: 180,
    taunt: 'The crown keeps my seat warm. Do hurry.',
    pal: { horse: '#463548', horseDark: '#2a1f2c', cloth: '#6b3f9e', cloth2: '#e3d5ff', plate: '#d5d3e6', plateDark: '#7f7c99', plume: '#c9a6ff' },
  },
  {
    id: 'wrynn',
    name: 'Sir Gareth Wrynn',
    house: 'The Iron Rose',
    hp: 192,
    lance: 28,
    skill: 0.68,
    reward: 240,
    taunt: 'Twenty-one passes unbeaten. You will be twenty-two.',
    pal: { horse: '#4d4238', horseDark: '#2e261f', cloth: '#a83a2e', cloth2: '#f0d9a0', plate: '#e2e5e8', plateDark: '#8b8f95', plume: '#f0d9a0' },
  },
  {
    id: 'cain',
    name: 'Sir Mordred Cain',
    house: 'The Black Banner',
    hp: 224,
    lance: 32,
    skill: 0.82,
    reward: 400,
    taunt: 'The crown is not given, child. It is taken.',
    pal: { horse: '#241f22', horseDark: '#12100f', cloth: '#1d1a1f', cloth2: '#8f1f2a', plate: '#5d5a63', plateDark: '#35323a', plume: '#c22a35' },
  },
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);

/** One pass of rival AI: how hard they run, where they aim, how cleanly they strike. */
export function rollRivalPass(rival) {
  const s = rival.skill;
  const speed = clamp(0.42 + s * 0.55 + rnd(-0.14, 0.14), 0.1, 1);
  const helmW = 0.2 + s * 0.32;
  const shieldW = 0.34 - s * 0.22;
  const r = Math.random();
  const zone = r < helmW ? 0 : r < helmW + (1 - helmW - shieldW) ? 1 : 2;
  const aimQ = 1 + rnd(0.03, 0.13);
  const q = Math.random();
  const strikeQ = q < 0.04 + s * 0.5 ? 'perfect' : q < 0.93 ? 'good' : 'poor';
  return { speed, zone: ZONES[zone].id, aimQ, strikeQ };
}

export function emptySave() {
  return { gold: 0, up: { lance: 0, armor: 0, horse: 0 }, beaten: [], runs: 0, crowns: 0, seenTutorial: false };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw);
    const base = emptySave();
    return {
      ...base,
      ...parsed,
      up: { ...base.up, ...(parsed.up || {}) },
      beaten: Array.isArray(parsed.beaten) ? parsed.beaten : [],
    };
  } catch {
    return emptySave();
  }
}

export function saveGame(save) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    /* private mode / quota: the game still plays, progress just won't stick */
  }
}

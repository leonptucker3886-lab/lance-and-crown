// Core game data + pure combat maths (no DOM here, so it stays testable).
// JoustLine: The First — a LeonLink game.

export const SAVE_KEY = 'joustline-the-first-v1';
export const LEGACY_SAVE_KEY = 'lance-and-crown-v1';

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

/* ------------------------------------------------------------- the retinue */

/**
 * Who you are. Each knight leans the stats one way; the numbers are small on
 * purpose so the ladder balance (and tests/balance.mjs) still holds.
 */
export const KNIGHTS = [
  {
    id: 'ashby',
    name: 'Sir Aldric Ashby',
    house: 'House Ashby',
    blurb: 'A steady hand on a steady horse. No tricks, no weaknesses.',
    boon: 'Balanced',
    mods: { lance: 1.04, maxHP: 1.02 },
    pal: { horse: '#3f3230', horseDark: '#241b1a', cloth: '#8f2233', cloth2: '#e8c96a', plate: '#dfe5ec', plateDark: '#8d96a3', plume: '#f2d98a' },
  },
  {
    id: 'pike',
    name: 'Dame Rowena Pike',
    house: 'The Pike Company',
    blurb: 'Lives for the crash. Hits like a dropped portcullis, guards like a hinge.',
    boon: '+12% lance, −10% stamina',
    mods: { lance: 1.12, maxHP: 0.9 },
    pal: { horse: '#4a3a33', horseDark: '#2c211d', cloth: '#2f5aa8', cloth2: '#e6dcc0', plate: '#c8d3e0', plateDark: '#77839a', plume: '#dfe8ff' },
  },
  {
    id: 'voss',
    name: 'Sir Caelan Voss',
    house: 'House Voss',
    blurb: 'Wins on attrition. Lets you land the first blow, then outlasts you.',
    boon: '+15% stamina, −5% lance',
    mods: { lance: 0.95, maxHP: 1.15 },
    pal: { horse: '#3c3a30', horseDark: '#232118', cloth: '#2f7a4e', cloth2: '#e8c96a', plate: '#c2ccc8', plateDark: '#6f7a76', plume: '#f4e29a' },
  },
];

/**
 * A squire rides behind you and handles the purse and the paperwork. Perks are
 * economic only — they never touch the damage maths.
 */
export const SQUIRES = [
  { id: 'wren', name: 'Wren', blurb: 'Quick hands with the barding straps.', perk: '+1 Glow per won tilt', tokens: 1, goldMul: 1 },
  { id: 'tam', name: 'Tam', blurb: 'Haggles the purse men down to the last coin.', perk: '+12% purse', tokens: 0, goldMul: 1.12 },
  { id: 'odo', name: 'Odo', blurb: 'Reads a rival\u2019s shoulder a half-beat early.', perk: 'wider perfect-strike window', tokens: 0, goldMul: 1, perfectBonus: 0.014 },
];

/**
 * Every knight rides for someone. The first is waiting at the gate; the rest
 * have to be earned by putting rivals in the sand.
 */
export const LADIES = [
  {
    id: 'isolde',
    name: 'Lady Isolde of Wex',
    court: 'The Wex Marches',
    blurb: 'Sends a ribbon and a cold, practical letter.',
    boon: '+6% purse',
    unlock: 0,
    mods: { goldMul: 1.06 },
  },
  {
    id: 'maren',
    name: 'Lady Maren Voss',
    court: 'House Voss',
    blurb: 'Will not be seen with a knight who loses to farmers.',
    boon: '+4% lance',
    unlock: 1,
    mods: { lance: 1.04 },
  },
  {
    id: 'alienor',
    name: 'Dame Aliénor\u2019s cousin, Ysolde',
    court: 'House Delacroix',
    blurb: 'Wears your colours only if they are worth wearing.',
    boon: '+8% stamina',
    unlock: 3,
    mods: { maxHP: 1.08 },
  },
  {
    id: 'crown',
    name: 'The Queen of the Lists',
    court: 'The royal box',
    blurb: 'Rides for no one. Rides for the crown itself.',
    boon: '+10% lance, +10% pursuit',
    unlock: 6,
    mods: { lance: 1.1, goldMul: 1.1 },
  },
];

/* ---------------------------------------------------------- coat of arms */

/**
 * Heraldry. You cannot buy your way to a charge: each symbol is earned by
 * unhorsing enough rivals, which is the whole point of the ladder.
 */
export const FIELDS = [
  { id: 'gules', name: 'Gules', color: '#8f2233', unlock: 0 },
  { id: 'azure', name: 'Azure', color: '#2f5aa8', unlock: 0 },
  { id: 'vert', name: 'Vert', color: '#2f7a4e', unlock: 1 },
  { id: 'sable', name: 'Sable', color: '#2b2630', unlock: 2 },
  { id: 'purpure', name: 'Purpure', color: '#6b3f9e', unlock: 4 },
  { id: 'or', name: 'Or', color: '#c9a227', unlock: 6 },
];

export const CHARGES = [
  { id: 'chevron', name: 'Chevron', note: 'a roof, for the house', unlock: 0 },
  { id: 'cross', name: 'Cross', note: 'the old faith', unlock: 0 },
  { id: 'saltire', name: 'Saltire', note: 'broken lances', unlock: 1 },
  { id: 'roundel', name: 'Roundel', note: 'a shield boss', unlock: 2 },
  { id: 'lion', name: 'Lion', note: 'for the bold', unlock: 4 },
  { id: 'crown', name: 'Crown', note: 'only for champions', unlock: 6 },
];

/** Horse armour, bought with Glow. Purely how you look — except tier 0 is free. */
export const BARDING = [
  { level: 0, name: 'Unbarded', cost: 0, blurb: 'Cloth caparison only.' },
  { level: 1, name: 'Peytral', cost: 2, blurb: 'Steel breastplate and a stitched border.' },
  { level: 2, name: 'Chanfron', cost: 4, blurb: 'A peytral plus an armoured horse-head.' },
  { level: 3, name: 'Full bard', cost: 7, blurb: 'Peytral, chanfron and crinet along the neck.' },
  { level: 4, name: 'Gilded bard', cost: 11, blurb: 'The whole horse in harness, trimmed in gold.' },
];

export const MAX_BARDING = BARDING.length - 1;

export const TOKENS_PER_WIN = 2;
export const TOKENS_FOR_UNHURT = 1;

const NEUTRAL_MODS = { lance: 1, maxHP: 1, perfectBonus: 0, goldMul: 1, tokens: 0 };

const findById = (list, id, fallbackId) => list.find((x) => x.id === id) || list.find((x) => x.id === fallbackId) || list[0];

export function knightOf(save) {
  return findById(KNIGHTS, save && save.knight, 'ashby');
}

export function squireOf(save) {
  return findById(SQUIRES, save && save.squire, 'wren');
}

export function ladyOf(save) {
  return findById(LADIES, save && save.lady, 'isolde');
}

/** Are you yet worthy of this lady's colours? */
export function ladyUnlocked(save, lady) {
  return (save ? save.beaten.length : 0) >= lady.unlock;
}

export function fieldOf(save) {
  return findById(FIELDS, save && save.coat && save.coat.field, 'gules');
}

export function chargeOf(save) {
  return findById(CHARGES, save && save.coat && save.coat.charge, 'chevron');
}

export function fieldUnlocked(save, field) {
  return (save ? save.beaten.length : 0) >= field.unlock;
}

export function chargeUnlocked(save, charge) {
  return (save ? save.beaten.length : 0) >= charge.unlock;
}

/** Combined knight + lady modifiers. Squire perks are economic and handled apart. */
export function retinueMods(save) {
  if (!save) return { ...NEUTRAL_MODS };
  const k = knightOf(save).mods || {};
  const l = ladyOf(save).mods || {};
  return {
    lance: (k.lance || 1) * (l.lance || 1),
    maxHP: (k.maxHP || 1) * (l.maxHP || 1),
    perfectBonus: (k.perfectBonus || 0) + (l.perfectBonus || 0),
    goldMul: (k.goldMul || 1) * (l.goldMul || 1),
    tokens: k.tokens || 0,
  };
}

/** Glow earned for one tilt. First clear of a rival is worth more. */
export function tokenEarn(save, { win, youHP, maxHP, firstClear }) {
  if (!win) return 0;
  let t = TOKENS_PER_WIN + (squireOf(save).tokens || 0);
  if (firstClear) t += 1;
  if (maxHP > 0 && youHP / maxHP >= 0.5) t += TOKENS_FOR_UNHURT;
  return t;
}

/** Purse earned for one tilt, including squire and lady percentage shifts. */
export function goldEarn(save, { win, youHP, maxHP, reward }) {
  if (!win) return Math.floor(reward * 0.2);
  const mods = retinueMods(save);
  const raw = reward + Math.round((Math.max(0, youHP) / Math.max(1, maxHP)) * 30);
  return Math.round(raw * mods.goldMul * (squireOf(save).goldMul || 1));
}

/** Player combat stats for a given upgrade spread and retinue. */
export function playerStats(up = {}, save = null) {
  const lance = up.lance || 0;
  const armor = up.armor || 0;
  const horse = up.horse || 0;
  const mods = save ? retinueMods(save) : NEUTRAL_MODS;
  const squire = save ? squireOf(save) : null;
  return {
    lance: (22 + lance * 5.5) * mods.lance,
    maxHP: (100 + armor * 20) * mods.maxHP,
    deflect: 0.06 + armor * 0.015,
    plates: {
      helm: 20 + armor * 4,
      chest: 38 + armor * 8,
      shield: 28 + armor * 6,
    },
    perfectWindow: 0.055 + horse * 0.016 + mods.perfectBonus + (squire && squire.perfectBonus ? squire.perfectBonus : 0),
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

/** The heraldry your knight actually carries onto the field. */
export function heroPal(save) {
  const knight = knightOf(save);
  const field = fieldOf(save);
  const base = knight.pal;
  return {
    ...base,
    cloth: field.color,
    cloth2: '#e8c96a',
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
  return {
    gold: 0,
    tokens: 0,
    up: { lance: 0, armor: 0, horse: 0 },
    beaten: [],
    runs: 0,
    crowns: 0,
    seenTutorial: false,
    knight: 'ashby',
    squire: 'wren',
    lady: 'isolde',
    coat: { field: 'gules', charge: 'chevron' },
    barding: 0,
  };
}

export function loadSave() {
  try {
    let raw = localStorage.getItem(SAVE_KEY);
    if (!raw) raw = localStorage.getItem(LEGACY_SAVE_KEY);
    if (!raw) return emptySave();
    const parsed = JSON.parse(raw);
    const base = emptySave();
    return {
      ...base,
      ...parsed,
      up: { ...base.up, ...(parsed.up || {}) },
      coat: { ...base.coat, ...(parsed.coat || {}) },
      tokens: parsed.tokens || 0,
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

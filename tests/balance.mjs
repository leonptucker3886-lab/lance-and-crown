// Balance harness: simulates many tilts to sanity-check pass counts and win rates.
// Run with: node tests/balance.mjs
import {
  RIVALS,
  ZONES,
  playerStats,
  rivalStats,
  computeDamage,
  applyHit,
  rollRivalPass,
} from '../js/data.js';

const PROFILES = {
  novice: { perfect: 0.15, gallopPerfect: 0.15, helm: 0.15 },
  decent: { perfect: 0.4, gallopPerfect: 0.45, helm: 0.3 },
  expert: { perfect: 0.68, gallopPerfect: 0.7, helm: 0.45 },
};

function pickZone(prof) {
  const r = Math.random();
  if (r < prof.helm) return 'helm';
  if (r < prof.helm + (1 - prof.helm) * 0.6) return 'chest';
  return 'shield';
}

function simMatch(rival, up, prof) {
  const ps = playerStats(up);
  const fs = rivalStats(rival);
  const you = { hp: ps.maxHP, maxHP: ps.maxHP, plates: { ...ps.plates } };
  const foe = { hp: fs.maxHP, maxHP: fs.maxHP, plates: { ...fs.plates } };

  for (let pass = 1; pass <= 40; pass++) {
    const speed = Math.random() < prof.gallopPerfect ? 0.95 : 0.5 + Math.random() * 0.4;
    const zone = pickZone(prof);
    const aimQ = 1 + Math.random() * 0.14;
    const q = Math.random();
    const strikeQ = q < prof.perfect ? 'perfect' : q < 0.9 ? 'good' : 'poor';
    const fr = rollRivalPass(rival);

    const youDeflect = you.plates.shield > 0 ? ps.deflect : 0;
    const foeDeflect = foe.plates.shield > 0 ? fs.deflect : 0;

    const youDmg = computeDamage({
      lance: ps.lance,
      speed,
      zoneMult: ZONES.find((z) => z.id === zone).mult,
      aimQ,
      strikeQ,
      deflect: foeDeflect,
    });
    const foeDmg = computeDamage({
      lance: fs.lance,
      speed: fr.speed,
      zoneMult: ZONES.find((z) => z.id === fr.zone).mult,
      aimQ: fr.aimQ,
      strikeQ: fr.strikeQ,
      deflect: youDeflect,
    });

    applyHit(foe, zone, youDmg);
    applyHit(you, fr.zone, foeDmg);

    if (foe.hp <= 0) return { passes: pass, win: true };
    if (you.hp <= 0) return { passes: pass, win: false };
  }
  return { passes: 40, win: false };
}

const N = 4000;
let problems = 0;

for (let i = 0; i < RIVALS.length; i++) {
  const rival = RIVALS[i];
  for (const [name, prof] of Object.entries(PROFILES)) {
    // player is assumed to have upgraded roughly in step with the ladder
    const up = { lance: i, armor: i, horse: i };
    let wins = 0;
    let passes = 0;
    for (let n = 0; n < N; n++) {
      const r = simMatch(rival, up, prof);
      if (r.win) wins++;
      passes += r.passes;
    }
    const wr = (wins / N) * 100;
    const avg = (passes / N).toFixed(1);
    const flag =
      name === 'decent' && (wr < 45 || wr > 92) ? '  <-- tune' : name === 'decent' && avg > 9 ? '  <-- too long' : '';
    if (flag) problems++;
    console.log(
      `${String(i + 1).padStart(2)}. ${rival.name.padEnd(24)} ${name.padEnd(7)} win ${wr.toFixed(0).padStart(3)}%  passes ${avg}${flag}`
    );
  }
  console.log('');
}

console.log(problems === 0 ? 'balance: OK' : `balance: ${problems} matchup(s) flagged`);
process.exit(0);

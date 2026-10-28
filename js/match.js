// A single tilt (match): gallop -> aim -> strike -> resolve. Canvas rendering for
// the world and the two timing widgets; DOM handles the text prompts.

import {
  ART_H,
  LANCE_REACH,
  HERO_PAL,
  drawArena,
  drawKnight,
  drawCrowdCheer,
} from './art.js';
import { ZONES, STRIKE_LABEL, computeDamage, applyHit, rollRivalPass } from './data.js';
import { Sfx, vibrate } from './audio.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (a, b) => a + Math.random() * (b - a);
const damp = (a, b, rate, dt) => lerp(a, b, 1 - Math.exp(-rate * dt));
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

const SWEEP = 0.78; // seconds for one full pass of the gallop needle
const STRIKE_SWEEP = 0.72;
const GOOD_BAND = 0.22;

export class Match {
  constructor({ rival, stats, foeStats, ui, onFinish }) {
    this.rival = rival;
    this.stats = stats;
    this.foeStats = foeStats;
    this.ui = ui;
    this.onFinish = onFinish;

    this.you = {
      hp: stats.maxHP,
      maxHP: stats.maxHP,
      plates: { ...stats.plates },
      maxPlates: { ...stats.plates },
      x: 0,
      y: 0,
      sMul: 1,
      couch: 0.1,
      lean: 0,
      gait: 0,
      down: 0,
      downT: 0,
      punch: 0,
    };
    this.foe = {
      hp: foeStats.maxHP,
      maxHP: foeStats.maxHP,
      plates: { ...foeStats.plates },
      maxPlates: { ...foeStats.plates },
      x: 0,
      y: 0,
      sMul: 1,
      couch: 0.1,
      lean: 0,
      gait: 0,
      down: 0,
      punch: 0,
    };

    this.phase = 'ready';
    this.phaseT = 0;
    this.pass = 0;
    this.time = 0;
    this.paused = false;
    this.done = false;

    this.needle = 0;
    this.needleDir = 1;
    this.locked = false;
    this.gallopPower = 0.5;
    this.lockFlash = 0;

    this.reticle = 0;
    this.reticleDir = 1;
    this.aimZone = 1;
    this.aimQ = 1;

    this.strikePos = 0;
    this.strikeDir = 1;
    this.strikeQ = 'good';
    this.strikeLocked = false;

    this.zoom = 0.92;
    this.zoomTarget = 0.92;
    this.shake = 0;
    this.flash = 0;
    this.hitStop = 0;
    this.cheer = 0;
    this.scroll = 0;
    this.parts = [];
    this.floats = [];
    this.foeRoll = null;
    this.overlay = null; // 'win' | 'lose'
    this.nextTimer = 0;
    this.contactFlash = 0;
    this.W = 360;
    this.H = 700;
    this.k = 1;
    this.groundY = 0;
  }

  /* ------------------------------------------------------------- setup */

  layout(W, H) {
    this.W = W;
    this.H = H;
    this.k = Math.min((H * 0.215) / ART_H, (W * 0.36) / 104);
    this.groundY = H * 0.72;
    this.meterY = H * 0.845;
    this.reach = LANCE_REACH * this.k;
    this.focus = { x: W * 0.5, y: H * 0.62 };
  }

  start() {
    this.pass = 1;
    this.beginPass();
  }

  beginPass() {
    this.phase = 'ready';
    this.phaseT = 0;
    this.locked = false;
    this.strikeLocked = false;
    this.needle = 0;
    this.needleDir = 1;
    this.reticle = 0.1;
    this.reticleDir = 1;
    this.strikePos = 0;
    this.aimZone = 1;
    this.aimQ = 1;
    this.gallopPower = 0.5;
    this.zoomTarget = 0.92;
    this.foeRoll = this.rollFoe();
    this.ui.setPass?.(this.pass);
    this.ui.prompt('MAKE READY', 'Ready your lance');
    if (this.pass === 1) Sfx.whoosh();
  }

  /* -------------------------------------------------------------- input */

  tap() {
    if (this.done || this.paused) return;
    if (this.phase === 'ready') {
      this.phase = 'gallop';
      this.phaseT = 0;
      this.ui.prompt('GALLOP', 'Tap when the needle hits gold');
      return;
    }
    if (this.phase === 'gallop' && !this.locked) {
      this.lockGallop();
      return;
    }
    if (this.phase === 'aim' && !this.locked) {
      this.lockAim();
      return;
    }
    if (this.phase === 'impact' && !this.strikeLocked) {
      this.lockStrike();
    }
  }

  lockGallop() {
    this.locked = true;
    this.lockFlash = 1;
    const d = Math.abs(this.needle - 0.5) / 0.5;
    this.gallopPower = clamp(1 - d, 0, 1);
    const perfect = d < 0.14;
    if (perfect) {
      Sfx.perfect();
      vibrate([8, 20, 8]);
      this.ui.prompt('FULL GALLOP', 'Perfect run-up', 'gold');
    } else if (this.gallopPower > 0.6) {
      Sfx.good();
      this.ui.prompt('STRONG RUN', '', 'gold');
    } else {
      Sfx.tap();
      this.ui.prompt('SLOW RUN', 'Weak charge', 'dim');
    }
    this.phaseT = 0;
  }

  lockAim() {
    this.locked = true;
    const r = clamp(this.reticle, 0, 0.999);
    const bands = [
      { i: 0, a: 0, b: 0.28 },
      { i: 1, a: 0.28, b: 0.62 },
      { i: 2, a: 0.62, b: 1 },
    ];
    const band = bands.find((x) => r >= x.a && r < x.b) || bands[1];
    this.aimZone = band.i;
    const mid = (band.a + band.b) / 2;
    const half = (band.b - band.a) / 2;
    this.aimQ = 1 + (1 - Math.abs(r - mid) / half) * 0.14;
    Sfx.lock();
    vibrate(12);
    this.ui.prompt('AIM LOCKED', ZONES[this.aimZone].label + ' \u00b7 ' + ZONES[this.aimZone].note, 'gold');
    this.phaseT = 0;
  }

  lockStrike() {
    this.strikeLocked = true;
    const d = Math.abs(this.strikePos - 0.5);
    if (d <= this.stats.perfectWindow) this.strikeQ = 'perfect';
    else if (d <= GOOD_BAND) this.strikeQ = 'good';
    else this.strikeQ = 'poor';

    if (this.strikeQ === 'perfect') {
      Sfx.perfect();
      vibrate([10, 24, 14]);
    } else if (this.strikeQ === 'good') {
      Sfx.good();
      vibrate(10);
    } else {
      Sfx.poor();
    }
    this.resolve();
  }

  rollFoe() {
    return rollRivalPass(this.rival);
  }

  /* ------------------------------------------------------------ resolve */

  resolve() {
    this.phase = 'resolve';
    this.phaseT = 0;
    this.zoomTarget = 1.0;
    this.hitStop = 0.08;

    const zYou = ZONES[this.aimZone];
    const zFoe = ZONES.find((z) => z.id === this.foeRoll.zone) || ZONES[1];

    const youDeflect = this.you.plates.shield > 0 ? this.stats.deflect : 0;
    const foeDeflect = this.foe.plates.shield > 0 ? this.foeStats.deflect : 0;

    const youStrikeQ = this.strikeQ;
    const foeStrikeQ = this.foeRoll.strikeQ;

    const youDmg = computeDamage({
      lance: this.stats.lance,
      speed: this.gallopPower,
      zoneMult: zYou.mult,
      aimQ: this.aimQ,
      strikeQ: youStrikeQ,
      deflect: foeDeflect,
    });
    const foeDmg = computeDamage({
      lance: this.rival.lance,
      speed: this.foeRoll.speed,
      zoneMult: zFoe.mult,
      aimQ: this.foeRoll.aimQ,
      strikeQ: foeStrikeQ,
      deflect: youDeflect,
    });

    const foeHit = applyHit(this.foe, zYou.id, youDmg);
    const youHit = applyHit(this.you, zFoe.id, foeDmg);

    this.lastHit = { foeHit, youHit, youDmg, foeDmg, zYou, zFoe, youStrikeQ, foeStrikeQ };

    const cx = this.W * 0.5;
    const cy = this.groundY - this.k * 96;

    // impact feedback
    const big = youStrikeQ === 'perfect' || foeStrikeQ === 'perfect';
    Sfx.impact(big ? 1.2 : 0.9);
    if (youStrikeQ === 'perfect') Sfx.perfect();
    this.shake = big ? 16 : 10;
    this.flash = 0.85;
    this.contactFlash = 1;
    vibrate(big ? [14, 30, 22] : 16);
    this.spawnSparks(cx, cy, big ? 26 : 16, zYou.id === 'helm' ? '#ffe6a8' : '#ffd08a');

    // damage floats
    this.floats.push({
      x: this.foe.x + this.k * 10,
      y: this.groundY - this.k * 150,
      text: '-' + Math.round(foeHit.dealt),
      sub: STRIKE_LABEL[youStrikeQ],
      color: youStrikeQ === 'perfect' ? '#ffe08a' : '#fff4e0',
      life: 1.4,
      max: 1.4,
      vy: -52,
    });
    this.floats.push({
      x: this.you.x - this.k * 10,
      y: this.groundY - this.k * 150,
      text: '-' + Math.round(youHit.dealt),
      sub: STRIKE_LABEL[foeStrikeQ],
      color: '#ff9c8a',
      life: 1.4,
      max: 1.4,
      vy: -52,
    });

    this.foe.punch = 1;
    this.you.punch = 1;
    this.foe.lean = foeStrikeQ === 'perfect' ? 0.1 : 0.16;
    this.you.lean = youStrikeQ === 'perfect' ? 0.1 : 0.16;

    if (foeHit.broke) {
      Sfx.crack();
      this.spawnSparks(this.foe.x + this.k * 34, this.groundY - this.k * 70, 18, '#fff2c6');
      this.ui.toast('PLATE SHATTERED');
    }
    if (youHit.broke) this.ui.toast('YOUR PLATE SHATTERED');

    const dead = this.foe.hp <= 0 ? 'win' : this.you.hp <= 0 ? 'lose' : null;
    if (dead) {
      this.done = true;
      this.overlay = dead;
      this.zoomTarget = dead === 'win' ? 1.05 : 1.1;
      if (dead === 'win') {
        this.foe.down = 0.001;
        this.cheer = 1;
        Sfx.cheer();
      } else {
        this.you.down = 0.001;
        Sfx.boo();
      }
      this.resultTimer = 1.9;
    } else {
      this.nextTimer = 1.95;
    }
  }

  /* ------------------------------------------------------------- update */

  update(dt) {
    if (this.paused) return;
    this.time += dt;

    if (this.hitStop > 0) {
      this.hitStop -= dt;
      dt *= 0.15;
    }

    this.flash = Math.max(0, this.flash - dt * 3.2);
    this.contactFlash = Math.max(0, this.contactFlash - dt * 2.4);
    this.shake = damp(this.shake, 0, 7, dt);
    this.lockFlash = Math.max(0, this.lockFlash - dt * 2.6);
    this.cheer = damp(this.cheer, this.overlay === 'win' ? 1 : 0, 3, dt);

    const speedFactor = this.phase === 'resolve' || this.done ? 0.55 : 1 + this.gallopPower * 0.5;
    this.gaitSpeed = speedFactor;
    this.scroll += dt * 640 * speedFactor;

    this.you.gait += dt * 13 * speedFactor;
    this.foe.gait += dt * 13 * speedFactor;

    this.phaseT += dt;

    // ---- camera framing per phase
    const W = this.W;
    const H = this.H;
    const contact = this.reach * 0.97;

    const pos = {
      ready: { you: -W * 0.14, foe: W * 1.14, zm: 0.86, ys: 1, fs: 1, yc: 0.12, fc: 0.12 },
      gallop: { you: 0, foe: 0, zm: 0.95, ys: 1, fs: 1, yc: 0.55, fc: 0.55 },
      aim: { you: W * 0.0, foe: W * 0.42, zm: 1.62, ys: 0.72, fs: 1.25, yc: 0.7, fc: 0.82 },
      impact: { you: 0, foe: 0, zm: 0.98, ys: 1, fs: 1, yc: 1, fc: 1 },
      resolve: { you: 0, foe: 0, zm: 1.02, ys: 1, fs: 1, yc: 1, fc: 1 },
    }[this.phase] || { you: 0, foe: 0, zm: 1, ys: 1, fs: 1, yc: 1, fc: 1 };

    let youX;
    let foeX;
    if (this.phase === 'gallop') {
      const g = easeOut(clamp(this.phaseT / 1.15, 0, 1));
      youX = lerp(-W * 0.14, W * 0.5 - contact, g);
      foeX = lerp(W * 1.14, W * 0.5 + contact, g);
    } else if (this.phase === 'aim') {
      youX = pos.you;
      foeX = pos.foe;
    } else if (this.phase === 'impact' || this.phase === 'resolve') {
      const g = easeOut(clamp(this.phaseT / 0.55, 0, 1));
      youX = lerp(this.you.x, W * 0.5 - contact, this.phase === 'resolve' ? 1 : g);
      foeX = lerp(this.foe.x, W * 0.5 + contact, this.phase === 'resolve' ? 1 : g);
    } else {
      youX = pos.you;
      foeX = pos.foe;
    }

    this.you.x = damp(this.you.x, youX, 9, dt);
    this.foe.x = damp(this.foe.x, foeX, 9, dt);
    this.you.sMul = damp(this.you.sMul, pos.ys, 7, dt);
    this.foe.sMul = damp(this.foe.sMul, pos.fs, 7, dt);
    this.you.couch = damp(this.you.couch, pos.yc, 5, dt);
    this.foe.couch = damp(this.foe.couch, pos.fc, 5, dt);
    this.you.lean = damp(this.you.lean, 0, 6, dt);
    this.foe.lean = damp(this.foe.lean, 0, 6, dt);
    this.you.punch = damp(this.you.punch, 0, 6, dt);
    this.foe.punch = damp(this.foe.punch, 0, 6, dt);

    if (this.overlay && this.you.down > 0) this.you.down = damp(this.you.down, 1, 3.4, dt);
    if (this.overlay && this.foe.down > 0) this.foe.down = damp(this.foe.down, 1, 3.4, dt);

    this.zoom = damp(this.zoom, this.zoomTarget * pos.zm, 5, dt);

    // ---- hooves
    if (this.phase !== 'aim' && !this.done) {
      this.hoofAcc = (this.hoofAcc || 0) + dt * 11 * speedFactor;
      while (this.hoofAcc > 1) {
        this.hoofAcc -= 1;
        Sfx.hoof(0.55);
        if (Math.random() < 0.6) this.spawnDust(this.you.x + this.k * 20, this.groundY, 1);
        if (Math.random() < 0.4) this.spawnDust(this.foe.x - this.k * 20, this.groundY, 1);
      }
    }

    // ---- phase logic
    if (this.phase === 'ready' && this.phaseT > 0.62) {
      this.phase = 'gallop';
      this.phaseT = 0;
      this.ui.prompt('GALLOP', 'Tap when the needle hits gold');
    }

    if (this.phase === 'gallop' && !this.locked) {
      this.needle += this.needleDir * dt * (1 / SWEEP);
      if (this.needle > 1) {
        this.needle = 1;
        this.needleDir = -1;
      }
      if (this.needle < 0) {
        this.needle = 0;
        this.needleDir = 1;
      }
      if (this.phaseT > 3.1) this.lockGallop();
    }
    if (this.phase === 'gallop' && this.locked && this.phaseT > 0.42) {
      this.phase = 'aim';
      this.phaseT = 0;
      this.locked = false;
      this.zoomTarget = 1.0;
      this.ui.prompt('AIM', 'Tap to lock your lance on a plate');
      Sfx.whoosh();
    }

    if (this.phase === 'aim') {
      if (!this.locked) {
        this.reticle += this.reticleDir * dt * 0.85;
        if (this.reticle > 1) {
          this.reticle = 1;
          this.reticleDir = -1;
        }
        if (this.reticle < 0) {
          this.reticle = 0;
          this.reticleDir = 1;
        }
        if (this.phaseT > 4.2) this.lockAim();
      } else if (this.phaseT > 0.45) {
        this.phase = 'impact';
        this.phaseT = 0;
        this.locked = false;
        this.strikeLocked = false;
        this.strikePos = 0;
        this.strikeDir = 1;
        this.zoomTarget = 1.0;
        this.ui.prompt('STRIKE', 'Tap in the gold window');
        Sfx.whoosh();
      }
    }

    if (this.phase === 'impact') {
      if (!this.strikeLocked && this.phaseT > 0.22) {
        this.strikePos += this.strikeDir * dt / STRIKE_SWEEP;
        if (this.strikePos > 1) {
          this.strikePos = 1;
          this.strikeDir = -1;
        } else if (this.strikePos < 0) {
          this.strikePos = 0;
          this.strikeDir = 1;
        }
        if (this.phaseT > 2.1) {
          this.strikeQ = 'poor';
          this.resolve();
        }
      }
    }

    if (this.phase === 'resolve' && !this.done) {
      this.nextTimer -= dt;
      if (this.nextTimer <= 0) {
        this.pass++;
        this.beginPass();
      }
    }

    if (this.done && this.resultTimer !== undefined) {
      this.resultTimer -= dt;
      if (this.resultTimer <= 0 && this.resultTimer > -100) {
        this.resultTimer = -1000;
        this.finish();
      }
    }

    // ---- particles
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.parts.splice(i, 1);
        continue;
      }
      p.vy += (p.grav || 0) * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 1 - 1.6 * dt;
    }
    for (let i = this.floats.length - 1; i >= 0; i--) {
      const f = this.floats[i];
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy = damp(f.vy, -4, 2, dt);
      if (f.life <= 0) this.floats.splice(i, 1);
    }
  }

  finish() {
    this.onFinish?.({
      win: this.overlay === 'win',
      rival: this.rival,
      youHP: this.you.hp,
      foeHP: this.foe.hp,
      passes: this.pass,
    });
  }

  /* ------------------------------------------------------------- effects */

  spawnDust(x, y, scale = 1) {
    for (let i = 0; i < 3; i++) {
      this.parts.push({
        type: 'dust',
        x: x + rnd(-10, 10),
        y: y + rnd(-4, 2),
        vx: rnd(-40, 10),
        vy: rnd(-30, -6),
        grav: 26,
        size: rnd(3, 9) * scale,
        life: rnd(0.4, 0.8),
        max: 0.8,
        color: 'rgba(214,168,122,',
      });
    }
  }

  spawnSparks(x, y, n, color) {
    for (let i = 0; i < n; i++) {
      const a = rnd(-Math.PI, 0.4);
      const sp = rnd(120, 460);
      this.parts.push({
        type: 'spark',
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        grav: 620,
        size: rnd(1.2, 3.4),
        life: rnd(0.25, 0.7),
        max: 0.7,
        color,
      });
    }
  }

  /* -------------------------------------------------------------- paint */

  render(ctx) {
    const { W, H } = this;
    ctx.clearRect(0, 0, W, H);

    const sx = this.shake ? rnd(-this.shake, this.shake) : 0;
    const sy = this.shake ? rnd(-this.shake, this.shake) : 0;

    ctx.save();
    ctx.translate(this.focus.x + sx, this.focus.y + sy);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.focus.x, -this.focus.y);

    drawArena(ctx, { W, H, t: this.time, scroll: this.scroll, groundY: this.groundY });
    drawCrowdCheer(ctx, { W, H, t: this.time, power: this.cheer });

    this.drawKnightOf(ctx, this.foe, -1);
    this.drawKnightOf(ctx, this.you, 1);

    this.drawParticles(ctx);
    this.drawFloats(ctx);

    ctx.restore();

    // screen-space HUD widgets
    if (this.phase === 'gallop') this.drawMeter(ctx, 'gallop');
    if (this.phase === 'aim') this.drawAimRail(ctx);
    if (this.phase === 'impact') this.drawMeter(ctx, 'strike');

    if (this.flash > 0.01) {
      ctx.fillStyle = `rgba(255,238,206,${this.flash * 0.55})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  drawKnightOf(ctx, f, facing) {
    drawKnight(ctx, {
      x: f.x,
      y: this.groundY,
      k: this.k * f.sMul,
      facing,
      pal: facing > 0 ? this.youPal() : this.rival.pal,
      t: this.time,
      gait: f.gait,
      couch: f.couch,
      lean: f.lean + f.punch * 0.06,
      down: f.down > 0 ? easeOut(f.down) : 0,
      dim: this.done && facing < 0 && this.overlay === 'win' ? 0.35 : 0,
      glow: this.phase === 'aim' && facing < 0 ? 0.6 : 0,
      shieldOn: f.plates.shield > 0.01,
    });
  }

  youPal() {
    return HERO_PAL;
  }

  drawParticles(ctx) {
    for (const p of this.parts) {
      const a = clamp(p.life / (p.max || 1), 0, 1);
      if (p.type === 'dust') {
        ctx.fillStyle = p.color + (a * 0.42).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1.4 - a * 0.4), 0, TAU);
        ctx.fill();
      } else {
        ctx.globalAlpha = a;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  drawFloats(ctx) {
    for (const f of this.floats) {
      const a = clamp(f.life / f.max, 0, 1);
      const pop = clamp((f.max - f.life) * 6, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.textAlign = 'center';
      ctx.fillStyle = f.color;
      ctx.font = `700 ${Math.round(this.H * 0.036 * (0.7 + pop * 0.3))}px ui-serif, Georgia, serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 8;
      ctx.fillText(f.text, f.x, f.y);
      ctx.shadowBlur = 0;
      ctx.font = `600 ${Math.round(this.H * 0.016)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = 'rgba(255,240,214,0.85)';
      ctx.fillText(f.sub, f.x, f.y + this.H * 0.024);
      ctx.restore();
    }
  }

  /* ---- gallop & strike bar ---- */
  drawMeter(ctx, mode) {
    const { W, H } = this;
    const pad = W * 0.075;
    const x0 = pad;
    const x1 = W - pad;
    const w = x1 - x0;
    const h = clamp(H * 0.042, 20, 34);
    const y = this.meterY - h / 2;

    const pos = mode === 'gallop' ? this.needle : this.strikePos;
    const locked = mode === 'gallop' ? this.locked : this.strikeLocked;
    const perfect = mode === 'gallop' ? 0.14 : this.stats.perfectWindow;

    // frame
    ctx.save();
    ctx.fillStyle = 'rgba(14,10,16,0.82)';
    ctx.strokeStyle = 'rgba(232,201,106,0.55)';
    ctx.lineWidth = 1.5;
    this.roundRect(ctx, x0 - 4, y - 4, w + 8, h + 8, (h + 8) / 2);
    ctx.fill();
    ctx.stroke();
    ctx.clip();

    // track
    const tg = ctx.createLinearGradient(x0, 0, x1, 0);
    tg.addColorStop(0, '#3a2430');
    tg.addColorStop(0.5, '#50303a');
    tg.addColorStop(1, '#3a2430');
    ctx.fillStyle = tg;
    ctx.fillRect(x0, y, w, h);

    // good band
    ctx.fillStyle = 'rgba(232,201,106,0.16)';
    ctx.fillRect(x0 + w * (0.5 - GOOD_BAND), y, w * GOOD_BAND * 2, h);
    // perfect band
    const pg = ctx.createLinearGradient(x0 + w * (0.5 - perfect), 0, x0 + w * (0.5 + perfect), 0);
    pg.addColorStop(0, 'rgba(255,214,120,0.35)');
    pg.addColorStop(0.5, 'rgba(255,236,180,0.95)');
    pg.addColorStop(1, 'rgba(255,214,120,0.35)');
    ctx.fillStyle = pg;
    ctx.fillRect(x0 + w * (0.5 - perfect), y, w * perfect * 2, h);

    // ticks
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    for (let i = 1; i < 12; i++) ctx.fillRect(x0 + (w / 12) * i, y + h * 0.6, 1, h * 0.4);

    // needle
    const nx = x0 + w * pos;
    ctx.fillStyle = locked ? '#ffe9b0' : '#ff5f52';
    ctx.shadowColor = locked ? 'rgba(255,222,150,0.9)' : 'rgba(255,90,70,0.9)';
    ctx.shadowBlur = 14;
    ctx.fillRect(nx - 2, y - 2, 4, h + 4);
    ctx.shadowBlur = 0;
    ctx.restore();

    // label
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = locked ? 'rgba(255,225,160,0.95)' : 'rgba(255,244,224,0.82)';
    ctx.font = `700 ${Math.round(H * 0.018)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.letterSpacing = '2px';
    const label = mode === 'gallop' ? 'GALLOP' : 'STRIKE';
    ctx.fillText(label, W / 2, y - 12);
    ctx.restore();
  }

  /* ---- aim rail ---- */
  drawAimRail(ctx) {
    const { W, H } = this;
    const railW = clamp(W * 0.075, 22, 34);
    const railX = W - W * 0.085 - railW / 2;
    const top = H * 0.31;
    const bottom = H * 0.63;
    const h = bottom - top;

    const bands = [
      { i: 0, a: 0, b: 0.28, color: '#e8c96a' },
      { i: 1, a: 0.28, b: 0.62, color: '#9fb4c9' },
      { i: 2, a: 0.62, b: 1, color: '#c8865a' },
    ];

    ctx.save();
    // backing
    ctx.fillStyle = 'rgba(12,9,15,0.72)';
    this.roundRect(ctx, railX - railW / 2 - 6, top - 12, railW + 12, h + 24, 16);
    ctx.fill();
    ctx.strokeStyle = 'rgba(232,201,106,0.35)';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    for (const b of bands) {
      const by = top + h * b.a;
      const bh = h * (b.b - b.a);
      const active = this.locked && this.aimZone === b.i;
      const z = ZONES[b.i];
      const f = this.foe;
      const plate = f.plates[z.id] || 0;
      const maxP = f.maxPlates[z.id] || 1;
      const frac = clamp(plate / maxP, 0, 1);

      ctx.fillStyle = active ? 'rgba(255,226,150,0.28)' : 'rgba(255,255,255,0.05)';
      this.roundRect(ctx, railX - railW / 2, by + 2, railW, bh - 4, 6);
      ctx.fill();

      // plate integrity
      ctx.fillStyle = frac > 0.02 ? b.color : 'rgba(220,70,60,0.55)';
      ctx.globalAlpha = 0.9;
      this.roundRect(ctx, railX - railW / 2 + 3, by + bh - 6 - (bh - 12) * frac, railW - 6, (bh - 12) * frac, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      if (plate <= 0.02) {
        ctx.strokeStyle = 'rgba(255,110,96,0.9)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(railX - railW / 2 + 4, by + 8);
        ctx.lineTo(railX + railW / 2 - 4, by + bh - 8);
        ctx.stroke();
      }

      // labels
      ctx.textAlign = 'right';
      ctx.fillStyle = active ? '#ffe9b0' : 'rgba(255,244,224,0.8)';
      ctx.font = `700 ${Math.round(clamp(W * 0.032, 10, 15))}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillText(z.label, railX - railW / 2 - 12, by + bh / 2);
      ctx.fillStyle = 'rgba(255,236,196,0.55)';
      ctx.font = `600 ${Math.round(clamp(W * 0.026, 9, 12))}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillText('\u00d7' + z.mult.toFixed(2).replace(/0$/, ''), railX - railW / 2 - 12, by + bh / 2 + 14);
    }

    // reticle
    if (!this.locked) {
      const ry = top + h * clamp(this.reticle, 0, 1);
      ctx.strokeStyle = '#ffdc8a';
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255,210,120,0.9)';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(railX - railW / 2 - 26, ry);
      ctx.lineTo(railX + railW / 2 + 6, ry);
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffdc8a';
      ctx.beginPath();
      ctx.moveTo(railX + railW / 2 + 6, ry);
      ctx.lineTo(railX + railW / 2 - 4, ry - 6);
      ctx.lineTo(railX + railW / 2 - 4, ry + 6);
      ctx.closePath();
      ctx.fill();
    } else {
      const ry = top + h * clamp(this.reticle, 0, 1);
      ctx.fillStyle = 'rgba(255,232,170,0.9)';
      ctx.fillRect(railX - railW / 2 - 26, ry - 1.5, railW + 32, 3);
    }
    ctx.restore();
  }

  roundRect(ctx, x, y, w, h, r) {
    const rad = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rad, y);
    ctx.arcTo(x + w, y, x + w, y + h, rad);
    ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad);
    ctx.arcTo(x, y, x + w, y, rad);
    ctx.closePath();
  }
}

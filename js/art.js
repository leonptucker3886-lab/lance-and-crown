// Procedural artwork: sky, crowd, lists, knights. No bitmap assets anywhere.

const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);

let cache = { W: 0, H: 0, bg: null, crowd: [], posts: [] };

/* ---------------------------------------------------------------- utils */

function rr(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function limb(ctx, ax, ay, bx, by, l1, l2, bend, w, color) {
  let dx = bx - ax;
  let dy = by - ay;
  let d = Math.hypot(dx, dy) || 0.001;
  const maxd = l1 + l2 - 0.5;
  if (d > maxd) {
    const s = maxd / d;
    bx = ax + dx * s;
    by = ay + dy * s;
    dx = bx - ax;
    dy = by - ay;
    d = maxd;
  }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const ux = dx / d;
  const uy = dy / d;
  const kx = ax + ux * a - uy * h * bend;
  const ky = ay + uy * a + ux * h * bend;
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  ctx.quadraticCurveTo(kx, ky, bx, by);
  ctx.stroke();
}

/* ------------------------------------------------------------- backdrop */

function paintBackdrop(W, H, dpr) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(W * dpr));
  c.height = Math.max(1, Math.round(H * dpr));
  const g = c.getContext('2d');
  g.scale(dpr, dpr);

  const hz = H * 0.5;

  // sky
  const sky = g.createLinearGradient(0, 0, 0, hz * 1.15);
  sky.addColorStop(0, '#0e0b1c');
  sky.addColorStop(0.35, '#2b1740');
  sky.addColorStop(0.66, '#6b2e4d');
  sky.addColorStop(0.86, '#b4523f');
  sky.addColorStop(1, '#e08a4e');
  g.fillStyle = sky;
  g.fillRect(0, 0, W, hz * 1.16);

  // stars
  for (let i = 0; i < 46; i++) {
    const sx = Math.random() * W;
    const sy = Math.random() * hz * 0.55;
    const a = 0.15 + Math.random() * 0.5;
    g.fillStyle = `rgba(255,240,220,${a})`;
    g.beginPath();
    g.arc(sx, sy, Math.random() * 1.3 + 0.3, 0, TAU);
    g.fill();
  }

  // sun
  const sx = W * 0.72;
  const sy = hz * 0.88;
  const glow = g.createRadialGradient(sx, sy, 1, sx, sy, H * 0.34);
  glow.addColorStop(0, 'rgba(255,226,168,0.95)');
  glow.addColorStop(0.18, 'rgba(255,178,104,0.5)');
  glow.addColorStop(0.55, 'rgba(226,120,80,0.16)');
  glow.addColorStop(1, 'rgba(200,90,70,0)');
  g.fillStyle = glow;
  g.beginPath();
  g.arc(sx, sy, H * 0.34, 0, TAU);
  g.fill();
  g.fillStyle = '#ffe1a8';
  g.beginPath();
  g.arc(sx, sy, H * 0.042, 0, TAU);
  g.fill();

  // far hills
  const drawHills = (amp, yOff, color, alpha, freq, phase) => {
    g.globalAlpha = alpha;
    g.fillStyle = color;
    g.beginPath();
    g.moveTo(-10, hz + 4);
    for (let x = -10; x <= W + 10; x += 8) {
      const y = hz - yOff + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.7 + phase * 2) * amp * 0.3;
      g.lineTo(x, y);
    }
    g.lineTo(W + 10, hz + 4);
    g.closePath();
    g.fill();
    g.globalAlpha = 1;
  };
  drawHills(H * 0.035, H * 0.055, '#4a2b52', 0.85, 0.006, 0.6);
  drawHills(H * 0.024, H * 0.028, '#33203f', 0.95, 0.009, 2.1);

  // castle on the horizon
  const cx = W * 0.16;
  const cy = hz + 2;
  g.fillStyle = '#241634';
  const tower = (tx, tw, th) => {
    g.fillRect(tx, cy - th, tw, th);
    for (let i = 0; i < tw / 6; i++) g.fillRect(tx + i * 6, cy - th - 5, 3.4, 6);
  };
  tower(cx - 26, 13, H * 0.075);
  tower(cx - 6, 17, H * 0.105);
  tower(cx + 16, 11, H * 0.066);
  g.fillRect(cx - 34, cy - H * 0.05, 62, H * 0.05);
  // banner
  g.strokeStyle = '#241634';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(cx + 2, cy - H * 0.105 - 5);
  g.lineTo(cx + 2, cy - H * 0.13);
  g.stroke();
  g.fillStyle = '#8f2233';
  g.beginPath();
  g.moveTo(cx + 2, cy - H * 0.13);
  g.lineTo(cx + 14, cy - H * 0.124);
  g.lineTo(cx + 2, cy - H * 0.118);
  g.closePath();
  g.fill();

  // haze on the horizon
  const haze = g.createLinearGradient(0, hz - H * 0.07, 0, hz + 2);
  haze.addColorStop(0, 'rgba(224,138,78,0)');
  haze.addColorStop(1, 'rgba(224,138,78,0.5)');
  g.fillStyle = haze;
  g.fillRect(0, hz - H * 0.07, W, H * 0.075);

  // crowd (silhouettes with a warm rim)
  const crowd = [];
  const baseY = H * 0.5 + H * 0.055;
  for (let row = 0; row < 4; row++) {
    const y = baseY + row * H * 0.017;
    const r = 3.4 + row * 1.1;
    for (let x = -10; x < W + 20; x += r * 2.3 + Math.random() * 5) {
      crowd.push({
        x: x + rnd(-3, 3),
        y: y + rnd(-2, 2),
        r: r * rnd(0.8, 1.2),
        ph: Math.random() * TAU,
        tent: Math.random() < 0.18 ? rnd(0, 1) : -1,
      });
    }
  }
  g.fillStyle = '#1b1226';
  for (const p of crowd) {
    g.beginPath();
    g.arc(p.x, p.y, p.r, 0, TAU);
    g.fill();
    g.fillRect(p.x - p.r * 0.8, p.y + p.r * 0.6, p.r * 1.6, p.r * 1.5);
  }

  // far stands / tent stripes
  g.globalAlpha = 0.5;
  for (let i = 0; i < 10; i++) {
    const x = (W / 10) * i;
    g.fillStyle = i % 2 ? '#4a2038' : '#5a2a44';
    g.beginPath();
    g.moveTo(x, baseY - H * 0.005);
    g.lineTo(x + W / 20, baseY - H * 0.005);
    g.lineTo(x + W / 20 + 8, baseY + H * 0.02);
    g.lineTo(x - 8, baseY + H * 0.02);
    g.closePath();
    g.fill();
  }
  g.globalAlpha = 1;

  return c;
}

export function prepare(W, H, dpr) {
  cache = {
    W,
    H,
    bg: paintBackdrop(W, H, dpr),
    crowd: [],
    posts: [],
  };
  // pennants that line the lists
  const n = Math.ceil(W / 54) + 2;
  for (let i = 0; i < n; i++) cache.posts.push(i);
}

/* --------------------------------------------------------------- scene */

export function drawArena(ctx, { W, H, t, scroll, groundY }) {
  const hz = H * 0.5;

  if (cache.bg) ctx.drawImage(cache.bg, 0, 0, W, H);

  // ---- tilt barrier & fence (far side of the lists)
  const fenceY = groundY - H * 0.012;
  const fh = H * 0.05;
  ctx.save();
  ctx.fillStyle = '#231720';
  ctx.fillRect(0, fenceY - fh, W, fh + H * 0.02);

  const spacing = Math.max(38, W * 0.11);
  const off = -((scroll * 0.55) % spacing);
  for (let i = -1; i * spacing + off < W + spacing; i++) {
    const x = i * spacing + off;
    ctx.fillStyle = '#3a2531';
    ctx.fillRect(x, fenceY - fh - H * 0.012, Math.max(4, W * 0.012), fh + H * 0.012);
    ctx.fillStyle = 'rgba(255,190,130,0.16)';
    ctx.fillRect(x, fenceY - fh - H * 0.012, Math.max(1.5, W * 0.003), fh);
    // pennant
    ctx.fillStyle = i % 3 === 0 ? '#8f2233' : i % 3 === 1 ? '#2f5aa8' : '#c9a227';
    const pw = W * 0.03;
    const wave = Math.sin(t * 2.4 + i) * 2;
    ctx.beginPath();
    ctx.moveTo(x + pw * 0.3, fenceY - fh - H * 0.012);
    ctx.lineTo(x + pw * 0.3 + pw, fenceY - fh + wave * 0.5);
    ctx.lineTo(x + pw * 0.3, fenceY - fh + H * 0.016);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // ---- ground
  const gg = ctx.createLinearGradient(0, hz, 0, H);
  gg.addColorStop(0, '#3a2620');
  gg.addColorStop(0.35, '#2b1b18');
  gg.addColorStop(1, '#150e0d');
  ctx.fillStyle = gg;
  ctx.fillRect(0, hz, W, H - hz);

  // sand track band
  const tg = ctx.createLinearGradient(0, groundY - H * 0.02, 0, H);
  tg.addColorStop(0, 'rgba(150,104,66,0.42)');
  tg.addColorStop(0.45, 'rgba(112,74,48,0.22)');
  tg.addColorStop(1, 'rgba(60,38,28,0)');
  ctx.fillStyle = tg;
  ctx.fillRect(0, groundY - H * 0.02, W, H - groundY);

  // speed streaks on the dirt
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < 22; i++) {
    const seed = i * 97.13;
    const y = groundY + ((i * 37) % (H - groundY - 8)) + 2;
    const depth = (y - groundY) / Math.max(1, H - groundY);
    const len = 16 + (i % 5) * 22 + depth * 70;
    const sp = scroll * (0.5 + depth * 1.6);
    const x = ((seed * 7 - sp) % (W + 260) + W + 260) % (W + 260) - 130;
    ctx.strokeStyle = `rgba(226,178,128,${0.05 + depth * 0.13})`;
    ctx.lineWidth = 1 + depth * 2.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y);
    ctx.stroke();
  }
  ctx.restore();

  // horizon shadow so the crowd reads against the sky
  const vg = ctx.createRadialGradient(W * 0.5, groundY, H * 0.12, W * 0.5, groundY, H * 0.92);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(0.72, 'rgba(0,0,0,0.18)');
  vg.addColorStop(1, 'rgba(0,0,0,0.62)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
}

export function drawCrowdCheer(ctx, { W, H, t, power }) {
  if (!cache.bg || power <= 0) return;
  const baseY = H * 0.5 + H * 0.055;
  ctx.save();
  ctx.globalAlpha = Math.min(1, power);
  for (let row = 0; row < 3; row++) {
    const y = baseY + row * H * 0.017;
    for (let x = 0; x < W; x += 9) {
      const bounce = Math.abs(Math.sin(t * 6 + x * 0.11 + row)) * 5 * power;
      ctx.fillStyle = '#1b1226';
      ctx.beginPath();
      ctx.arc(x + (x % 7), y - bounce, 3.6, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

/* -------------------------------------------------------------- knight */

export const ART_H = 162;
export const LANCE_REACH = 118;

/** The player's own heraldry. */
export const HERO_PAL = {
  horse: '#3f3230',
  horseDark: '#241b1a',
  cloth: '#8f2233',
  cloth2: '#e8c96a',
  plate: '#dfe5ec',
  plateDark: '#8d96a3',
  plume: '#f2d98a',
};

/**
 * Draw a mounted jouster.
 * Local units: ground at y=0, up is negative, facing +x, art height ~162.
 */
export function drawKnight(ctx, o) {
  const {
    x,
    y,
    k,
    facing = 1,
    pal,
    t = 0,
    gait = 0,
    couch = 0.7,
    lean = 0,
    down = 0,
    dim = 0,
    glow = 0,
    shieldOn = true,
  } = o;

  ctx.save();
  ctx.translate(x, y);

  // shadow
  ctx.save();
  ctx.globalAlpha = 0.34 * (1 - dim * 0.45);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 2 * k, (58 + down * 20) * k, 8.5 * k, 0, 0, TAU);
  ctx.fill();
  ctx.restore();

  ctx.scale(facing * k, k);
  if (glow > 0) {
    ctx.shadowColor = 'rgba(255,206,120,0.85)';
    ctx.shadowBlur = 24 * glow;
  }
  ctx.globalAlpha = 1 - dim * 0.55;
  ctx.rotate(-lean);
  ctx.translate(0, down * 30);
  if (down > 0) ctx.rotate(down * 0.5);

  const bob = Math.sin(gait * 2) * 2.2;

  /* ---------- tail
   */
  ctx.strokeStyle = pal.horseDark;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-52, -74 + bob);
  ctx.quadraticCurveTo(-72, -60, -70, -26 + Math.sin(t * 6) * 5);
  ctx.stroke();

  /* ---------- legs (far pair first)
   */
  const legY = -52 + bob * 0.4;
  const stride = 21;
  const drawLeg = (hipX, ph, wide, color) => {
    const fx = hipX + Math.cos(ph) * stride;
    const fy = -Math.max(0, Math.sin(ph)) * 15;
    limb(ctx, hipX, legY, fx, fy, 27, 28, 1, wide, color);
    // hoof
    ctx.fillStyle = '#181316';
    ctx.beginPath();
    ctx.ellipse(fx, fy + 1, wide * 0.62, wide * 0.42, 0, 0, TAU);
    ctx.fill();
    // joint
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(hipX, legY, wide * 0.62, 0, TAU);
    ctx.fill();
  };
  drawLeg(-38, gait + 2.4, 6, pal.horseDark);
  drawLeg(30, gait + 0.5, 6, pal.horseDark);

  /* ---------- body
   */
  ctx.fillStyle = pal.horse;
  ctx.beginPath();
  ctx.moveTo(-52, -58 + bob);
  ctx.bezierCurveTo(-60, -84 + bob, -24, -94 + bob, 6, -89 + bob);
  ctx.bezierCurveTo(30, -85 + bob, 45, -78 + bob, 46, -62 + bob);
  ctx.bezierCurveTo(47, -42 + bob, 26, -34 + bob, 0, -34 + bob);
  ctx.bezierCurveTo(-26, -34 + bob, -48, -42 + bob, -52, -58 + bob);
  ctx.closePath();
  ctx.fill();

  // haunch / shoulder shading
  ctx.fillStyle = pal.horseDark;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.ellipse(-36, -62 + bob, 18, 20, 0.2, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  /* ---------- caparison (heraldic cloth)
   */
  ctx.fillStyle = pal.cloth;
  ctx.beginPath();
  ctx.moveTo(-40, -84 + bob);
  ctx.lineTo(34, -82 + bob);
  ctx.quadraticCurveTo(40, -58 + bob, 33, -34 + bob);
  ctx.quadraticCurveTo(12, -28 + bob, -6, -33 + bob);
  ctx.quadraticCurveTo(-30, -30 + bob, -42, -38 + bob);
  ctx.quadraticCurveTo(-44, -62 + bob, -40, -84 + bob);
  ctx.closePath();
  ctx.fill();
  // trim
  ctx.strokeStyle = pal.cloth2;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(-41, -42 + bob);
  ctx.quadraticCurveTo(-10, -30 + bob, 33, -40 + bob);
  ctx.stroke();
  // charge (a chevron)
  ctx.fillStyle = pal.cloth2;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(-6, -74 + bob);
  ctx.lineTo(8, -58 + bob);
  ctx.lineTo(2, -58 + bob);
  ctx.lineTo(-6, -66 + bob);
  ctx.lineTo(-14, -58 + bob);
  ctx.lineTo(-20, -58 + bob);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  /* ---------- near legs
   */
  drawLeg(-32, gait + 2.9, 7, pal.horse);
  drawLeg(36, gait + 0.0, 7, pal.horse);

  /* ---------- neck + head
   */
  ctx.fillStyle = pal.horse;
  ctx.beginPath();
  ctx.moveTo(28, -70 + bob);
  ctx.bezierCurveTo(40, -92 + bob, 58, -112 + bob, 74, -120 + bob);
  ctx.lineTo(88, -104 + bob);
  ctx.bezierCurveTo(74, -96 + bob, 62, -84 + bob, 51, -62 + bob);
  ctx.closePath();
  ctx.fill();
  // head
  ctx.beginPath();
  ctx.moveTo(70, -124 + bob);
  ctx.quadraticCurveTo(92, -122 + bob, 100, -106 + bob);
  ctx.quadraticCurveTo(96, -94 + bob, 84, -96 + bob);
  ctx.lineTo(70, -104 + bob);
  ctx.closePath();
  ctx.fill();
  // ears
  ctx.beginPath();
  ctx.moveTo(68, -126 + bob);
  ctx.lineTo(71, -138 + bob);
  ctx.lineTo(77, -126 + bob);
  ctx.closePath();
  ctx.fill();
  // mane
  ctx.strokeStyle = pal.horseDark;
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    const p = i / 4;
    ctx.beginPath();
    ctx.moveTo(34 + p * 36, -76 - p * 40 + bob);
    ctx.lineTo(26 + p * 36, -66 - p * 38 + bob);
    ctx.stroke();
  }
  // eye + bridle
  ctx.fillStyle = '#0d0a0c';
  ctx.beginPath();
  ctx.arc(84, -114 + bob, 1.9, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = pal.cloth2;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(92, -104 + bob);
  ctx.lineTo(84, -110 + bob);
  ctx.stroke();

  /* ---------- rider
   */
  const rz = bob * 0.7;
  // leg
  ctx.strokeStyle = pal.plateDark;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-2, -86 + rz);
  ctx.quadraticCurveTo(12, -76 + rz, 14, -62 + rz);
  ctx.stroke();
  ctx.fillStyle = '#211a1c';
  ctx.beginPath();
  ctx.ellipse(16, -58 + rz, 6, 4, 0, 0, TAU);
  ctx.fill();

  // torso
  ctx.fillStyle = pal.plate;
  ctx.beginPath();
  ctx.moveTo(-10, -124 + rz);
  ctx.quadraticCurveTo(6, -130 + rz, 16, -118 + rz);
  ctx.quadraticCurveTo(18, -100 + rz, 8, -86 + rz);
  ctx.lineTo(-10, -88 + rz);
  ctx.quadraticCurveTo(-16, -106 + rz, -10, -124 + rz);
  ctx.closePath();
  ctx.fill();
  // tabard
  ctx.fillStyle = pal.cloth;
  ctx.beginPath();
  ctx.moveTo(-2, -118 + rz);
  ctx.lineTo(14, -114 + rz);
  ctx.lineTo(10, -92 + rz);
  ctx.lineTo(-2, -94 + rz);
  ctx.closePath();
  ctx.fill();

  // arm to lance
  ctx.strokeStyle = pal.plate;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(4, -118 + rz);
  ctx.quadraticCurveTo(14, -112 + rz, 20, -104 + rz);
  ctx.stroke();

  // shield (facing the opponent)
  if (shieldOn) {
    ctx.save();
    ctx.translate(26, -106 + rz);
    ctx.rotate(-0.12);
    ctx.fillStyle = pal.cloth;
    ctx.beginPath();
    ctx.moveTo(-11, -14);
    ctx.lineTo(11, -14);
    ctx.quadraticCurveTo(13, 4, 0, 15);
    ctx.quadraticCurveTo(-13, 4, -11, -14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = pal.cloth2;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.fillStyle = pal.cloth2;
    ctx.fillRect(-1.6, -10, 3.2, 18);
    ctx.fillRect(-6, -6, 12, 3.2);
    ctx.restore();
  }

  // helmet
  ctx.fillStyle = pal.plate;
  ctx.beginPath();
  ctx.ellipse(6, -136 + rz, 11.5, 12.5, -0.1, 0, TAU);
  ctx.fill();
  ctx.fillStyle = pal.plateDark;
  ctx.fillRect(0, -137 + rz, 18, 3);
  ctx.fillStyle = '#0b0a0c';
  ctx.fillRect(9, -134 + rz, 8, 2.2);
  // plume
  ctx.strokeStyle = pal.plume;
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(4, -146 + rz);
  ctx.quadraticCurveTo(-14, -150 + rz + Math.sin(t * 5) * 3, -28, -132 + rz + Math.sin(t * 5 + 1) * 4);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = pal.cloth2;
  ctx.beginPath();
  ctx.moveTo(2, -143 + rz);
  ctx.quadraticCurveTo(-18, -140 + rz, -26, -124 + rz + Math.sin(t * 5 + 2) * 4);
  ctx.stroke();

  /* ---------- lance
   */
  const ang = (1 - couch) * 0.42; // raised when not couched
  ctx.save();
  ctx.translate(20, -104 + rz);
  ctx.rotate(ang);
  const L = LANCE_REACH;
  const grad = ctx.createLinearGradient(0, 0, L, 0);
  grad.addColorStop(0, '#6b4a2f');
  grad.addColorStop(0.75, '#c9a878');
  grad.addColorStop(1, '#e6dcc0');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'butt';
  ctx.beginPath();
  ctx.moveTo(-52, 0);
  ctx.lineTo(L, 0);
  ctx.stroke();
  // vamplate
  ctx.fillStyle = pal.plate;
  ctx.beginPath();
  ctx.moveTo(4, -7);
  ctx.quadraticCurveTo(16, 0, 4, 8);
  ctx.lineTo(-2, 4);
  ctx.lineTo(-2, -4);
  ctx.closePath();
  ctx.fill();
  // pennon
  ctx.fillStyle = pal.cloth;
  const w = Math.sin(t * 7) * 4;
  ctx.beginPath();
  ctx.moveTo(L - 30, -2);
  ctx.quadraticCurveTo(L - 8, -12 + w, L - 2, -4 + w * 0.4);
  ctx.lineTo(L - 4, 0);
  ctx.closePath();
  ctx.fill();
  // steel tip
  ctx.fillStyle = '#eef2f6';
  ctx.beginPath();
  ctx.moveTo(L, -2.6);
  ctx.lineTo(L + 10, 0);
  ctx.lineTo(L, 2.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  if (glow > 0) ctx.shadowBlur = 0;
  ctx.restore();
}

/* ------------------------------------------------------------- effects */

export function drawSpark(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
  ctx.restore();
}

export function drawBanner(ctx, { x, y, w, h, t, text, color = '#8f2233' }) {
  ctx.save();
  ctx.translate(x, y);
  const wave = Math.sin(t * 3) * 3;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(w * 0.5, wave, w, 0);
  ctx.lineTo(w, h);
  ctx.quadraticCurveTo(w * 0.5, h + wave, 0, h);
  ctx.closePath();
  ctx.fill();
  if (text) {
    ctx.fillStyle = 'rgba(255,240,210,0.92)';
    ctx.font = `600 ${Math.round(h * 0.5)}px ui-serif, Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, w / 2, h / 2 + 1);
  }
  ctx.restore();
}

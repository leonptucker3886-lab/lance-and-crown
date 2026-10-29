// The showcase coat of arms for the cold open: a gilded shield carrying the
// crown charge, drawn so it can be spun about its vertical axis. These are the
// arms of a knight who has already taken every rival — shown before the player
// has earned a single charge, which is the promise the intro is making.
//
// Deliberately self-contained: the intro poses one hero crest, so it does not
// need the whole knight rig in art.js.

function outline(ctx, w, h) {
  ctx.beginPath();
  ctx.moveTo(-w, -h);
  ctx.lineTo(w, -h);
  ctx.lineTo(w * 0.94, h * 0.24);
  ctx.quadraticCurveTo(w * 0.86, h * 0.78, 0, h * 1.16);
  ctx.quadraticCurveTo(-w * 0.86, h * 0.78, -w * 0.94, h * 0.24);
  ctx.closePath();
}

function crownPath(ctx, s) {
  ctx.beginPath();
  ctx.moveTo(-s * 0.72, s * 0.46);
  ctx.lineTo(-s * 0.72, -s * 0.34);
  ctx.lineTo(-s * 0.36, s * 0.04);
  ctx.lineTo(0, -s * 0.5);
  ctx.lineTo(s * 0.36, s * 0.04);
  ctx.lineTo(s * 0.72, -s * 0.34);
  ctx.lineTo(s * 0.72, s * 0.46);
  ctx.closePath();
}

/**
 * Draw the arms.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{x?:number,y?:number,r?:number,squash?:number,t?:number}} o
 *   squash is the cosine of the spin angle: 1 faces front, 0 is edge-on,
 *   negative is the back of the shield.
 */
export function drawCrest(ctx, o = {}) {
  const { x = 0, y = 0, r = 60, squash = 1, t = 0 } = o;
  const face = Math.max(0.04, Math.abs(squash));
  const h = r;
  const w = r * 0.8;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);

  // Gilt rim behind the field, so the edge always reads as gold.
  ctx.fillStyle = '#e8c96a';
  outline(ctx, w * 1.07, h * 1.05);
  ctx.fill();

  // The field: gules, lit from above.
  const g = ctx.createLinearGradient(0, -h, 0, h * 1.1);
  g.addColorStop(0, '#ab2d3f');
  g.addColorStop(0.55, '#8f2233');
  g.addColorStop(1, '#5b1421');
  ctx.fillStyle = g;
  outline(ctx, w, h);
  ctx.fill();

  // A finer rule just inside the rim.
  ctx.save();
  ctx.scale(0.9, 0.9);
  ctx.strokeStyle = 'rgba(232,201,106,0.8)';
  ctx.lineWidth = r * 0.032;
  outline(ctx, w, h);
  ctx.stroke();
  ctx.restore();

  // The charge. Mirrored on the back half so it is still a crown facing you.
  if (face > 0.22) {
    ctx.save();
    if (squash < 0) ctx.scale(-1, 1);
    const s = h * 0.5;
    ctx.fillStyle = '#f7e2a6';
    crownPath(ctx, s);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,250,232,0.92)';
    for (const [cx, cy] of [
      [-0.72, -0.34],
      [0, -0.5],
      [0.72, -0.34],
    ]) {
      ctx.beginPath();
      ctx.arc(cx * s, cy * s, s * 0.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.restore();

  // A slow band of light crossing the face, in screen space.
  if (face > 0.3) {
    const sweep = ((t % 3.2) / 3.2) * 2 - 0.5;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.beginPath();
    ctx.rect(x - w * face, y - h, w * 2 * face, h * 2);
    ctx.clip();
    const sx = x + (sweep - 0.75) * w * 2.2 * face;
    const grad = ctx.createLinearGradient(sx, y - h, sx + w * 0.5, y + h);
    grad.addColorStop(0, 'rgba(255,244,216,0)');
    grad.addColorStop(0.5, `rgba(255,244,216,${0.16 * face})`);
    grad.addColorStop(1, 'rgba(255,244,216,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(x - w * face, y - h, w * 2 * face, h * 2);
    ctx.restore();
  }
}

import { drawText, roundedRect } from './core';

const px = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  u: number,
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x * u), Math.round(y * u), Math.ceil(w * u), Math.ceil(h * u));
};

const rect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void => {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
};

export const drawBattlefield = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
): void => {
  ctx.save();
  ctx.imageSmoothingEnabled = false;

  const unit = Math.max(3, Math.floor(Math.min(width, height) / 150));
  const snap = (value: number) => Math.round(value / unit) * unit;

  rect(ctx, 0, 0, width, height, '#14233f');
  rect(ctx, 0, height * 0.16, width, height * 0.2, '#1f4b73');
  rect(ctx, 0, height * 0.32, width, height * 0.18, '#1d5b6a');

  for (let i = 0; i < 32; i += 1) {
    const x = snap((i * 97 + time * 8) % (width + 160) - 80);
    const y = snap(height * (0.12 + ((i * 23) % 18) / 100));
    rect(ctx, x, y, unit * (8 + (i % 4) * 3), unit * 2, 'rgba(195,231,255,0.18)');
    rect(ctx, x + unit * 3, y - unit, unit * (4 + (i % 3)), unit, 'rgba(195,231,255,0.14)');
  }

  drawPixelMountains(ctx, width, height, unit, '#183b59', height * 0.42, time * 0.1);
  drawPixelMountains(ctx, width, height, unit, '#102f42', height * 0.51, time * 0.18);

  const groundY = snap(height * 0.72);
  rect(ctx, 0, groundY, width, height - groundY, '#163a2a');
  rect(ctx, 0, groundY + unit * 9, width, height - groundY, '#0c2119');

  for (let x = 0; x < width; x += unit * 9) {
    const y = groundY + ((x / unit) % 5) * unit;
    rect(ctx, x, y, unit * 8, unit * 2, '#6c5f3d');
    rect(ctx, x + unit, y + unit * 2, unit * 7, unit, '#9b8050');
  }

  drawPixelRuins(ctx, snap(width * 0.5), groundY, unit);
  drawPixelTree(ctx, snap(width * 0.08), groundY + unit * 9, unit, time);
  drawPixelTree(ctx, snap(width * 0.92), groundY + unit * 7, unit, time + 1.7);

  for (let i = 0; i < 48; i += 1) {
    const x = snap((i * 53 + Math.sin(time + i) * 5) % width);
    const y = snap(groundY - unit * (2 + (i * 7) % 24));
    const color = i % 3 === 0 ? '#7dd3fc' : i % 3 === 1 ? '#a7f3d0' : '#c084fc';
    rect(ctx, x, y, unit, unit, color);
  }

  ctx.restore();
};

const drawPixelMountains = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  unit: number,
  color: string,
  baseY: number,
  drift: number,
): void => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  for (let x = -unit * 20; x <= width + unit * 20; x += unit * 16) {
    const peak = baseY - unit * (12 + ((x / unit + Math.floor(drift)) % 9));
    ctx.lineTo(x, peak);
    ctx.lineTo(x + unit * 16, baseY);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();
};

const drawPixelRuins = (ctx: CanvasRenderingContext2D, x: number, y: number, u: number): void => {
  const c1 = '#52616f';
  const c2 = '#2d3748';
  const moss = '#5d8b3c';
  rect(ctx, x - u * 54, y - u * 42, u * 9, u * 42, c1);
  rect(ctx, x - u * 51, y - u * 38, u * 6, u * 38, c2);
  rect(ctx, x - u * 60, y - u * 45, u * 20, u * 5, c1);
  rect(ctx, x + u * 36, y - u * 48, u * 10, u * 48, c1);
  rect(ctx, x + u * 39, y - u * 43, u * 7, u * 43, c2);
  rect(ctx, x + u * 28, y - u * 51, u * 26, u * 5, c1);
  rect(ctx, x + u * 36, y - u * 38, u * 10, u * 4, '#78d5ff');
  rect(ctx, x - u * 50, y - u * 48, u * 6, u * 3, moss);
  rect(ctx, x + u * 30, y - u * 54, u * 18, u * 3, moss);
  rect(ctx, x - u * 68, y - u * 2, u * 136, u * 3, '#273241');
};

const drawPixelTree = (ctx: CanvasRenderingContext2D, x: number, y: number, u: number, time: number): void => {
  const sway = Math.round(Math.sin(time * 0.9) * u);
  rect(ctx, x - u * 4, y - u * 38, u * 8, u * 38, '#4a2e18');
  rect(ctx, x - u * 9 + sway, y - u * 34, u * 18, u * 7, '#0f3b2e');
  rect(ctx, x - u * 14 + sway, y - u * 28, u * 28, u * 8, '#13553c');
  rect(ctx, x - u * 11 + sway, y - u * 21, u * 22, u * 8, '#1c704c');
};

export const drawHero = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  phase: number,
  attack: number,
  flash: number,
): void => {
  const u = Math.max(2.2, 3.25 * scale);
  const frame = attack > 0 ? Math.min(7, Math.floor(attack * 8)) : Math.floor(phase * 7) % 6;
  const bob = attack > 0 ? 0 : Math.round(Math.sin(phase * 4) * u);
  const lunge = attack > 0 ? Math.sin(Math.min(attack, 1) * Math.PI) * u * 10 : 0;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x + lunge), Math.round(y + bob));

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.fillRect(-22 * u, 12 * u, 42 * u, 7 * u);

  const capeShift = attack > 0 ? -4 : Math.round(Math.sin(phase * 5) * 2);
  drawHeroCape(ctx, u, capeShift);
  drawHeroLegs(ctx, u, frame, attack);
  drawHeroBody(ctx, u, flash);
  drawHeroHead(ctx, u, frame);
  drawHeroSword(ctx, u, attack, frame);

  ctx.restore();
};

const drawHeroCape = (ctx: CanvasRenderingContext2D, u: number, shift: number): void => {
  px(ctx, -13 + shift, -25, 10, 33, '#10264b', u);
  px(ctx, -17 + shift, -14, 6, 20, '#173a75', u);
  px(ctx, -12 + shift, 6, 9, 6, '#244f96', u);
  px(ctx, -14 + shift, 11, 6, 4, '#d0a94f', u);
};

const drawHeroLegs = (ctx: CanvasRenderingContext2D, u: number, frame: number, attack: number): void => {
  const stride = attack > 0 ? 3 : frame % 2 === 0 ? 1 : -1;
  px(ctx, -7 - stride, -1, 6, 12, '#1f2937', u);
  px(ctx, 3 + stride, -1, 6, 12, '#1f2937', u);
  px(ctx, -9 - stride, 9, 9, 4, '#9ca3af', u);
  px(ctx, 2 + stride, 9, 10, 4, '#9ca3af', u);
  px(ctx, -8 - stride, 0, 5, 4, '#64748b', u);
  px(ctx, 4 + stride, 0, 5, 4, '#64748b', u);
};

const drawHeroBody = (ctx: CanvasRenderingContext2D, u: number, flash: number): void => {
  const silver = flash > 0 ? '#ffffff' : '#cbd5e1';
  px(ctx, -10, -24, 20, 24, '#111827', u);
  px(ctx, -8, -22, 16, 20, '#1e3a8a', u);
  px(ctx, -10, -23, 5, 8, silver, u);
  px(ctx, 5, -23, 5, 8, silver, u);
  px(ctx, -6, -17, 12, 5, '#334155', u);
  px(ctx, -5, -11, 10, 8, '#0f172a', u);
  px(ctx, -2, -23, 4, 22, '#facc15', u);
  px(ctx, -8, -2, 16, 3, '#a16207', u);
};

const drawHeroHead = (ctx: CanvasRenderingContext2D, u: number, frame: number): void => {
  px(ctx, -7, -38, 14, 12, '#f4c29b', u);
  px(ctx, -9, -43, 17, 9, '#0f172a', u);
  px(ctx, -11, -39, 8, 7, '#111827', u);
  px(ctx, 4, -39, 6, 6, '#111827', u);
  px(ctx, -4, -34, 2, 2, '#60a5fa', u);
  px(ctx, 4, -34, 2, 2, '#60a5fa', u);
  if (frame % 3 === 0) {
    px(ctx, -9, -45, 10, 3, '#1e293b', u);
  }
};

const drawHeroSword = (ctx: CanvasRenderingContext2D, u: number, attack: number, frame: number): void => {
  ctx.save();
  const progress = Math.min(attack, 1);
  const swing = attack > 0 ? -0.78 + Math.sin(progress * Math.PI) * 1.45 : -0.18 + (frame % 2) * 0.03;
  ctx.translate(9 * u, -14 * u);
  ctx.rotate(swing);
  rect(ctx, -2 * u, -2 * u, 4 * u, 12 * u, '#7c4a16');
  rect(ctx, -8 * u, 8 * u, 16 * u, 3 * u, '#facc15');
  rect(ctx, -2 * u, -28 * u, 4 * u, 36 * u, '#dbeafe');
  rect(ctx, 2 * u, -26 * u, 2 * u, 31 * u, '#60a5fa');
  rect(ctx, -4 * u, -30 * u, 4 * u, 4 * u, '#ffffff');
  ctx.restore();
};

export const drawMonster = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  phase: number,
  hit: number,
  dead: number,
): void => {
  const u = Math.max(2, 3.05 * scale);
  const wobble = dead > 0 ? 0 : Math.round(Math.sin(phase * 5) * 2);
  const squash = dead > 0 ? 1 - dead * 0.55 : 1;
  const frame = dead > 0 ? Math.floor(dead * 6) : hit > 0 ? 1 : Math.floor(phase * 6) % 6;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y + dead * u * 16));
  ctx.scale(1, squash);
  ctx.globalAlpha = 1 - dead * 0.72;

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(-31 * u, 11 * u, 62 * u, 8 * u);

  if (dead > 0.78) {
    drawMonsterAsh(ctx, u, dead);
    ctx.restore();
    return;
  }

  const flash = hit > 0 ? '#f5d0fe' : '#25113e';
  px(ctx, -28, -17 + wobble, 44, 28, flash, u);
  px(ctx, -22, -22 + wobble, 38, 20, '#172915', u);
  px(ctx, -17, -25 + wobble, 29, 12, '#31572c', u);
  px(ctx, -4, -20 + wobble, 27, 26, '#2e1065', u);
  px(ctx, -31, -6 + wobble, 10, 11, '#0f1f12', u);
  px(ctx, 13, -5 + wobble, 19, 11, '#0f1f12', u);

  // Head facing left
  px(ctx, -34, -24 + wobble, 22, 21, hit > 0 ? '#ffffff' : '#33185d', u);
  px(ctx, -39, -15 + wobble, 9, 8, '#1b0b2e', u);
  px(ctx, -31, -18 + wobble, 5, 5, '#a855f7', u);
  px(ctx, -30, -17 + wobble, 2, 2, '#ffffff', u);
  px(ctx, -36, -8 + wobble, 13, 3, '#e9d5ff', u);

  // Branch horns and claws
  px(ctx, -34, -31 + wobble, 5, 8, '#4a2e18', u);
  px(ctx, -31, -36 + wobble, 3, 5, '#6b4f2a', u);
  px(ctx, -17, -31 + wobble, 5, 9, '#4a2e18', u);
  px(ctx, -14, -39 + wobble, 3, 8, '#6b4f2a', u);
  px(ctx, -29, 7, 8, 5, '#a3e635', u);
  px(ctx, -6, 7, 8, 5, '#a3e635', u);
  px(ctx, 18, 7, 8, 5, '#a3e635', u);

  // Purple corruption fire
  const flame = frame % 2 === 0 ? 0 : -2;
  px(ctx, -8, -33 + flame, 5, 10, '#9333ea', u);
  px(ctx, 5, -35 - flame, 5, 12, '#7e22ce', u);
  px(ctx, 14, -31 + flame, 4, 8, '#c084fc', u);

  ctx.restore();
};

const drawMonsterAsh = (ctx: CanvasRenderingContext2D, u: number, dead: number): void => {
  px(ctx, -28, 0, 48, 11, '#291047', u);
  px(ctx, -18, -5, 30, 6, '#43206f', u);
  px(ctx, -4, -16, 5, 14, '#a855f7', u);
  px(ctx, 7, -11, 4, 10, '#c084fc', u);
  if (dead > 0.9) {
    px(ctx, -21, -19, 3, 3, '#c084fc', u);
    px(ctx, 16, -22, 3, 3, '#c084fc', u);
  }
};

export const drawSlash = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
): void => {
  const alpha = 1 - progress;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = alpha;
  ctx.translate(Math.round(x), Math.round(y));
  const u = 5;
  const color = '#7dd3fc';
  const white = '#f8fafc';
  const points = [
    [-18, -18, 8, 4, color],
    [-11, -24, 12, 4, white],
    [0, -30, 16, 5, color],
    [12, -25, 18, 5, white],
    [23, -16, 13, 5, color],
    [28, -7, 8, 4, white],
  ] as const;
  points.forEach(([pxx, pyy, w, h, c]) => rect(ctx, pxx * u, pyy * u, w * u, h * u, c));
  ctx.restore();
};

export const drawLogo = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  roundedRect(ctx, x, y, 236, 58, 0);
  ctx.fillStyle = 'rgba(7, 12, 24, 0.72)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.28)';
  ctx.stroke();
  drawText(ctx, 'MYTHVALE 2D', x + 16, y + 27, { size: 19, weight: 900, color: '#e0f2fe' });
  drawText(ctx, 'pixel idle combat prototype', x + 16, y + 44, {
    size: 10,
    weight: 800,
    color: '#93c5fd',
  });
  ctx.restore();
};

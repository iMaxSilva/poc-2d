import { clamp, drawDiamond, drawText, pulse, roundedRect, smoothStep } from './core';

export type SkillKind = 'slash' | 'nova' | 'meteor' | 'potion';

const snap = (value: number, unit = 1): number => Math.round(value / unit) * unit;

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

const px = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  unit: number,
): void => rect(ctx, x * unit, y * unit, w * unit, h * unit, color);

const polygon = (
  ctx: CanvasRenderingContext2D,
  points: Array<[number, number]>,
  fill: string,
  stroke?: string,
): void => {
  if (points.length < 3) return;
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let index = 1; index < points.length; index += 1) {
    ctx.lineTo(points[index][0], points[index][1]);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
};

const glowDot = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha = 1,
): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = color;
  ctx.shadowBlur = radius * 3;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x - radius / 2), Math.round(y - radius / 2), Math.max(1, radius), Math.max(1, radius));
  ctx.restore();
};

const drawMountainLayer = (
  ctx: CanvasRenderingContext2D,
  width: number,
  baseY: number,
  unit: number,
  color: string,
  offset: number,
  amplitude: number,
): void => {
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  for (let x = -unit * 24; x <= width + unit * 24; x += unit * 18) {
    const seed = Math.floor((x + offset) / (unit * 18));
    const peak = baseY - unit * (amplitude + ((seed * 11) % 13));
    ctx.lineTo(x + (offset % (unit * 18)), peak);
    ctx.lineTo(x + unit * 18 + (offset % (unit * 18)), baseY);
  }
  ctx.lineTo(width, baseY + unit * 32);
  ctx.lineTo(0, baseY + unit * 32);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
};

const drawMoon = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, time: number): void => {
  ctx.save();
  const halo = ctx.createRadialGradient(x, y, radius * 0.1, x, y, radius * 2.4);
  halo.addColorStop(0, 'rgba(232, 248, 255, 0.32)');
  halo.addColorStop(0.5, 'rgba(99, 102, 241, 0.12)');
  halo.addColorStop(1, 'rgba(99, 102, 241, 0)');
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(x, y, radius * 2.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = '#bae6fd';
  ctx.shadowBlur = 28;
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#c7d2fe';
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(x - radius * 0.28, y - radius * 0.17, radius * 0.16, 0, Math.PI * 2);
  ctx.arc(x + radius * 0.22, y + radius * 0.3, radius * 0.11, 0, Math.PI * 2);
  ctx.fill();

  for (let index = 0; index < 8; index += 1) {
    const angle = time * 0.06 + index * (Math.PI / 4);
    const distance = radius * (1.35 + (index % 3) * 0.22);
    glowDot(ctx, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, 2, '#dbeafe', 0.6);
  }
  ctx.restore();
};

const drawRuinedGate = (
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  unit: number,
  time: number,
): void => {
  const stoneDark = '#11192d';
  const stone = '#24304a';
  const edge = '#475569';
  const moss = '#164e3f';

  rect(ctx, x - unit * 49, groundY - unit * 44, unit * 10, unit * 44, stoneDark);
  rect(ctx, x - unit * 45, groundY - unit * 52, unit * 10, unit * 52, stone);
  rect(ctx, x - unit * 48, groundY - unit * 52, unit * 4, unit * 48, edge);
  rect(ctx, x + unit * 35, groundY - unit * 57, unit * 11, unit * 57, stoneDark);
  rect(ctx, x + unit * 39, groundY - unit * 62, unit * 10, unit * 62, stone);
  rect(ctx, x + unit * 39, groundY - unit * 61, unit * 4, unit * 56, edge);

  rect(ctx, x - unit * 48, groundY - unit * 58, unit * 26, unit * 6, stone);
  rect(ctx, x + unit * 28, groundY - unit * 68, unit * 29, unit * 7, stone);
  rect(ctx, x - unit * 46, groundY - unit * 60, unit * 13, unit * 2, moss);
  rect(ctx, x + unit * 34, groundY - unit * 70, unit * 17, unit * 2, moss);

  const portalPulse = 0.55 + pulse(time, 1.7) * 0.25;
  ctx.save();
  ctx.globalAlpha = portalPulse;
  const portal = ctx.createRadialGradient(x, groundY - unit * 26, unit * 2, x, groundY - unit * 26, unit * 28);
  portal.addColorStop(0, 'rgba(216, 180, 254, 0.38)');
  portal.addColorStop(0.48, 'rgba(124, 58, 237, 0.22)');
  portal.addColorStop(1, 'rgba(76, 29, 149, 0)');
  ctx.fillStyle = portal;
  ctx.fillRect(x - unit * 34, groundY - unit * 62, unit * 68, unit * 62);
  ctx.restore();

  for (let index = 0; index < 7; index += 1) {
    const angle = time * (0.18 + index * 0.012) + index * 0.9;
    const rx = unit * (13 + (index % 3) * 5);
    const ry = unit * (20 + (index % 2) * 4);
    glowDot(
      ctx,
      x + Math.cos(angle) * rx,
      groundY - unit * 27 + Math.sin(angle) * ry,
      unit * 0.7,
      index % 2 === 0 ? '#c084fc' : '#67e8f9',
      0.55,
    );
  }
};

const drawForegroundRocks = (ctx: CanvasRenderingContext2D, width: number, height: number, unit: number): void => {
  ctx.save();
  ctx.globalAlpha = 0.86;
  for (let index = 0; index < 14; index += 1) {
    const x = ((index * 137) % (width + unit * 20)) - unit * 8;
    const y = height - unit * (4 + (index % 3));
    const w = unit * (8 + (index % 5) * 3);
    polygon(
      ctx,
      [
        [x, y],
        [x + w * 0.2, y - unit * (3 + (index % 4))],
        [x + w * 0.6, y - unit * (5 + ((index + 2) % 3))],
        [x + w, y],
      ],
      index % 2 === 0 ? '#080b14' : '#0d1220',
    );
  }
  ctx.restore();
};

export const drawBattlefield = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  danger = 0,
): void => {
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  const unit = Math.max(2, Math.floor(Math.min(width, height) / 180));
  const horizon = snap(height * 0.68, unit);

  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#050713');
  sky.addColorStop(0.38, danger > 0.5 ? '#21102f' : '#0b1632');
  sky.addColorStop(0.7, '#10263a');
  sky.addColorStop(1, '#07110f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  drawMoon(ctx, width * 0.72, height * 0.18, clamp(width * 0.045, 25, 54), time);

  for (let index = 0; index < 46; index += 1) {
    const x = snap((index * 89 + Math.sin(index * 4.7) * 41) % width, unit);
    const y = snap(height * (0.06 + ((index * 17) % 40) / 100), unit);
    const flicker = 0.22 + pulse(time + index, 1.3 + (index % 4)) * 0.44;
    rect(ctx, x, y, index % 7 === 0 ? unit * 2 : unit, unit, `rgba(186,230,253,${flicker})`);
  }

  drawMountainLayer(ctx, width, horizon - unit * 30, unit, '#121a32', time * 2.2, 26);
  drawMountainLayer(ctx, width, horizon - unit * 17, unit, '#101b2b', time * 3.4, 19);

  const fog = ctx.createLinearGradient(0, horizon - unit * 32, 0, horizon + unit * 8);
  fog.addColorStop(0, 'rgba(125, 211, 252, 0)');
  fog.addColorStop(0.5, 'rgba(125, 211, 252, 0.10)');
  fog.addColorStop(1, 'rgba(125, 211, 252, 0)');
  ctx.fillStyle = fog;
  ctx.fillRect(0, horizon - unit * 36, width, unit * 48);

  ctx.fillStyle = '#0b201d';
  ctx.fillRect(0, horizon, width, height - horizon);
  ctx.fillStyle = '#102d25';
  ctx.fillRect(0, horizon, width, unit * 10);
  ctx.fillStyle = '#173b2e';
  for (let x = -unit * 4; x < width + unit * 4; x += unit * 7) {
    const offset = ((x / unit) % 4) * unit;
    rect(ctx, x, horizon + offset * 0.2, unit * 5, unit * 2, '#315744');
    rect(ctx, x + unit, horizon + unit * 2 + offset * 0.2, unit * 4, unit, '#56745b');
  }

  drawRuinedGate(ctx, width * 0.52, horizon + unit * 3, unit, time);

  for (let index = 0; index < 34; index += 1) {
    const drift = Math.sin(time * (0.4 + (index % 5) * 0.06) + index) * unit * 5;
    const x = ((index * 103 + time * (index % 2 === 0 ? 3 : -2)) % (width + unit * 20)) - unit * 10;
    const y = horizon - unit * (3 + ((index * 13) % 34)) + drift;
    const color = index % 3 === 0 ? '#67e8f9' : index % 3 === 1 ? '#a7f3d0' : '#c084fc';
    glowDot(ctx, x, y, unit * (index % 8 === 0 ? 1.2 : 0.7), color, 0.35 + pulse(time + index) * 0.35);
  }

  drawForegroundRocks(ctx, width, height, unit);
  ctx.restore();
};

const drawHeroShadow = (ctx: CanvasRenderingContext2D, unit: number, attack: number): void => {
  ctx.save();
  ctx.globalAlpha = 0.42;
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.ellipse(unit * (attack > 0 ? 4 : 0), unit * 12, unit * 19, unit * 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawHeroCape = (ctx: CanvasRenderingContext2D, unit: number, time: number, attack: number): void => {
  const sway = Math.round(Math.sin(time * 4.2) * 1.5 - attack * 4);
  px(ctx, -15 + sway, -29, 10, 31, '#0a1738', unit);
  px(ctx, -19 + sway, -21, 7, 24, '#102a5f', unit);
  px(ctx, -17 + sway, -3, 12, 8, '#17428f', unit);
  px(ctx, -15 + sway, 4, 9, 5, '#2563eb', unit);
  px(ctx, -13 + sway, 8, 7, 3, '#f59e0b', unit);
  px(ctx, -18 + sway, -17, 3, 11, '#38bdf8', unit);
};

const drawHeroLegs = (ctx: CanvasRenderingContext2D, unit: number, time: number, attack: number): void => {
  const step = attack > 0 ? 2 : Math.sin(time * 5.5) > 0 ? 1 : -1;
  px(ctx, -7 - step, -2, 6, 13, '#111827', unit);
  px(ctx, 2 + step, -2, 6, 13, '#111827', unit);
  px(ctx, -8 - step, 5, 6, 6, '#334155', unit);
  px(ctx, 3 + step, 5, 6, 6, '#334155', unit);
  px(ctx, -10 - step, 10, 10, 4, '#64748b', unit);
  px(ctx, 2 + step, 10, 11, 4, '#64748b', unit);
  px(ctx, -9 - step, 10, 8, 2, '#cbd5e1', unit);
  px(ctx, 3 + step, 10, 8, 2, '#cbd5e1', unit);
};

const drawHeroTorso = (ctx: CanvasRenderingContext2D, unit: number, flash: number, skill: number): void => {
  const silver = flash > 0 ? '#ffffff' : '#cbd5e1';
  px(ctx, -12, -29, 23, 28, '#060b18', unit);
  px(ctx, -10, -27, 19, 24, '#102b68', unit);
  px(ctx, -8, -25, 15, 20, '#1d4ed8', unit);
  px(ctx, -12, -26, 6, 10, silver, unit);
  px(ctx, 6, -26, 6, 10, silver, unit);
  px(ctx, -11, -16, 5, 12, '#64748b', unit);
  px(ctx, 6, -16, 5, 12, '#64748b', unit);
  px(ctx, -5, -24, 10, 8, '#1e293b', unit);
  px(ctx, -3, -23, 6, 5, '#67e8f9', unit);
  px(ctx, -1, -21, 2, 2, '#ffffff', unit);
  px(ctx, -5, -14, 10, 10, '#0f172a', unit);
  px(ctx, -10, -3, 19, 4, '#92400e', unit);
  px(ctx, -2, -4, 5, 5, '#fbbf24', unit);
  if (skill > 0) {
    const glow = 0.45 + skill * 0.55;
    glowDot(ctx, 0, -20 * unit, unit * 1.4, '#67e8f9', glow);
  }
};

const drawHeroHead = (ctx: CanvasRenderingContext2D, unit: number, time: number): void => {
  px(ctx, -8, -43, 16, 14, '#e5ad83', unit);
  px(ctx, -10, -47, 18, 9, '#111827', unit);
  px(ctx, -12, -43, 7, 11, '#0f172a', unit);
  px(ctx, 5, -43, 6, 8, '#0f172a', unit);
  px(ctx, -7, -46, 4, 3, '#334155', unit);
  px(ctx, 1, -46, 6, 3, '#1e293b', unit);
  px(ctx, -5, -37, 2, 2, '#67e8f9', unit);
  px(ctx, 4, -37, 2, 2, '#67e8f9', unit);
  if (Math.floor(time * 2.2) % 9 === 0) {
    px(ctx, -5, -37, 2, 1, '#0f172a', unit);
    px(ctx, 4, -37, 2, 1, '#0f172a', unit);
  }
  px(ctx, -2, -32, 5, 2, '#9a5e47', unit);
};

const drawHeroArm = (ctx: CanvasRenderingContext2D, unit: number, attack: number): void => {
  const reach = attack > 0 ? Math.sin(clamp(attack, 0, 1) * Math.PI) * 7 : 0;
  px(ctx, 7 + reach, -23, 6, 15, '#1e3a8a', unit);
  px(ctx, 8 + reach, -22, 5, 7, '#94a3b8', unit);
  px(ctx, 8 + reach, -10, 6, 5, '#e5ad83', unit);
};

const drawHeroSword = (ctx: CanvasRenderingContext2D, unit: number, attack: number, skill: number): void => {
  ctx.save();
  const attackCurve = Math.sin(clamp(attack, 0, 1) * Math.PI);
  const swing = attack > 0 ? -1.1 + smoothStep(attack) * 2.25 : -0.3;
  const skillSpin = skill > 0 ? skill * Math.PI * 2.8 : 0;
  ctx.translate((12 + attackCurve * 7) * unit, -11 * unit);
  ctx.rotate(swing + skillSpin);

  rect(ctx, -2 * unit, -1 * unit, 4 * unit, 12 * unit, '#713f12');
  rect(ctx, -7 * unit, 8 * unit, 14 * unit, 3 * unit, '#fbbf24');
  rect(ctx, -2 * unit, 8 * unit, 4 * unit, 5 * unit, '#fde68a');
  rect(ctx, -3 * unit, -31 * unit, 6 * unit, 40 * unit, '#dbeafe');
  rect(ctx, 1 * unit, -29 * unit, 3 * unit, 35 * unit, '#38bdf8');
  rect(ctx, -3 * unit, -32 * unit, 4 * unit, 4 * unit, '#ffffff');
  rect(ctx, -1 * unit, -27 * unit, 2 * unit, 25 * unit, '#eff6ff');

  ctx.save();
  ctx.globalAlpha = 0.38 + attackCurve * 0.45 + skill * 0.35;
  ctx.shadowColor = skill > 0 ? '#c084fc' : '#38bdf8';
  ctx.shadowBlur = unit * 7;
  rect(ctx, -4 * unit, -34 * unit, 8 * unit, 44 * unit, skill > 0 ? '#c084fc' : '#67e8f9');
  ctx.restore();
  ctx.restore();
};

export const drawHero = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  time: number,
  attack: number,
  skill: number,
  flash: number,
): void => {
  const unit = Math.max(2.15, 3.25 * scale);
  const bob = attack > 0 || skill > 0 ? 0 : Math.round(Math.sin(time * 4.6) * unit * 0.65);
  const lunge = attack > 0 ? Math.sin(clamp(attack, 0, 1) * Math.PI) * unit * 9 : skill > 0 ? unit * 2 : 0;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x + lunge), Math.round(y + bob));
  if (flash > 0) {
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 22;
  }

  drawHeroShadow(ctx, unit, attack);
  drawHeroCape(ctx, unit, time, attack);
  drawHeroLegs(ctx, unit, time, attack);
  drawHeroTorso(ctx, unit, flash, skill);
  drawHeroHead(ctx, unit, time);
  drawHeroArm(ctx, unit, attack);
  drawHeroSword(ctx, unit, attack, skill);

  if (skill > 0) {
    for (let index = 0; index < 8; index += 1) {
      const angle = time * 3 + index * (Math.PI / 4);
      const radius = unit * (17 + skill * 8);
      glowDot(ctx, Math.cos(angle) * radius, -unit * 17 + Math.sin(angle) * radius * 0.5, unit, '#67e8f9', 0.7);
    }
  }
  ctx.restore();
};

const drawBossShadow = (ctx: CanvasRenderingContext2D, unit: number, dead: number): void => {
  ctx.save();
  ctx.globalAlpha = 0.5 * (1 - dead);
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, unit * 16, unit * 31, unit * 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const drawBossAura = (ctx: CanvasRenderingContext2D, unit: number, time: number, hit: number, charge: number): void => {
  ctx.save();
  const aura = ctx.createRadialGradient(0, -unit * 18, unit * 2, 0, -unit * 18, unit * 42);
  aura.addColorStop(0, `rgba(216,180,254,${0.2 + charge * 0.45})`);
  aura.addColorStop(0.48, `rgba(124,58,237,${0.1 + charge * 0.24})`);
  aura.addColorStop(1, 'rgba(76,29,149,0)');
  ctx.fillStyle = aura;
  ctx.fillRect(-unit * 48, -unit * 68, unit * 96, unit * 86);

  for (let index = 0; index < 11; index += 1) {
    const angle = time * (0.7 + index * 0.015) + index * 0.58;
    const radius = unit * (25 + (index % 4) * 4 + charge * 9);
    glowDot(
      ctx,
      Math.cos(angle) * radius,
      -unit * 18 + Math.sin(angle) * radius * 0.72,
      unit * (index % 5 === 0 ? 1.4 : 0.8),
      hit > 0 ? '#ffffff' : index % 2 === 0 ? '#c084fc' : '#fb7185',
      0.45 + charge * 0.35,
    );
  }
  ctx.restore();
};

const drawBossHorns = (ctx: CanvasRenderingContext2D, unit: number, time: number): void => {
  const sway = Math.sin(time * 2.7) * unit;
  polygon(ctx, [[-unit * 13, -unit * 47], [-unit * 29 + sway, -unit * 67], [-unit * 20, -unit * 42]], '#27133d');
  polygon(ctx, [[unit * 13, -unit * 47], [unit * 30 - sway, -unit * 66], [unit * 20, -unit * 42]], '#27133d');
  polygon(ctx, [[-unit * 14, -unit * 49], [-unit * 26 + sway, -unit * 63], [-unit * 20, -unit * 46]], '#7c3aed');
  polygon(ctx, [[unit * 14, -unit * 49], [unit * 27 - sway, -unit * 62], [unit * 20, -unit * 46]], '#7c3aed');
  rect(ctx, -unit * 27 + sway, -unit * 64, unit * 4, unit * 4, '#f0abfc');
  rect(ctx, unit * 24 - sway, -unit * 63, unit * 4, unit * 4, '#f0abfc');
};

const drawBossBody = (ctx: CanvasRenderingContext2D, unit: number, hit: number): void => {
  const edge = hit > 0 ? '#ffffff' : '#7c3aed';
  px(ctx, -20, -42, 40, 49, '#130b22', unit);
  px(ctx, -24, -31, 48, 31, '#21103a', unit);
  px(ctx, -19, -40, 38, 42, '#32105a', unit);
  px(ctx, -14, -35, 28, 35, '#4c1d95', unit);
  px(ctx, -21, -26, 7, 23, edge, unit);
  px(ctx, 14, -26, 7, 23, edge, unit);
  px(ctx, -13, -10, 26, 10, '#1b102d', unit);
  px(ctx, -9, -31, 18, 17, '#251144', unit);
  px(ctx, -5, -27, 10, 10, '#fb7185', unit);
  px(ctx, -2, -24, 4, 4, '#ffffff', unit);
  px(ctx, -11, -6, 22, 5, '#6d28d9', unit);
};

const drawBossFace = (ctx: CanvasRenderingContext2D, unit: number, time: number, hit: number): void => {
  px(ctx, -15, -53, 30, 19, '#170d25', unit);
  px(ctx, -12, -50, 24, 14, '#2e1065', unit);
  px(ctx, -10, -48, 20, 7, '#111827', unit);
  px(ctx, -8, -46, 16, 4, hit > 0 ? '#ffffff' : '#fb7185', unit);
  px(ctx, -4, -45, 8, 2, '#ffffff', unit);
  px(ctx, -8, -38, 5, 3, '#6b2140', unit);
  px(ctx, 3, -38, 5, 3, '#6b2140', unit);
  if (Math.floor(time * 3) % 7 === 0) {
    px(ctx, -6, -45, 12, 1, '#111827', unit);
  }
};

const drawBossArms = (ctx: CanvasRenderingContext2D, unit: number, time: number, charge: number): void => {
  const raise = charge * unit * 11;
  const sway = Math.sin(time * 3.4) * unit * 1.2;
  px(ctx, -31, -30 - raise / unit, 12, 31, '#1f1234', unit);
  px(ctx, 19, -30 - raise / unit, 12, 31, '#1f1234', unit);
  px(ctx, -34, -4 - raise / unit, 14, 8, '#4c1d95', unit);
  px(ctx, 20, -4 - raise / unit, 14, 8, '#4c1d95', unit);
  px(ctx, -37 + sway / unit, 1 - raise / unit, 7, 8, '#c084fc', unit);
  px(ctx, 30 - sway / unit, 1 - raise / unit, 7, 8, '#c084fc', unit);
  px(ctx, -39 + sway / unit, 5 - raise / unit, 4, 7, '#f0abfc', unit);
  px(ctx, 35 - sway / unit, 5 - raise / unit, 4, 7, '#f0abfc', unit);
};

const drawBossLegs = (ctx: CanvasRenderingContext2D, unit: number): void => {
  px(ctx, -16, -2, 11, 17, '#130b22', unit);
  px(ctx, 5, -2, 11, 17, '#130b22', unit);
  px(ctx, -19, 10, 15, 6, '#312e81', unit);
  px(ctx, 4, 10, 15, 6, '#312e81', unit);
  px(ctx, -20, 13, 17, 4, '#7c3aed', unit);
  px(ctx, 3, 13, 17, 4, '#7c3aed', unit);
};

export const drawBoss = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  time: number,
  hit: number,
  dead: number,
  attackCharge: number,
): void => {
  const unit = Math.max(2, 3.08 * scale);
  const bob = dead > 0 ? 0 : Math.sin(time * 3.7) * unit * 1.1;
  const squash = 1 - dead * 0.72;
  const fall = dead * unit * 22;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(Math.round(x), Math.round(y + bob + fall));
  ctx.scale(1 + dead * 0.22, Math.max(0.18, squash));
  ctx.globalAlpha = 1 - dead * 0.86;

  drawBossShadow(ctx, unit, dead);
  drawBossAura(ctx, unit, time, hit, attackCharge);
  drawBossHorns(ctx, unit, time);
  drawBossArms(ctx, unit, time, attackCharge);
  drawBossLegs(ctx, unit);
  drawBossBody(ctx, unit, hit);
  drawBossFace(ctx, unit, time, hit);

  if (attackCharge > 0) {
    const radius = unit * (7 + attackCharge * 18);
    ctx.save();
    ctx.globalAlpha = 0.45 + attackCharge * 0.55;
    ctx.shadowColor = '#fb7185';
    ctx.shadowBlur = unit * 12;
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = Math.max(2, unit * 0.7);
    ctx.beginPath();
    ctx.arc(0, -unit * 22, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
};

export const drawWeaponTrail = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  progress: number,
  critical = false,
): void => {
  const p = clamp(progress, 0, 1);
  const radius = 56 * scale;
  const start = -Math.PI * 0.72;
  const end = start + Math.PI * 1.35 * smoothStep(p);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'square';

  for (let layer = 0; layer < 3; layer += 1) {
    ctx.globalAlpha = (0.45 - layer * 0.11) * (1 - p * 0.42);
    ctx.strokeStyle = critical ? (layer === 0 ? '#ffffff' : '#fbbf24') : layer === 0 ? '#ffffff' : '#67e8f9';
    ctx.lineWidth = (13 - layer * 4) * scale;
    ctx.shadowColor = critical ? '#f59e0b' : '#38bdf8';
    ctx.shadowBlur = 20 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, radius + layer * 5 * scale, start, end);
    ctx.stroke();
  }
  ctx.restore();
};

export const drawArcaneNova = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  progress: number,
): void => {
  const p = clamp(progress, 0, 1);
  const eased = smoothStep(p);
  ctx.save();
  ctx.translate(x, y);
  ctx.globalCompositeOperation = 'lighter';

  for (let ring = 0; ring < 3; ring += 1) {
    ctx.globalAlpha = (1 - p) * (0.8 - ring * 0.16);
    ctx.strokeStyle = ring === 0 ? '#ffffff' : ring === 1 ? '#67e8f9' : '#8b5cf6';
    ctx.lineWidth = Math.max(1, (7 - ring * 2) * scale);
    ctx.shadowColor = '#67e8f9';
    ctx.shadowBlur = 24 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, (24 + eased * (118 + ring * 12)) * scale, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (let index = 0; index < 16; index += 1) {
    const angle = index * (Math.PI / 8) + p * 1.2;
    const r1 = (30 + eased * 36) * scale;
    const r2 = (48 + eased * 104) * scale;
    ctx.globalAlpha = (1 - p) * 0.72;
    ctx.strokeStyle = index % 2 === 0 ? '#67e8f9' : '#c084fc';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * r1, Math.sin(angle) * r1);
    ctx.lineTo(Math.cos(angle) * r2, Math.sin(angle) * r2);
    ctx.stroke();
  }
  ctx.restore();
};

export const drawMeteor = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  progress: number,
): void => {
  const p = clamp(progress, 0, 1);
  const impact = p < 0.58 ? 0 : (p - 0.58) / 0.42;
  const fall = clamp(p / 0.58, 0, 1);
  const meteorY = y - (230 - fall * 210) * scale;
  const meteorX = x + (1 - fall) * 90 * scale;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  if (impact <= 0) {
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 15 * scale;
    ctx.globalAlpha = 0.42;
    ctx.beginPath();
    ctx.moveTo(meteorX + 85 * scale, meteorY - 85 * scale);
    ctx.lineTo(meteorX, meteorY);
    ctx.stroke();

    const gradient = ctx.createRadialGradient(meteorX, meteorY, 1, meteorX, meteorY, 27 * scale);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.25, '#fde68a');
    gradient.addColorStop(0.6, '#f97316');
    gradient.addColorStop(1, 'rgba(190,24,93,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(meteorX, meteorY, 29 * scale, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.globalAlpha = 1 - impact;
    const gradient = ctx.createRadialGradient(x, y, 1, x, y, (35 + impact * 130) * scale);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.18, '#fbbf24');
    gradient.addColorStop(0.48, '#f97316');
    gradient.addColorStop(1, 'rgba(190,24,93,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, (36 + impact * 130) * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6 * scale;
    ctx.beginPath();
    ctx.ellipse(x, y + 12 * scale, (40 + impact * 150) * scale, (9 + impact * 22) * scale, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
};

export const drawBossTelegraph = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  progress: number,
): void => {
  const p = clamp(progress, 0, 1);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.34 + p * 0.46;
  ctx.strokeStyle = p > 0.72 ? '#ffffff' : '#fb7185';
  ctx.lineWidth = 3 + p * 4;
  ctx.setLineDash([12, 8]);
  ctx.lineDashOffset = -p * 56;
  ctx.beginPath();
  ctx.ellipse(x, y, radius * (0.62 + p * 0.38), radius * 0.26, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  const fill = ctx.createRadialGradient(x, y, 1, x, y, radius);
  fill.addColorStop(0, `rgba(251,113,133,${0.04 + p * 0.12})`);
  fill.addColorStop(0.7, `rgba(239,68,68,${0.03 + p * 0.08})`);
  fill.addColorStop(1, 'rgba(239,68,68,0)');
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, radius, radius * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

export const drawSkillIcon = (
  ctx: CanvasRenderingContext2D,
  kind: SkillKind,
  x: number,
  y: number,
  size: number,
  time: number,
): void => {
  const unit = size / 32;
  ctx.save();
  ctx.translate(x, y);
  ctx.imageSmoothingEnabled = false;

  if (kind === 'slash') {
    ctx.rotate(-0.62);
    rect(ctx, -unit * 3, -unit * 12, unit * 6, unit * 25, '#dbeafe');
    rect(ctx, unit, -unit * 10, unit * 3, unit * 21, '#38bdf8');
    rect(ctx, -unit * 7, unit * 9, unit * 14, unit * 3, '#fbbf24');
    rect(ctx, -unit * 2, unit * 11, unit * 4, unit * 8, '#713f12');
  } else if (kind === 'nova') {
    for (let index = 0; index < 8; index += 1) {
      const angle = time * 0.8 + index * (Math.PI / 4);
      ctx.strokeStyle = index % 2 === 0 ? '#67e8f9' : '#c084fc';
      ctx.lineWidth = unit * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * unit * 5, Math.sin(angle) * unit * 5);
      ctx.lineTo(Math.cos(angle) * unit * 13, Math.sin(angle) * unit * 13);
      ctx.stroke();
    }
    drawDiamond(ctx, 0, 0, unit * 7, '#e0f2fe', '#67e8f9');
    drawDiamond(ctx, 0, 0, unit * 3, '#7c3aed');
  } else if (kind === 'meteor') {
    const fire = 0.7 + pulse(time, 5) * 0.3;
    polygon(ctx, [[-unit * 12, unit * 12], [unit * 9, -unit * 9], [unit * 13, -unit * 4], [-unit * 7, unit * 16]], `rgba(249,115,22,${fire})`);
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(unit * 6, -unit * 6, unit * 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(unit * 4, -unit * 8, unit * 3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    rect(ctx, -unit * 8, -unit * 7, unit * 16, unit * 19, '#e2e8f0');
    rect(ctx, -unit * 5, -unit * 11, unit * 10, unit * 5, '#94a3b8');
    rect(ctx, -unit * 5, -unit * 2, unit * 10, unit * 9, '#22c55e');
    rect(ctx, -unit * 2, -unit * 7, unit * 4, unit * 15, '#bbf7d0');
  }
  ctx.restore();
};

export const drawLogo = (ctx: CanvasRenderingContext2D, x: number, y: number, compact = false): void => {
  const size = compact ? 32 : 40;
  ctx.save();
  ctx.translate(x, y);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, '#67e8f9');
  gradient.addColorStop(0.55, '#3b82f6');
  gradient.addColorStop(1, '#8b5cf6');
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 18;
  roundedRect(ctx, 0, 0, size, size, 11);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.shadowBlur = 0;
  polygon(
    ctx,
    [
      [size * 0.25, size * 0.22],
      [size * 0.47, size * 0.22],
      [size * 0.47, size * 0.42],
      [size * 0.72, size * 0.42],
      [size * 0.72, size * 0.62],
      [size * 0.47, size * 0.62],
      [size * 0.47, size * 0.82],
      [size * 0.25, size * 0.82],
    ],
    '#07111f',
  );
  ctx.restore();

  if (!compact) {
    drawText(ctx, 'ETERNAL', x + size + 12, y + 15, { size: 11, weight: 900, color: '#7dd3fc', letterSpacing: 2 });
    drawText(ctx, 'RIFT', x + size + 12, y + 34, { size: 21, weight: 950, color: '#ffffff', letterSpacing: 1 });
  }
};

import { drawText } from './core';

export const drawBattlefield = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
): void => {
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#111b35');
  sky.addColorStop(0.45, '#14233d');
  sky.addColorStop(1, '#0a0f1f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  for (let i = 0; i < 3; i += 1) {
    const drift = Math.sin(time * 0.18 + i) * 18;
    ctx.fillStyle = `rgba(72, 90, 132, ${0.18 - i * 0.04})`;
    ctx.beginPath();
    ctx.moveTo(-120, height * (0.56 + i * 0.06));
    for (let x = -120; x < width + 180; x += 90) {
      const peak = height * (0.36 + i * 0.08) + Math.sin(x * 0.01 + i) * 34;
      ctx.lineTo(x + drift, peak);
    }
    ctx.lineTo(width + 160, height);
    ctx.lineTo(-120, height);
    ctx.closePath();
    ctx.fill();
  }

  ctx.save();
  ctx.globalAlpha = 0.6;
  for (let i = 0; i < 18; i += 1) {
    const x = ((i * 173 + time * 8) % (width + 140)) - 70;
    const y = height * (0.1 + ((i * 37) % 22) / 100);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.ellipse(x, y, 40 + (i % 3) * 16, 9 + (i % 4), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  const groundY = height * 0.73;
  const ground = ctx.createLinearGradient(0, groundY - 40, 0, height);
  ground.addColorStop(0, '#213f34');
  ground.addColorStop(0.55, '#123225');
  ground.addColorStop(1, '#07120e');
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  ctx.bezierCurveTo(width * 0.22, groundY - 32, width * 0.58, groundY + 36, width, groundY - 4);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  drawRuins(ctx, width * 0.5, groundY - 8, Math.min(width, height) / 760);
  drawTree(ctx, width * 0.1, groundY + 18, 1.16, time);
  drawTree(ctx, width * 0.9, groundY + 4, 1.04, time + 1.4);

  ctx.save();
  for (let i = 0; i < 26; i += 1) {
    const x = (i * 97 + Math.sin(time * 0.4 + i) * 12) % width;
    const y = height * (0.22 + ((i * 29) % 48) / 100);
    const glow = 0.25 + Math.sin(time * 2 + i) * 0.18;
    ctx.fillStyle = `rgba(255, 215, 122, ${glow})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.4 + (i % 3) * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
};

const drawRuins = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = '#24364a';
  ctx.fillRect(-210, -82, 34, 116);
  ctx.fillRect(-154, -118, 42, 154);
  ctx.fillRect(126, -102, 38, 136);
  ctx.fillRect(184, -74, 30, 104);
  ctx.fillStyle = '#1b293a';
  ctx.fillRect(-230, 26, 470, 24);
  ctx.fillStyle = '#30455e';
  ctx.fillRect(-160, -126, 54, 12);
  ctx.fillRect(116, -110, 58, 12);
  ctx.restore();
};

const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, time: number): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const sway = Math.sin(time * 0.9) * 4;
  ctx.fillStyle = '#392612';
  ctx.beginPath();
  ctx.moveTo(-12, 0);
  ctx.quadraticCurveTo(-6 + sway, -86, 4 + sway, -158);
  ctx.quadraticCurveTo(18 + sway, -80, 14, 0);
  ctx.closePath();
  ctx.fill();
  const colors = ['#123a2c', '#19543b', '#26724c'];
  colors.forEach((color, index) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(sway + index * 3, -152 + index * 10, 68 - index * 8, 44, -0.16, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
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
  const bob = Math.sin(phase * 2.2) * 3;
  const lunge = attack > 0 ? Math.sin(Math.min(attack, 1) * Math.PI) * 32 : 0;

  ctx.save();
  ctx.translate(x + lunge, y + bob);
  ctx.scale(scale, scale);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 44, 54, 15, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.rotate(Math.sin(phase * 1.6) * 0.03);
  ctx.fillStyle = '#6d1f35';
  ctx.beginPath();
  ctx.moveTo(-22, -32);
  ctx.quadraticCurveTo(-70, -6, -44, 38);
  ctx.quadraticCurveTo(-16, 22, 10, -22);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = flash > 0 ? '#ffffff' : '#d6b06a';
  ctx.beginPath();
  ctx.roundRect(-28, -38, 56, 68, 16);
  ctx.fill();
  ctx.fillStyle = '#2d405c';
  ctx.beginPath();
  ctx.roundRect(-22, -32, 44, 58, 12);
  ctx.fill();
  ctx.fillStyle = '#85b8ff';
  ctx.fillRect(-18, -24, 36, 8);
  ctx.fillStyle = '#f2c975';
  ctx.fillRect(-4, -35, 8, 67);

  ctx.fillStyle = '#f3c89a';
  ctx.beginPath();
  ctx.arc(0, -62, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#172033';
  ctx.beginPath();
  ctx.ellipse(0, -75, 25, 13, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0e1728';
  ctx.fillRect(-18, -70, 36, 8);
  ctx.fillStyle = '#8fe0ff';
  ctx.fillRect(-13, -67, 10, 3);
  ctx.fillRect(4, -67, 10, 3);

  const swordAngle = attack > 0 ? -0.72 + Math.sin(Math.min(attack, 1) * Math.PI) * 1.45 : -0.24;
  ctx.save();
  ctx.translate(30, -22);
  ctx.rotate(swordAngle);
  ctx.fillStyle = '#56412a';
  ctx.fillRect(-5, 0, 10, 32);
  ctx.fillStyle = '#efd68e';
  ctx.fillRect(-18, 18, 36, 7);
  const blade = ctx.createLinearGradient(0, -84, 0, 18);
  blade.addColorStop(0, '#ffffff');
  blade.addColorStop(0.45, '#9fdcff');
  blade.addColorStop(1, '#5476a8');
  ctx.fillStyle = blade;
  ctx.beginPath();
  ctx.moveTo(0, -96);
  ctx.lineTo(13, 19);
  ctx.lineTo(-13, 19);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#172033';
  ctx.fillRect(-20, 28, 14, 26);
  ctx.fillRect(7, 28, 14, 26);
  ctx.restore();
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
  const squash = dead > 0 ? 1 - dead * 0.45 : 1 + Math.sin(phase * 2) * 0.035;
  const wobble = Math.sin(phase * 3) * 4;
  const alpha = 1 - dead * 0.75;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x + (hit > 0 ? Math.sin(phase * 42) * 6 : 0), y + (dead > 0 ? dead * 28 : 0));
  ctx.scale(scale * (1 / squash), scale * squash);

  ctx.fillStyle = 'rgba(0,0,0,0.32)';
  ctx.beginPath();
  ctx.ellipse(0, 48, 66, 17, 0, 0, Math.PI * 2);
  ctx.fill();

  const body = ctx.createRadialGradient(-20, -26, 10, 0, 0, 88);
  body.addColorStop(0, hit > 0 ? '#ffffff' : '#a855f7');
  body.addColorStop(0.55, '#6d28d9');
  body.addColorStop(1, '#2e1065');
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-70, 24);
  ctx.bezierCurveTo(-68, -46, -32 + wobble, -86, 18, -82);
  ctx.bezierCurveTo(68, -78, 88, -30, 74, 28);
  ctx.bezierCurveTo(38, 62, -30, 64, -70, 24);
  ctx.fill();

  ctx.fillStyle = '#12081f';
  ctx.beginPath();
  ctx.ellipse(-24, -28, 12, 18, -0.12, 0, Math.PI * 2);
  ctx.ellipse(28, -30, 12, 18, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f9fafb';
  ctx.beginPath();
  ctx.arc(-20, -34, 4, 0, Math.PI * 2);
  ctx.arc(32, -36, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#f0abfc';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-16, 4);
  ctx.quadraticCurveTo(4, 18, 28, 0);
  ctx.stroke();

  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-35, -80);
  ctx.quadraticCurveTo(-44, -118, -18, -132);
  ctx.moveTo(38, -78);
  ctx.quadraticCurveTo(54, -114, 28, -136);
  ctx.stroke();
  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.arc(-18, -133, 10, 0, Math.PI * 2);
  ctx.arc(28, -137, 10, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
};

export const drawSlash = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  progress: number,
): void => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.24);
  ctx.globalAlpha = 1 - progress;
  ctx.lineCap = 'round';
  ctx.lineWidth = 18 * (1 - progress * 0.4);
  ctx.strokeStyle = '#dbeafe';
  ctx.beginPath();
  ctx.arc(0, 0, 80, -1.15, 0.82);
  ctx.stroke();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#fbbf24';
  ctx.stroke();
  ctx.restore();
};

export const drawLogo = (ctx: CanvasRenderingContext2D, x: number, y: number): void => {
  ctx.save();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.beginPath();
  ctx.roundRect(x, y, 224, 56, 18);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.stroke();
  drawText(ctx, 'MYTHVALE', x + 18, y + 27, { size: 20, weight: 900, color: '#fff' });
  drawText(ctx, 'combat prototype', x + 18, y + 43, { size: 10, weight: 700, color: 'rgba(255,255,255,0.55)' });
  ctx.restore();
};

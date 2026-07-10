export type Vec2 = {
  x: number;
  y: number;
};

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (from: number, to: number, amount: number): number => {
  return from + (to - from) * amount;
};

export const invLerp = (from: number, to: number, value: number): number => {
  if (from === to) return 0;
  return clamp((value - from) / (to - from), 0, 1);
};

export const easeOutCubic = (t: number): number => {
  const n = 1 - clamp(t, 0, 1);
  return 1 - n * n * n;
};

export const easeInCubic = (t: number): number => {
  const n = clamp(t, 0, 1);
  return n * n * n;
};

export const easeInOut = (t: number): number => {
  const n = clamp(t, 0, 1);
  return n < 0.5 ? 2 * n * n : 1 - Math.pow(-2 * n + 2, 2) / 2;
};

export const smoothStep = (t: number): number => {
  const n = clamp(t, 0, 1);
  return n * n * (3 - 2 * n);
};

export const pulse = (time: number, speed = 1): number => {
  return 0.5 + Math.sin(time * speed) * 0.5;
};

export const pointInRect = (x: number, y: number, rect: Rect): boolean => {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
};

export const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void => {
  const radius = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

export const drawText = (
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  options: {
    size?: number;
    weight?: number;
    color?: string;
    align?: CanvasTextAlign;
    baseline?: CanvasTextBaseline;
    shadow?: boolean;
    letterSpacing?: number;
    maxWidth?: number;
  } = {},
): void => {
  ctx.save();
  ctx.font = `${options.weight ?? 700} ${options.size ?? 16}px Inter, ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = options.align ?? 'left';
  ctx.textBaseline = options.baseline ?? 'alphabetic';
  ctx.fillStyle = options.color ?? '#ffffff';

  if (options.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.72)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
  }

  const letterSpacing = options.letterSpacing ?? 0;
  if (letterSpacing === 0) {
    ctx.fillText(text, x, y, options.maxWidth);
  } else {
    const chars = [...text];
    const widths = chars.map((char) => ctx.measureText(char).width);
    const total = widths.reduce((sum, value) => sum + value, 0) + letterSpacing * Math.max(0, chars.length - 1);
    let cursor = options.align === 'center' ? x - total / 2 : options.align === 'right' ? x - total : x;
    ctx.textAlign = 'left';
    chars.forEach((char, index) => {
      ctx.fillText(char, cursor, y);
      cursor += widths[index] + letterSpacing;
    });
  }
  ctx.restore();
};

export const drawPanel = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  options: {
    radius?: number;
    fill?: string | CanvasGradient;
    stroke?: string;
    glow?: string;
    shadow?: boolean;
  } = {},
): void => {
  ctx.save();
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, options.radius ?? 18);
  if (options.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 12;
  }
  ctx.fillStyle = options.fill ?? 'rgba(7, 10, 22, 0.78)';
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 1;
  ctx.strokeStyle = options.stroke ?? 'rgba(255,255,255,0.12)';
  ctx.stroke();
  if (options.glow) {
    ctx.globalAlpha = 0.5;
    ctx.shadowColor = options.glow;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = options.glow;
    ctx.stroke();
  }
  ctx.restore();
};

export const drawBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  fill: string | CanvasGradient,
  label?: string,
  delayedProgress?: number,
): void => {
  const safeProgress = clamp(progress, 0, 1);
  const delayed = clamp(delayedProgress ?? safeProgress, 0, 1);
  ctx.save();
  roundedRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(2, 4, 12, 0.88)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.stroke();

  const inner = Math.max(2, Math.floor(h * 0.18));
  const available = w - inner * 2;

  if (delayed > safeProgress) {
    roundedRect(ctx, x + inner, y + inner, available * delayed, h - inner * 2, h / 2);
    ctx.fillStyle = '#f8fafc';
    ctx.globalAlpha = 0.72;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const pw = Math.max(0, available * safeProgress);
  if (pw > 0.5) {
    roundedRect(ctx, x + inner, y + inner, pw, h - inner * 2, h / 2);
    ctx.fillStyle = fill;
    ctx.fill();

    ctx.save();
    roundedRect(ctx, x + inner, y + inner, pw, h - inner * 2, h / 2);
    ctx.clip();
    const sheen = ctx.createLinearGradient(0, y, 0, y + h);
    sheen.addColorStop(0, 'rgba(255,255,255,0.42)');
    sheen.addColorStop(0.46, 'rgba(255,255,255,0.04)');
    sheen.addColorStop(1, 'rgba(0,0,0,0.22)');
    ctx.fillStyle = sheen;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  if (label) {
    drawText(ctx, label, x + w / 2, y + h / 2 + 0.5, {
      size: Math.max(10, h * 0.52),
      weight: 900,
      align: 'center',
      baseline: 'middle',
      color: '#ffffff',
      shadow: true,
    });
  }
  ctx.restore();
};

export const drawDiamond = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fill: string,
  stroke?: string,
): void => {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y - radius);
  ctx.lineTo(x + radius, y);
  ctx.lineTo(x, y + radius);
  ctx.lineTo(x - radius, y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
};

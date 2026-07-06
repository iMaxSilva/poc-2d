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

export const easeOutCubic = (t: number): number => {
  const n = 1 - clamp(t, 0, 1);
  return 1 - n * n * n;
};

export const easeInOut = (t: number): number => {
  const n = clamp(t, 0, 1);
  return n < 0.5 ? 2 * n * n : 1 - Math.pow(-2 * n + 2, 2) / 2;
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
  const radius = Math.min(r, w / 2, h / 2);
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
  } = {},
): void => {
  ctx.save();
  ctx.font = `${options.weight ?? 700} ${options.size ?? 16}px Inter, ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = options.align ?? 'left';
  ctx.textBaseline = options.baseline ?? 'alphabetic';
  ctx.fillStyle = options.color ?? '#ffffff';
  if (options.shadow) {
    ctx.shadowColor = 'rgba(0, 0, 0, 0.55)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
  }
  ctx.fillText(text, x, y);
  ctx.restore();
};

export const drawBar = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  progress: number,
  fill: string,
  label?: string,
): void => {
  ctx.save();
  roundedRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = 'rgba(7, 10, 18, 0.76)';
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.stroke();

  const inner = 4;
  const pw = Math.max(0, (w - inner * 2) * clamp(progress, 0, 1));
  roundedRect(ctx, x + inner, y + inner, pw, h - inner * 2, (h - inner * 2) / 2);
  ctx.fillStyle = fill;
  ctx.fill();

  if (label) {
    drawText(ctx, label, x + w / 2, y + h / 2 + 1, {
      size: 12,
      weight: 800,
      align: 'center',
      baseline: 'middle',
      color: '#fff',
      shadow: true,
    });
  }
  ctx.restore();
};

export type Rect = { x: number; y: number; w: number; h: number };

export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
export const lerp = (from: number, to: number, amount: number): number => from + (to - from) * amount;
export const smoothStep = (value: number): number => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
export const pointInRect = (x: number, y: number, rect: Rect): boolean =>
  x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;

export const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
): void => {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
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
    font?: string;
    shadow?: boolean;
    maxWidth?: number;
  } = {},
): void => {
  ctx.save();
  ctx.font = `${options.weight ?? 700} ${options.size ?? 14}px ${options.font ?? 'Trebuchet MS, ui-sans-serif, sans-serif'}`;
  ctx.textAlign = options.align ?? 'left';
  ctx.textBaseline = options.baseline ?? 'alphabetic';
  ctx.fillStyle = options.color ?? '#f8fafc';
  if (options.shadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetY = 2;
  }
  ctx.fillText(text, x, y, options.maxWidth);
  ctx.restore();
};

export const drawBar = (
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  progress: number,
  colors: [string, string],
  label?: string,
  delayedProgress?: number,
): void => {
  const p = clamp(progress, 0, 1);
  const delayed = clamp(delayedProgress ?? p, 0, 1);
  ctx.save();
  roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 3);
  ctx.fillStyle = '#07090e';
  ctx.fill();
  ctx.strokeStyle = 'rgba(226,232,240,0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();
  const inset = 2;
  const innerW = rect.w - inset * 2;
  if (delayed > p) {
    ctx.fillStyle = 'rgba(248,250,252,0.72)';
    ctx.fillRect(rect.x + inset, rect.y + inset, innerW * delayed, rect.h - inset * 2);
  }
  const gradient = ctx.createLinearGradient(rect.x, 0, rect.x + rect.w, 0);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  ctx.fillStyle = gradient;
  ctx.fillRect(rect.x + inset, rect.y + inset, innerW * p, rect.h - inset * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(rect.x + inset, rect.y + inset, innerW * p, Math.max(1, (rect.h - inset * 2) * 0.28));
  if (label) {
    drawText(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 0.5, {
      size: Math.max(8, rect.h * 0.53),
      weight: 900,
      align: 'center',
      baseline: 'middle',
      shadow: true,
    });
  }
  ctx.restore();
};

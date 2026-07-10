import type { SpriteSheetMeta } from './AssetStore';

export class SpriteAnimator {
  private state: string;
  private elapsed = 0;
  private finished = false;

  constructor(
    private readonly image: HTMLImageElement,
    private readonly meta: SpriteSheetMeta,
    initialState: string,
  ) {
    this.state = initialState;
  }

  setState(state: string, restart = false): void {
    if (!this.meta.animations[state]) return;
    if (state !== this.state || restart) {
      this.state = state;
      this.elapsed = 0;
      this.finished = false;
    }
  }

  getState(): string {
    return this.state;
  }

  isFinished(): boolean {
    return this.finished;
  }

  update(dt: number): void {
    const animation = this.meta.animations[this.state];
    if (!animation || this.finished) return;
    this.elapsed += dt;
    const duration = animation.frames / animation.fps;
    if (!animation.loop && this.elapsed >= duration) {
      this.elapsed = duration - 1 / animation.fps;
      this.finished = true;
    } else if (animation.loop && duration > 0) {
      this.elapsed %= duration;
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    scale = 1,
    options: { alpha?: number; flipX?: boolean; filter?: string; rotation?: number } = {},
  ): void {
    const animation = this.meta.animations[this.state];
    if (!animation) return;
    const frame = Math.min(animation.frames - 1, Math.floor(this.elapsed * animation.fps));
    const sx = frame * this.meta.frameWidth;
    const sy = animation.row * this.meta.frameHeight;
    const dw = this.meta.frameWidth * scale;
    const dh = this.meta.frameHeight * scale;

    ctx.save();
    ctx.translate(x, y);
    if (options.rotation) ctx.rotate(options.rotation);
    if (options.flipX) ctx.scale(-1, 1);
    ctx.globalAlpha = options.alpha ?? 1;
    ctx.filter = options.filter ?? 'none';
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      this.image,
      sx,
      sy,
      this.meta.frameWidth,
      this.meta.frameHeight,
      -dw / 2,
      -dh,
      dw,
      dh,
    );
    ctx.restore();
  }
}

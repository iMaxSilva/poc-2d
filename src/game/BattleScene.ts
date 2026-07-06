import {
  clamp,
  drawBar,
  drawText,
  easeInOut,
  easeOutCubic,
  pointInRect,
  Rect,
  roundedRect,
} from './core';
import { drawBattlefield, drawHero, drawLogo, drawMonster, drawSlash } from './studioSprites';

type DamageText = {
  value: number;
  x: number;
  y: number;
  life: number;
  critical: boolean;
};

type Spark = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  radius: number;
};

type LootPopup = {
  text: string;
  life: number;
};

export class BattleScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width = 960;
  private height = 540;
  private pixelRatio = 1;
  private running = false;
  private frame = 0;
  private lastTime = 0;
  private elapsed = 0;

  private monsterHp = 160;
  private readonly monsterMaxHp = 160;
  private heroHp = 220;
  private readonly heroMaxHp = 220;
  private attackCooldown = 0;
  private attackTimer = 0;
  private hitApplied = false;
  private monsterHitTimer = 0;
  private heroFlashTimer = 0;
  private deathTimer = 0;
  private autoBattle = true;
  private kills = 0;
  private gold = 0;
  private xp = 0;
  private damageTexts: DamageText[] = [];
  private sparks: Spark[] = [];
  private lootPopups: LootPopup[] = [];

  private attackButton: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private autoButton: Rect = { x: 0, y: 0, w: 0, h: 0 };

  private readonly onPointerDown = (event: PointerEvent): void => {
    const point = this.pointerToCanvas(event);
    if (pointInRect(point.x, point.y, this.attackButton)) {
      this.tryAttack(true);
      return;
    }
    if (pointInRect(point.x, point.y, this.autoButton)) {
      this.autoBattle = !this.autoBattle;
      return;
    }
    if (point.x > this.width * 0.45) {
      this.tryAttack(true);
    }
  };

  private readonly onResize = (): void => this.resize();

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) {
      throw new Error('Canvas 2D não disponível neste navegador.');
    }
    this.canvas = canvas;
    this.ctx = ctx;
  }

  start(): void {
    this.running = true;
    this.resize();
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('resize', this.onResize);
    requestAnimationFrame(this.loop);
  }

  destroy(): void {
    this.running = false;
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('resize', this.onResize);
  }

  private readonly loop = (time: number): void => {
    if (!this.running) {
      return;
    }

    const dt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.elapsed += dt;
    this.frame += 1;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop);
  };

  private resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(320, Math.floor(rect.width));
    this.height = Math.max(360, Math.floor(rect.height));
    this.canvas.width = Math.floor(this.width * this.pixelRatio);
    this.canvas.height = Math.floor(this.height * this.pixelRatio);
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  private pointerToCanvas(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * this.width,
      y: ((event.clientY - rect.top) / rect.height) * this.height,
    };
  }

  private update(dt: number): void {
    this.attackCooldown = Math.max(0, this.attackCooldown - dt);
    this.heroFlashTimer = Math.max(0, this.heroFlashTimer - dt);
    this.monsterHitTimer = Math.max(0, this.monsterHitTimer - dt);

    if (this.attackTimer > 0) {
      this.attackTimer += dt;
      if (!this.hitApplied && this.attackTimer > 0.18) {
        this.applyDamage();
      }
      if (this.attackTimer > 0.52) {
        this.attackTimer = 0;
        this.hitApplied = false;
      }
    }

    if (this.autoBattle && this.attackCooldown <= 0 && this.monsterHp > 0) {
      this.tryAttack(false);
    }

    if (this.monsterHp <= 0) {
      this.deathTimer += dt;
      if (this.deathTimer > 2.1) {
        this.respawnMonster();
      }
    }

    this.damageTexts = this.damageTexts
      .map((text) => ({ ...text, y: text.y - dt * 42, life: text.life - dt }))
      .filter((text) => text.life > 0);

    this.sparks = this.sparks
      .map((spark) => ({
        ...spark,
        x: spark.x + spark.vx * dt,
        y: spark.y + spark.vy * dt,
        vy: spark.vy + 80 * dt,
        life: spark.life - dt,
      }))
      .filter((spark) => spark.life > 0);

    this.lootPopups = this.lootPopups
      .map((popup) => ({ ...popup, life: popup.life - dt }))
      .filter((popup) => popup.life > 0);
  }

  private tryAttack(manual: boolean): void {
    if (this.attackCooldown > 0 || this.attackTimer > 0 || this.monsterHp <= 0) {
      return;
    }
    this.attackTimer = 0.01;
    this.attackCooldown = manual ? 0.52 : 1.05;
    this.hitApplied = false;
  }

  private applyDamage(): void {
    this.hitApplied = true;
    const critical = Math.random() > 0.78;
    const damage = critical ? 42 + Math.floor(Math.random() * 12) : 23 + Math.floor(Math.random() * 12);
    this.monsterHp = Math.max(0, this.monsterHp - damage);
    this.monsterHitTimer = 0.32;

    const monsterX = this.width * 0.68;
    const monsterY = this.height * 0.66;
    this.damageTexts.push({
      value: damage,
      x: monsterX + Math.random() * 44 - 22,
      y: monsterY - 132,
      life: 0.78,
      critical,
    });

    for (let i = 0; i < 18; i += 1) {
      const angle = -Math.PI * 0.85 + Math.random() * Math.PI * 1.3;
      const speed = 110 + Math.random() * 180;
      this.sparks.push({
        x: monsterX - 22 + Math.random() * 26,
        y: monsterY - 64 + Math.random() * 36,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.32 + Math.random() * 0.26,
        radius: 2 + Math.random() * 3,
      });
    }

    if (this.monsterHp <= 0) {
      this.kills += 1;
      const earnedGold = 18 + Math.floor(Math.random() * 11);
      const earnedXp = 34 + Math.floor(Math.random() * 17);
      this.gold += earnedGold;
      this.xp += earnedXp;
      this.lootPopups.push({ text: `+${earnedXp} XP  +${earnedGold} gold`, life: 1.8 });
    }
  }

  private respawnMonster(): void {
    this.monsterHp = this.monsterMaxHp;
    this.deathTimer = 0;
    this.monsterHitTimer = 0;
    this.lootPopups.push({ text: 'Novo monstro apareceu', life: 1.2 });
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    drawBattlefield(ctx, this.width, this.height, this.elapsed);
    this.drawVignette();

    const heroX = this.width * 0.28;
    const monsterX = this.width * 0.68;
    const baseY = this.height * 0.66;
    const scale = clamp(this.width / 980, 0.72, 1.08);
    const attackProgress = this.attackTimer > 0 ? clamp(this.attackTimer / 0.52, 0, 1) : 0;

    drawHero(ctx, heroX, baseY, scale, this.elapsed, attackProgress, this.heroFlashTimer);

    const deadProgress = this.monsterHp <= 0 ? clamp(this.deathTimer / 0.9, 0, 1) : 0;
    drawMonster(ctx, monsterX, baseY, scale, this.elapsed, this.monsterHitTimer, deadProgress);

    if (attackProgress > 0.16 && attackProgress < 0.58) {
      drawSlash(ctx, monsterX - 18, baseY - 72, easeOutCubic((attackProgress - 0.16) / 0.42));
    }

    this.drawSparks();
    this.drawFloatingTexts();
    this.drawTopHud();
    this.drawCombatHud();
    this.drawLootPopups();
  }

  private drawTopHud(): void {
    const ctx = this.ctx;
    const margin = clamp(this.width * 0.03, 16, 34);
    drawLogo(ctx, margin, margin);

    const cardW = Math.min(340, this.width * 0.38);
    const x = this.width - margin - cardW;
    const y = margin;
    ctx.save();
    roundedRect(ctx, x, y, cardW, 76, 22);
    ctx.fillStyle = 'rgba(4, 8, 18, 0.54)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.stroke();
    drawText(ctx, 'Herói Lv. 01', x + 18, y + 26, { size: 15, weight: 900, color: '#fff' });
    drawText(ctx, `Kills ${this.kills}  •  XP ${this.xp}  •  Gold ${this.gold}`, x + 18, y + 50, {
      size: 12,
      weight: 700,
      color: 'rgba(255,255,255,0.72)',
    });
    drawBar(ctx, x + cardW - 130, y + 22, 106, 16, this.heroHp / this.heroMaxHp, '#22c55e');
    ctx.restore();
  }

  private drawCombatHud(): void {
    const ctx = this.ctx;
    const panelW = Math.min(this.width - 28, 560);
    const panelH = 104;
    const x = (this.width - panelW) / 2;
    const y = this.height - panelH - 22;

    ctx.save();
    roundedRect(ctx, x, y, panelW, panelH, 28);
    ctx.fillStyle = 'rgba(4, 8, 18, 0.62)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();

    drawText(ctx, 'Void Slime', x + 24, y + 30, { size: 18, weight: 900, color: '#fff' });
    drawText(ctx, 'Rank D • floresta antiga • drop comum', x + 24, y + 51, {
      size: 11,
      weight: 700,
      color: 'rgba(255,255,255,0.58)',
    });
    drawBar(
      ctx,
      x + 24,
      y + 64,
      panelW - 48,
      18,
      this.monsterHp / this.monsterMaxHp,
      '#ef4444',
      `${this.monsterHp}/${this.monsterMaxHp}`,
    );

    const buttonY = y - 70;
    this.attackButton = { x: x + panelW - 174, y: buttonY, w: 150, h: 50 };
    this.autoButton = { x: x + 24, y: buttonY, w: 150, h: 50 };
    this.drawButton(this.autoButton, this.autoBattle ? 'AUTO ON' : 'AUTO OFF', this.autoBattle ? '#16a34a' : '#334155');
    const disabled = this.attackCooldown > 0 || this.monsterHp <= 0;
    this.drawButton(this.attackButton, disabled ? 'WAIT' : 'ATTACK', disabled ? '#475569' : '#f97316');
    ctx.restore();
  }

  private drawButton(rect: Rect, label: string, color: string): void {
    const ctx = this.ctx;
    ctx.save();
    roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 18);
    const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, '#111827');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();
    drawText(ctx, label, rect.x + rect.w / 2, rect.y + rect.h / 2 + 1, {
      size: 14,
      weight: 900,
      align: 'center',
      baseline: 'middle',
      color: '#fff',
      shadow: true,
    });
    ctx.restore();
  }

  private drawSparks(): void {
    const ctx = this.ctx;
    ctx.save();
    this.sparks.forEach((spark) => {
      ctx.globalAlpha = clamp(spark.life / 0.5, 0, 1);
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(spark.x, spark.y, spark.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  private drawFloatingTexts(): void {
    const ctx = this.ctx;
    this.damageTexts.forEach((text) => {
      const alpha = clamp(text.life / 0.78, 0, 1);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawText(ctx, text.critical ? `CRIT -${text.value}` : `-${text.value}`, text.x, text.y, {
        size: text.critical ? 28 : 22,
        weight: 1000,
        align: 'center',
        color: text.critical ? '#facc15' : '#fee2e2',
        shadow: true,
      });
      ctx.restore();
    });
  }

  private drawLootPopups(): void {
    const ctx = this.ctx;
    this.lootPopups.forEach((popup, index) => {
      const progress = 1 - clamp(popup.life / 1.8, 0, 1);
      const y = this.height * 0.24 - index * 44 - easeInOut(progress) * 24;
      ctx.save();
      ctx.globalAlpha = clamp(popup.life, 0, 1);
      const w = Math.min(330, this.width - 48);
      const x = (this.width - w) / 2;
      roundedRect(ctx, x, y, w, 42, 18);
      ctx.fillStyle = 'rgba(12, 18, 32, 0.76)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.32)';
      ctx.stroke();
      drawText(ctx, popup.text, this.width / 2, y + 26, {
        size: 14,
        weight: 900,
        align: 'center',
        color: '#fde68a',
        shadow: true,
      });
      ctx.restore();
    });
  }

  private drawVignette(): void {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.22,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.72,
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }
}

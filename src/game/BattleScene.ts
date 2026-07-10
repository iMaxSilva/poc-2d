import {
  clamp,
  drawBar,
  drawPanel,
  drawText,
  lerp,
  pointInRect,
  Rect,
  roundedRect,
  smoothStep,
} from './core';
import {
  drawArcaneNova,
  drawBattlefield,
  drawBoss,
  drawBossTelegraph,
  drawHero,
  drawMeteor,
  drawSkillIcon,
  drawWeaponTrail,
  SkillKind,
} from './pixelSprites';

type ActionKind = 'basic' | 'nova' | 'meteor' | null;
type ParticleShape = 'square' | 'streak' | 'ring';

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  gravity: number;
  drag: number;
  shape: ParticleShape;
};

type DamageText = {
  value: number;
  x: number;
  y: number;
  life: number;
  maxLife: number;
  critical: boolean;
  heal: boolean;
  label?: string;
};

type Toast = {
  title: string;
  subtitle: string;
  life: number;
  maxLife: number;
  accent: string;
};

type SkillButton = {
  rect: Rect;
  kind: SkillKind;
  key: string;
  name: string;
  cooldown: number;
  remaining: number;
  energyCost: number;
};

const WORLD_COLORS = ['#67e8f9', '#38bdf8', '#c084fc', '#f0abfc', '#fbbf24'];

export class BattleScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width = 960;
  private height = 540;
  private pixelRatio = 1;
  private running = false;
  private lastTime = 0;
  private elapsed = 0;

  private heroHp = 360;
  private heroMaxHp = 360;
  private heroEnergy = 100;
  private heroFlash = 0;
  private heroHit = 0;
  private invulnerable = 0;

  private bossHp = 920;
  private bossMaxHp = 920;
  private bossDelayedHp = 920;
  private bossHit = 0;
  private bossDeath = 0;
  private bossAttackWait = 3.2;
  private bossCharge = 0;
  private bossTier = 1;

  private action: ActionKind = null;
  private actionTimer = 0;
  private actionDuration = 0;
  private actionApplied = false;
  private basicCooldown = 0;
  private autoBattle = true;
  private combo = 0;
  private comboLife = 0;
  private kills = 0;
  private gold = 1240;
  private xp = 62;
  private level = 12;

  private particles: Particle[] = [];
  private damageTexts: DamageText[] = [];
  private toasts: Toast[] = [];
  private screenShake = 0;
  private worldFlash = 0;
  private hitStop = 0;
  private audioContext: AudioContext | null = null;

  private attackButton: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private autoButton: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private potionButton: Rect = { x: 0, y: 0, w: 0, h: 0 };
  private skillButtons: SkillButton[] = [
    {
      rect: { x: 0, y: 0, w: 0, h: 0 },
      kind: 'nova',
      key: 'Q',
      name: 'Arc Nova',
      cooldown: 5.5,
      remaining: 0,
      energyCost: 28,
    },
    {
      rect: { x: 0, y: 0, w: 0, h: 0 },
      kind: 'meteor',
      key: 'R',
      name: 'Starfall',
      cooldown: 10,
      remaining: 0,
      energyCost: 58,
    },
  ];
  private potionCooldown = 0;

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.ensureAudio();
    const point = this.pointerToCanvas(event);

    if (pointInRect(point.x, point.y, this.autoButton)) {
      this.autoBattle = !this.autoBattle;
      this.playUiSound();
      return;
    }

    if (pointInRect(point.x, point.y, this.potionButton)) {
      this.usePotion();
      return;
    }

    for (const skill of this.skillButtons) {
      if (pointInRect(point.x, point.y, skill.rect)) {
        this.trySkill(skill.kind);
        return;
      }
    }

    if (pointInRect(point.x, point.y, this.attackButton) || point.y < this.height * 0.8) {
      this.tryBasicAttack();
    }
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    this.ensureAudio();
    if (event.code === 'Space') this.tryBasicAttack();
    if (event.key.toLowerCase() === 'q') this.trySkill('nova');
    if (event.key.toLowerCase() === 'r') this.trySkill('meteor');
    if (event.key.toLowerCase() === 'f') this.usePotion();
    if (event.key.toLowerCase() === 'a') this.autoBattle = !this.autoBattle;
  };

  private readonly onResize = (): void => this.resize();

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D não disponível neste navegador.');
    this.canvas = canvas;
    this.ctx = ctx;
  }

  start(): void {
    this.running = true;
    this.resize();
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);
    requestAnimationFrame(this.loop);
    this.toasts.push({
      title: 'THE HOLLOW WARDEN',
      subtitle: 'Elite encounter • Ancient Rift',
      life: 3.6,
      maxLife: 3.6,
      accent: '#c084fc',
    });
  }

  destroy(): void {
    this.running = false;
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);
    void this.audioContext?.close();
  }

  private readonly loop = (time: number): void => {
    if (!this.running) return;
    const rawDt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.elapsed += rawDt;

    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - rawDt);
      this.updateFx(rawDt * 0.2);
    } else {
      this.update(rawDt);
    }
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
    this.heroFlash = Math.max(0, this.heroFlash - dt);
    this.heroHit = Math.max(0, this.heroHit - dt);
    this.invulnerable = Math.max(0, this.invulnerable - dt);
    this.bossHit = Math.max(0, this.bossHit - dt);
    this.worldFlash = Math.max(0, this.worldFlash - dt);
    this.screenShake = Math.max(0, this.screenShake - dt * 3.4);
    this.basicCooldown = Math.max(0, this.basicCooldown - dt);
    this.potionCooldown = Math.max(0, this.potionCooldown - dt);
    this.heroEnergy = Math.min(100, this.heroEnergy + dt * 6.5);
    this.comboLife = Math.max(0, this.comboLife - dt);
    if (this.comboLife <= 0) this.combo = 0;

    for (const skill of this.skillButtons) {
      skill.remaining = Math.max(0, skill.remaining - dt);
    }

    this.bossDelayedHp = lerp(this.bossDelayedHp, this.bossHp, clamp(dt * 2.4, 0, 1));

    if (this.action) {
      this.actionTimer += dt;
      const progress = this.actionTimer / this.actionDuration;
      const hitPoint = this.action === 'basic' ? 0.39 : this.action === 'nova' ? 0.37 : 0.61;
      if (!this.actionApplied && progress >= hitPoint) this.applyHeroDamage(this.action);
      if (progress >= 1) {
        this.action = null;
        this.actionTimer = 0;
        this.actionApplied = false;
      }
    }

    if (this.bossHp > 0 && this.heroHp > 0) {
      if (this.bossCharge > 0) {
        this.bossCharge += dt / 1.3;
        if (this.bossCharge >= 1) this.resolveBossAttack();
      } else {
        this.bossAttackWait -= dt;
        if (this.bossAttackWait <= 0) this.bossCharge = 0.001;
      }
    }

    if (this.autoBattle && !this.action && this.bossHp > 0 && this.heroHp > 0) {
      const nova = this.skillButtons[0];
      if (nova.remaining <= 0 && this.heroEnergy >= nova.energyCost && this.bossHp / this.bossMaxHp > 0.22) {
        this.trySkill('nova');
      } else if (this.basicCooldown <= 0) {
        this.tryBasicAttack();
      }
    }

    if (this.bossHp <= 0) {
      this.bossDeath += dt;
      if (this.bossDeath > 2.45) this.respawnBoss();
    }

    if (this.heroHp <= 0) {
      this.heroHit += dt;
      if (this.heroHit > 2.2) this.reviveHero();
    }

    this.updateFx(dt);
  }

  private updateFx(dt: number): void {
    this.particles = this.particles
      .map((particle) => {
        const drag = Math.pow(particle.drag, dt * 60);
        return {
          ...particle,
          x: particle.x + particle.vx * dt,
          y: particle.y + particle.vy * dt,
          vx: particle.vx * drag,
          vy: particle.vy * drag + particle.gravity * dt,
          life: particle.life - dt,
        };
      })
      .filter((particle) => particle.life > 0);

    this.damageTexts = this.damageTexts
      .map((text) => ({ ...text, y: text.y - dt * 46, life: text.life - dt }))
      .filter((text) => text.life > 0);

    this.toasts = this.toasts
      .map((toast) => ({ ...toast, life: toast.life - dt }))
      .filter((toast) => toast.life > 0);
  }

  private tryBasicAttack(): void {
    if (this.action || this.basicCooldown > 0 || this.bossHp <= 0 || this.heroHp <= 0) return;
    this.action = 'basic';
    this.actionDuration = 0.48;
    this.actionTimer = 0;
    this.actionApplied = false;
    this.basicCooldown = this.autoBattle ? 0.72 : 0.44;
    this.playAttackSound(false);
  }

  private trySkill(kind: SkillKind): void {
    if (kind !== 'nova' && kind !== 'meteor') return;
    const skill = this.skillButtons.find((item) => item.kind === kind);
    if (!skill || this.action || skill.remaining > 0 || this.heroEnergy < skill.energyCost || this.bossHp <= 0 || this.heroHp <= 0) {
      this.playDeniedSound();
      return;
    }

    this.heroEnergy -= skill.energyCost;
    skill.remaining = skill.cooldown;
    this.action = kind;
    this.actionDuration = kind === 'nova' ? 0.78 : 1.12;
    this.actionTimer = 0;
    this.actionApplied = false;
    this.playAttackSound(true);
  }

  private applyHeroDamage(kind: Exclude<ActionKind, null>): void {
    this.actionApplied = true;
    const criticalChance = kind === 'basic' ? 0.22 : kind === 'nova' ? 0.34 : 0.48;
    const critical = Math.random() < criticalChance;
    const base = kind === 'basic' ? 34 : kind === 'nova' ? 92 : 178;
    const variance = kind === 'basic' ? 14 : kind === 'nova' ? 26 : 44;
    let damage = base + Math.floor(Math.random() * variance);
    if (critical) damage = Math.floor(damage * 1.72);
    damage = Math.floor(damage * (1 + Math.min(this.combo, 12) * 0.018));

    this.bossHp = Math.max(0, this.bossHp - damage);
    this.bossHit = kind === 'meteor' ? 0.48 : 0.3;
    this.combo += 1;
    this.comboLife = 2.5;
    this.hitStop = kind === 'basic' ? 0.045 : kind === 'nova' ? 0.075 : 0.12;
    this.screenShake = kind === 'basic' ? 0.32 : kind === 'nova' ? 0.62 : 1;
    this.worldFlash = kind === 'meteor' ? 0.22 : kind === 'nova' ? 0.1 : 0;

    const { bossX, baseY } = this.getWorldLayout();
    this.damageTexts.push({
      value: damage,
      x: bossX + (Math.random() - 0.5) * 44,
      y: baseY - 142,
      life: critical ? 1.05 : 0.82,
      maxLife: critical ? 1.05 : 0.82,
      critical,
      heal: false,
      label: kind === 'meteor' ? 'STARFALL' : kind === 'nova' ? 'ARC BURST' : undefined,
    });

    const count = kind === 'basic' ? 24 : kind === 'nova' ? 54 : 86;
    const colors = kind === 'meteor' ? ['#ffffff', '#fde68a', '#f97316', '#fb7185'] : WORLD_COLORS;
    this.emitBurst(bossX - 16, baseY - 78, count, colors, kind === 'meteor' ? 360 : kind === 'nova' ? 290 : 210);
    this.playImpactSound(kind, critical);

    if (this.bossHp <= 0) {
      this.kills += 1;
      const rewardGold = 72 + this.bossTier * 18;
      const rewardXp = 96 + this.bossTier * 24;
      this.gold += rewardGold;
      this.xp += rewardXp;
      while (this.xp >= 100) {
        this.xp -= 100;
        this.level += 1;
        this.heroMaxHp += 18;
        this.heroHp = this.heroMaxHp;
      }
      this.toasts.push({
        title: 'ELITE DEFEATED',
        subtitle: `+${rewardXp} XP  •  +${rewardGold} gold  •  Rift core secured`,
        life: 2.6,
        maxLife: 2.6,
        accent: '#fbbf24',
      });
      this.screenShake = 1;
      this.worldFlash = 0.28;
    }
  }

  private resolveBossAttack(): void {
    this.bossCharge = 0;
    this.bossAttackWait = 3.7 + Math.random() * 2.1;
    const { heroX, baseY } = this.getWorldLayout();
    this.screenShake = 0.82;
    this.worldFlash = 0.13;
    this.emitBurst(heroX, baseY - 46, 42, ['#ffffff', '#fb7185', '#c084fc', '#7c3aed'], 260);

    if (this.invulnerable <= 0) {
      const damage = 42 + this.bossTier * 7 + Math.floor(Math.random() * 18);
      this.heroHp = Math.max(0, this.heroHp - damage);
      this.heroFlash = 0.32;
      this.heroHit = 0.42;
      this.invulnerable = 0.48;
      this.damageTexts.push({
        value: damage,
        x: heroX,
        y: baseY - 120,
        life: 0.9,
        maxLife: 0.9,
        critical: false,
        heal: false,
        label: 'VOID STRIKE',
      });
      this.playBossImpactSound();
    }
  }

  private usePotion(): void {
    if (this.potionCooldown > 0 || this.heroHp >= this.heroMaxHp || this.heroHp <= 0) {
      this.playDeniedSound();
      return;
    }
    const heal = Math.min(this.heroMaxHp - this.heroHp, 124);
    this.heroHp += heal;
    this.potionCooldown = 14;
    this.heroFlash = 0.45;
    const { heroX, baseY } = this.getWorldLayout();
    this.damageTexts.push({
      value: heal,
      x: heroX,
      y: baseY - 118,
      life: 1,
      maxLife: 1,
      critical: false,
      heal: true,
      label: 'RESTORED',
    });
    this.emitBurst(heroX, baseY - 52, 34, ['#ffffff', '#bbf7d0', '#4ade80', '#22c55e'], 180);
    this.playHealSound();
  }

  private respawnBoss(): void {
    this.bossTier += 1;
    this.bossMaxHp = Math.floor(920 * (1 + (this.bossTier - 1) * 0.16));
    this.bossHp = this.bossMaxHp;
    this.bossDelayedHp = this.bossMaxHp;
    this.bossDeath = 0;
    this.bossHit = 0;
    this.bossAttackWait = 2.8;
    this.combo = 0;
    this.toasts.push({
      title: `RIFT LEVEL ${this.bossTier}`,
      subtitle: 'The Hollow Warden returns empowered',
      life: 2.5,
      maxLife: 2.5,
      accent: '#c084fc',
    });
  }

  private reviveHero(): void {
    this.heroHp = this.heroMaxHp;
    this.heroEnergy = 100;
    this.heroHit = 0;
    this.invulnerable = 1.4;
    this.toasts.push({
      title: 'SOUL REAWAKENED',
      subtitle: 'Sanctuary protection active',
      life: 2.4,
      maxLife: 2.4,
      accent: '#67e8f9',
    });
  }

  private emitBurst(x: number, y: number, count: number, colors: string[], speed: number): void {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.25 + Math.random() * 0.75);
      const shape: ParticleShape = index % 7 === 0 ? 'ring' : index % 3 === 0 ? 'streak' : 'square';
      this.particles.push({
        x: x + (Math.random() - 0.5) * 22,
        y: y + (Math.random() - 0.5) * 22,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 24,
        life: 0.28 + Math.random() * 0.52,
        maxLife: 0.8,
        size: 2 + Math.random() * 5,
        color: colors[index % colors.length],
        gravity: shape === 'ring' ? 0 : 160,
        drag: shape === 'streak' ? 0.91 : 0.96,
        shape,
      });
    }
  }

  private getWorldLayout(): { heroX: number; bossX: number; baseY: number; scale: number } {
    const compact = this.width < 700;
    return {
      heroX: this.width * (compact ? 0.27 : 0.31),
      bossX: this.width * (compact ? 0.72 : 0.69),
      baseY: this.height * (compact ? 0.68 : 0.7),
      scale: clamp(Math.min(this.width / 980, this.height / 600), compact ? 0.72 : 0.82, 1.16),
    };
  }

  private draw(): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const danger = this.bossCharge > 0 ? this.bossCharge : 0;
    drawBattlefield(ctx, this.width, this.height, this.elapsed, danger);

    const { heroX, bossX, baseY, scale } = this.getWorldLayout();
    const shake = this.screenShake > 0 ? this.screenShake * 8 : 0;
    const shakeX = shake > 0 ? (Math.random() - 0.5) * shake : 0;
    const shakeY = shake > 0 ? (Math.random() - 0.5) * shake : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);

    if (this.bossCharge > 0) {
      drawBossTelegraph(ctx, heroX, baseY + 12, 112 * scale, this.bossCharge);
    }

    const actionProgress = this.action ? clamp(this.actionTimer / this.actionDuration, 0, 1) : 0;
    const basicProgress = this.action === 'basic' ? actionProgress : 0;
    const novaProgress = this.action === 'nova' ? actionProgress : 0;
    const meteorProgress = this.action === 'meteor' ? actionProgress : 0;

    drawHero(ctx, heroX, baseY, scale, this.elapsed, basicProgress, novaProgress, this.heroFlash);
    drawBoss(ctx, bossX, baseY, scale, this.elapsed, this.bossHit, clamp(this.bossDeath / 1.15, 0, 1), this.bossCharge);

    if (this.action === 'basic' && actionProgress > 0.18 && actionProgress < 0.84) {
      drawWeaponTrail(ctx, bossX - 34 * scale, baseY - 73 * scale, scale, (actionProgress - 0.18) / 0.66, false);
    }
    if (this.action === 'nova') {
      drawArcaneNova(ctx, heroX + 30 * scale, baseY - 48 * scale, scale, actionProgress);
    }
    if (this.action === 'meteor') {
      drawMeteor(ctx, bossX, baseY - 18 * scale, scale, meteorProgress);
    }

    this.drawParticles();
    this.drawDamageTexts();
    ctx.restore();

    this.drawVignette();
    this.drawBossHud();
    this.drawPlayerHud();
    this.drawQuestHud();
    this.drawCombatHud();
    this.drawCombo();
    this.drawToasts();

    if (this.worldFlash > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(this.worldFlash * 3.8, 0, 0.7);
      ctx.fillStyle = this.action === 'meteor' ? '#fff7ed' : '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  private drawParticles(): void {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const particle of this.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.strokeStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2.5;
      if (particle.shape === 'streak') {
        ctx.lineWidth = Math.max(1, particle.size * 0.55);
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(particle.x - particle.vx * 0.035, particle.y - particle.vy * 0.035);
        ctx.stroke();
      } else if (particle.shape === 'ring') {
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * (1.6 - alpha * 0.4), 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
      }
    }
    ctx.restore();
  }

  private drawDamageTexts(): void {
    const ctx = this.ctx;
    for (const text of this.damageTexts) {
      const progress = 1 - text.life / text.maxLife;
      const alpha = clamp(text.life * 2.4, 0, 1);
      const scale = text.critical ? 1.2 + Math.sin(progress * Math.PI) * 0.38 : 1 + Math.sin(progress * Math.PI) * 0.14;
      ctx.save();
      ctx.translate(text.x, text.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      if (text.label) {
        drawText(ctx, text.label, 0, -22, {
          size: text.critical ? 11 : 9,
          weight: 950,
          color: text.heal ? '#86efac' : text.critical ? '#fde68a' : '#e2e8f0',
          align: 'center',
          letterSpacing: 1.4,
          shadow: true,
        });
      }
      drawText(ctx, `${text.heal ? '+' : '-'}${text.value}`, 0, 0, {
        size: text.critical ? 34 : 24,
        weight: 950,
        color: text.heal ? '#4ade80' : text.critical ? '#fbbf24' : '#ffffff',
        align: 'center',
        shadow: true,
      });
      ctx.restore();
    }
  }

  private drawVignette(): void {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(this.width / 2, this.height * 0.45, this.width * 0.18, this.width / 2, this.height / 2, this.width * 0.72);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.7, 'rgba(0,0,0,0.1)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.72)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawBossHud(): void {
    const ctx = this.ctx;
    const compact = this.width < 700;
    const width = Math.min(compact ? this.width - 30 : 560, this.width * 0.62);
    const x = (this.width - width) / 2;
    const y = compact ? 18 : 22;

    drawText(ctx, `RIFT ELITE • TIER ${this.bossTier}`, x, y + 12, {
      size: compact ? 9 : 10,
      weight: 950,
      color: '#c4b5fd',
      letterSpacing: 1.6,
      shadow: true,
    });
    drawText(ctx, 'THE HOLLOW WARDEN', x, y + 33, {
      size: compact ? 17 : 20,
      weight: 950,
      color: '#ffffff',
      letterSpacing: compact ? 0.6 : 1.3,
      shadow: true,
    });

    const hpGradient = ctx.createLinearGradient(x, 0, x + width, 0);
    hpGradient.addColorStop(0, '#fb7185');
    hpGradient.addColorStop(0.55, '#ef4444');
    hpGradient.addColorStop(1, '#7c3aed');
    drawBar(
      ctx,
      x,
      y + 43,
      width,
      compact ? 17 : 20,
      this.bossHp / this.bossMaxHp,
      hpGradient,
      `${Math.ceil(this.bossHp).toLocaleString()} / ${this.bossMaxHp.toLocaleString()}`,
      this.bossDelayedHp / this.bossMaxHp,
    );

    if (this.bossCharge > 0) {
      drawText(ctx, 'VOID STRIKE INCOMING', x + width / 2, y + 76, {
        size: 10,
        weight: 950,
        color: this.bossCharge > 0.72 ? '#ffffff' : '#fb7185',
        align: 'center',
        letterSpacing: 1.7,
        shadow: true,
      });
    }
  }

  private drawPlayerHud(): void {
    const ctx = this.ctx;
    const compact = this.width < 700;
    const x = compact ? 14 : 24;
    const y = compact ? 96 : 24;
    const cardW = compact ? 162 : 220;
    const cardH = compact ? 72 : 86;
    drawPanel(ctx, { x, y, w: cardW, h: cardH }, { radius: 18, fill: 'rgba(5, 9, 20, 0.76)', shadow: true });

    const portrait = compact ? 44 : 54;
    const portraitX = x + 12;
    const portraitY = y + (cardH - portrait) / 2;
    const portraitGradient = ctx.createLinearGradient(portraitX, portraitY, portraitX + portrait, portraitY + portrait);
    portraitGradient.addColorStop(0, '#0ea5e9');
    portraitGradient.addColorStop(1, '#312e81');
    roundedRect(ctx, portraitX, portraitY, portrait, portrait, 14);
    ctx.fillStyle = portraitGradient;
    ctx.fill();
    ctx.strokeStyle = '#67e8f9';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    drawText(ctx, 'A', portraitX + portrait / 2, portraitY + portrait / 2 + 2, {
      size: compact ? 22 : 28,
      weight: 950,
      align: 'center',
      baseline: 'middle',
      color: '#ffffff',
      shadow: true,
    });

    const contentX = portraitX + portrait + 10;
    drawText(ctx, `AERON  •  LV ${this.level}`, contentX, y + 23, { size: compact ? 10 : 12, weight: 950, color: '#ffffff' });
    const hpGradient = ctx.createLinearGradient(contentX, 0, x + cardW - 12, 0);
    hpGradient.addColorStop(0, '#4ade80');
    hpGradient.addColorStop(1, '#16a34a');
    drawBar(ctx, contentX, y + 32, cardW - (contentX - x) - 12, compact ? 12 : 14, this.heroHp / this.heroMaxHp, hpGradient);
    const energyGradient = ctx.createLinearGradient(contentX, 0, x + cardW - 12, 0);
    energyGradient.addColorStop(0, '#67e8f9');
    energyGradient.addColorStop(1, '#2563eb');
    drawBar(ctx, contentX, y + (compact ? 50 : 55), cardW - (contentX - x) - 12, compact ? 9 : 11, this.heroEnergy / 100, energyGradient);
    drawText(ctx, `${Math.ceil(this.heroHp)} HP`, contentX, y + cardH - 8, { size: 8, weight: 850, color: '#bbf7d0' });
  }

  private drawQuestHud(): void {
    if (this.width < 780) return;
    const ctx = this.ctx;
    const cardW = 236;
    const x = this.width - cardW - 24;
    const y = 24;
    drawPanel(ctx, { x, y, w: cardW, h: 94 }, { radius: 18, fill: 'rgba(5, 9, 20, 0.72)', shadow: true });
    drawText(ctx, 'ANCIENT RIFT', x + 16, y + 21, { size: 10, weight: 950, color: '#7dd3fc', letterSpacing: 1.3 });
    drawText(ctx, 'Seal the corrupted gate', x + 16, y + 43, { size: 13, weight: 850, color: '#ffffff' });
    drawText(ctx, `${this.kills}/5 elite guardians`, x + 16, y + 63, { size: 10, weight: 700, color: '#94a3b8' });
    drawBar(ctx, x + 16, y + 72, cardW - 32, 9, clamp(this.kills / 5, 0, 1), '#38bdf8');
  }

  private drawCombatHud(): void {
    const ctx = this.ctx;
    const compact = this.width < 700;
    const bottom = compact ? 12 : 18;
    const buttonSize = compact ? 56 : 66;
    const gap = compact ? 8 : 10;
    const barW = buttonSize * 4 + gap * 3 + (compact ? 22 : 32);
    const barH = buttonSize + (compact ? 18 : 24);
    const x = (this.width - barW) / 2;
    const y = this.height - barH - bottom;

    drawPanel(ctx, { x, y, w: barW, h: barH }, { radius: 24, fill: 'rgba(3, 6, 16, 0.84)', stroke: 'rgba(125,211,252,0.16)', shadow: true });

    const buttonY = y + (barH - buttonSize) / 2;
    this.attackButton = { x: x + (compact ? 10 : 14), y: buttonY, w: buttonSize, h: buttonSize };
    this.drawSkillButton(this.attackButton, 'slash', 'SPACE', 'Strike', 0, this.basicCooldown > 0 ? this.basicCooldown / 0.44 : 0, true);

    this.skillButtons.forEach((skill, index) => {
      skill.rect = {
        x: this.attackButton.x + (index + 1) * (buttonSize + gap),
        y: buttonY,
        w: buttonSize,
        h: buttonSize,
      };
      const unavailable = skill.remaining > 0 || this.heroEnergy < skill.energyCost;
      this.drawSkillButton(skill.rect, skill.kind, skill.key, skill.name, skill.remaining, skill.remaining / skill.cooldown, !unavailable);
    });

    this.potionButton = {
      x: this.attackButton.x + 3 * (buttonSize + gap),
      y: buttonY,
      w: buttonSize,
      h: buttonSize,
    };
    this.drawSkillButton(this.potionButton, 'potion', 'F', 'Potion', this.potionCooldown, this.potionCooldown / 14, this.potionCooldown <= 0);

    const autoW = compact ? 72 : 90;
    const autoH = 28;
    this.autoButton = { x: x + barW - autoW - 8, y: y - autoH - 8, w: autoW, h: autoH };
    this.drawAutoButton();

    if (!compact) {
      const infoX = x + barW + 14;
      drawPanel(ctx, { x: infoX, y: y + 8, w: 154, h: barH - 16 }, { radius: 18, fill: 'rgba(3,6,16,0.7)' });
      drawText(ctx, 'LOOT', infoX + 14, y + 30, { size: 9, weight: 950, color: '#94a3b8', letterSpacing: 1.5 });
      drawText(ctx, `${this.gold.toLocaleString()} gold`, infoX + 14, y + 50, { size: 13, weight: 900, color: '#fde68a' });
      drawText(ctx, `${this.xp}/100 XP`, infoX + 14, y + 69, { size: 10, weight: 800, color: '#7dd3fc' });
    }
  }

  private drawSkillButton(
    rect: Rect,
    kind: SkillKind,
    key: string,
    name: string,
    cooldown: number,
    cooldownProgress: number,
    enabled: boolean,
  ): void {
    const ctx = this.ctx;
    const hoverPulse = 0.5 + Math.sin(this.elapsed * 2.5) * 0.5;
    const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    gradient.addColorStop(0, enabled ? 'rgba(30, 64, 175, 0.82)' : 'rgba(30, 41, 59, 0.86)');
    gradient.addColorStop(1, enabled ? 'rgba(15, 23, 42, 0.96)' : 'rgba(2, 6, 23, 0.96)');
    drawPanel(ctx, rect, {
      radius: 16,
      fill: gradient,
      stroke: enabled ? `rgba(103,232,249,${0.25 + hoverPulse * 0.22})` : 'rgba(148,163,184,0.16)',
      glow: enabled && kind === 'meteor' ? 'rgba(249,115,22,0.34)' : undefined,
    });

    ctx.save();
    ctx.globalAlpha = enabled ? 1 : 0.42;
    drawSkillIcon(ctx, kind, rect.x + rect.w / 2, rect.y + rect.h / 2 - 4, rect.w * 0.52, this.elapsed);
    ctx.restore();

    drawText(ctx, key, rect.x + 7, rect.y + 12, { size: 8, weight: 950, color: '#e2e8f0' });
    drawText(ctx, name, rect.x + rect.w / 2, rect.y + rect.h - 7, {
      size: rect.w < 60 ? 7 : 8,
      weight: 900,
      color: '#ffffff',
      align: 'center',
      shadow: true,
    });

    if (cooldownProgress > 0) {
      ctx.save();
      roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 16);
      ctx.clip();
      ctx.fillStyle = 'rgba(2,6,23,0.72)';
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h * clamp(cooldownProgress, 0, 1));
      drawText(ctx, cooldown.toFixed(cooldown < 2 ? 1 : 0), rect.x + rect.w / 2, rect.y + rect.h / 2, {
        size: 18,
        weight: 950,
        align: 'center',
        baseline: 'middle',
        color: '#ffffff',
        shadow: true,
      });
      ctx.restore();
    }
  }

  private drawAutoButton(): void {
    const ctx = this.ctx;
    const active = this.autoBattle;
    drawPanel(ctx, this.autoButton, {
      radius: 14,
      fill: active ? 'rgba(22,163,74,0.86)' : 'rgba(30,41,59,0.9)',
      stroke: active ? 'rgba(134,239,172,0.5)' : 'rgba(148,163,184,0.18)',
      glow: active ? 'rgba(74,222,128,0.22)' : undefined,
    });
    ctx.save();
    ctx.fillStyle = active ? '#86efac' : '#64748b';
    ctx.beginPath();
    ctx.arc(this.autoButton.x + 14, this.autoButton.y + this.autoButton.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    drawText(ctx, active ? 'AUTO ON' : 'AUTO OFF', this.autoButton.x + 25, this.autoButton.y + this.autoButton.h / 2 + 1, {
      size: 9,
      weight: 950,
      color: '#ffffff',
      baseline: 'middle',
    });
  }

  private drawCombo(): void {
    if (this.combo <= 1 || this.comboLife <= 0) return;
    const ctx = this.ctx;
    const alpha = clamp(this.comboLife * 1.5, 0, 1);
    const x = this.width * 0.77;
    const y = this.height * 0.39;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawText(ctx, `${this.combo}x`, x, y, { size: 42, weight: 950, color: '#ffffff', align: 'center', shadow: true });
    drawText(ctx, 'COMBO', x, y + 19, { size: 10, weight: 950, color: '#67e8f9', align: 'center', letterSpacing: 2.4, shadow: true });
    ctx.restore();
  }

  private drawToasts(): void {
    const ctx = this.ctx;
    let offset = 0;
    for (const toast of this.toasts) {
      const progress = 1 - toast.life / toast.maxLife;
      const appear = smoothStep(clamp(progress / 0.12, 0, 1));
      const disappear = smoothStep(clamp(toast.life / 0.35, 0, 1));
      const alpha = appear * disappear;
      const width = Math.min(420, this.width - 32);
      const x = (this.width - width) / 2;
      const y = this.height * 0.2 + offset + (1 - appear) * -16;
      ctx.save();
      ctx.globalAlpha = alpha;
      drawPanel(ctx, { x, y, w: width, h: 62 }, { radius: 18, fill: 'rgba(3,6,16,0.88)', stroke: `${toast.accent}80`, glow: `${toast.accent}38`, shadow: true });
      rectFill(ctx, x + 12, y + 13, 3, 36, toast.accent);
      drawText(ctx, toast.title, x + 28, y + 27, { size: 13, weight: 950, color: '#ffffff', letterSpacing: 1.2 });
      drawText(ctx, toast.subtitle, x + 28, y + 46, { size: 10, weight: 700, color: '#94a3b8' });
      ctx.restore();
      offset += 72;
    }
  }

  private ensureAudio(): void {
    if (this.audioContext) {
      if (this.audioContext.state === 'suspended') void this.audioContext.resume();
      return;
    }
    try {
      this.audioContext = new AudioContext();
    } catch {
      this.audioContext = null;
    }
  }

  private tone(frequency: number, duration: number, type: OscillatorType, gainValue: number, endFrequency?: number): void {
    const audio = this.audioContext;
    if (!audio) return;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audio.currentTime);
    if (endFrequency) oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), audio.currentTime + duration);
    gain.gain.setValueAtTime(gainValue, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start();
    oscillator.stop(audio.currentTime + duration);
  }

  private playAttackSound(skill: boolean): void {
    this.tone(skill ? 280 : 190, skill ? 0.22 : 0.12, 'sawtooth', skill ? 0.035 : 0.022, skill ? 780 : 440);
  }

  private playImpactSound(kind: Exclude<ActionKind, null>, critical: boolean): void {
    const base = kind === 'meteor' ? 74 : kind === 'nova' ? 110 : 145;
    this.tone(base, kind === 'meteor' ? 0.38 : 0.2, 'square', kind === 'meteor' ? 0.06 : 0.038, 42);
    if (critical) this.tone(620, 0.18, 'triangle', 0.022, 980);
  }

  private playBossImpactSound(): void {
    this.tone(92, 0.34, 'sawtooth', 0.05, 38);
  }

  private playHealSound(): void {
    this.tone(420, 0.25, 'sine', 0.03, 820);
    this.tone(620, 0.28, 'triangle', 0.018, 1040);
  }

  private playUiSound(): void {
    this.tone(420, 0.08, 'sine', 0.018, 520);
  }

  private playDeniedSound(): void {
    this.tone(130, 0.1, 'square', 0.012, 94);
  }
}

const rectFill = (
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

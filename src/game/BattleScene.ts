import { GameAssets, loadGameAssets } from './AssetStore';
import { clamp, drawText, lerp, smoothStep } from './core';
import { SpriteAnimator } from './SpriteAnimator';
import { GameHUD, HudAction, HudModel, HudSkill } from './ui/GameHUD';

type CombatAction = 'attack' | 'nova' | 'meteor' | null;
type PanelName = HudModel['openPanel'];

type Effect = {
  animator: SpriteAnimator;
  x: number;
  y: number;
  scale: number;
  life: number;
  duration: number;
  follow?: 'hero' | 'boss';
};

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
};

type DamageNumber = {
  x: number;
  y: number;
  value: number;
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
  color: string;
};

const FULL_HP = 5210;
const FULL_MANA = 1590;

export class BattleScene {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private width = 1280;
  private height = 720;
  private pixelRatio = 1;
  private running = false;
  private lastTime = 0;
  private elapsed = 0;
  private assets: GameAssets | null = null;
  private hud: GameHUD | null = null;
  private heroAnimator: SpriteAnimator | null = null;
  private bossAnimator: SpriteAnimator | null = null;

  private heroHp = FULL_HP;
  private heroMana = FULL_MANA;
  private heroXp = 68400;
  private heroLevel = 52;
  private heroGold = 1243587;
  private heroHitTimer = 0;
  private heroDeathTimer = 0;
  private heroInvulnerability = 0;

  private bossTier = 1;
  private bossMaxHp = 125000;
  private bossHp = 125000;
  private bossDelayedHp = 125000;
  private bossHitTimer = 0;
  private bossDeathTimer = 0;
  private bossAttackWait = 3.8;
  private bossCharge = 0;
  private bossStrikeApplied = false;

  private action: CombatAction = null;
  private actionTimer = 0;
  private actionDuration = 0;
  private actionApplied = false;
  private attackCooldown = 0;
  private novaCooldown = 0;
  private meteorCooldown = 0;
  private potionCooldown = 0;
  private autoBattle = true;
  private openPanel: PanelName = null;
  private combo = 0;
  private comboLife = 0;
  private kills = 0;

  private effects: Effect[] = [];
  private particles: Particle[] = [];
  private damageNumbers: DamageNumber[] = [];
  private toasts: Toast[] = [];
  private logs: string[] = [
    '[System] Welcome to Eternal Rift.',
    '[System] Entered Shadowed Sanctum.',
    '[World] Lyra: LFM for Ancient Crypt.',
    '[System] The Hollow Warden senses your soul.',
  ];
  private loot = [
    { name: 'Void Shard', rarity: 'epic' as const, amount: 2 },
    { name: 'Warden Plate', rarity: 'rare' as const, amount: 1 },
    { name: 'Crimson Potion', rarity: 'common' as const, amount: 14 },
  ];

  private screenShake = 0;
  private hitStop = 0;
  private worldFlash = 0;
  private audio: AudioContext | null = null;

  private readonly onResize = (): void => this.resize();

  private readonly onPointerDown = (event: PointerEvent): void => {
    this.ensureAudio();
    const point = this.pointerToCanvas(event);
    const hudAction = this.hud?.hitTest(point.x, point.y) ?? null;
    if (hudAction) {
      this.handleHudAction(hudAction);
      return;
    }
    if (!this.openPanel && point.y < this.height * 0.82) this.tryAction('attack');
  };

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    if (event.code === 'Space' || ['1', '2', '3', '4'].includes(event.key)) event.preventDefault();
    this.ensureAudio();

    if (event.code === 'Space' || event.key === '1') this.tryAction('attack');
    if (event.key === '2') this.tryAction('nova');
    if (event.key === '3') this.tryAction('meteor');
    if (event.key === '4' || key === 'z') this.usePotion();
    if (key === 'a') this.toggleAuto();
    if (key === 'i') this.togglePanel('inventory');
    if (key === 'k') this.togglePanel('skills');
    if (key === 'g') this.togglePanel('guild');
    if (key === 'q') this.togglePanel('quests');
    if (event.key === 'Escape') this.openPanel = this.openPanel ? null : 'settings';
  };

  constructor(canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas 2D não disponível.');
    this.canvas = canvas;
    this.ctx = ctx;
  }

  async start(): Promise<void> {
    this.running = true;
    this.resize();
    this.canvas.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('resize', this.onResize);
    this.drawLoading(0.1, 'Preparing the rift…');

    try {
      this.assets = await loadGameAssets();
      this.hud = new GameHUD(this.assets);
      this.heroAnimator = new SpriteAnimator(this.assets.heroImage, this.assets.heroMeta, 'idle');
      this.bossAnimator = new SpriteAnimator(this.assets.bossImage, this.assets.bossMeta, 'idle');
      this.toasts.push({
        title: 'SHADOWED SANCTUM',
        subtitle: 'Elite encounter • The Hollow Warden',
        life: 4,
        maxLife: 4,
        color: '#c084fc',
      });
      requestAnimationFrame(this.loop);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown asset error';
      this.drawLoading(1, message, true);
      throw error;
    }
  }

  destroy(): void {
    this.running = false;
    this.canvas.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('resize', this.onResize);
    void this.audio?.close();
  }

  private readonly loop = (time: number): void => {
    if (!this.running || !this.assets || !this.hud || !this.heroAnimator || !this.bossAnimator) return;
    const rawDt = Math.min(0.033, (time - this.lastTime) / 1000 || 0);
    this.lastTime = time;
    this.elapsed += rawDt;

    if (this.hitStop > 0) {
      this.hitStop = Math.max(0, this.hitStop - rawDt);
      this.updateEffects(rawDt * 0.15);
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
    this.ctx.imageSmoothingEnabled = false;
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
    this.novaCooldown = Math.max(0, this.novaCooldown - dt);
    this.meteorCooldown = Math.max(0, this.meteorCooldown - dt);
    this.potionCooldown = Math.max(0, this.potionCooldown - dt);
    this.heroMana = Math.min(FULL_MANA, this.heroMana + dt * 62);
    this.heroHitTimer = Math.max(0, this.heroHitTimer - dt);
    this.heroInvulnerability = Math.max(0, this.heroInvulnerability - dt);
    this.bossHitTimer = Math.max(0, this.bossHitTimer - dt);
    this.screenShake = Math.max(0, this.screenShake - dt * 3.4);
    this.worldFlash = Math.max(0, this.worldFlash - dt * 2.2);
    this.comboLife = Math.max(0, this.comboLife - dt);
    if (this.comboLife <= 0) this.combo = 0;
    this.bossDelayedHp = lerp(this.bossDelayedHp, this.bossHp, clamp(dt * 2.8, 0, 1));

    if (this.action) this.updatePlayerAction(dt);
    if (this.heroHp > 0 && this.bossHp > 0) this.updateBossAttack(dt);

    if (this.autoBattle && !this.action && this.heroHp > 0 && this.bossHp > 0 && !this.openPanel) {
      if (this.novaCooldown <= 0 && this.heroMana >= 280 && this.bossHp / this.bossMaxHp > 0.18) this.tryAction('nova');
      else if (this.attackCooldown <= 0) this.tryAction('attack');
    }

    if (this.bossHp <= 0) {
      this.bossDeathTimer += dt;
      if (this.bossDeathTimer > 2.7) this.respawnBoss();
    }
    if (this.heroHp <= 0) {
      this.heroDeathTimer += dt;
      if (this.heroDeathTimer > 2.8) this.reviveHero();
    }

    this.updateAnimationStates();
    this.heroAnimator?.update(dt);
    this.bossAnimator?.update(dt);
    this.updateEffects(dt);
  }

  private updatePlayerAction(dt: number): void {
    const action = this.action;
    if (!action) return;
    this.actionTimer += dt;
    const progress = this.actionTimer / this.actionDuration;
    const hitPoint = action === 'attack' ? 0.42 : action === 'nova' ? 0.48 : 0.68;
    if (!this.actionApplied && progress >= hitPoint) this.applyPlayerHit(action);
    if (progress >= 1) {
      this.action = null;
      this.actionTimer = 0;
      this.actionApplied = false;
    }
  }

  private updateBossAttack(dt: number): void {
    if (this.bossCharge > 0) {
      this.bossCharge += dt / 1.45;
      if (!this.bossStrikeApplied && this.bossCharge >= 0.78) {
        this.bossStrikeApplied = true;
        this.applyBossHit();
      }
      if (this.bossCharge >= 1) {
        this.bossCharge = 0;
        this.bossStrikeApplied = false;
        this.bossAttackWait = Math.max(2.8, 5.1 - this.bossTier * 0.15) + Math.random() * 1.8;
      }
      return;
    }
    this.bossAttackWait -= dt;
    if (this.bossAttackWait <= 0) {
      this.bossCharge = 0.001;
      this.bossAnimator?.setState('attack', true);
      this.logs.push('[System] Hollow Warden begins casting Void Strike.');
      this.tone(110, 0.45, 'sawtooth', 0.025, 56);
    }
  }

  private updateAnimationStates(): void {
    if (!this.heroAnimator || !this.bossAnimator) return;
    if (this.heroHp <= 0) this.heroAnimator.setState('death');
    else if (this.heroHitTimer > 0) this.heroAnimator.setState('hit');
    else if (this.action === 'attack') this.heroAnimator.setState('attack');
    else if (this.action === 'nova' || this.action === 'meteor') this.heroAnimator.setState('cast');
    else this.heroAnimator.setState('idle');

    if (this.bossHp <= 0) this.bossAnimator.setState('death');
    else if (this.bossHitTimer > 0) this.bossAnimator.setState('hit');
    else if (this.bossCharge > 0) this.bossAnimator.setState('attack');
    else this.bossAnimator.setState('idle');
  }

  private updateEffects(dt: number): void {
    for (const effect of this.effects) {
      effect.life -= dt;
      effect.animator.update(dt);
    }
    this.effects = this.effects.filter((effect) => effect.life > 0);

    this.particles = this.particles
      .map((particle) => ({
        ...particle,
        x: particle.x + particle.vx * dt,
        y: particle.y + particle.vy * dt,
        vy: particle.vy + particle.gravity * dt,
        vx: particle.vx * Math.pow(0.97, dt * 60),
        life: particle.life - dt,
      }))
      .filter((particle) => particle.life > 0);

    this.damageNumbers = this.damageNumbers
      .map((number) => ({ ...number, y: number.y - dt * 52, life: number.life - dt }))
      .filter((number) => number.life > 0);

    this.toasts = this.toasts
      .map((toast) => ({ ...toast, life: toast.life - dt }))
      .filter((toast) => toast.life > 0);
  }

  private tryAction(action: Exclude<CombatAction, null>): void {
    if (this.action || this.heroHp <= 0 || this.bossHp <= 0 || this.openPanel) return;
    if (action === 'attack' && this.attackCooldown > 0) return;
    if (action === 'nova' && (this.novaCooldown > 0 || this.heroMana < 280)) {
      this.denied();
      return;
    }
    if (action === 'meteor' && (this.meteorCooldown > 0 || this.heroMana < 680)) {
      this.denied();
      return;
    }

    this.action = action;
    this.actionTimer = 0;
    this.actionApplied = false;
    if (action === 'attack') {
      this.actionDuration = 0.55;
      this.attackCooldown = this.autoBattle ? 0.72 : 0.48;
      this.spawnEffect('slash', 'boss', 1.05, 0.5);
      this.tone(190, 0.11, 'sawtooth', 0.018, 480);
    } else if (action === 'nova') {
      this.actionDuration = 0.82;
      this.novaCooldown = 5.5;
      this.heroMana -= 280;
      this.spawnEffect('nova', 'hero', 1.15, 0.75);
      this.tone(270, 0.28, 'triangle', 0.028, 880);
    } else {
      this.actionDuration = 1.2;
      this.meteorCooldown = 11;
      this.heroMana -= 680;
      this.spawnEffect('meteor', 'boss', 1.35, 1.15);
      this.tone(360, 0.4, 'sawtooth', 0.026, 80);
    }
  }

  private applyPlayerHit(action: Exclude<CombatAction, null>): void {
    this.actionApplied = true;
    const criticalChance = action === 'attack' ? 0.22 : action === 'nova' ? 0.34 : 0.52;
    const critical = Math.random() < criticalChance;
    const base = action === 'attack' ? 920 : action === 'nova' ? 2480 : 6820;
    const variance = action === 'attack' ? 420 : action === 'nova' ? 900 : 2100;
    let damage = base + Math.floor(Math.random() * variance);
    if (critical) damage = Math.floor(damage * 1.72);
    damage = Math.floor(damage * (1 + Math.min(this.combo, 12) * 0.024));

    this.bossHp = Math.max(0, this.bossHp - damage);
    this.bossHitTimer = action === 'meteor' ? 0.5 : 0.3;
    this.combo += 1;
    this.comboLife = 2.7;
    this.hitStop = action === 'attack' ? 0.045 : action === 'nova' ? 0.075 : 0.12;
    this.screenShake = action === 'attack' ? 0.36 : action === 'nova' ? 0.72 : 1;
    this.worldFlash = action === 'meteor' ? 0.38 : action === 'nova' ? 0.18 : 0.06;

    const { bossX, baseY, worldScale } = this.worldLayout();
    this.damageNumbers.push({
      x: bossX + (Math.random() - 0.5) * 54,
      y: baseY - 150 * worldScale,
      value: damage,
      life: critical ? 1.2 : 0.9,
      maxLife: critical ? 1.2 : 0.9,
      critical,
      heal: false,
      label: action === 'meteor' ? 'STARFALL' : action === 'nova' ? 'ARC NOVA' : critical ? 'CRITICAL!' : undefined,
    });
    this.emitParticles(bossX - 8, baseY - 92 * worldScale, action === 'meteor' ? 70 : action === 'nova' ? 46 : 26, action === 'meteor' ? ['#fff7ed', '#fbbf24', '#f97316', '#fb7185'] : ['#ffffff', '#67e8f9', '#38bdf8', '#c084fc'], action === 'meteor' ? 350 : 240);
    this.logs.push(`[Combat] You hit ${this.bossTier > 1 ? 'Empowered ' : ''}Hollow Warden for ${damage.toLocaleString()} damage${critical ? ' — Critical!' : '.'}`);
    this.tone(action === 'meteor' ? 76 : action === 'nova' ? 112 : 150, action === 'meteor' ? 0.42 : 0.2, 'square', action === 'meteor' ? 0.055 : 0.034, 40);

    if (this.bossHp <= 0) this.onBossDefeated();
  }

  private applyBossHit(): void {
    const { heroX, baseY, worldScale } = this.worldLayout();
    this.screenShake = 0.88;
    this.worldFlash = 0.2;
    this.emitParticles(heroX, baseY - 76 * worldScale, 46, ['#ffffff', '#fb7185', '#c084fc', '#7c3aed'], 280);
    if (this.heroInvulnerability > 0) return;

    const damage = 520 + this.bossTier * 68 + Math.floor(Math.random() * 260);
    this.heroHp = Math.max(0, this.heroHp - damage);
    this.heroHitTimer = 0.42;
    this.heroInvulnerability = 0.55;
    this.damageNumbers.push({
      x: heroX,
      y: baseY - 132 * worldScale,
      value: damage,
      life: 1,
      maxLife: 1,
      critical: false,
      heal: false,
      label: 'VOID STRIKE',
    });
    this.logs.push(`[Combat] Hollow Warden hit you for ${damage.toLocaleString()} damage.`);
    this.tone(92, 0.35, 'sawtooth', 0.05, 38);
  }

  private onBossDefeated(): void {
    this.kills += 1;
    const xpGain = 18500 + this.bossTier * 2200;
    const goldGain = 420 + this.bossTier * 90;
    this.heroXp += xpGain;
    this.heroGold += goldGain;
    while (this.heroXp >= 100000) {
      this.heroXp -= 100000;
      this.heroLevel += 1;
      this.heroHp = FULL_HP;
      this.heroMana = FULL_MANA;
    }
    const rarity = Math.random() > 0.66 ? 'epic' : 'rare';
    const lootName = rarity === 'epic' ? 'Malgrath Soul Fragment' : 'Warden Sigil';
    const existing = this.loot.find((item) => item.name === lootName);
    if (existing) existing.amount += 1;
    else this.loot.unshift({ name: lootName, rarity, amount: 1 });
    this.logs.push(`[Loot] ${lootName} obtained.`);
    this.toasts.push({
      title: 'ELITE DEFEATED',
      subtitle: `+${xpGain.toLocaleString()} XP • +${goldGain} gold • ${lootName}`,
      life: 3.2,
      maxLife: 3.2,
      color: rarity === 'epic' ? '#c084fc' : '#67e8f9',
    });
    this.screenShake = 1;
    this.worldFlash = 0.48;
  }

  private respawnBoss(): void {
    this.bossTier += 1;
    this.bossMaxHp = Math.floor(125000 * (1 + (this.bossTier - 1) * 0.2));
    this.bossHp = this.bossMaxHp;
    this.bossDelayedHp = this.bossMaxHp;
    this.bossDeathTimer = 0;
    this.bossHitTimer = 0;
    this.bossAttackWait = 2.8;
    this.bossCharge = 0;
    this.combo = 0;
    this.bossAnimator?.setState('idle', true);
    this.toasts.push({
      title: `RIFT TIER ${this.bossTier}`,
      subtitle: 'The Hollow Warden returns empowered',
      life: 2.8,
      maxLife: 2.8,
      color: '#c084fc',
    });
  }

  private reviveHero(): void {
    this.heroHp = FULL_HP;
    this.heroMana = FULL_MANA;
    this.heroDeathTimer = 0;
    this.heroInvulnerability = 1.8;
    this.heroAnimator?.setState('idle', true);
    this.toasts.push({
      title: 'SOUL REAWAKENED',
      subtitle: 'Sanctuary protection restored your body',
      life: 2.8,
      maxLife: 2.8,
      color: '#67e8f9',
    });
  }

  private usePotion(): void {
    if (this.potionCooldown > 0 || this.heroHp <= 0 || this.heroHp >= FULL_HP) {
      this.denied();
      return;
    }
    const heal = Math.min(FULL_HP - this.heroHp, 1650);
    this.heroHp += heal;
    this.potionCooldown = 14;
    const potion = this.loot.find((item) => item.name === 'Crimson Potion');
    if (potion && potion.amount > 0) potion.amount -= 1;
    const { heroX, baseY, worldScale } = this.worldLayout();
    this.damageNumbers.push({
      x: heroX,
      y: baseY - 132 * worldScale,
      value: heal,
      life: 1.1,
      maxLife: 1.1,
      critical: false,
      heal: true,
      label: 'RESTORED',
    });
    this.emitParticles(heroX, baseY - 72 * worldScale, 38, ['#ffffff', '#bbf7d0', '#4ade80', '#22c55e'], 190);
    this.logs.push(`[System] Crimson Potion restored ${heal.toLocaleString()} HP.`);
    this.tone(440, 0.25, 'sine', 0.028, 840);
  }

  private spawnEffect(kind: 'slash' | 'nova' | 'meteor', follow: 'hero' | 'boss', scale: number, duration: number): void {
    if (!this.assets) return;
    const animator = new SpriteAnimator(this.assets.effectsImage, this.assets.effectsMeta, kind);
    animator.setState(kind, true);
    const { heroX, bossX, baseY, worldScale } = this.worldLayout();
    const x = follow === 'hero' ? heroX + 18 * worldScale : bossX - 14 * worldScale;
    const y = follow === 'hero' ? baseY - 40 * worldScale : baseY - 48 * worldScale;
    this.effects.push({ animator, x, y, scale: scale * worldScale, life: duration, duration, follow });
  }

  private emitParticles(x: number, y: number, count: number, colors: string[], speed: number): void {
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = speed * (0.25 + Math.random() * 0.75);
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity - 20,
        life: 0.35 + Math.random() * 0.55,
        maxLife: 0.9,
        size: 2 + Math.random() * 5,
        color: colors[index % colors.length],
        gravity: 170,
      });
    }
  }

  private handleHudAction(action: HudAction): void {
    if (action === 'attack') this.tryAction('attack');
    else if (action === 'nova') this.tryAction('nova');
    else if (action === 'meteor') this.tryAction('meteor');
    else if (action === 'potion') this.usePotion();
    else if (action === 'toggle-auto') this.toggleAuto();
    else if (action === 'close-panel') this.openPanel = null;
    else this.togglePanel(action);
  }

  private togglePanel(panel: Exclude<PanelName, null>): void {
    this.openPanel = this.openPanel === panel ? null : panel;
    this.tone(420, 0.07, 'sine', 0.012, 540);
  }

  private toggleAuto(): void {
    this.autoBattle = !this.autoBattle;
    this.logs.push(`[System] Auto Battle ${this.autoBattle ? 'enabled' : 'disabled'}.`);
    this.tone(this.autoBattle ? 560 : 260, 0.08, 'sine', 0.014, this.autoBattle ? 760 : 180);
  }

  private denied(): void {
    this.tone(130, 0.1, 'square', 0.012, 90);
  }

  private worldLayout(): { heroX: number; bossX: number; baseY: number; worldScale: number } {
    const compact = this.width < 900 || this.height < 620;
    const worldScale = clamp(Math.min(this.width / 1280, this.height / 720), compact ? 0.64 : 0.78, 1.24);
    return {
      heroX: this.width * (compact ? 0.3 : 0.34),
      bossX: this.width * (compact ? 0.71 : 0.67),
      baseY: this.height * (compact ? 0.7 : 0.76),
      worldScale,
    };
  }

  private draw(): void {
    if (!this.assets || !this.hud || !this.heroAnimator || !this.bossAnimator) return;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    this.drawBackground(ctx);

    const layout = this.worldLayout();
    const shakePx = this.screenShake * 9;
    const shakeX = shakePx > 0 ? (Math.random() - 0.5) * shakePx : 0;
    const shakeY = shakePx > 0 ? (Math.random() - 0.5) * shakePx : 0;

    ctx.save();
    ctx.translate(shakeX, shakeY);
    this.drawBossTelegraph(ctx, layout);
    this.drawWorldCharacters(ctx, layout);
    this.drawEffects(ctx, layout);
    this.drawParticles(ctx);
    this.drawDamageNumbers(ctx);
    ctx.restore();

    this.drawWorldVignette(ctx);
    this.hud.draw(ctx, this.width, this.height, this.createHudModel());
    this.drawCombo(ctx);
    this.drawToasts(ctx);

    if (this.worldFlash > 0) {
      ctx.save();
      ctx.globalAlpha = clamp(this.worldFlash, 0, 0.72);
      ctx.fillStyle = this.action === 'meteor' ? '#fff7ed' : '#ffffff';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }
  }

  private drawBackground(ctx: CanvasRenderingContext2D): void {
    if (!this.assets) return;
    const image = this.assets.background;
    const scale = Math.max(this.width / image.width, this.height / image.height);
    const dw = image.width * scale;
    const dh = image.height * scale;
    const dx = (this.width - dw) / 2;
    const dy = (this.height - dh) / 2;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(image, dx, dy, dw, dh);

    const danger = this.bossCharge > 0 ? this.bossCharge : 0;
    if (danger > 0) {
      ctx.save();
      ctx.globalAlpha = danger * 0.18;
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let index = 0; index < 28; index += 1) {
      const x = (index * 83 + this.elapsed * (index % 2 === 0 ? 9 : -6)) % (this.width + 40) - 20;
      const y = this.height * (0.3 + ((index * 17) % 36) / 100) + Math.sin(this.elapsed + index) * 8;
      const alpha = 0.18 + Math.sin(this.elapsed * 2 + index) * 0.12;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = index % 3 === 0 ? '#67e8f9' : index % 3 === 1 ? '#c084fc' : '#fbbf24';
      ctx.fillRect(Math.round(x), Math.round(y), index % 7 === 0 ? 3 : 2, index % 7 === 0 ? 3 : 2);
    }
    ctx.restore();
  }

  private drawWorldCharacters(
    ctx: CanvasRenderingContext2D,
    layout: { heroX: number; bossX: number; baseY: number; worldScale: number },
  ): void {
    if (!this.heroAnimator || !this.bossAnimator) return;
    const heroScale = 1.72 * layout.worldScale;
    const bossScale = 1.68 * layout.worldScale;
    const heroFilter = this.heroHitTimer > 0 && Math.floor(this.elapsed * 20) % 2 === 0 ? 'brightness(3) saturate(0)' : 'none';
    const bossFilter = this.bossHitTimer > 0 && Math.floor(this.elapsed * 24) % 2 === 0 ? 'brightness(3) saturate(0)' : 'none';
    const heroAlpha = this.heroHp <= 0 ? clamp(1 - this.heroDeathTimer / 2.5, 0.15, 1) : 1;
    const bossAlpha = this.bossHp <= 0 ? clamp(1 - this.bossDeathTimer / 2.4, 0.12, 1) : 1;

    this.heroAnimator.draw(ctx, layout.heroX, layout.baseY, heroScale, { alpha: heroAlpha, filter: heroFilter });
    this.bossAnimator.draw(ctx, layout.bossX, layout.baseY + 4 * layout.worldScale, bossScale, { alpha: bossAlpha, filter: bossFilter, flipX: true });
  }

  private drawBossTelegraph(
    ctx: CanvasRenderingContext2D,
    layout: { heroX: number; bossX: number; baseY: number; worldScale: number },
  ): void {
    if (this.bossCharge <= 0) return;
    const p = smoothStep(this.bossCharge);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = p > 0.74 ? '#ffffff' : '#fb7185';
    ctx.lineWidth = 3 + p * 4;
    ctx.globalAlpha = 0.35 + p * 0.5;
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -this.elapsed * 42;
    ctx.beginPath();
    ctx.ellipse(layout.heroX, layout.baseY + 7, 106 * layout.worldScale * (0.75 + p * 0.25), 28 * layout.worldScale, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    const gradient = ctx.createRadialGradient(layout.heroX, layout.baseY, 1, layout.heroX, layout.baseY, 120 * layout.worldScale);
    gradient.addColorStop(0, `rgba(251,113,133,${0.12 + p * 0.18})`);
    gradient.addColorStop(1, 'rgba(127,29,29,0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(layout.heroX, layout.baseY + 6, 120 * layout.worldScale, 34 * layout.worldScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawEffects(
    ctx: CanvasRenderingContext2D,
    layout: { heroX: number; bossX: number; baseY: number; worldScale: number },
  ): void {
    for (const effect of this.effects) {
      const x = effect.follow === 'hero' ? layout.heroX + 16 * layout.worldScale : effect.follow === 'boss' ? layout.bossX - 12 * layout.worldScale : effect.x;
      const y = effect.follow === 'hero' ? layout.baseY - 38 * layout.worldScale : effect.follow === 'boss' ? layout.baseY - 48 * layout.worldScale : effect.y;
      const alpha = clamp(effect.life / Math.min(0.25, effect.duration), 0, 1);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      effect.animator.draw(ctx, x, y + 64 * effect.scale, effect.scale, { alpha });
      ctx.restore();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const particle of this.particles) {
      const alpha = clamp(particle.life / particle.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;
      ctx.shadowColor = particle.color;
      ctx.shadowBlur = particle.size * 2;
      ctx.fillRect(Math.round(particle.x), Math.round(particle.y), particle.size, particle.size);
    }
    ctx.restore();
  }

  private drawDamageNumbers(ctx: CanvasRenderingContext2D): void {
    for (const number of this.damageNumbers) {
      const progress = 1 - number.life / number.maxLife;
      const alpha = clamp(number.life * 2.4, 0, 1);
      const scale = number.critical ? 1.15 + Math.sin(progress * Math.PI) * 0.42 : 1 + Math.sin(progress * Math.PI) * 0.16;
      ctx.save();
      ctx.translate(number.x, number.y);
      ctx.scale(scale, scale);
      ctx.globalAlpha = alpha;
      if (number.label) {
        drawText(ctx, number.label, 0, -24, {
          size: number.critical ? 14 : 11,
          weight: 950,
          color: number.heal ? '#86efac' : number.critical ? '#fbbf24' : '#fca5a5',
          align: 'center',
          shadow: true,
          font: 'Georgia, serif',
        });
      }
      drawText(ctx, `${number.heal ? '+' : ''}${number.value.toLocaleString()}${number.critical ? '!' : ''}`, 0, 0, {
        size: number.critical ? 38 : 27,
        weight: 950,
        color: number.heal ? '#4ade80' : number.critical ? '#fbbf24' : '#ffffff',
        align: 'center',
        shadow: true,
        font: 'Georgia, serif',
      });
      ctx.restore();
    }
  }

  private drawWorldVignette(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(this.width / 2, this.height * 0.48, this.width * 0.2, this.width / 2, this.height / 2, this.width * 0.75);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.68, 'rgba(0,0,0,0.08)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.76)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawCombo(ctx: CanvasRenderingContext2D): void {
    if (this.combo <= 1 || this.comboLife <= 0) return;
    const alpha = clamp(this.comboLife * 1.5, 0, 1);
    ctx.save();
    ctx.globalAlpha = alpha;
    drawText(ctx, `${this.combo}x`, this.width * 0.72, this.height * 0.43, {
      size: 44,
      weight: 950,
      color: '#fbbf24',
      align: 'center',
      shadow: true,
      font: 'Georgia, serif',
    });
    drawText(ctx, 'COMBO', this.width * 0.72, this.height * 0.43 + 24, {
      size: 11,
      weight: 950,
      color: '#e0f2fe',
      align: 'center',
      shadow: true,
    });
    ctx.restore();
  }

  private drawToasts(ctx: CanvasRenderingContext2D): void {
    let offset = 0;
    for (const toast of this.toasts) {
      const progress = 1 - toast.life / toast.maxLife;
      const appear = smoothStep(clamp(progress / 0.14, 0, 1));
      const disappear = smoothStep(clamp(toast.life / 0.38, 0, 1));
      const alpha = appear * disappear;
      const w = Math.min(460, this.width - 40);
      const x = (this.width - w) / 2;
      const y = this.height * 0.2 + offset - (1 - appear) * 18;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(3,5,12,0.92)';
      ctx.fillRect(x, y, w, 64);
      ctx.strokeStyle = toast.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, y + 1, w - 2, 62);
      ctx.fillStyle = toast.color;
      ctx.fillRect(x + 9, y + 10, 4, 44);
      drawText(ctx, toast.title, x + 26, y + 27, { size: 15, weight: 950, color: '#ffffff', font: 'Georgia, serif', shadow: true });
      drawText(ctx, toast.subtitle, x + 26, y + 48, { size: 10, weight: 700, color: '#cbd5e1' });
      ctx.restore();
      offset += 74;
    }
  }

  private createHudModel(): HudModel {
    const potion = this.loot.find((item) => item.name === 'Crimson Potion');
    const skills: HudSkill[] = [
      { id: 'attack', icon: 'slash', key: '1', label: 'Arc Slash', cooldown: this.attackCooldown, cooldownMax: 0.72, enabled: this.attackCooldown <= 0 },
      { id: 'nova', icon: 'nova', key: '2', label: 'Arc Nova', cooldown: this.novaCooldown, cooldownMax: 5.5, enabled: this.novaCooldown <= 0 && this.heroMana >= 280 },
      { id: 'meteor', icon: 'meteor', key: '3', label: 'Starfall', cooldown: this.meteorCooldown, cooldownMax: 11, enabled: this.meteorCooldown <= 0 && this.heroMana >= 680 },
      { id: 'potion', icon: 'potion', key: '4', label: 'Potion', cooldown: this.potionCooldown, cooldownMax: 14, enabled: this.potionCooldown <= 0 && this.heroHp < FULL_HP, charges: potion?.amount ?? 0 },
    ];
    return {
      playerName: 'Arthurion',
      level: this.heroLevel,
      hp: this.heroHp,
      maxHp: FULL_HP,
      mana: this.heroMana,
      maxMana: FULL_MANA,
      xp: this.heroXp,
      xpTarget: 100000,
      gold: this.heroGold,
      bossName: 'DREAD SOVEREIGN MALGRATH',
      bossTier: this.bossTier,
      bossHp: this.bossHp,
      bossMaxHp: this.bossMaxHp,
      bossDelayedHp: this.bossDelayedHp,
      bossCharge: this.bossCharge,
      autoBattle: this.autoBattle,
      kills: this.kills,
      combo: this.combo,
      skillPower: 28470 + this.heroLevel * 420,
      openPanel: this.openPanel,
      skills,
      logs: this.logs,
      loot: this.loot,
    };
  }

  private drawLoading(progress: number, label: string, error = false): void {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#070a18');
    gradient.addColorStop(1, '#02030a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);
    drawText(ctx, 'ETERNAL RIFT', this.width / 2, this.height / 2 - 56, {
      size: 34,
      weight: 950,
      color: '#f4e7c0',
      align: 'center',
      font: 'Georgia, serif',
      shadow: true,
    });
    ctx.fillStyle = '#080b12';
    ctx.fillRect(this.width / 2 - 160, this.height / 2, 320, 14);
    ctx.strokeStyle = error ? '#ef4444' : '#7c3aed';
    ctx.strokeRect(this.width / 2 - 160, this.height / 2, 320, 14);
    ctx.fillStyle = error ? '#ef4444' : '#c084fc';
    ctx.fillRect(this.width / 2 - 157, this.height / 2 + 3, 314 * clamp(progress, 0, 1), 8);
    drawText(ctx, label, this.width / 2, this.height / 2 + 43, { size: 12, weight: 700, color: error ? '#fca5a5' : '#94a3b8', align: 'center' });
  }

  private ensureAudio(): void {
    if (this.audio) {
      if (this.audio.state === 'suspended') void this.audio.resume();
      return;
    }
    try {
      this.audio = new AudioContext();
    } catch {
      this.audio = null;
    }
  }

  private tone(frequency: number, duration: number, type: OscillatorType, gainValue: number, endFrequency?: number): void {
    const audio = this.audio;
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
}

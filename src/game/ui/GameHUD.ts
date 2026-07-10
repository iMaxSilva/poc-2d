import type { GameAssets } from '../AssetStore';
import { clamp, drawBar, drawText, pointInRect, Rect, roundedRect } from '../core';

export type HudAction =
  | 'attack'
  | 'nova'
  | 'meteor'
  | 'potion'
  | 'toggle-auto'
  | 'inventory'
  | 'skills'
  | 'guild'
  | 'quests'
  | 'settings'
  | 'close-panel';

export type HudSkill = {
  id: HudAction;
  icon: string;
  key: string;
  label: string;
  cooldown: number;
  cooldownMax: number;
  enabled: boolean;
  charges?: number;
};

export type HudModel = {
  playerName: string;
  level: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  xp: number;
  xpTarget: number;
  gold: number;
  bossName: string;
  bossTier: number;
  bossHp: number;
  bossMaxHp: number;
  bossDelayedHp: number;
  bossCharge: number;
  autoBattle: boolean;
  kills: number;
  combo: number;
  skillPower: number;
  openPanel: 'inventory' | 'skills' | 'guild' | 'quests' | 'settings' | null;
  skills: HudSkill[];
  logs: string[];
  loot: Array<{ name: string; rarity: 'common' | 'rare' | 'epic'; amount: number }>;
};

type HitTarget = { rect: Rect; action: HudAction };

const COLORS = {
  panel: 'rgba(4, 7, 15, 0.92)',
  panelSoft: 'rgba(8, 12, 23, 0.84)',
  gold: '#c98a2a',
  goldBright: '#f6c35b',
  goldDark: '#5f3713',
  border: '#7a4d1f',
  text: '#f4e7c0',
  muted: '#9ba4b4',
};

export class GameHUD {
  private targets: HitTarget[] = [];
  private width = 0;
  private height = 0;
  private compact = false;
  private readonly assets: GameAssets;

  constructor(assets: GameAssets) {
    this.assets = assets;
  }

  hitTest(x: number, y: number): HudAction | null {
    for (let index = this.targets.length - 1; index >= 0; index -= 1) {
      if (pointInRect(x, y, this.targets[index].rect)) return this.targets[index].action;
    }
    return null;
  }

  draw(ctx: CanvasRenderingContext2D, width: number, height: number, model: HudModel): void {
    this.width = width;
    this.height = height;
    this.compact = width < 900 || height < 620;
    this.targets = [];

    this.drawPlayerHud(ctx, model);
    this.drawBossHud(ctx, model);
    this.drawHotbar(ctx, model);

    if (!this.compact) {
      this.drawMapAndQuests(ctx, model);
      this.drawSideMenu(ctx, model);
      this.drawChat(ctx, model);
    } else {
      this.drawCompactQuest(ctx, model);
    }

    if (model.openPanel) this.drawWindow(ctx, model);
  }

  private drawFrame(ctx: CanvasRenderingContext2D, rect: Rect, title?: string, emphasis = false): void {
    ctx.save();
    roundedRect(ctx, rect.x, rect.y, rect.w, rect.h, 5);
    const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    gradient.addColorStop(0, emphasis ? 'rgba(25, 16, 32, 0.97)' : COLORS.panel);
    gradient.addColorStop(1, 'rgba(2, 4, 9, 0.97)');
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#1d120a';
    ctx.stroke();
    roundedRect(ctx, rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4, 4);
    ctx.lineWidth = 1;
    ctx.strokeStyle = emphasis ? '#a855f7' : COLORS.border;
    ctx.stroke();

    this.drawCorner(ctx, rect.x, rect.y, 1, 1);
    this.drawCorner(ctx, rect.x + rect.w, rect.y, -1, 1);
    this.drawCorner(ctx, rect.x, rect.y + rect.h, 1, -1);
    this.drawCorner(ctx, rect.x + rect.w, rect.y + rect.h, -1, -1);

    if (title) {
      const titleW = Math.min(rect.w - 24, Math.max(98, ctx.measureText(title).width + 42));
      const tx = rect.x + (rect.w - titleW) / 2;
      ctx.fillStyle = '#120d09';
      ctx.fillRect(tx, rect.y - 3, titleW, 24);
      ctx.strokeStyle = emphasis ? '#7c3aed' : COLORS.border;
      ctx.strokeRect(tx, rect.y - 3, titleW, 24);
      drawText(ctx, title, rect.x + rect.w / 2, rect.y + 10, {
        size: 13,
        weight: 900,
        color: emphasis ? '#e9d5ff' : COLORS.text,
        align: 'center',
        baseline: 'middle',
        font: 'Georgia, serif',
        shadow: true,
      });
    }
    ctx.restore();
  }

  private drawCorner(ctx: CanvasRenderingContext2D, x: number, y: number, sx: number, sy: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sx, sy);
    ctx.fillStyle = '#3c220e';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(18, 0);
    ctx.lineTo(12, 4);
    ctx.lineTo(4, 12);
    ctx.lineTo(0, 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }

  private drawIcon(ctx: CanvasRenderingContext2D, icon: string, rect: Rect, alpha = 1): void {
    const frame = this.assets.iconsMeta.frames[icon];
    if (!frame) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.assets.iconsImage, frame.x, frame.y, frame.w, frame.h, rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  }

  private drawPlayerHud(ctx: CanvasRenderingContext2D, model: HudModel): void {
    const rect: Rect = this.compact
      ? { x: 10, y: 10, w: Math.min(290, this.width * 0.45), h: 86 }
      : { x: 18, y: 18, w: 350, h: 118 };
    this.drawFrame(ctx, rect);

    const portrait = this.compact ? 66 : 92;
    const px = rect.x + 10;
    const py = rect.y + (rect.h - portrait) / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(px + portrait / 2, py + portrait / 2, portrait / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(this.assets.heroPortrait, px, py, portrait, portrait);
    ctx.restore();
    ctx.strokeStyle = COLORS.goldBright;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(px + portrait / 2, py + portrait / 2, portrait / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();

    const contentX = px + portrait + 12;
    const barW = rect.x + rect.w - contentX - 12;
    drawText(ctx, model.playerName, contentX, rect.y + (this.compact ? 19 : 25), {
      size: this.compact ? 14 : 18,
      weight: 900,
      color: COLORS.text,
      font: 'Georgia, serif',
      shadow: true,
    });
    drawText(ctx, `Lv. ${model.level}`, rect.x + rect.w - 12, rect.y + (this.compact ? 19 : 25), {
      size: this.compact ? 11 : 13,
      weight: 900,
      color: COLORS.goldBright,
      align: 'right',
      shadow: true,
    });

    const hpY = rect.y + (this.compact ? 29 : 39);
    drawBar(ctx, { x: contentX, y: hpY, w: barW, h: this.compact ? 15 : 19 }, model.hp / model.maxHp, ['#ef4444', '#991b1b'], `${Math.ceil(model.hp)} / ${model.maxHp}`);
    drawBar(ctx, { x: contentX, y: hpY + (this.compact ? 20 : 25), w: barW, h: this.compact ? 13 : 17 }, model.mana / model.maxMana, ['#38bdf8', '#1d4ed8'], `${Math.ceil(model.mana)} / ${model.maxMana}`);
    drawBar(ctx, { x: contentX, y: hpY + (this.compact ? 38 : 48), w: barW, h: 8 }, model.xp / model.xpTarget, ['#c084fc', '#6d28d9']);
  }

  private drawBossHud(ctx: CanvasRenderingContext2D, model: HudModel): void {
    const w = this.compact ? Math.min(440, this.width * 0.52) : Math.min(680, this.width * 0.48);
    const h = this.compact ? 70 : 88;
    const x = (this.width - w) / 2;
    const y = this.compact ? 12 : 16;
    this.drawFrame(ctx, { x, y, w, h }, undefined, true);

    const portrait = this.compact ? 50 : 68;
    ctx.drawImage(this.assets.bossPortrait, x + 7, y + (h - portrait) / 2, portrait, portrait);
    ctx.strokeStyle = '#a855f7';
    ctx.strokeRect(x + 7, y + (h - portrait) / 2, portrait, portrait);

    const bx = x + portrait + 18;
    const bw = w - portrait - 31;
    drawText(ctx, model.bossName, bx, y + (this.compact ? 18 : 23), {
      size: this.compact ? 14 : 20,
      weight: 900,
      color: '#e9d5ff',
      font: 'Georgia, serif',
      shadow: true,
    });
    drawText(ctx, `Rift Tier ${model.bossTier}`, x + w - 12, y + (this.compact ? 18 : 23), {
      size: this.compact ? 9 : 11,
      weight: 800,
      color: '#c4b5fd',
      align: 'right',
    });
    drawBar(
      ctx,
      { x: bx, y: y + (this.compact ? 29 : 35), w: bw, h: this.compact ? 17 : 22 },
      model.bossHp / model.bossMaxHp,
      ['#dc2626', '#701a75'],
      `${Math.ceil(model.bossHp).toLocaleString()} / ${model.bossMaxHp.toLocaleString()}`,
      model.bossDelayedHp / model.bossMaxHp,
    );

    if (model.bossCharge > 0) {
      const pulse = 0.65 + Math.sin(performance.now() * 0.02) * 0.35;
      drawText(ctx, 'VOID STRIKE', bx + bw / 2, y + h - 8, {
        size: this.compact ? 9 : 11,
        weight: 950,
        color: model.bossCharge > 0.72 ? '#ffffff' : `rgba(251,113,133,${pulse})`,
        align: 'center',
        shadow: true,
      });
    }
  }

  private drawHotbar(ctx: CanvasRenderingContext2D, model: HudModel): void {
    const slot = this.compact ? 52 : 64;
    const gap = this.compact ? 5 : 7;
    const count = model.skills.length;
    const width = count * slot + (count - 1) * gap + 28;
    const rect: Rect = {
      x: (this.width - width) / 2,
      y: this.height - slot - (this.compact ? 24 : 34),
      w: width,
      h: slot + 18,
    };
    this.drawFrame(ctx, rect);

    model.skills.forEach((skill, index) => {
      const x = rect.x + 14 + index * (slot + gap);
      const y = rect.y + 8;
      const sr: Rect = { x, y, w: slot, h: slot };
      this.drawSkillSlot(ctx, sr, skill);
      this.targets.push({ rect: sr, action: skill.id });
    });

    const autoRect: Rect = {
      x: rect.x + rect.w - (this.compact ? 76 : 92),
      y: rect.y - 31,
      w: this.compact ? 76 : 92,
      h: 28,
    };
    this.drawFrame(ctx, autoRect);
    ctx.fillStyle = model.autoBattle ? '#16a34a' : '#475569';
    ctx.beginPath();
    ctx.arc(autoRect.x + 14, autoRect.y + 14, 4, 0, Math.PI * 2);
    ctx.fill();
    drawText(ctx, model.autoBattle ? 'AUTO ON' : 'AUTO OFF', autoRect.x + 25, autoRect.y + 15, {
      size: 10,
      weight: 900,
      baseline: 'middle',
      color: '#f8fafc',
    });
    this.targets.push({ rect: autoRect, action: 'toggle-auto' });

    const xpRect: Rect = { x: rect.x + 4, y: rect.y + rect.h + 4, w: rect.w - 8, h: 7 };
    drawBar(ctx, xpRect, model.xp / model.xpTarget, ['#84cc16', '#4d7c0f']);
    if (!this.compact) {
      drawText(ctx, `XP ${model.xp.toLocaleString()} / ${model.xpTarget.toLocaleString()}`, rect.x + rect.w / 2, xpRect.y + 15, {
        size: 9,
        weight: 800,
        align: 'center',
        color: '#d9f99d',
        shadow: true,
      });
    }
  }

  private drawSkillSlot(ctx: CanvasRenderingContext2D, rect: Rect, skill: HudSkill): void {
    ctx.save();
    const gradient = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    gradient.addColorStop(0, '#263043');
    gradient.addColorStop(1, '#080b12');
    ctx.fillStyle = gradient;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#120b06';
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.lineWidth = 1;
    ctx.strokeStyle = skill.enabled ? COLORS.gold : '#475569';
    ctx.strokeRect(rect.x + 3, rect.y + 3, rect.w - 6, rect.h - 6);
    this.drawIcon(ctx, skill.icon, { x: rect.x + 7, y: rect.y + 7, w: rect.w - 14, h: rect.h - 14 }, skill.enabled ? 1 : 0.42);

    ctx.fillStyle = '#0b0d12';
    ctx.fillRect(rect.x + 3, rect.y + 3, 20, 16);
    drawText(ctx, skill.key, rect.x + 13, rect.y + 11, {
      size: 9,
      weight: 950,
      align: 'center',
      baseline: 'middle',
      color: COLORS.goldBright,
    });

    if (skill.cooldown > 0) {
      const ratio = clamp(skill.cooldown / skill.cooldownMax, 0, 1);
      ctx.fillStyle = 'rgba(2,4,10,0.72)';
      ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, (rect.h - 6) * ratio);
      drawText(ctx, skill.cooldown.toFixed(skill.cooldown < 2 ? 1 : 0), rect.x + rect.w / 2, rect.y + rect.h / 2, {
        size: 18,
        weight: 950,
        align: 'center',
        baseline: 'middle',
        color: '#ffffff',
        shadow: true,
      });
    }
    if (skill.charges !== undefined) {
      drawText(ctx, String(skill.charges), rect.x + rect.w - 7, rect.y + rect.h - 7, {
        size: 11,
        weight: 950,
        align: 'right',
        color: '#ffffff',
        shadow: true,
      });
    }
    ctx.restore();
  }

  private drawMapAndQuests(ctx: CanvasRenderingContext2D, model: HudModel): void {
    const mapRect: Rect = { x: this.width - 274, y: 18, w: 256, h: 168 };
    this.drawFrame(ctx, mapRect, 'SHADOWED SANCTUM');
    ctx.drawImage(this.assets.minimap, mapRect.x + 12, mapRect.y + 29, mapRect.w - 24, 112);
    drawText(ctx, 'CH. 1', mapRect.x + mapRect.w - 15, mapRect.y + 18, {
      size: 10,
      weight: 900,
      color: COLORS.goldBright,
      align: 'right',
    });
    drawText(ctx, 'PvE • Elite Rift', mapRect.x + 14, mapRect.y + mapRect.h - 10, {
      size: 10,
      weight: 700,
      color: '#94a3b8',
    });

    const questRect: Rect = { x: this.width - 274, y: 196, w: 256, h: 198 };
    this.drawFrame(ctx, questRect, 'ACTIVE QUESTS');
    const lines = [
      { title: 'The Corrupted Crown', body: 'Defeat the Hollow Warden', value: `${Math.min(model.kills, 1)}/1`, color: '#fbbf24' },
      { title: 'A Shattered Legacy', body: 'Collect Ancient Shards', value: `${Math.min(model.kills * 2, 5)}/5`, color: '#67e8f9' },
      { title: 'The Fallen Guard', body: 'Return to Captain Alaric', value: '—', color: '#cbd5e1' },
    ];
    lines.forEach((quest, index) => {
      const y = questRect.y + 38 + index * 51;
      drawText(ctx, quest.title, questRect.x + 14, y, { size: 12, weight: 900, color: quest.color });
      drawText(ctx, `• ${quest.body}`, questRect.x + 18, y + 20, { size: 10, weight: 700, color: '#cbd5e1' });
      drawText(ctx, quest.value, questRect.x + questRect.w - 14, y + 20, { size: 10, weight: 900, color: quest.color, align: 'right' });
      if (index < lines.length - 1) {
        ctx.strokeStyle = 'rgba(148,163,184,0.13)';
        ctx.beginPath();
        ctx.moveTo(questRect.x + 12, y + 31);
        ctx.lineTo(questRect.x + questRect.w - 12, y + 31);
        ctx.stroke();
      }
    });
  }

  private drawCompactQuest(ctx: CanvasRenderingContext2D, model: HudModel): void {
    const rect: Rect = { x: this.width - 166, y: 92, w: 154, h: 54 };
    this.drawFrame(ctx, rect);
    drawText(ctx, 'THE CORRUPTED CROWN', rect.x + 10, rect.y + 18, { size: 8, weight: 950, color: '#fbbf24' });
    drawText(ctx, `Defeat Warden  ${Math.min(model.kills, 1)}/1`, rect.x + 10, rect.y + 38, { size: 9, weight: 700, color: '#e2e8f0' });
  }

  private drawSideMenu(ctx: CanvasRenderingContext2D, model: HudModel): void {
    const items: Array<{ action: HudAction; icon: string; label: string; key: string }> = [
      { action: 'inventory', icon: 'inventory', label: 'Inventory', key: 'I' },
      { action: 'skills', icon: 'skills', label: 'Skills', key: 'K' },
      { action: 'guild', icon: 'guild', label: 'Guild', key: 'G' },
      { action: 'quests', icon: 'quests', label: 'Quests', key: 'Q' },
      { action: 'settings', icon: 'settings', label: 'Settings', key: 'Esc' },
    ];
    const x = this.width - 204;
    const startY = 414;
    items.forEach((item, index) => {
      const rect: Rect = { x, y: startY + index * 55, w: 186, h: 48 };
      const active = model.openPanel === item.action;
      this.drawFrame(ctx, rect, undefined, active);
      this.drawIcon(ctx, item.icon, { x: rect.x + 8, y: rect.y + 8, w: 32, h: 32 });
      drawText(ctx, item.label, rect.x + 48, rect.y + 25, {
        size: 13,
        weight: 900,
        baseline: 'middle',
        color: active ? '#e9d5ff' : COLORS.text,
      });
      drawText(ctx, item.key, rect.x + rect.w - 10, rect.y + 25, {
        size: 10,
        weight: 900,
        baseline: 'middle',
        align: 'right',
        color: COLORS.goldBright,
      });
      this.targets.push({ rect, action: item.action });
    });
  }

  private drawChat(ctx: CanvasRenderingContext2D, model: HudModel): void {
    const rect: Rect = { x: 18, y: this.height - 260, w: 380, h: 224 };
    this.drawFrame(ctx, rect);
    const tabs = ['General', 'Party', 'Guild', 'System'];
    tabs.forEach((tab, index) => {
      const tw = 73;
      const tx = rect.x + 6 + index * (tw + 2);
      ctx.fillStyle = index === 0 ? '#2a1a0d' : '#0a0d14';
      ctx.fillRect(tx, rect.y + 6, tw, 25);
      ctx.strokeStyle = index === 0 ? COLORS.gold : '#334155';
      ctx.strokeRect(tx, rect.y + 6, tw, 25);
      drawText(ctx, tab, tx + tw / 2, rect.y + 19, {
        size: 10,
        weight: 800,
        align: 'center',
        baseline: 'middle',
        color: index === 0 ? COLORS.goldBright : '#94a3b8',
      });
    });

    const visible = model.logs.slice(-8);
    visible.forEach((line, index) => {
      const color = line.includes('Critical') ? '#fbbf24' : line.includes('loot') ? '#c084fc' : line.includes('hit') ? '#fb7185' : '#cbd5e1';
      drawText(ctx, line, rect.x + 10, rect.y + 49 + index * 19, { size: 10, weight: 650, color, maxWidth: rect.w - 20 });
    });
    ctx.fillStyle = '#05070c';
    ctx.fillRect(rect.x + 7, rect.y + rect.h - 30, rect.w - 14, 23);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(rect.x + 7, rect.y + rect.h - 30, rect.w - 14, 23);
    drawText(ctx, 'Press Enter to chat…', rect.x + 15, rect.y + rect.h - 18, { size: 10, weight: 600, color: '#64748b', baseline: 'middle' });
  }

  private drawWindow(ctx: CanvasRenderingContext2D, model: HudModel): void {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.48)';
    ctx.fillRect(0, 0, this.width, this.height);
    const w = Math.min(720, this.width - 40);
    const h = Math.min(520, this.height - 80);
    const rect: Rect = { x: (this.width - w) / 2, y: (this.height - h) / 2, w, h };
    this.drawFrame(ctx, rect, model.openPanel?.toUpperCase(), model.openPanel === 'skills');
    const closeRect: Rect = { x: rect.x + rect.w - 38, y: rect.y + 10, w: 25, h: 25 };
    ctx.fillStyle = '#3f1218';
    ctx.fillRect(closeRect.x, closeRect.y, closeRect.w, closeRect.h);
    ctx.strokeStyle = '#fb7185';
    ctx.strokeRect(closeRect.x, closeRect.y, closeRect.w, closeRect.h);
    drawText(ctx, '×', closeRect.x + closeRect.w / 2, closeRect.y + closeRect.h / 2 + 1, {
      size: 20,
      weight: 900,
      align: 'center',
      baseline: 'middle',
      color: '#fecdd3',
    });
    this.targets.push({ rect: closeRect, action: 'close-panel' });

    if (model.openPanel === 'inventory') this.drawInventoryWindow(ctx, rect, model);
    if (model.openPanel === 'skills') this.drawSkillsWindow(ctx, rect, model);
    if (model.openPanel === 'quests') this.drawQuestWindow(ctx, rect, model);
    if (model.openPanel === 'guild') this.drawGuildWindow(ctx, rect);
    if (model.openPanel === 'settings') this.drawSettingsWindow(ctx, rect, model);
    ctx.restore();
  }

  private drawInventoryWindow(ctx: CanvasRenderingContext2D, rect: Rect, model: HudModel): void {
    drawText(ctx, `Gold: ${model.gold.toLocaleString()}`, rect.x + rect.w - 64, rect.y + 61, {
      size: 13,
      weight: 900,
      color: COLORS.goldBright,
      align: 'right',
    });
    const cols = this.compact ? 5 : 7;
    const slot = Math.min(68, (rect.w - 70) / cols);
    const startX = rect.x + 24;
    const startY = rect.y + 82;
    const loot = model.loot;
    for (let index = 0; index < cols * 4; index += 1) {
      const x = startX + (index % cols) * slot;
      const y = startY + Math.floor(index / cols) * slot;
      ctx.fillStyle = '#080b12';
      ctx.fillRect(x, y, slot - 7, slot - 7);
      ctx.strokeStyle = index < loot.length ? (loot[index].rarity === 'epic' ? '#a855f7' : loot[index].rarity === 'rare' ? '#38bdf8' : '#64748b') : '#263142';
      ctx.strokeRect(x + 1, y + 1, slot - 9, slot - 9);
      if (index < loot.length) {
        const icon = loot[index].rarity === 'epic' ? 'void' : loot[index].rarity === 'rare' ? 'shield' : 'potion';
        this.drawIcon(ctx, icon, { x: x + 8, y: y + 8, w: slot - 23, h: slot - 23 });
        drawText(ctx, String(loot[index].amount), x + slot - 13, y + slot - 13, { size: 10, weight: 950, align: 'right', color: '#ffffff', shadow: true });
      }
    }
    drawText(ctx, 'Recent loot', rect.x + 24, rect.y + rect.h - 98, { size: 12, weight: 900, color: COLORS.text });
    model.loot.slice(0, 3).forEach((item, index) => {
      drawText(ctx, `${item.name} ×${item.amount}`, rect.x + 28, rect.y + rect.h - 72 + index * 20, {
        size: 10,
        weight: 700,
        color: item.rarity === 'epic' ? '#c084fc' : item.rarity === 'rare' ? '#67e8f9' : '#cbd5e1',
      });
    });
  }

  private drawSkillsWindow(ctx: CanvasRenderingContext2D, rect: Rect, model: HudModel): void {
    drawText(ctx, `Combat Power ${model.skillPower.toLocaleString()}`, rect.x + 28, rect.y + 62, { size: 15, weight: 900, color: COLORS.goldBright });
    model.skills.slice(0, 4).forEach((skill, index) => {
      const y = rect.y + 92 + index * 92;
      const row: Rect = { x: rect.x + 24, y, w: rect.w - 48, h: 76 };
      this.drawFrame(ctx, row, undefined, index === 2);
      this.drawIcon(ctx, skill.icon, { x: row.x + 10, y: row.y + 10, w: 56, h: 56 }, skill.enabled ? 1 : 0.45);
      drawText(ctx, skill.label, row.x + 78, row.y + 25, { size: 15, weight: 900, color: index === 2 ? '#fde68a' : '#f8fafc' });
      drawText(ctx, index === 0 ? 'Fast melee strike with arcane edge.' : index === 1 ? 'Expanding burst that damages all enemies.' : index === 2 ? 'Calls a burning star from the rift.' : 'Restores vitality over a short duration.', row.x + 78, row.y + 47, { size: 10, weight: 650, color: '#94a3b8' });
      drawText(ctx, skill.key, row.x + row.w - 18, row.y + row.h / 2, { size: 16, weight: 950, color: COLORS.goldBright, align: 'right', baseline: 'middle' });
    });
  }

  private drawQuestWindow(ctx: CanvasRenderingContext2D, rect: Rect, model: HudModel): void {
    const entries = [
      ['The Corrupted Crown', 'Defeat the Hollow Warden and seal the breach.', `${Math.min(model.kills, 1)}/1`],
      ['A Shattered Legacy', 'Recover five ancient shards from elite enemies.', `${Math.min(model.kills * 2, 5)}/5`],
      ['Sanctum Cartography', 'Map every chamber in the Shadowed Sanctum.', '42%'],
    ];
    entries.forEach((entry, index) => {
      const y = rect.y + 72 + index * 112;
      drawText(ctx, entry[0], rect.x + 30, y, { size: 17, weight: 900, color: index === 0 ? '#fbbf24' : '#67e8f9', font: 'Georgia, serif' });
      drawText(ctx, entry[1], rect.x + 34, y + 29, { size: 11, weight: 650, color: '#cbd5e1' });
      drawText(ctx, entry[2], rect.x + rect.w - 34, y + 29, { size: 13, weight: 900, color: '#f8fafc', align: 'right' });
      drawBar(ctx, { x: rect.x + 34, y: y + 48, w: rect.w - 68, h: 10 }, index === 0 ? Math.min(model.kills, 1) : index === 1 ? Math.min(model.kills * 2, 5) / 5 : 0.42, ['#f59e0b', '#7c3aed']);
    });
  }

  private drawGuildWindow(ctx: CanvasRenderingContext2D, rect: Rect): void {
    drawText(ctx, 'Riftwalkers', rect.x + 30, rect.y + 76, { size: 26, weight: 900, color: COLORS.goldBright, font: 'Georgia, serif' });
    drawText(ctx, 'Guild Level 18 • 27/40 members', rect.x + 31, rect.y + 101, { size: 11, weight: 700, color: '#94a3b8' });
    const members = ['Aeron — Vanguard', 'Lyra — Arcanist', 'Kaelthas — Ranger', 'Mira — Cleric', 'Torren — Guardian'];
    members.forEach((member, index) => {
      const y = rect.y + 146 + index * 50;
      ctx.fillStyle = index % 2 === 0 ? 'rgba(30,41,59,0.45)' : 'rgba(15,23,42,0.35)';
      ctx.fillRect(rect.x + 26, y - 25, rect.w - 52, 38);
      ctx.fillStyle = index < 3 ? '#4ade80' : '#64748b';
      ctx.beginPath();
      ctx.arc(rect.x + 43, y - 6, 4, 0, Math.PI * 2);
      ctx.fill();
      drawText(ctx, member, rect.x + 58, y - 3, { size: 12, weight: 800, color: '#e2e8f0' });
      drawText(ctx, index < 3 ? 'Online' : 'Offline', rect.x + rect.w - 42, y - 3, { size: 10, weight: 700, color: index < 3 ? '#86efac' : '#64748b', align: 'right' });
    });
  }

  private drawSettingsWindow(ctx: CanvasRenderingContext2D, rect: Rect, model: HudModel): void {
    const settings = [
      ['Auto Battle', model.autoBattle ? 'Enabled' : 'Disabled'],
      ['Pixel Scaling', 'Nearest Neighbor'],
      ['Combat Numbers', 'Detailed'],
      ['Screen Shake', 'High'],
      ['Audio', 'Procedural SFX'],
    ];
    settings.forEach((setting, index) => {
      const y = rect.y + 88 + index * 62;
      drawText(ctx, setting[0], rect.x + 34, y, { size: 14, weight: 900, color: '#e2e8f0' });
      drawText(ctx, setting[1], rect.x + rect.w - 34, y, { size: 12, weight: 800, color: index === 0 && model.autoBattle ? '#86efac' : COLORS.goldBright, align: 'right' });
      ctx.strokeStyle = 'rgba(148,163,184,0.15)';
      ctx.beginPath();
      ctx.moveTo(rect.x + 30, y + 20);
      ctx.lineTo(rect.x + rect.w - 30, y + 20);
      ctx.stroke();
    });
  }
}

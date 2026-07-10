export type AnimationDefinition = {
  row: number;
  frames: number;
  fps: number;
  loop: boolean;
};

export type SpriteSheetMeta = {
  frameWidth: number;
  frameHeight: number;
  animations: Record<string, AnimationDefinition>;
};

export type IconAtlasMeta = {
  frames: Record<string, { x: number; y: number; w: number; h: number }>;
};

const HERO_META: SpriteSheetMeta = {
  frameWidth: 96,
  frameHeight: 112,
  animations: {
    idle: { row: 0, frames: 8, fps: 8, loop: true },
    attack: { row: 1, frames: 8, fps: 12, loop: true },
    cast: { row: 2, frames: 8, fps: 12, loop: true },
    hit: { row: 3, frames: 8, fps: 12, loop: true },
    death: { row: 4, frames: 8, fps: 12, loop: false },
  },
};

const BOSS_META: SpriteSheetMeta = {
  frameWidth: 160,
  frameHeight: 176,
  animations: {
    idle: { row: 0, frames: 8, fps: 8, loop: true },
    attack: { row: 1, frames: 8, fps: 12, loop: true },
    hit: { row: 2, frames: 8, fps: 12, loop: true },
    death: { row: 3, frames: 8, fps: 12, loop: false },
  },
};

const EFFECTS_META: SpriteSheetMeta = {
  frameWidth: 128,
  frameHeight: 128,
  animations: {
    slash: { row: 0, frames: 8, fps: 16, loop: false },
    nova: { row: 1, frames: 8, fps: 16, loop: false },
    meteor: { row: 2, frames: 8, fps: 16, loop: false },
  },
};

const ICON_NAMES = ['slash', 'nova', 'meteor', 'potion', 'inventory', 'skills', 'guild', 'quests', 'settings', 'shield', 'fire', 'void'];
const ICONS_META: IconAtlasMeta = {
  frames: Object.fromEntries(ICON_NAMES.map((name, index) => [name, { x: index * 64, y: 0, w: 64, h: 64 }])),
};

const assetUrl = (path: string): string => new URL(path, document.baseURI).toString();

const loadImage = (path: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Falha ao carregar asset: ${path}`));
    image.src = assetUrl(path);
  });

export type GameAssets = {
  background: HTMLImageElement;
  heroImage: HTMLImageElement;
  heroMeta: SpriteSheetMeta;
  bossImage: HTMLImageElement;
  bossMeta: SpriteSheetMeta;
  effectsImage: HTMLImageElement;
  effectsMeta: SpriteSheetMeta;
  iconsImage: HTMLImageElement;
  iconsMeta: IconAtlasMeta;
  heroPortrait: HTMLImageElement;
  bossPortrait: HTMLImageElement;
  minimap: HTMLImageElement;
};

export const loadGameAssets = async (): Promise<GameAssets> => {
  const [background, heroImage, bossImage, effectsImage, iconsImage, heroPortrait, bossPortrait, minimap] = await Promise.all([
    loadImage('assets/backgrounds/shadowed-sanctum.png'),
    loadImage('assets/characters/hero.png'),
    loadImage('assets/characters/boss.png'),
    loadImage('assets/effects/combat.png'),
    loadImage('assets/ui/icons.png'),
    loadImage('assets/ui/hero-portrait.png'),
    loadImage('assets/ui/boss-portrait.png'),
    loadImage('assets/ui/minimap.png'),
  ]);

  return {
    background,
    heroImage,
    heroMeta: HERO_META,
    bossImage,
    bossMeta: BOSS_META,
    effectsImage,
    effectsMeta: EFFECTS_META,
    iconsImage,
    iconsMeta: ICONS_META,
    heroPortrait,
    bossPortrait,
    minimap,
  };
};

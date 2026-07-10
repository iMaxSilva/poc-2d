# Eternal Rift — Pixel MMORPG Vertical Slice

Uma vertical slice jogável de MMORPG 2D em pixel art para web e mobile, construída com TypeScript, Canvas 2D e Vite.

A versão 2 abandona personagens desenhados diretamente por código e passa a usar um pipeline de assets real, com spritesheets SVG versionados, animações por estado, efeitos separados e uma interface completa de jogo inspirada na leitura visual dos MMORPGs 2D clássicos — sem copiar assets, personagens ou identidade de terceiros.

## Destaques da versão 2

### Sprites e animações

- Herói com spritesheet dedicado para `idle`, `attack`, `cast`, `hit` e `death`.
- Chefe com `idle`, `attack`, `hit` e `death`.
- Efeitos em spritesheet próprio para `slash`, `nova` e `meteor`.
- Renderização nearest-neighbor para preservar a leitura pixel art.
- Sistema genérico `SpriteAnimator`, desacoplado da lógica de combate.
- Assets locais e versionados, sem dependência de CDN.

### UI de MMORPG

- HUD do personagem com retrato, nível, HP, mana e XP.
- Barra central de chefe com tier, HP atrasado e telegraph de ataque.
- Minimap e identificação da área.
- Quest tracker e janela completa de quests.
- Chat/combat log.
- Hotbar com cooldowns, teclas, cargas e Auto Battle.
- Menu lateral de Inventory, Skills, Guild, Quests e Settings.
- Janelas interativas para cada seção.
- Layout reduzido e adaptado em telas menores.

### Combate

- Ataque básico `Arc Slash`.
- Skill `Arc Nova`.
- Ultimate `Starfall`.
- Poção de cura com quantidade de itens.
- Auto Battle.
- Combo, críticos, partículas, hit stop, flashes e screen shake.
- Ataque do boss com telegraph visual.
- Progressão de tier, XP, gold, level-up e loot.
- SFX procedural via Web Audio API.

## Controles

| Ação | Tecla |
|---|---|
| Ataque básico | `Space` ou `1` |
| Arc Nova | `2` |
| Starfall | `3` |
| Poção | `4` ou `Z` |
| Auto Battle | `A` |
| Inventário | `I` |
| Skills | `K` |
| Guild | `G` |
| Quests | `Q` |
| Configurações/fechar | `Esc` |

Todos os controles principais também funcionam por toque/clique.

## Executar localmente

```bash
npm install
npm run dev
```

## Validar e gerar build

```bash
npm run typecheck
npm run build
npm run preview
```

## Assets entregues

```text
public/assets/
├── backgrounds/shadowed-sanctum.svg
├── characters/
│   ├── hero.svg
│   └── boss.svg
├── effects/combat.svg
└── ui/
    ├── icons.svg
    ├── hero-portrait.svg
    ├── boss-portrait.svg
    └── minimap.svg
```

Os SVGs usam dimensões fixas e coordenadas inteiras, funcionando como spritesheets convencionais no Canvas. O gerador determinístico está em `scripts/generate_assets.py` e a especificação completa em `docs/ART-PIPELINE.md`.

## Estrutura

```text
src/game/AssetStore.ts          carregamento dos SVGs e metadados
src/game/SpriteAnimator.ts      runtime genérica de spritesheet
src/game/BattleScene.ts         combate, estados, boss AI e efeitos
src/game/ui/GameHUD.ts          HUD e janelas de MMORPG
src/game/core.ts                primitivas de desenho e layout
scripts/generate_assets.py      regeneração determinística dos assets
docs/ART-PIPELINE.md            dimensões, estados e validação
```

## GitHub Pages

O workflow `.github/workflows/pages.yml` executa typecheck, build e deploy quando a branch `main` é atualizada.

Na primeira publicação, selecione **Settings → Pages → Source → GitHub Actions**.

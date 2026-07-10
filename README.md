# Eternal Rift — 2D Pixel MMORPG Combat Vertical Slice

Uma vertical slice jogável de combate MMORPG 2D para web e mobile, construída com TypeScript, Canvas 2D e Vite.

A POC foi redesenhada para demonstrar direção de arte pixelizada, feedback de combate, skills, boss encounter, HUD responsivo e publicação estática no GitHub Pages sem dependências de runtime.

## Jogabilidade

- **Ataque básico:** toque na arena ou use `Space`.
- **Arc Nova:** use `Q` ou toque no ícone azul.
- **Starfall:** use `R` ou toque no ícone de meteoro.
- **Poção:** use `F` ou toque no frasco.
- **Auto Battle:** use o botão `AUTO` para alternar o combate automático.

## O que está incluído

### Direção visual

- Herói procedural em pixel art com silhueta, armadura, capa, espada arcana e animações secundárias.
- Chefe autoral **The Hollow Warden**, com aura, núcleo corrompido, chifres, reação a dano, morte e progressão por tiers.
- Cenário em múltiplos planos com lua, montanhas, névoa, portal, ruínas, estrelas, partículas ambientais e foreground.
- Paleta própria baseada em azul arcano, violeta corrompido, dourado e contraste profundo.

### Combate e efeitos

- Ataque básico, skill radial e ultimate de meteoro.
- Cooldowns, energia, poção, combo e progressão de nível.
- Boss attack com telegraph visível e janela de antecipação.
- Hit stop, screen shake, flashes, trilhas de arma e partículas com física simples.
- Números de dano, críticos, cura, barra de vida atrasada e mensagens de encontro.
- Feedback sonoro procedural via Web Audio API após a primeira interação.

### UI/UX

- HUD de personagem com HP, energia e nível.
- Barra de chefe com tier, vida numérica e telegraph de perigo.
- Quest tracker, loot, XP, combo e barra de skills.
- Layout adaptativo para desktop, tablet, mobile e orientação portrait/landscape.
- Áreas de toque grandes e controles de teclado equivalentes.

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

O build estático é criado em `dist/`.

## GitHub Pages

O repositório inclui `.github/workflows/pages.yml`. Cada push na branch `main` executa o build e publica o conteúdo de `dist/` no GitHub Pages.

Caso seja a primeira publicação, selecione em **Settings → Pages → Source** a opção **GitHub Actions**.

## Estrutura principal

```text
src/main.ts                    bootstrap da aplicação
src/styles.css                 shell responsivo e adaptação mobile
src/game/BattleScene.ts        loop, combate, boss AI, HUD, input, áudio e FX
src/game/pixelSprites.ts       cenário, herói, chefe, armas, skills e ícones
src/game/core.ts               primitivas de desenho, easing, painéis e barras
docs/VISUAL-OVERHAUL.md        direção visual e princípios de feedback
.github/workflows/pages.yml    build e deploy no GitHub Pages
```

## Escopo técnico

Esta versão usa Canvas 2D procedural para manter o repositório leve e permitir iteração rápida. A arquitetura pode posteriormente ser migrada para spritesheets e cenas nativas de LayaAir, Phaser, PixiJS, Godot ou outra engine sem alterar os princípios de gameplay e direção visual definidos nesta vertical slice.

# Eternal Rift — Asset Pipeline

## Objetivo

Os assets visuais usados pelo runtime ficam versionados em `public/assets`. O jogo não depende de CDN, links temporários ou geração durante o deploy do GitHub Pages.

## Formato

A versão atual utiliza SVG com coordenadas inteiras e `shape-rendering="crispEdges"`. O Canvas renderiza os arquivos com `imageSmoothingEnabled = false`, preservando a estética pixel art em diferentes resoluções.

## Spritesheets

| Asset | Dimensão | Grid |
|---|---:|---|
| `characters/hero.svg` | 768×560 | 8 colunas × 5 estados; frame 96×112 |
| `characters/boss.svg` | 1280×704 | 8 colunas × 4 estados; frame 160×176 |
| `effects/combat.svg` | 1024×384 | 8 colunas × 3 efeitos; frame 128×128 |
| `ui/icons.svg` | 768×64 | 12 ícones; frame 64×64 |

## Estados

Herói: `idle`, `attack`, `cast`, `hit`, `death`.

Chefe: `idle`, `attack`, `hit`, `death`.

Efeitos: `slash`, `nova`, `meteor`.

## Assets independentes

- `backgrounds/shadowed-sanctum.svg`
- `ui/hero-portrait.svg`
- `ui/boss-portrait.svg`
- `ui/minimap.svg`

## Validação

1. Confirme que os oito caminhos usados por `AssetStore.ts` existem.
2. Valide que os SVGs são XML bem-formado.
3. Execute `npm run typecheck`.
4. Execute `npm run build`.
5. Confirme que o diretório `dist/assets` contém os oito arquivos.

O workflow de GitHub Pages executa typecheck e build em todo push na `main`.

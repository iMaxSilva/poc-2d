# POC 2D Pixel Art Idle MMORPG Battle Demo

Demo jogável 2D web/mobile para validar combate idle/MMORPG com direção de arte própria em pixel art.

Stack da POC:

- LayaAir/Layabox-oriented project structure (`src`, `assets`, TypeScript)
- Web build estático hospedável em GitHub Pages, Netlify, Vercel ou Cloudflare Pages
- Sem backend nesta primeira versão; o combate é client-side apenas para validar UX, animação e direção visual

## Rodar local

```bash
npm install
npm run dev
```

Abra o endereço exibido pelo Vite.

## Build estático

```bash
npm run build
npm run preview
```

O build sai em `dist/`.

## Deploy rápido

### GitHub Pages

Configure Pages para publicar via GitHub Actions. Este repo já inclui workflow em `.github/workflows/pages.yml`.

### Netlify/Vercel/Cloudflare Pages

- Build command: `npm run build`
- Output directory: `dist`

## Demo incluída

- Herói espadachim 2D pixel art com idle, ataque e hit flash
- Arma desenhada: espada curta com lâmina mágica azul
- Armadura desenhada: azul escura, prata e detalhes dourados
- Monstro autoral 2D pixel art: criatura corrompida da floresta, com olho roxo, chifres/galhos, garras e fogo do vazio
- Cenário pixel art de floresta/ruínas, com camadas, chão em blocos e partículas
- Barra de HP, dano flutuante, XP/gold popup e auto battle
- Runtime Canvas TypeScript com arquitetura separada em entidades/cena/HUD

## Arquivos principais

```text
src/game/BattleScene.ts     # loop, combate, input e HUD
src/game/pixelSprites.ts    # herói, arma, armadura, monstro, FX e cenário pixel art
src/game/studioSprites.ts   # shim para manter compatibilidade, agora reexporta pixelSprites
src/game/core.ts            # primitivas de canvas, easing, barras e hit testing
```

## Observação sobre LayaAir

A estrutura segue uma organização compatível com um projeto LayaAir-oriented: `assets` para recursos e `src` para código TypeScript. Esta POC inclui uma runtime web leve para garantir que você consiga hospedar e testar imediatamente. A próxima etapa é abrir no LayaAir IDE e trocar o renderer `CanvasRuntime` por cenas/nodes nativos do LayaAir, mantendo a mesma organização de entidades (`Player`, `Monster`, `BattleScene`, `FX`, `HUD`).

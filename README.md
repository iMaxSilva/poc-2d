# POC 2D Idle MMORPG Battle Demo

Demo jogável 2D web/mobile para validar um combate idle/MMORPG com direção de arte própria.

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

- Herói espadachim 2D com idle, caminhada, ataque e hit flash
- Monstro 2D com idle, hit, morte e respawn
- Fundo fantasy com parallax, partículas, névoa e leitura mobile
- Barra de HP, dano flutuante, XP/gold popup e auto battle
- Runtime Canvas TypeScript com arquitetura separada em entidades/cena/HUD

## Observação sobre LayaAir

A estrutura segue uma organização compatível com um projeto LayaAir-oriented: `assets` para recursos e `src` para código TypeScript. Esta POC inclui uma runtime web leve para garantir que você consiga hospedar e testar imediatamente. A próxima etapa é abrir no LayaAir IDE e trocar o renderer `CanvasRuntime` por cenas/nodes nativos do LayaAir, mantendo a mesma organização de entidades (`Player`, `Monster`, `BattleScene`, `FX`, `HUD`).

# LayaAir / Layabox integration notes

Esta POC está organizada para migrar diretamente para LayaAir/Layabox sem reescrever a lógica de gameplay.

## Estado atual

A demo usa uma runtime Canvas 2D leve para garantir que o deploy web funcione imediatamente em GitHub Pages, Netlify, Vercel e Cloudflare Pages.

A arquitetura já separa:

- `BattleScene`: loop, estado de combate, input e HUD
- `studioSprites`: desenho/arte procedural do herói, monstro, FX e cenário
- `core`: primitivas de renderização, barras, easing e hit testing

## Como portar para LayaAir

1. Criar projeto no LayaAir IDE.
2. Copiar `src/game` e manter as entidades/lógica de combate.
3. Trocar o renderer Canvas por nodes nativos do LayaAir:
   - `Sprite` para herói, monstro, FX e UI
   - `Graphics` para desenho vetorial/procedural
   - `Timer.frameLoop` ou loop da cena para update
   - `Stage` para resize/scale mode
4. Transformar os desenhos procedurais em sprite sheets quando a direção visual estiver aprovada.
5. Manter a mesma regra: dano, cooldown e drop serão validados no backend na versão real.

## Por que esta POC não começa com asset binário

Para acelerar o teste, todos os sprites são desenhados por código. Isso evita dependência de PNGs grandes e permite testar imediatamente no navegador. Depois que o estilo for aprovado, o caminho natural é exportar:

- `hero_idle.png`
- `hero_attack.png`
- `monster_idle.png`
- `monster_hit.png`
- `monster_death.png`
- `slash_fx.png`
- `forest_battle_bg.png`

## Próxima etapa recomendada

Fazer uma segunda PR com um projeto criado pelo LayaAir IDE, mantendo esta POC como baseline visual e funcional.

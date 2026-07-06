# LayaAir / Layabox integration notes

Esta POC está organizada para migrar diretamente para LayaAir/Layabox sem reescrever a lógica de gameplay.

## Estado atual

A demo usa uma runtime Canvas 2D leve para garantir que o deploy web funcione imediatamente em GitHub Pages, Netlify, Vercel e Cloudflare Pages.

A arquitetura já separa:

- `BattleScene`: loop, estado de combate, input e HUD
- `pixelSprites`: herói, espada, armadura, monstro, FX e cenário em pixel art 2D
- `studioSprites`: shim de compatibilidade, agora reexporta `pixelSprites`
- `core`: primitivas de renderização, barras, easing e hit testing

## Como portar para LayaAir

1. Criar projeto no LayaAir IDE.
2. Copiar `src/game` e manter as entidades/lógica de combate.
3. Trocar o renderer Canvas por nodes nativos do LayaAir:
   - `Sprite` para herói, monstro, FX e UI
   - `Graphics` para desenho pixel/procedural ou `Texture` para sprite sheets PNG
   - `Timer.frameLoop` ou loop da cena para update
   - `Stage` para resize/scale mode
4. Exportar os sprites atuais para sprite sheets quando a direção visual estiver aprovada.
5. Manter a mesma regra: dano, cooldown e drop serão validados no backend na versão real.

## Por que esta POC ainda não usa PNG binário no repo

Os sprites desta revisão são desenhados em código para manter a POC leve, versionável e testável imediatamente no navegador. A direção visual agora é 2D pixel art real: herói com armadura/espada, monstro autoral corrompido, FX pixelado e cenário de ruínas.

Quando a arte for aprovada, o caminho natural é exportar:

- `hero_idle.png`
- `hero_attack.png`
- `hero_hurt.png`
- `monster_idle.png`
- `monster_hit.png`
- `monster_death.png`
- `slash_fx.png`
- `forest_battle_bg.png`

## Próxima etapa recomendada

Fazer uma segunda PR com sprite sheets PNG reais gerados/exportados e um projeto criado pelo LayaAir IDE, mantendo esta POC como baseline visual e funcional.

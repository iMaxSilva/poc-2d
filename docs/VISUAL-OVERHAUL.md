# Visual Overhaul — MMORPG 2D Pixel Art

Este documento registra a nova direção visual da POC.

## Objetivo

Transformar a demonstração em uma vertical slice de combate com leitura imediata, silhuetas fortes, impacto visual e boa adaptação entre desktop e mobile.

## Pilares

- Pixel art procedural com resolução visual consistente.
- Personagem com silhueta heroica, arma luminosa e animações secundárias.
- Inimigo chefe com múltiplas camadas, telegraph e efeitos de corrupção.
- Skills com cooldown, partículas, ondas de choque, screen shake e hit stop.
- HUD inspirado em action RPG/MMORPG, com hierarquia clara e áreas seguras para toque.
- Cenário em múltiplos planos com parallax, iluminação, névoa e partículas ambientais.

## Paleta

- Fundo profundo: `#070913`, `#0b1020`, `#121b35`
- Azul arcano: `#67e8f9`, `#38bdf8`, `#2563eb`
- Violeta corrompido: `#c084fc`, `#7c3aed`, `#4c1d95`
- Dourado: `#fbbf24`, `#f59e0b`
- Vida: `#22c55e`
- Perigo: `#fb7185`, `#ef4444`

## Arquitetura de feedback

Cada golpe relevante combina pelo menos quatro sinais:

1. Antecipação da pose.
2. Trilha luminosa da arma ou skill.
3. Hit stop curto e screen shake.
4. Partículas, flash, número de dano e reação do inimigo.

## Responsividade

- Desktop: HUD superior completo e barra de skills centralizada.
- Mobile: controles maiores, painéis reduzidos e tipografia condensada.
- O canvas preserva a composição em qualquer proporção sem deformar os personagens.

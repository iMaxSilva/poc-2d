#!/usr/bin/env python3
"""Regenerate Eternal Rift's deterministic SVG asset pack."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
BOB = [0, 1, 2, 1, 0, -1, -2, -1]


def write(path: str, value: str) -> None:
    target = ASSETS / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(value, encoding="utf-8")


def wrap(width: int, height: int, body: str, defs: str = "") -> str:
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" shape-rendering="crispEdges"><defs>{defs}</defs>{body}</svg>'


def hero() -> str:
    defs = '''<g id="body"><ellipse cx="48" cy="96" rx="22" ry="8" fill="#02040a" opacity=".5"/><path d="M30 84 48 56 67 84 61 101H35Z" fill="#0f172a"/><path d="M35 77 48 60 61 77 57 92H39Z" fill="#1d4ed8"/><rect x="38" y="55" width="20" height="25" fill="#334155"/><rect x="41" y="59" width="14" height="18" fill="#94a3b8"/><circle cx="48" cy="43" r="12" fill="#e2e8f0"/><path d="M36 43 48 27 60 43Z" fill="#0f172a"/><rect x="37" y="38" width="22" height="9" fill="#1e3a8a"/><rect x="33" y="46" width="30" height="5" fill="#38bdf8"/><rect x="44" y="39" width="3" height="3" fill="#67e8f9"/><rect x="52" y="39" width="3" height="3" fill="#67e8f9"/><rect x="37" y="82" width="8" height="20" fill="#1e293b"/><rect x="52" y="82" width="8" height="20" fill="#1e293b"/><rect x="34" y="99" width="14" height="6" fill="#0f172a"/><rect x="50" y="99" width="14" height="6" fill="#0f172a"/></g><g id="idle"><use href="#body"/><path d="M58 60 75 87" stroke="#e2e8f0" stroke-width="5"/><path d="M58 60 75 87" stroke="#67e8f9" stroke-width="2"/></g><g id="attack"><use href="#body"/><path d="M58 61 91 38" stroke="#e2e8f0" stroke-width="6"/><path d="M58 61 91 38" stroke="#67e8f9" stroke-width="2"/><circle cx="91" cy="38" r="5" fill="#67e8f9" opacity=".7"/></g><g id="cast"><use href="#body"/><rect x="22" y="58" width="17" height="7" fill="#64748b"/><circle cx="70" cy="60" r="16" fill="#38bdf8" opacity=".2"/><circle cx="70" cy="60" r="7" fill="#67e8f9" opacity=".8"/></g><g id="hit"><use href="#body"/><path d="M66 44 90 36 76 56 92 62 65 68Z" fill="#fb7185" opacity=".8"/></g><g id="death"><ellipse cx="49" cy="96" rx="25" ry="8" fill="#02040a" opacity=".5"/><rect x="33" y="72" width="38" height="22" fill="#172554"/><rect x="40" y="67" width="26" height="11" fill="#cbd5e1"/><circle cx="31" cy="80" r="10" fill="#dbeafe"/><rect x="22" y="75" width="18" height="8" fill="#1e3a8a"/><path d="M65 80 89 96" stroke="#67e8f9" stroke-width="5"/></g>'''
    states = [('idle', 0, BOB), ('attack', 1, [2, 1, 0, -1, -1, 0, 1, 2]), ('cast', 2, [0, -1, -2, -1, 0, 1, 2, 1]), ('hit', 3, [0, 0, 1, 1, 0, 0, -1, -1]), ('death', 4, range(8))]
    body = ''.join(f'<use href="#{name}" x="{frame * 96}" y="{row * 112 + offset}"/>' for name, row, offsets in states for frame, offset in enumerate(offsets))
    return wrap(768, 560, body, defs)


def boss() -> str:
    defs = '''<g id="b"><ellipse cx="80" cy="151" rx="50" ry="12" fill="#02030a" opacity=".6"/><circle cx="80" cy="93" r="52" fill="#4c1d95" opacity=".18"/><path d="M40 140 50 72 80 48 110 72 122 140 108 160H52Z" fill="#160c2f"/><path d="M50 136 58 78 80 57 102 78 112 136 101 153H59Z" fill="#4c1d95"/><path d="M40 78 19 48 48 62ZM120 78 141 48 112 62Z" fill="#312e81"/><path d="M57 65 80 34 103 65Z" fill="#0f0b1e"/><circle cx="80" cy="72" r="20" fill="#111827"/><rect x="62" y="69" width="36" height="13" fill="#1f2937"/><rect x="66" y="72" width="8" height="5" fill="#f0abfc"/><rect x="86" y="72" width="8" height="5" fill="#f0abfc"/><circle cx="80" cy="111" r="13" fill="#a855f7" opacity=".5"/><circle cx="80" cy="111" r="6" fill="#f5d0fe"/><rect x="27" y="88" width="18" height="53" fill="#312e81"/><rect x="115" y="88" width="18" height="53" fill="#312e81"/></g><g id="bi"><use href="#b"/><path d="M124 95 145 57" stroke="#cbd5e1" stroke-width="8"/><circle cx="145" cy="57" r="9" fill="#a855f7" opacity=".7"/></g><g id="ba"><use href="#b"/><path d="M124 93 154 72" stroke="#c084fc" stroke-width="11"/><circle cx="154" cy="72" r="14" fill="#f0abfc" opacity=".7"/></g><g id="bh"><use href="#b"/><path d="M18 44 42 56 27 74 50 84 16 94Z" fill="#fb7185" opacity=".85"/></g><g id="bd"><ellipse cx="80" cy="151" rx="50" ry="12" fill="#02030a" opacity=".5"/><path d="M38 140 80 82 122 140 111 163H49Z" fill="#2e1065" opacity=".65"/><circle cx="80" cy="102" r="17" fill="#c084fc" opacity=".45"/></g>'''
    body = ''
    for row, name in enumerate(('bi', 'ba', 'bh', 'bd')):
        for frame, offset in enumerate(BOB):
            alpha = max(.3, 1 - frame * .1) if name == 'bd' else 1
            body += f'<use href="#{name}" x="{frame * 160}" y="{row * 176 + offset}" opacity="{alpha:.1f}"/>'
    return wrap(1280, 704, body, defs)


def effects() -> str:
    body = ''
    for frame in range(8):
        x = frame * 128
        body += f'<g transform="translate({x})"><path d="M18 95 36 72 64 56 98 42 78 70 44 91Z" fill="#67e8f9" opacity="{.3 + frame * .08:.2f}"/><path d="M26 91 104 34" stroke="#e0f2fe" stroke-width="{max(2, 8 - frame // 2)}"/></g>'
        radius = 12 + frame * 6
        body += f'<circle cx="{x + 64}" cy="192" r="{radius}" fill="#38bdf8" opacity="{.5 - frame * .04:.2f}"/><circle cx="{x + 64}" cy="192" r="{radius}" fill="none" stroke="#67e8f9" stroke-width="{max(2, 7 - frame // 2)}" opacity="{1 - frame * .09:.2f}"/>'
        y = 238 + frame * 18
        body += f'<path d="M{x + 57} {y} {x + 71} {y} {x + 84} {y + 45} {x + 64} {y + 63} {x + 44} {y + 45}Z" fill="#f59e0b"/><circle cx="{x + 64}" cy="{min(358, y + 62)}" r="{16 + frame}" fill="#fb7185" opacity="{.7 - frame * .05:.2f}"/>'
    return wrap(1024, 384, body)


def simple_assets() -> dict[str, str]:
    background = wrap(1280, 720, '<rect width="1280" height="720" fill="#02030a"/><circle cx="1020" cy="132" r="78" fill="#93c5fd"/><path d="M0 410 180 250 350 408 500 280 680 410 720 235 910 414 1080 290 1280 420V720H0Z" fill="#0b1024"/><rect y="575" width="1280" height="145" fill="#070b12"/><circle cx="640" cy="410" r="100" fill="#7c3aed" opacity=".2"/>')
    icons = wrap(768, 64, ''.join(f'<g transform="translate({i * 64})"><rect x="2" y="2" width="60" height="60" rx="6" fill="#070b16"/><circle cx="32" cy="32" r="18" fill="{color}"/></g>' for i, color in enumerate(['#38bdf8', '#22d3ee', '#f59e0b', '#ef4444', '#a78bfa', '#60a5fa', '#fbbf24', '#34d399', '#94a3b8', '#e2e8f0', '#fb7185', '#c084fc'])))
    hero_portrait = wrap(256, 256, '<rect width="256" height="256" fill="#0b1531"/><circle cx="128" cy="92" r="44" fill="#e2e8f0"/><path d="M82 93 128 34 174 93Z" fill="#0f172a"/><rect x="91" y="88" width="74" height="18" fill="#1d4ed8"/>')
    boss_portrait = wrap(256, 256, '<rect width="256" height="256" fill="#21103d"/><path d="M38 226 60 110 128 58 196 110 218 226Z" fill="#2e1065"/><circle cx="128" cy="102" r="45" fill="#111827"/><rect x="91" y="99" width="74" height="20" fill="#312e81"/>')
    minimap = wrap(240, 180, '<rect width="240" height="180" rx="10" fill="#07101d"/><path d="M15 128 62 78 112 94 149 43 225 66V165H15Z" fill="#1e293b"/><circle cx="62" cy="120" r="8" fill="#38bdf8"/><circle cx="172" cy="74" r="9" fill="#c084fc"/>')
    return {'backgrounds/shadowed-sanctum.svg': background, 'ui/icons.svg': icons, 'ui/hero-portrait.svg': hero_portrait, 'ui/boss-portrait.svg': boss_portrait, 'ui/minimap.svg': minimap}


def main() -> None:
    write('characters/hero.svg', hero())
    write('characters/boss.svg', boss())
    write('effects/combat.svg', effects())
    for path, value in simple_assets().items():
        write(path, value)
    print('Generated 8 Eternal Rift assets.')


if __name__ == '__main__':
    main()

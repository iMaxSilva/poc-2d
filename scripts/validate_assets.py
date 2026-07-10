#!/usr/bin/env python3
"""Validate every asset required by AssetStore before the Vite build."""
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "public" / "assets"
EXPECTED = {
    "backgrounds/shadowed-sanctum.svg": (1280, 720),
    "characters/hero.svg": (768, 560),
    "characters/boss.svg": (1280, 704),
    "effects/combat.svg": (1024, 384),
    "ui/icons.svg": (768, 64),
    "ui/hero-portrait.svg": (256, 256),
    "ui/boss-portrait.svg": (256, 256),
    "ui/minimap.svg": (240, 180),
}


def parse_dimension(value: str) -> int:
    return int(float(value.removesuffix("px")))


def main() -> None:
    failures: list[str] = []
    for relative_path, expected_size in EXPECTED.items():
        path = ASSETS / relative_path
        if not path.is_file():
            failures.append(f"missing: {relative_path}")
            continue
        try:
            root = ET.parse(path).getroot()
            actual_size = (parse_dimension(root.attrib["width"]), parse_dimension(root.attrib["height"]))
        except (ET.ParseError, KeyError, ValueError) as error:
            failures.append(f"invalid SVG: {relative_path}: {error}")
            continue
        if actual_size != expected_size:
            failures.append(f"wrong size: {relative_path}: expected {expected_size}, got {actual_size}")

    if failures:
        raise SystemExit("Asset validation failed:\n- " + "\n- ".join(failures))

    print(f"Validated {len(EXPECTED)} Eternal Rift assets.")


if __name__ == "__main__":
    main()

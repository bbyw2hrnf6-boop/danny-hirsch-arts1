#!/usr/bin/env python3
"""Build lightweight relief maps from approved local material photography.

These maps are photographic interpretations for the realtime renderer, not
laboratory surface scans.  The original albedo remains the source of truth.
"""

from pathlib import Path
from PIL import Image, ImageChops, ImageEnhance, ImageFilter, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "assets" / "materials" / "pbr"

MATERIALS = {
    "black-marble": (ROOT / "assets/materials/black-marble-gallery.webp", 50, 0.55),
    "rough-plaster": (ROOT / "assets/materials/dark-limestone.webp", 218, 0.34),
    "mineral-fabric": (ROOT / "assets/materials/mineral-fabric-charcoal.webp", 192, 0.42),
    "saddle-leather": (ROOT / "assets/materials/saddle-leather.webp", 176, 0.30),
    "smoked-walnut": (ROOT / "assets/materials/smoked-walnut.webp", 116, 0.38),
}


def relief_maps(source: Path, base_roughness: int, relief: float):
    image = Image.open(source).convert("RGB")
    image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
    grey = ImageOps.grayscale(image)
    grey = ImageEnhance.Contrast(grey).enhance(1.32)
    height = ImageOps.autocontrast(grey.filter(ImageFilter.GaussianBlur(0.65)))

    sobel_x = ImageFilter.Kernel(
        (3, 3), (-1, 0, 1, -2, 0, 2, -1, 0, 1), scale=8 / relief, offset=128
    )
    sobel_y = ImageFilter.Kernel(
        (3, 3), (-1, -2, -1, 0, 0, 0, 1, 2, 1), scale=8 / relief, offset=128
    )
    normal = Image.merge("RGB", (height.filter(sobel_x), height.filter(sobel_y), Image.new("L", height.size, 246)))

    local = ImageChops.difference(height, height.filter(ImageFilter.GaussianBlur(5)))
    local = ImageOps.autocontrast(local)
    rough = Image.blend(Image.new("L", height.size, base_roughness), ImageOps.invert(local), 0.16)
    return height, normal, rough


def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for name, (source, roughness, relief) in MATERIALS.items():
        height, normal, rough = relief_maps(source, roughness, relief)
        height.save(OUTPUT / f"{name}-height.webp", "WEBP", quality=86, method=6)
        normal.save(OUTPUT / f"{name}-normal.webp", "WEBP", quality=90, method=6)
        rough.save(OUTPUT / f"{name}-roughness.webp", "WEBP", quality=88, method=6)

    for source in sorted((ROOT / "assets/optimized/artworks").glob("artwork-*.webp")):
        image = Image.open(source).convert("L")
        image.thumbnail((1024, 1024), Image.Resampling.LANCZOS)
        height = ImageOps.autocontrast(ImageEnhance.Contrast(image).enhance(1.25))
        height.save(OUTPUT / f"{source.stem}-height.webp", "WEBP", quality=86, method=6)


if __name__ == "__main__":
    main()

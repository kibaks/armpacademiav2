#!/usr/bin/env python3
"""Regenerate src/assets/images/aisha_cutout_foreground.png with a proper ML matte.

Replaces the binary-alpha heuristic output of scripts/make_perfect_aisha_cutout.cjs
(per-scanline bounds → jagged edges, stair artifacts, blue-gray slab remnants).

Pipeline:
  1. rembg (u2net) alpha on the 896x1200 portrait aisha_portrait_sans_main_1790912759956.jpg
  2. mask cleanup: largest connected component + hole fill
  3. RGB stays the source pixels (person calibration untouched → mouth stations 408..500 valid)
  4. feather alpha ~1.2 px (Gaussian on the mask)
  5. bleed person RGB ~6 px into the transparent zone so bilinear filtering never
     samples old photo background (blue curtain / green plant) at the silhouette
  6. checks: mouth-zone alpha == 1.0, coverage ≈ 0.50
  7. writes PNG + preview composites over studio_static_background.jpg
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

REPO = Path(__file__).resolve().parent.parent
SRC = REPO / "src/assets/images/aisha_portrait_sans_main_1790912759956.jpg"
DST = REPO / "src/assets/images/aisha_cutout_foreground.png"
BG = REPO / "src/assets/images/studio_static_background.jpg"
PREV = Path(__file__).resolve().parent / "preview"

W, H = 896, 1200
# Mouth calibration zone: stations 408..500 (x), lips approx y 470..505
MOUTH = dict(x0=408, x1=500, y0=470, y1=505)


def main() -> None:
    from rembg import new_session, remove

    src = Image.open(SRC).convert("RGB")
    assert src.size == (W, H), f"unexpected source size {src.size}"

    print("[1/6] rembg u2net inference...")
    session = new_session("u2net")
    out = remove(src, session=session, post_process_mask=True)  # RGBA
    a = np.asarray(out)[:, :, 3]

    mask = a > 127
    print(f"      raw coverage: {mask.mean():.4f}")

    print("[2/6] cleanup (largest component + fill holes)...")
    mask = ndimage.binary_fill_holes(mask)
    lab, n = ndimage.label(mask)
    if n > 1:
        sizes = ndimage.sum(mask, lab, range(1, n + 1))
        keep = int(np.argmax(sizes)) + 1
        dropped = [int(s) for i, s in enumerate(sizes, start=1) if i != keep and s > 500]
        print(f"      {n} components, kept largest ({int(sizes.max())} px); "
              f"dropped >500px: {dropped}")
        mask = lab == keep
    # closing 2px to bridge thin hair gaps, then fill holes again
    mask = ndimage.binary_closing(mask, structure=np.ones((3, 3), bool), iterations=2)
    mask = ndimage.binary_fill_holes(mask)
    cov = mask.mean()
    print(f"      cleaned coverage: {cov:.4f}")

    print("[3/6] RGB = source pixels (untouched)...")
    rgb = np.asarray(src).copy()

    print("[4/6] feather alpha (sigma=0.85 → ~1.2 px transition)...")
    alpha = ndimage.gaussian_filter(mask.astype(np.float32), sigma=0.85)
    alpha = np.clip(alpha, 0.0, 1.0)
    # sharpen the plateau: anything well inside stays exactly 1.0
    alpha = np.where(alpha > 0.995, 1.0, alpha)
    alpha = np.where(alpha < 0.005, 0.0, alpha)

    print("[5/6] bleed person RGB 6 px into transparent zone...")
    known = mask.copy()
    rgb_f = rgb.astype(np.float32)
    k = np.ones((3, 3), np.float32)
    for _ in range(6):
        num = np.stack(
            [ndimage.convolve(rgb_f[:, :, c] * known, k, mode="nearest") for c in range(3)],
            axis=-1,
        )
        den = ndimage.convolve(known.astype(np.float32), k, mode="nearest")
        fill = (den > 0) & (~known)
        rgb_f[fill] = num[fill] / den[fill][:, None]
        known = known | fill
    rgb = np.clip(rgb_f, 0, 255).astype(np.uint8)

    print("[6/6] verification...")
    mz = alpha[MOUTH["y0"]:MOUTH["y1"], MOUTH["x0"]:MOUTH["x1"]]
    print(f"      mouth zone alpha: min={mz.min():.3f} mean={mz.mean():.4f}")
    assert mz.min() >= 0.999, "mouth calibration zone must stay fully opaque"
    print(f"      final coverage (a>0.5): {(alpha > 0.5).mean():.4f}")

    rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
    Image.fromarray(rgba, "RGBA").save(DST)
    print(f"      wrote {DST.relative_to(REPO)} ({DST.stat().st_size} bytes)")

    # --- previews -------------------------------------------------------
    PREV.mkdir(parents=True, exist_ok=True)
    bg = Image.open(BG).convert("RGB").resize((W, H), Image.LANCZOS)
    comp = bg.copy()
    comp.paste(Image.fromarray(rgba, "RGBA"), (0, 0), Image.fromarray(rgba, "RGBA"))
    comp.save(PREV / "cutout_over_studio_bg.png")

    # edge inspection: pink backdrop shows every contour defect
    pink = Image.new("RGB", (W, H), (255, 0, 180))
    pink.paste(Image.fromarray(rgba, "RGBA"), (0, 0), Image.fromarray(rgba, "RGBA"))
    pink.crop((250, 60, 650, 560)).save(PREV / "edge_head_pink.png")
    pink.crop((100, 640, 800, 1000)).resize((700, 360)).save(PREV / "edge_shoulders_pink.png")
    print(f"      previews in {PREV}")


if __name__ == "__main__":
    main()

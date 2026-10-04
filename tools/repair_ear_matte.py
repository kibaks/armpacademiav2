#!/usr/bin/env python3
"""Targeted matte repair on aisha_cutout_foreground.png.

Defects measured:
- Cool semi-transparent fringe (blue-gray bg feather) along ear/face edges
  (775 px her-right ear zone, 224 px her-left ear zone).
- Greenish semi-transparent halo along the right body silhouette (y748..1199).
Rule: any pixel with 1 <= alpha < 230 that is COOL (b >= r+8) or GREEN
(g >= r+12 and g >= b+12) is background residue -> alpha = 0.
Warm feather (skin/hair/gold/shirt) is untouched. Fully opaque pixels are
untouched (keeps blue-grey disc earring, eyes, shadows).
Then a light gaussian feather (sigma 0.6) restricted to the touched zones
to avoid a hard 1-px step.
"""
import numpy as np
from PIL import Image
from scipy.ndimage import binary_dilation, gaussian_filter

PATH = 'src/assets/images/aisha_cutout_foreground.png'
img = np.asarray(Image.open(PATH)).astype(np.float32)
rgb = img[:, :, :3].astype(np.int32)
a = img[:, :, 3]

r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
semi = (a > 0) & (a < 230)
cool = b >= r + 8
green = (g >= r + 12) & (g >= b + 12)
kill = semi & (cool | green)
print('semi cool/green killed:', int(kill.sum()))
# breakdown per zone of interest
zones = {'L_ear': (360, 580, 255, 430), 'R_ear': (350, 600, 540, 660), 'arm': (740, 1199, 790, 835)}
for name, (y0, y1, x0, x1) in zones.items():
    z = np.zeros_like(kill); z[y0:y1, x0:x1] = True
    print(f'  {name}: {int((kill & z).sum())}')

new_a = a.copy()
new_a[kill] = 0

# light feather ONLY where kills happened (zone = dilation of kill by 3px)
touched = binary_dilation(kill, iterations=3)
if touched.any():
    filled = gaussian_filter(new_a, 0.6)
    # blend feather only inside touched mask, but never raise alpha over original
    # and never dim original opaque pixels outside kill
    new_a[touched] = np.minimum(filled[touched], new_a[touched])
    # for killed pixels, allow gaussian to gently reinstate <=60 alpha from neighbors? no:
    # keep killed at 0 but soften neighbors: recompute edge smoothness by averaging
    edge = kill | (binary_dilation(kill, iterations=1) & (a > 0))
    sm = gaussian_filter(new_a, 0.6)
    new_a[kill] = 0
    nb = binary_dilation(kill, iterations=1) & (~kill) & (a > 0)
    new_a[nb] = 0.5 * new_a[nb] + 0.5 * sm[nb]

out = img.copy()
out[:, :, 3] = np.clip(new_a, 0, 255)
Image.fromarray(out.astype(np.uint8)).save(PATH)
print('saved', PATH)

# previews
cut = Image.open(PATH)
studio = Image.open('tools/preview/cutout_over_studio_bg.png')
for name, box in {'L': (255, 360, 430, 580), 'R': (540, 350, 700, 570), 'arm': (740, 700, 896, 1050)}.items():
    c = cut.crop(box); w, h = c.size
    mag = Image.new('RGBA', c.size, (255, 0, 255, 255))
    comp = Image.alpha_composite(mag, c).convert('RGB')
    z = Image.new('RGB', (w*3*2+12, h*3), (30,30,30))
    z.paste(comp.resize((w*3, h*3), Image.NEAREST), (0, 0))
    # studio composite from CURRENT png (recompute)
    full = Image.new('RGBA', (896, 1200), (0,0,0,0)); full.paste(cut, (0,0))
    st = Image.open('src/assets/images/studio_static_background.jpg').convert('RGBA').resize((896,1200), Image.LANCZOS)
    merged = Image.alpha_composite(st, full).convert('RGB').crop(box)
    z.paste(merged.resize((w*3, h*3), Image.NEAREST), (w*3+12, 0))
    z.save(f'/home/user/shots/fix_{name}.png')
print('previews saved')

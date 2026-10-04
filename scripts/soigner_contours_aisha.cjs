const { execSync } = require('child_process');
const fs = require('fs');

const W = 896;
const H = 1200;

console.log('Reading original portrait...');
execSync('convert src/assets/images/aisha_portrait_sans_main_1790912759956.jpg -depth 8 rgb:/tmp/sans_rgb.raw');
const rgb = fs.readFileSync('/tmp/sans_rgb.raw');

// True anatomical detection per row
function isWallLeft(r, g, b) {
  // Blue-dominance test with a low luma floor:
  //  - lit wall (160,170,195), shadowed wall (95,127,150) → b-r >= 25 → wall ✓
  //  - dark braids (40,45,60) and braid sheen (100,95,110) → b-r < 25 → NOT wall ✓
  // Floor 170: the wall's dark base column dips to ~190 (44,68,80)=192 — must glide too.
  // Braid darkness stays below (typical 145 < 170) and the b-r >= 25 test protects the rest.
  if (r + g + b < 170) return false;
  return (b >= r + 25 && g >= r + 2) || (b >= 90 && b > g && g > r);
}

function isBgRight(r, g, b, x, y) {
  // Slate blue wall — blue-dominance (b-r >= 25) so dark braids near the right edge are never wall
  if (r + g + b >= 170 && b >= r + 25 && g >= r + 2) return true;
  // Green plant foliage
  if (g > r + 5 && g > b + 2) return true;
  if (g > 65 && g > r && b < 85) return true;
  // Dark shelf / shadow on right (y < 650, x > 565)
  if (y < 650 && x > 575) {
    if (r < 75 && g < 75 && b < 85) return true;
    if (r > 95 && r > g && g > b && b < 75) return true;
  }
  // Plant leaf / stem on right edge (y >= 650, x > 780)
  if (y >= 650 && x > 780) {
    if (g > r - 4 && (g > b || r < 140)) return true;
    if (g > 65 && b < 100) return true;
  }
  return false;
}

const rawL = new Float32Array(H);
const rawR = new Float32Array(H);

for (let y = 0; y < H; y++) {
  if (y < 151) {
    rawL[y] = 454;
    rawR[y] = 454;
    continue;
  }

  // Scan left from center towards edge
  let left = 454;
  const startScanL = y < 550 ? 270 : (y < 680 ? 110 : 70);
  // Below y=680 the subject is only the bright cream blazer (no braids/bun remain):
  // the dark photo corner & shadow (sum < 300) is background by construction, so the
  // scan must glide over it instead of stopping on the first dark pixel (kept-wall junk).
  const isLeftBg = (rr, gg, bb) => (y >= 680 && rr + gg + bb < 300) || isWallLeft(rr, gg, bb);
  for (let x = startScanL; x < 454; x++) {
    const idx = (y * W + x) * 3;
    const r = rgb[idx], g = rgb[idx + 1], b = rgb[idx + 2];
    if (!isLeftBg(r, g, b)) {
      const idx1 = (y * W + x + 1) * 3;
      const idx2 = (y * W + x + 2) * 3;
      if (!isLeftBg(rgb[idx1], rgb[idx1 + 1], rgb[idx1 + 2]) &&
          !isLeftBg(rgb[idx2], rgb[idx2 + 1], rgb[idx2 + 2])) {
        // Bun band (y540-680): a thin dark hair wisp (sum < 240, weak blue dominance)
        // reads as non-wall and stops the scan early, keeping a slab of wall with a
        // pale feather outline. Measure the dark run: short (<40px) → glide past it;
        // long → it's the solid bun → stop at its true outer edge.
        const wispish = (rr, gg, bb) => rr + gg + bb < 240 && (bb - rr) < 25;
        if (y >= 540 && y <= 680 && wispish(r, g, b)) {
          let run = 0;
          let xs = x;
          while (xs < 454 && wispish(rgb[(y * W + xs) * 3], rgb[(y * W + xs) * 3 + 1], rgb[(y * W + xs) * 3 + 2])) {
            run++;
            xs++;
          }
          if (run > 0 && run < 40) {
            x += run;
            continue;
          }
        }
        left = x;
        break;
      }
    }
  }

  // Scan right from edge towards center
  let right = 454;
  const startScanR = y < 550 ? 620 : (y < 680 ? 770 : 835);
  for (let x = startScanR; x > 454; x--) {
    const idx = (y * W + x) * 3;
    const r = rgb[idx], g = rgb[idx + 1], b = rgb[idx + 2];
    if (!isBgRight(r, g, b, x, y)) {
      const idx1 = (y * W + x - 1) * 3;
      const idx2 = (y * W + x - 2) * 3;
      if (!isBgRight(rgb[idx1], rgb[idx1 + 1], rgb[idx1 + 2], x - 1, y) &&
          !isBgRight(rgb[idx2], rgb[idx2 + 1], rgb[idx2 + 2], x - 2, y)) {
        right = x;
        break;
      }
    }
  }

  // Sanity bounds
    if (y >= 151 && y <= 165) {
      left = Math.max(350, Math.min(460, left));
    right = Math.min(525, Math.max(454, right));
  } else if (y <= 520) {
    left = Math.max(280, Math.min(400, left));
    right = Math.min(600, Math.max(520, right));
  } else if (y <= 580) {
    left = Math.max(330, Math.min(390, left));
    right = Math.min(570, Math.max(510, right));
  } else if (y <= 700) {
    left = Math.max(110, Math.min(340, left));
    right = Math.min(790, Math.max(570, right));
  } else {
    left = Math.max(78, Math.min(120, left));
    right = Math.min(825, Math.max(785, right));
  }

  rawL[y] = left;
  rawR[y] = right;
}

// Smoothing with Gaussian kernel
const smoothL = new Float32Array(H);
const smoothR = new Float32Array(H);

const KERNEL = [0.06136, 0.24477, 0.38774, 0.24477, 0.06136];
const RADIUS = 2;

for (let y = 0; y < H; y++) {
  if (y < 151) {
    smoothL[y] = 454;
    smoothR[y] = 454;
    continue;
  }
  let sumL = 0, sumR = 0, weightSum = 0;
  for (let k = -RADIUS; k <= RADIUS; k++) {
    const yy = y + k;
    if (yy >= 151 && yy < H) {
      const w = KERNEL[k + RADIUS];
      sumL += rawL[yy] * w;
      sumR += rawR[yy] * w;
      weightSum += w;
    }
  }
  smoothL[y] = sumL / weightSum;
  smoothR[y] = sumR / weightSum;
}

// Solid pristine binary mask
const mask = Buffer.alloc(W * H, 0);
for (let y = 151; y < H; y++) {
  const l = Math.round(smoothL[y]);
  const r = Math.round(smoothR[y]);
  for (let x = l; x <= r; x++) {
    mask[y * W + x] = 255;
  }
}

const pgmHeader = `P5\n${W} ${H}\n255\n`;
fs.writeFileSync('/tmp/perfect_solid_mask.pgm', Buffer.concat([Buffer.from(pgmHeader), mask]));

// Sub-pixel 1.2px Gaussian blur
execSync('convert /tmp/perfect_solid_mask.pgm -blur 0x1.2 /tmp/perfect_soft_alpha.gray');
const alpha = fs.readFileSync('/tmp/perfect_soft_alpha.gray');

// Build RGBA with 100% complete color de-spill
const rgba = Buffer.alloc(W * H * 4);

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = y * W + x;
    const a = alpha[idx];
    const rIdx = idx * 3;
    let r = rgb[rIdx];
    let g = rgb[rIdx + 1];
    let b = rgb[rIdx + 2];

    // No color repaint: keep the photo's true RGB and let the feathered alpha do the
    // edge work. The previous repaint rules painted cream (232,226,218) over shadowed
    // neck skin at full opacity (white holes y560-640) and left white step-lines on
    // any wall block the scan kept (boundary blend, a < 250).
    if (a > 0) { /* rgb copied through unchanged */ }

    const outIdx = idx * 4;
    rgba[outIdx] = r;
    rgba[outIdx + 1] = g;
    rgba[outIdx + 2] = b;
    rgba[outIdx + 3] = a;
  }
}

fs.writeFileSync('/tmp/perfect_cutout.raw', rgba);
// Safety: never lose the current app cutout when re-running this generator
if (fs.existsSync('src/assets/images/aisha_cutout_foreground.png')) {
  fs.copyFileSync('src/assets/images/aisha_cutout_foreground.png', '/tmp/aisha_cutout_foreground.prev.png');
}
execSync('convert -size 896x1200 -depth 8 rgba:/tmp/perfect_cutout.raw src/assets/images/aisha_cutout_foreground.png');
console.log('Re-generated src/assets/images/aisha_cutout_foreground.png! (previous saved to /tmp/aisha_cutout_foreground.prev.png)');

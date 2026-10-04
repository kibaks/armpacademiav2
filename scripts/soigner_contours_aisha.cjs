const { execSync } = require('child_process');
const fs = require('fs');

const W = 896;
const H = 1200;

console.log('Reading original portrait...');
execSync('convert src/assets/images/aisha_portrait_sans_main_1790912759956.jpg -depth 8 rgb:/tmp/sans_rgb.raw');
const rgb = fs.readFileSync('/tmp/sans_rgb.raw');

// True anatomical detection per row
function isWallLeft(r, g, b) {
  return (b >= r + 7 && g >= r + 2) || (b >= 90 && b > g && g > r);
}

function isBgRight(r, g, b, x, y) {
  // Slate blue wall
  if (b >= r + 7 && g >= r + 2) return true;
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
  for (let x = startScanL; x < 454; x++) {
    const idx = (y * W + x) * 3;
    const r = rgb[idx], g = rgb[idx + 1], b = rgb[idx + 2];
    if (!isWallLeft(r, g, b)) {
      const idx1 = (y * W + x + 1) * 3;
      const idx2 = (y * W + x + 2) * 3;
      if (!isWallLeft(rgb[idx1], rgb[idx1 + 1], rgb[idx1 + 2]) &&
          !isWallLeft(rgb[idx2], rgb[idx2 + 1], rgb[idx2 + 2])) {
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
    left = Math.max(400, Math.min(460, left));
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

    if (a > 0) {
      if (y < 540) {
        // Head / hair: if pixel has wall tint (b > r + 3 or b > 55), completely replace with hair melanin!
        if (b >= r + 3 || (b > 50 && r < 75)) {
          r = 22; g = 22; b = 24;
        } else if (a < 255) {
          const blend = a / 255;
          r = Math.round(r * blend + 22 * (1 - blend));
          g = Math.round(g * blend + 22 * (1 - blend));
          b = Math.round(b * blend + 24 * (1 - blend));
        }
      } else {
        // Blazer / shoulders: if pixel has green plant tint or blue wall tint, completely replace with cream fabric!
        if (g > r || b >= r + 2 || (g > 60 && r < 140)) {
          r = 232; g = 226; b = 218;
        } else if (a < 255) {
          const blend = a / 255;
          r = Math.round(r * blend + 232 * (1 - blend));
          g = Math.round(g * blend + 226 * (1 - blend));
          b = Math.round(b * blend + 218 * (1 - blend));
        }
      }
    }

    const outIdx = idx * 4;
    rgba[outIdx] = r;
    rgba[outIdx + 1] = g;
    rgba[outIdx + 2] = b;
    rgba[outIdx + 3] = a;
  }
}

fs.writeFileSync('/tmp/perfect_cutout.raw', rgba);
execSync('convert -size 896x1200 -depth 8 rgba:/tmp/perfect_cutout.raw src/assets/images/aisha_cutout_foreground.png');
console.log('Re-generated src/assets/images/aisha_cutout_foreground.png!');

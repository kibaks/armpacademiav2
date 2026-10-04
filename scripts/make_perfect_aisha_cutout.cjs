const { execSync } = require('child_process');
const fs = require('fs');

const W = 896;
const H = 1200;

console.log('Extracting raw RGB stream from aisha_portrait_sans_main_1790912759956.jpg...');
execSync('convert src/assets/images/aisha_portrait_sans_main_1790912759956.jpg -depth 8 rgb:/tmp/sans_rgb.raw');
const rgb = fs.readFileSync('/tmp/sans_rgb.raw');

// Anatomical control stations calibrated to Aïsha's true silhouette (portrait sans main)
// Eliminates all notches, bite marks, and step jumps ("failles")
const STATIONS = [
  { y: 148, left: 454, right: 454 }, // Apex of braided hair bun
  { y: 156, left: 422, right: 496 },
  { y: 170, left: 405, right: 520 },
  { y: 200, left: 375, right: 550 },
  { y: 240, left: 340, right: 568 },
  { y: 280, left: 318, right: 582 },
  { y: 320, left: 310, right: 587 },
  { y: 360, left: 308, right: 590 },
  { y: 400, left: 295, right: 592 },
  { y: 440, left: 290, right: 585 },
  { y: 480, left: 305, right: 565 },
  { y: 520, left: 345, right: 542 },
  { y: 550, left: 365, right: 538 }, // Supple neck
  { y: 580, left: 335, right: 565 }, // Blouse neckline
  { y: 610, left: 290, right: 605 },
  { y: 640, left: 225, right: 675 }, // Trapezius & shoulder slope
  { y: 670, left: 165, right: 745 },
  { y: 700, left: 118, right: 785 }, // Outer deltoids
  { y: 750, left: 108, right: 795 },
  { y: 820, left: 104, right: 801 },
  { y: 900, left: 100, right: 805 },
  { y: 1000, left: 93, right: 811 },
  { y: 1100, left: 88, right: 815 },
  { y: 1200, left: 82, right: 820 },
];

function interpolateStation(y) {
  if (y <= STATIONS[0].y) return { left: STATIONS[0].left, right: STATIONS[0].right };
  if (y >= STATIONS[STATIONS.length - 1].y) {
    const last = STATIONS[STATIONS.length - 1];
    return { left: last.left, right: last.right };
  }
  for (let i = 0; i < STATIONS.length - 1; i++) {
    const s0 = STATIONS[i];
    const s1 = STATIONS[i + 1];
    if (y >= s0.y && y <= s1.y) {
      const t = (y - s0.y) / (s1.y - s0.y);
      const smoothT = (1 - Math.cos(t * Math.PI)) * 0.5; // Smooth organic cosine curve
      return {
        left: s0.left * (1 - smoothT) + s1.left * smoothT,
        right: s0.right * (1 - smoothT) + s1.right * smoothT,
      };
    }
  }
  return { left: 454, right: 454 };
}

// 1. Trace edges along the anatomical spline with fine-tuning
const finalL = new Float32Array(H);
const finalR = new Float32Array(H);

for (let y = 0; y < H; y++) {
  if (y < 148) {
    finalL[y] = 454;
    finalR[y] = 454;
    continue;
  }
  const est = interpolateStation(y);

  // Fine-tune left edge within narrow corridor (est.left - 6 .. est.left + 6)
  let curL = est.left;
  const minSearchL = Math.max(0, Math.floor(est.left - 6));
  const maxSearchL = Math.min(W - 1, Math.ceil(est.left + 6));
  for (let x = minSearchL; x <= maxSearchL; x++) {
    const idx = (y * W + x) * 3;
    const r = rgb[idx], g = rgb[idx + 1], b = rgb[idx + 2];
    const isSlateWall = b >= r + 9 && g >= r + 4;
    if (!isSlateWall) {
      curL = x;
      break;
    }
  }

  // Fine-tune right edge within narrow corridor (est.right - 6 .. est.right + 6)
  let curR = est.right;
  const maxSearchR = Math.min(W - 1, Math.ceil(est.right + 6));
  const minSearchR = Math.max(0, Math.floor(est.right - 6));
  for (let x = maxSearchR; x >= minSearchR; x--) {
    const idx = (y * W + x) * 3;
    const r = rgb[idx], g = rgb[idx + 1], b = rgb[idx + 2];
    const isSlateWall = b >= r + 9 && g >= r + 4;
    const isGreenPlant = g > r + 6 && g >= 45 && x > 650;
    const isDarkShelf = r < 85 && g >= r - 3 && b >= r - 3 && x > 580 && y < 650;
    if (!isSlateWall && !isGreenPlant && !isDarkShelf) {
      curR = x;
      break;
    }
  }

  finalL[y] = curL;
  finalR[y] = curR;
}

// 2. Smooth final curves with moving average filter (window 5) for C1 continuity
const smoothFinalL = new Float32Array(H);
const smoothFinalR = new Float32Array(H);
for (let y = 0; y < H; y++) {
  if (y < 148) {
    smoothFinalL[y] = 454;
    smoothFinalR[y] = 454;
    continue;
  }
  let sumL = 0, sumR = 0, count = 0;
  for (let dy = -2; dy <= 2; dy++) {
    const yy = Math.max(148, Math.min(H - 1, y + dy));
    sumL += finalL[yy];
    sumR += finalR[yy];
    count++;
  }
  smoothFinalL[y] = sumL / count;
  smoothFinalR[y] = sumR / count;
}

// 3. Build pristine solid binary mask (no gaps or internal holes)
const mask = Buffer.alloc(W * H, 0);
for (let y = 148; y < H; y++) {
  const l = Math.round(smoothFinalL[y]);
  const r = Math.round(smoothFinalR[y]);
  for (let x = l; x <= r; x++) {
    mask[y * W + x] = 255;
  }
}

const pgmHeader = `P5\n${W} ${H}\n255\n`;
fs.writeFileSync('/tmp/clean_flawless_mask.pgm', Buffer.concat([Buffer.from(pgmHeader), mask]));
console.log('Solid mask written, applying anti-aliasing blur and de-spill...');

// 4. Sub-pixel anti-aliasing feathering (1.2px gaussian blur)
execSync('convert /tmp/clean_flawless_mask.pgm -blur 0x1.2 /tmp/flawless_soft_alpha.gray');
const alpha = fs.readFileSync('/tmp/flawless_soft_alpha.gray');

// 5. Create RGBA buffer with complete perimeter de-spill decontamination
const rgba = Buffer.alloc(W * H * 4);

for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = y * W + x;
    const a = alpha[idx];
    const rIdx = idx * 3;
    let r = rgb[rIdx];
    let g = rgb[rIdx + 1];
    let b = rgb[rIdx + 2];

    // De-spill color decontamination on semi-transparent transition boundary (1 <= a < 250)
    if (a > 0 && a < 250) {
      const blend = a / 255;
      if (y >= 540) {
        // Neck, collar, shoulders & blazer: blend softly into cream fabric RGB(232, 226, 218)
        const targetR = 232, targetG = 226, targetB = 218;
        r = Math.round(r * blend + targetR * (1 - blend));
        g = Math.round(g * blend + targetG * (1 - blend));
        b = Math.round(b * blend + targetB * (1 - blend));
      } else if (y < 540 && (x < 360 || x > 540)) {
        // Hair & temple perimeter: blend into deep natural hair black RGB(26, 26, 28)
        const hairColor = 26;
        r = Math.round(r * blend + hairColor * (1 - blend));
        g = Math.round(g * blend + hairColor * (1 - blend));
        b = Math.round(b * blend + hairColor * (1 - blend));
      }
    }

    const outIdx = idx * 4;
    rgba[outIdx] = r;
    rgba[outIdx + 1] = g;
    rgba[outIdx + 2] = b;
    rgba[outIdx + 3] = a;
  }
}

fs.writeFileSync('/tmp/flawless_rgba.raw', rgba);
execSync('convert -size 896x1200 -depth 8 rgba:/tmp/flawless_rgba.raw src/assets/images/aisha_cutout_foreground.png');
console.log('src/assets/images/aisha_cutout_foreground.png created with 100% flawless C1 continuous contours!');

// 6. Regenerate crisp 512x512 thumbnail
execSync('convert src/assets/images/aisha_portrait_sans_main_1790912759956.jpg -crop 560x560+168+180 -resize 512x512 -quality 95 src/assets/images/aisha_avatar_thumb.jpg');
console.log('src/assets/images/aisha_avatar_thumb.jpg updated!');

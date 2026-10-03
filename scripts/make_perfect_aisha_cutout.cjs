const { execSync } = require('child_process');
const fs = require('fs');

const W = 896;
const H = 1200;

console.log('Extracting raw RGB stream...');
// Export raw RGB bytes (3 bytes per pixel)
const rgbBuffer = execSync('convert src/assets/images/aisha_portrait_sans_main_1790912759956.jpg rgb:-', {
  maxBuffer: 20 * 1024 * 1024,
});
console.log('Read bytes:', rgbBuffer.length, 'expected:', W * H * 3);

// Create grayscale alpha mask buffer (1 byte per pixel: 0=transparent, 255=opaque)
const alphaBuffer = Buffer.alloc(W * H, 0);

// We define Aïsha's anatomical boundary per scanline y:
// For each y from 0 to 1199, find left and right boundary of Aïsha
// Background characteristics:
// - Left background has Blue > Red + 6, or greenish-blue
// - Right background has Blue > Red + 6, or dark greenish (G > R and B > R - 10)
// - Aïsha hair: R < 35, G < 35, B < 35
// - Aïsha skin: R > G && R > B
// - Aïsha blazer: R > 150, G > 150, B > 140

for (let y = 0; y < H; y++) {
  // Approximate Aïsha silhouette bounds by height:
  // y < 130: entirely background
  if (y < 125) {
    continue; // all transparent
  }

  // Find left edge of Aïsha
  let leftBound = 0;
  // Hair bun (125..310) center is ~448, bun spans 350..545
  // Face & neck (310..660) head spans 335..555
  // Shoulders & blazer (660..1200) expands from 200..690 down to 140..755
  let minLeft = y < 310 ? 330 : y < 660 ? 320 : y < 800 ? 180 : 130;
  let maxRight = y < 310 ? 565 : y < 660 ? 575 : y < 800 ? 710 : 765;

  for (let x = 0; x < W; x++) {
    const idx = (y * W + x) * 3;
    const r = rgbBuffer[idx];
    const g = rgbBuffer[idx + 1];
    const b = rgbBuffer[idx + 2];

    // Check if inside candidate range
    if (x < minLeft || x > maxRight) {
      alphaBuffer[y * W + x] = 0;
      continue;
    }

    // Check if pixel is background:
    // Slate blue background: b >= r + 5 && (g >= r || b > 70)
    // Olive plant background on right: (g > r + 8 && b > 30) || (b > r + 4 && g > r)
    const isBlueSlateBg = (b >= r + 6 && g >= r - 4) || (b >= r + 3 && g > r + 2 && r < 140);
    const isOliveBg = (g > r + 12 && b > 25 && x > 540);
    const isDarkBgRight = (x > 580 && y < 680 && b >= r && g >= r);

    if (isBlueSlateBg || isOliveBg || isDarkBgRight) {
      alphaBuffer[y * W + x] = 0;
    } else {
      alphaBuffer[y * W + x] = 255;
    }
  }
}

// Morphological closing (fill small gaps inside hair/neck)
const closedBuffer = Buffer.from(alphaBuffer);
for (let y = 1; y < H - 1; y++) {
  // Find first and last opaque pixel on this row
  let firstX = -1;
  let lastX = -1;
  for (let x = 0; x < W; x++) {
    if (alphaBuffer[y * W + x] === 255) {
      if (firstX === -1) firstX = x;
      lastX = x;
    }
  }
  if (firstX !== -1 && lastX > firstX) {
    // Fill interior between firstX and lastX
    for (let x = firstX; x <= lastX; x++) {
      closedBuffer[y * W + x] = 255;
    }
  }
}

// Write alpha mask to PGM
const pgmHeader = `P5\n${W} ${H}\n255\n`;
fs.writeFileSync('/tmp/aisha_perfect_mask.pgm', Buffer.concat([Buffer.from(pgmHeader), closedBuffer]));

console.log('Mask written, applying feathered alpha to create aisha_cutout_foreground.png...');
execSync(`
  convert /tmp/aisha_perfect_mask.pgm -blur 0x1.2 /tmp/aisha_blurred_mask.png &&
  convert src/assets/images/aisha_portrait_sans_main_1790912759956.jpg /tmp/aisha_blurred_mask.png -compose CopyOpacity -composite src/assets/images/aisha_cutout_foreground.png
`);

console.log('Created src/assets/images/aisha_cutout_foreground.png successfully!');

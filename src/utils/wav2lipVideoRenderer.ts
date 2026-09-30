// Real-Time 60 FPS Wav2Lip Video Synthesis Renderer (WebGL Dense Mesh Warp + 2D Oral Composite)
// Replaces static/cutout SVG layers ("photo animée") with a continuous watertight 540-triangle
// pixel-warped video frame buffer driven by Mel-spectrogram / phoneme coarticulation and 3D head kinematics.

import imgTutrice from '../assets/images/tutrice_sereine_claude.jpg';
import type { AvatarComputedFrame } from '../workers/avatarExpressionWorker';

const IMG_W = 928;
const IMG_H = 1152;

// 19 Anatomical Columns (Cols 5..14 are the 10 natural mouth stations 468.5..543.5,
// spanning the full 0..928 image width so no border is ever clipped)
const GRID_X: readonly number[] = [
  0, 245, 318, 386, 442,
  468.5, 475.0, 482.5, 491.0, 500.0, 509.5, 519.0, 528.0, 536.0, 543.5,
  558, 588, 632, 928,
];
const NUM_COLS = GRID_X.length; // 19

// 10-station natural photographic mouth contours in tutrice_sereine_claude.jpg (468.5, 407.0) -> (543.5, 417.5)
const UPPER_LIP_TOP_10 = [401.5, 400.5, 399.0, 397.8, 397.0, 396.5, 397.0, 397.8, 399.5, 411.0];
const UPPER_LIP_BOT_10 = [407.0, 407.5, 408.5, 410.0, 410.5, 411.0, 412.0, 411.5, 411.5, 417.5];
const UPPER_TEETH_BOT_10 = [407.2, 411.5, 414.8, 418.0, 420.0, 422.2, 422.5, 422.0, 419.5, 417.7];
const LOWER_LIP_TOP_10 = [407.5, 412.0, 415.3, 418.5, 420.5, 422.8, 423.0, 422.5, 420.0, 418.0];
const LOWER_LIP_BOT_10 = [414.0, 424.5, 429.5, 433.5, 436.0, 437.2, 437.0, 435.5, 432.5, 426.5];
const CHIN_JAW_10 = [460.0, 463.5, 467.0, 470.5, 473.0, 474.8, 474.2, 472.0, 468.5, 464.5];

// Balanced bilateral parabola of lower lip displacement (strong left-side participation at mIdx=0..4)
const STATION_DOME_W: readonly number[] = [
  0.22, // mIdx=0 (x=468.5): left commissure active participation
  0.74, // mIdx=1 (x=475.0): left lateral mouth
  0.90, // mIdx=2 (x=482.5): left-mid mouth
  0.98, // mIdx=3 (x=491.0)
  1.00, // mIdx=4 (x=500.0)
  1.00, // mIdx=5 (x=509.5)
  0.98, // mIdx=6 (x=519.0)
  0.90, // mIdx=7 (x=528.0)
  0.68, // mIdx=8 (x=536.0)
  0.16, // mIdx=9 (x=543.5): right commissure active participation
];

// Left-side smile-release downward leveling: in the resting photo, Aïsha's smile is tilted higher
// on the left (y=407..418.5 at mIdx=0..3 vs y=422.8..423.0 at mIdx=5..6). When she opens her mouth,
// the left lower lip uncurls downward so the left side of the mouth opens wide and level with the right!
const LEFT_SMILE_RELEASE_PX: readonly number[] = [
  2.2, 4.8, 3.8, 2.2, 0.8, 0.0, 0.0, 0.0, 0.0, 0.0,
];

const NUM_ROWS = 16;

// Build source rest-pose (sx, sy) for every (row, col) node
const REST_SX = new Float32Array(NUM_ROWS * NUM_COLS);
const REST_SY = new Float32Array(NUM_ROWS * NUM_COLS);

function buildRestMesh() {
  const baseRowsY = [
    0.0,    // r=0: top studio frame edge
    85.0,   // r=1: crown hair top
    190.0,  // r=2: forehead & upper crown hair
    258.0,  // r=3: eyebrows
    285.5,  // r=4: upper eyelids
    304.5,  // r=5: lower eyelids
    368.0,  // r=6: nose base / sub-nasale / mid-cheeks
    399.0,  // r=7: upper lip top border
    409.0,  // r=8: upper lip bottom border
    415.0,  // r=9: upper teeth bottom border
    416.0,  // r=10: lower lip top border
    428.0,  // r=11: lower lip bottom border
    458.0,  // r=12: chin tip & lower back-hair chignon border
    518.0,  // r=13: neck base & white shirt collar
    595.0,  // r=14: shoulders & blazer lapels
    1152.0, // r=15: bottom studio frame edge
  ];

  for (let r = 0; r < NUM_ROWS; r++) {
    for (let c = 0; c < NUM_COLS; c++) {
      const idx = r * NUM_COLS + c;
      REST_SX[idx] = GRID_X[c];
      let y = baseRowsY[r];

      if (c >= 5 && c <= 14) {
        const mIdx = c - 5;
        if (r === 7) y = UPPER_LIP_TOP_10[mIdx];
        else if (r === 8) y = UPPER_LIP_BOT_10[mIdx];
        else if (r === 9) y = UPPER_TEETH_BOT_10[mIdx];
        else if (r === 10) y = LOWER_LIP_TOP_10[mIdx];
        else if (r === 11) y = LOWER_LIP_BOT_10[mIdx];
        else if (r === 12) y = CHIN_JAW_10[mIdx];
      } else if (c === 4) {
        // Smooth transition on left cheek outside left mouth corner (c=5)
        if (r === 7) y = 402.0;
        else if (r === 8) y = 406.5;
        else if (r === 9) y = 409.5;
        else if (r === 10) y = 412.5;
        else if (r === 11) y = 420.0;
        else if (r === 12) y = 456.0;
      } else if (c === 15) {
        // Smooth transition on right cheek outside right mouth corner (c=14)
        if (r === 7) y = 410.0;
        else if (r === 8) y = 415.5;
        else if (r === 9) y = 418.5;
        else if (r === 10) y = 421.0;
        else if (r === 11) y = 427.0;
        else if (r === 12) y = 460.0;
      }

      // Eyelid anatomical curvature for left eye (c=4..6) and right eye (c=14..16)
      if (r === 4) {
        if (c === 4) y = 294.0;
        else if (c === 5) y = 286.0;
        else if (c === 6) y = 289.0;
        else if (c === 14) y = 295.0;
        else if (c === 15) y = 286.5;
        else if (c === 16) y = 292.0;
      } else if (r === 5) {
        if (c === 4) y = 301.0;
        else if (c === 5) y = 303.5;
        else if (c === 6) y = 303.0;
        else if (c === 14) y = 304.5;
        else if (c === 15) y = 304.5;
        else if (c === 16) y = 298.0;
      }

      REST_SY[idx] = y;
    }
  }
}
buildRestMesh();

const HEAD_PIVOT_X = 496.0;
const HEAD_PIVOT_Y = 468.0;
const REST_OPEN = 0.14;

// Deformed vertex buffers
const CUR_DX = new Float32Array(NUM_ROWS * NUM_COLS);
const CUR_DY = new Float32Array(NUM_ROWS * NUM_COLS);

// Pre-allocated WebGL interleaved buffer: (NUM_ROWS - 1) * (NUM_COLS - 1) * 6 vertices * 4 floats (x, y, u, v)
const NUM_TRIS = (NUM_ROWS - 1) * (NUM_COLS - 1) * 2;
const GL_VERTS = new Float32Array(NUM_TRIS * 3 * 4);

function deformMeshForFrame(frame: AvatarComputedFrame) {
  const rad = (frame.tilt * Math.PI) / 180;
  const cosT = Math.cos(rad);
  const sinT = Math.sin(rad);

  const open = frame.open;
  const roundness = frame.roundness;
  const spread = frame.spread;
  const jawDy = frame.jawDy;
  const eyeWide = frame.eyeWide ?? 0.12;
  const cheekLift = frame.cheekLift ?? 0.15;
  const intonation = frame.intonation ?? 0.22;
  const closeRatio = open <= REST_OPEN ? 1 - open / REST_OPEN : 0;
  const openRatio = open > REST_OPEN ? (open - REST_OPEN) / (1 - REST_OPEN) : 0;

  for (let r = 0; r < NUM_ROWS; r++) {
    for (let c = 0; c < NUM_COLS; c++) {
      const idx = r * NUM_COLS + c;
      let lx = REST_SX[idx];
      let ly = REST_SY[idx];

      // 1. Local Facial, Cheek, Eye, Brow & Labial Deformations (in head space before 3D head rotation)
      // A. Bilateral Eyebrow Lift & Intonation / Astonishment Arch (r=2..3, c=3..16)
      if (r === 3 && c >= 3 && c <= 16) {
        const isLeftBrow = c >= 3 && c <= 8;
        const isRightBrow = c >= 12 && c <= 16;
        const browWeight = isLeftBrow
          ? c === 3
            ? 0.65
            : c >= 4 && c <= 7
            ? 1.12 // Strong left eyebrow arch so left upper face is highly expressive
            : 0.85
          : isRightBrow
          ? c === 16
            ? 0.75
            : 1.05
          : 0.42; // Glabella
        const intonArch = isLeftBrow ? intonation * 1.65 : isRightBrow ? intonation * 1.45 : intonation * 0.6;
        ly -= (frame.eyebrowLift * 7.8 + intonArch) * browWeight;
        if (isLeftBrow) {
          lx -= frame.eyebrowLift * 0.65;
        } else if (isRightBrow) {
          lx += frame.eyebrowLift * 0.55;
        }
      } else if (r === 2 && c >= 3 && c <= 16) {
        const wForehead = c >= 3 && c <= 8 ? 1.1 : 0.95;
        ly -= (frame.eyebrowLift * 2.8 + intonation * 0.8) * wForehead;
      }

      // B. Upper & Lower Eyelids: Blinks, Winks, Gaze Saccades & Intonation / Astonishment Widening (r=4..5)
      if (r === 4) {
        if (c >= 3 && c <= 7) {
          const w = c === 5 ? 1.0 : c === 4 || c === 6 ? 0.68 : 0.32;
          const wideLift = (1 - frame.blinkLeft) * eyeWide * 3.6 * w;
          ly += frame.blinkLeft * 15.5 * w - wideLift + frame.gazeY * 0.52;
          lx += frame.gazeX * 0.52;
        } else if (c >= 13 && c <= 16) {
          const w = c === 15 ? 1.0 : c === 14 || c === 16 ? 0.65 : 0.32;
          const wideLift = (1 - frame.blinkRight) * eyeWide * 3.4 * w;
          ly += frame.blinkRight * 15.0 * w - wideLift + frame.gazeY * 0.52;
          lx += frame.gazeX * 0.52;
        }
      } else if (r === 5) {
        if (c >= 3 && c <= 7) {
          const w = c >= 4 && c <= 6 ? 1.0 : 0.48;
          // Lower lid widens slightly downward on astonishment (eyeWide) and lifts on warm smile/cheekLift
          ly += (eyeWide * 1.35 - cheekLift * 1.45) * w + frame.gazeY * 0.40;
          lx += frame.gazeX * 0.42;
        } else if (c >= 13 && c <= 16) {
          const w = c >= 14 && c <= 15 ? 1.0 : 0.48;
          ly += (eyeWide * 1.25 - cheekLift * 1.35) * w + frame.gazeY * 0.40;
          lx += frame.gazeX * 0.42;
        }
      }

      // B2. Mid-Cheeks, Left Zygoma & Sub-Nasale (r=6, c=2..16):
      // Ensures Aïsha's left cheek & cheekbone (c=2..7) and right cheek (c=12..16) move organically
      // with speech, cheekLift, jaw opening, and 3D head turn parallax!
      if (r === 6 && c >= 2 && c <= 16) {
        if (c >= 2 && c <= 7) {
          const leftCheekW = c === 4 || c === 5 ? 1.0 : c === 3 || c === 6 ? 0.82 : 0.45;
          ly += (-cheekLift * 2.6 + Math.max(0, jawDy) * 0.14 - intonation * 0.9) * leftCheekW;
          lx += (-cheekLift * 0.9 + frame.turn * 0.14 - roundness * 0.8) * leftCheekW;
        } else if (c >= 12 && c <= 16) {
          const rightCheekW = c === 14 || c === 15 ? 1.0 : 0.65;
          ly += (-cheekLift * 2.3 + Math.max(0, jawDy) * 0.12 - intonation * 0.75) * rightCheekW;
          lx += (cheekLift * 0.8 + frame.turn * 0.12 + roundness * 0.7) * rightCheekW;
        } else {
          // Sub-nasale / nose tip subtle prosodic flare
          ly -= intonation * 0.55;
        }
      }

      // B3. Left & Right Outer Cheeks, Nasolabial Folds & Mandible Angles (r=7..12, c=2..4 and c=15..16):
      // Eliminates any static left-face zone by coupling the left cheek & left jawline (x=318..442)
      // and right cheek/jawline (x=558..588) to the moving mandible, labial rounding/spread, and intonation!
      if (r >= 7 && r <= 12 && ((c >= 2 && c <= 4) || (c >= 15 && c <= 16))) {
        const isLeftZone = c <= 4;
        const colW =
          c === 4
            ? 0.72
            : c === 3
            ? 0.42
            : c === 2
            ? 0.18
            : c === 15
            ? 0.65
            : 0.34;
        const rowJawW =
          r === 7
            ? 0.16
            : r === 8
            ? 0.24
            : r === 9
            ? 0.34
            : r === 10
            ? 0.52
            : r === 11
            ? 0.68
            : 0.76; // r=12 gonion / jawline follows mandible!
        const smileLift = cheekLift * (r <= 9 ? 1.8 : 0.8) * colW;
        const leftRelease = isLeftZone && openRatio > 0 ? openRatio * 2.1 * colW : 0;
        ly += jawDy * rowJawW * colW + leftRelease - smileLift;
        const horizShift = isLeftZone
          ? (roundness * 1.4 - spread * 1.3 - openRatio * 0.8) * colW + frame.turn * 0.12 * colW
          : (-roundness * 1.2 + spread * 1.1 + openRatio * 0.6) * colW + frame.turn * 0.10 * colW;
        lx += horizShift;
      }

      // C. Natural Photographic Mouth, Teeth, Lips & Chin Kinematics (r=7..12, c=5..14)
      // - At rest (!speechActive), preserves the resting smile photo with gentle living micro-expression.
      // - During speech:
      //   * All 10 stations c=5..14 (including left corner c=5 and left mouth c=6..8) articulate actively!
      //   * Left-side smile-release uncurling levels the left lower lip so the left side of the mouth
      //     opens wide and symmetrically with the center and right!
      if (r >= 7 && r <= 12 && c >= 5 && c <= 14) {
        const speechActive = frame.mouthOpacity === '1';
        const baseRestX = lx;
        const baseRestY = ly;

        if (!speechActive && Math.abs(open - REST_OPEN) < 0.008) {
          // Even when silent & looking at the user, apply subtle bilateral breathing/intonation life on the left side
          const mIdx = c - 5;
          const leftAlive = mIdx <= 4 ? (1 - mIdx * 0.18) : 0.25;
          lx = baseRestX - (mIdx <= 4 ? cheekLift * 0.45 * leftAlive : -cheekLift * 0.35);
          ly = baseRestY - cheekLift * 0.55 * leftAlive + (r >= 10 ? frame.breathY * 0.22 : 0);
        } else {
          const mIdx = c - 5;
          const baseDome = STATION_DOME_W[mIdx];
          const normDist = (mIdx - 4.5) / 4.5;
          const roundNarrowing = Math.max(
            0.46,
            1 - roundness * Math.min(0.54, Math.abs(normDist) * 0.64)
          );
          const arcW = baseDome * roundNarrowing;

          // Symmetric inward lip rounding on French 'O', 'OU', 'U', 'ON', 'CH' vs outward stretch on 'I', 'É'
          const roundDx =
            r >= 7 && r <= 11
              ? (-normDist * roundness * 2.2 + normDist * spread * 1.4) *
                (1 - Math.abs(normDist) * 0.22)
              : 0;

          const origUpperLipH = UPPER_LIP_BOT_10[mIdx] - UPPER_LIP_TOP_10[mIdx];
          const origFullTeethH = Math.max(0.4, UPPER_TEETH_BOT_10[mIdx] - UPPER_LIP_BOT_10[mIdx]);
          const origLowerLipH = LOWER_LIP_BOT_10[mIdx] - LOWER_LIP_TOP_10[mIdx];

          // Upper incisors occupy ~42% of the resting smile tooth block (~4.6px at center),
          // while the lower 58% opens into the dark oral cavity as the jaw parts!
          const speakingUpperTeethH = origFullTeethH * (0.42 - roundness * 0.10 + spread * 0.06);

          // Left-side smile-release downward uncurling so left stations mIdx=0..4 open wide & level
          const leftReleaseDy = LEFT_SMILE_RELEASE_PX[mIdx] * openRatio;

          let targetY = baseRestY;

          if (open <= REST_OPEN) {
            const seamY =
              UPPER_LIP_BOT_10[mIdx] * 0.44 + LOWER_LIP_TOP_10[mIdx] * 0.56;
            const sealFactor = Math.pow(Math.min(1, Math.max(0, closeRatio)), 1.35);

            const openR8 = UPPER_LIP_BOT_10[mIdx] + roundness * 1.0 * arcW;
            const openR9 = openR8 + speakingUpperTeethH;
            const openR10 = LOWER_LIP_TOP_10[mIdx] - 2.0 * baseDome;

            const closedR8 = seamY - 0.06;
            const closedR9 = seamY;
            const closedR10 = seamY + 0.06;

            const curR8 = openR8 * (1 - sealFactor) + closedR8 * sealFactor;
            const curR9 = openR9 * (1 - sealFactor) + closedR9 * sealFactor;
            const curR10 = openR10 * (1 - sealFactor) + closedR10 * sealFactor;

            if (r === 7) {
              targetY = curR8 - origUpperLipH * (1 + sealFactor * 0.14);
            } else if (r === 8) {
              targetY = curR8;
            } else if (r === 9) {
              targetY = curR9;
            } else if (r === 10) {
              targetY = curR10;
            } else if (r === 11) {
              targetY = curR10 + origLowerLipH * (1 + sealFactor * 0.14);
            } else if (r === 12) {
              targetY = CHIN_JAW_10[mIdx] + jawDy * 0.56 * Math.max(0.45, arcW);
            }
          } else {
            // Active Vowel & Open Syllable Articulation (open > REST_OPEN):
            const upperLipShift =
              (-openRatio * (1 - roundness * 0.85) * 1.65 + roundness * 1.4 - intonation * 0.45) *
              arcW;
            const curR8 = UPPER_LIP_BOT_10[mIdx] + upperLipShift;
            const curR9 = curR8 + speakingUpperTeethH;
            const curR10 = LOWER_LIP_TOP_10[mIdx] + jawDy * arcW + leftReleaseDy;

            if (r === 7) {
              targetY = curR8 - origUpperLipH * (1 + roundness * 0.10);
            } else if (r === 8) {
              targetY = curR8;
            } else if (r === 9) {
              targetY = curR9;
            } else if (r === 10) {
              targetY = curR10;
            } else if (r === 11) {
              targetY =
                curR10 + origLowerLipH * (1 + roundness * 0.12 + openRatio * 0.06);
            } else if (r === 12) {
              targetY =
                CHIN_JAW_10[mIdx] + jawDy * Math.max(0.52, arcW) * 0.82 + leftReleaseDy * 0.65;
            }
          }

          lx = baseRestX + roundDx;
          ly = targetY;
        }
      }

      // 2. Global 3D Head Transform vs Neck Elasticity vs Bilateral Thoracic Breathing
      let headWeight = 0.0;
      if (r >= 1 && r <= 12 && c >= 1 && c <= 17) {
        headWeight = 1.0;
      }

      if (headWeight > 0) {
        // Apply 3D head rotation + translation around balanced cervical neck pivot (496, 468)
        const rx = lx - HEAD_PIVOT_X;
        const ry = ly - HEAD_PIVOT_Y;
        const rotX = HEAD_PIVOT_X + frame.turn + (rx * cosT - ry * sinT) * 1.012;
        const rotY = HEAD_PIVOT_Y + frame.nod + (rx * sinT + ry * cosT) * 1.012;

        // Secondary physical hair inertia on the left hair chignon (c=1..3, r=2..12), crown (r=1), and right hair (c=17)
        let hairExtraX = 0;
        let hairExtraY = 0;
        const lagDx = frame.hairLagTurn - frame.turn;
        const lagDy = frame.hairLagNod - frame.nod;
        if (c >= 1 && c <= 3) {
          const wHair = c === 2 ? 0.95 : c === 1 ? 0.75 : 0.48;
          hairExtraX = lagDx * wHair + frame.breathY * 0.28 * wHair;
          hairExtraY = lagDy * wHair + frame.breathY * 0.35 * wHair;
        } else if (r === 1 || c === 17) {
          hairExtraX = lagDx * 0.60;
          hairExtraY = lagDy * 0.60;
        }

        CUR_DX[idx] = rotX + hairExtraX;
        CUR_DY[idx] = rotY + hairExtraY;
      } else if (r === 13 && c >= 1 && c <= 17) {
        // Neck & collar transition row (y=518): active bilateral follow-through on both left (c=1..7) and right (c=11..17)
        const leftBoost = c <= 7 ? 1.15 : 1.0;
        CUR_DX[idx] = lx + frame.turn * 0.28 * leftBoost;
        CUR_DY[idx] =
          ly + frame.nod * 0.22 + frame.breathY * 0.75 + (c <= 7 ? -frame.tilt * 0.22 : frame.tilt * 0.18);
      } else if (r === 14 && c >= 1 && c <= 17) {
        // Shoulders & blazer lapels: bilateral thoracic breathing + natural posture accompaniment with intonation
        const isLeftShoulder = c <= 8;
        CUR_DX[idx] = lx + frame.turn * (isLeftShoulder ? 0.15 : 0.12);
        CUR_DY[idx] =
          ly +
          frame.breathY * (isLeftShoulder ? 1.12 : 1.0) +
          (isLeftShoulder ? -frame.tilt * 0.32 : frame.tilt * 0.26);
      } else {
        // Pinned outer studio border (r=0, r=15, c=0, c=18)
        CUR_DX[idx] = lx;
        CUR_DY[idx] = ly;
      }

      // Guarantee strict vertical monotonicity within each column so no triangle ever folds
      if (r > 0) {
        const prevIdx = (r - 1) * NUM_COLS + c;
        if (CUR_DY[idx] < CUR_DY[prevIdx] + 0.08) {
          CUR_DY[idx] = CUR_DY[prevIdx] + 0.08;
        }
      }
    }
  }
}

// Transform a point (x, y) in head space by the current 3D head pose
function transformHeadPoint(x: number, y: number, frame: AvatarComputedFrame): [number, number] {
  const rad = (frame.tilt * Math.PI) / 180;
  const cosT = Math.cos(rad);
  const sinT = Math.sin(rad);
  const rx = x - HEAD_PIVOT_X;
  const ry = y - HEAD_PIVOT_Y;
  return [
    HEAD_PIVOT_X + frame.turn + (rx * cosT - ry * sinT) * 1.012,
    HEAD_PIVOT_Y + frame.nod + (rx * sinT + ry * cosT) * 1.012,
  ];
}

export interface Wav2LipViewport {
  x: number;
  y: number;
  w: number;
  h: number;
}

class SharedWav2LipWebGLCore {
  private glCanvas: HTMLCanvasElement | null = null;
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private vbo: WebGLBuffer | null = null;
  private texture: WebGLTexture | null = null;
  private img: HTMLImageElement | null = null;
  private isReady = false;
  private posLoc = -1;
  private uvLoc = -1;

  constructor() {
    if (typeof document !== 'undefined') {
      this.init();
    }
  }

  private init() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = IMG_W;
      canvas.height = IMG_H;
      const gl = (canvas.getContext('webgl', {
        alpha: false,
        antialias: true,
        preserveDrawingBuffer: true,
      }) ||
        canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;

      if (gl) {
        this.glCanvas = canvas;
        this.gl = gl;
        this.setupShaders(gl);
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.img = img;
        if (this.gl) {
          this.uploadTexture(this.gl, img);
        }
        this.isReady = true;
      };
      img.src = imgTutrice;
    } catch {
      // Fallback cleanly if WebGL is unavailable
    }
  }

  private setupShaders(gl: WebGLRenderingContext) {
    const vsSource = `
      attribute vec2 a_pos;
      attribute vec2 a_uv;
      varying vec2 v_uv;
      void main() {
        vec2 clip = vec2(
          (a_pos.x / ${IMG_W}.0) * 2.0 - 1.0,
          1.0 - (a_pos.y / ${IMG_H}.0) * 2.0
        );
        gl_Position = vec4(clip, 0.0, 1.0);
        v_uv = a_uv;
      }
    `;
    const fsSource = `
      precision mediump float;
      varying vec2 v_uv;
      uniform sampler2D u_tex;
      void main() {
        gl_FragColor = texture2D(u_tex, v_uv);
      }
    `;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, vsSource);
    const fs = compile(gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return;

    const prog = gl.createProgram();
    if (!prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

    this.program = prog;
    this.posLoc = gl.getAttribLocation(prog, 'a_pos');
    this.uvLoc = gl.getAttribLocation(prog, 'a_uv');
    this.vbo = gl.createBuffer();
  }

  private uploadTexture(gl: WebGLRenderingContext, img: HTMLImageElement) {
    const tex = gl.createTexture();
    if (!tex) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    this.texture = tex;
  }

  public renderWarpedFullFrame(frame: AvatarComputedFrame): HTMLCanvasElement | HTMLImageElement | null {
    if (!this.isReady || !this.img) return null;

    deformMeshForFrame(frame);

    const gl = this.gl;
    if (!gl || !this.program || !this.vbo || !this.texture || !this.glCanvas) {
      return this.img;
    }

    // Populate interleaved vertex buffer (x, y, u, v) for all 540 triangles
    let ptr = 0;
    const emit = (r: number, c: number) => {
      const idx = r * NUM_COLS + c;
      GL_VERTS[ptr++] = CUR_DX[idx];
      GL_VERTS[ptr++] = CUR_DY[idx];
      GL_VERTS[ptr++] = REST_SX[idx] / IMG_W;
      GL_VERTS[ptr++] = REST_SY[idx] / IMG_H;
    };

    for (let r = 0; r < NUM_ROWS - 1; r++) {
      for (let c = 0; c < NUM_COLS - 1; c++) {
        // Triangle 1
        emit(r, c);
        emit(r, c + 1);
        emit(r + 1, c);
        // Triangle 2
        emit(r, c + 1);
        emit(r + 1, c + 1);
        emit(r + 1, c);
      }
    }

    gl.viewport(0, 0, IMG_W, IMG_H);
    gl.useProgram(this.program);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
    gl.bufferData(gl.ARRAY_BUFFER, GL_VERTS, gl.DYNAMIC_DRAW);

    gl.enableVertexAttribArray(this.posLoc);
    gl.vertexAttribPointer(this.posLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(this.uvLoc);
    gl.vertexAttribPointer(this.uvLoc, 2, gl.FLOAT, false, 16, 8);

    gl.drawArrays(gl.TRIANGLES, 0, NUM_TRIS * 3);
    return this.glCanvas;
  }

  public renderToTargetCanvas(
    targetCanvas: HTMLCanvasElement,
    viewport: Wav2LipViewport,
    frame: AvatarComputedFrame,
    sourceSurface: HTMLCanvasElement | HTMLImageElement | null
  ) {
    if (!sourceSurface) return;
    const ctx = targetCanvas.getContext('2d');
    if (!ctx) return;

    const cw = targetCanvas.width;
    const ch = targetCanvas.height;
    if (cw === 0 || ch === 0) return;

    // 1. Draw the WebGL mesh-warped frame cropped to viewport with "xMidYMid slice" aspect fill
    const scale = Math.max(cw / viewport.w, ch / viewport.h);
    const drawW = cw / scale;
    const drawH = ch / scale;
    const sx = viewport.x + (viewport.w - drawW) * 0.5;
    const sy = viewport.y + (viewport.h - drawH) * 0.5;

    ctx.save();
    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(sourceSurface, sx, sy, drawW, drawH, 0, 0, cw, ch);

    // Map full-image coordinates (0..928, 0..1152) into targetCanvas coordinates
    ctx.scale(scale, scale);
    ctx.translate(-sx, -sy);

    // 2. Natural Oral Cavity & Tongue strictly below the upper incisors when speaking (open > 0.025)
    const speechActive = frame.mouthOpacity === '1';
    const cavOpacity = parseFloat(frame.cavityOpacity || '0');
    if (speechActive && cavOpacity > 0.02 && frame.open > 0.025) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, cavOpacity);

      const roundPinch = frame.roundness || 0;
      const topPts: [number, number][] = [];
      const botPts: [number, number][] = [];
      for (let m = 0; m < 10; m++) {
        const c = 5 + m;
        const iTop = 9 * NUM_COLS + c;
        const iBot = 10 * NUM_COLS + c;
        const tx = CUR_DX[iTop];
        const ty = CUR_DY[iTop];
        const bx = CUR_DX[iBot];
        const by = CUR_DY[iBot];

        const lateralFactor =
          m === 0 || m === 9
            ? 1.0
            : m === 1 || m === 8
            ? 0.14 + roundPinch * 0.28
            : m === 2 || m === 7
            ? roundPinch * 0.16
            : 0;
        const midY = (ty + by) * 0.5;
        const effTy = ty * (1 - lateralFactor) + midY * lateralFactor - (m >= 1 && m <= 8 ? 0.35 : 0);
        const effBy = by * (1 - lateralFactor) + midY * lateralFactor + (m >= 1 && m <= 8 ? 0.85 : 0);

        topPts.push([tx, effTy]);
        botPts.push([bx, Math.max(effTy + 0.15, effBy)]);
      }

      ctx.beginPath();
      ctx.moveTo(topPts[0][0], topPts[0][1]);
      for (let i = 0; i < 9; i++) {
        const p0 = topPts[Math.max(0, i - 1)];
        const p1 = topPts[i];
        const p2 = topPts[i + 1];
        const p3 = topPts[Math.min(9, i + 2)];
        ctx.bezierCurveTo(
          p1[0] + (p2[0] - p0[0]) / 6,
          p1[1] + (p2[1] - p0[1]) / 6,
          p2[0] - (p3[0] - p1[0]) / 6,
          p2[1] - (p3[1] - p1[1]) / 6,
          p2[0],
          p2[1]
        );
      }
      for (let i = 9; i > 0; i--) {
        const p0 = botPts[Math.min(9, i + 1)];
        const p1 = botPts[i];
        const p2 = botPts[i - 1];
        const p3 = botPts[Math.max(0, i - 2)];
        ctx.bezierCurveTo(
          p1[0] + (p2[0] - p0[0]) / 6,
          p1[1] + (p2[1] - p0[1]) / 6,
          p2[0] - (p3[0] - p1[0]) / 6,
          p2[1] - (p3[1] - p1[1]) / 6,
          p2[0],
          p2[1]
        );
      }
      ctx.closePath();

      const midTopY = (topPts[4][1] + topPts[5][1]) * 0.5;
      const midBotY = Math.max(midTopY + 2, (botPts[4][1] + botPts[5][1]) * 0.5);
      const oralGrad = ctx.createLinearGradient(0, midTopY, 0, midBotY);
      oralGrad.addColorStop(0, '#160307');
      oralGrad.addColorStop(0.48, '#2D0810');
      oralGrad.addColorStop(1, '#150206');
      ctx.fillStyle = oralGrad;
      ctx.fill();

      // Subtle natural tongue clipped strictly inside the oral cavity
      ctx.save();
      ctx.clip();

      const tOp = parseFloat(frame.tongueOpacity || '0');
      if (tOp > 0.02) {
        ctx.save();
        ctx.globalAlpha = Math.min(0.88, cavOpacity * tOp);
        const midTopX = (topPts[4][0] + topPts[5][0]) * 0.5;
        const midTopY2 = (topPts[4][1] + topPts[5][1]) * 0.5;
        const midBotX = (botPts[4][0] + botPts[5][0]) * 0.5;
        const midBotY2 = (botPts[4][1] + botPts[5][1]) * 0.5;
        const liftRatio = Math.min(0.76, 0.30 + (frame.tongueLift || 0) * 0.44);
        const tcx = midBotX * (1 - liftRatio) + midTopX * liftRatio;
        const tcy = midBotY2 * (1 - liftRatio) + midTopY2 * liftRatio;
        const trx = parseFloat(frame.tongueRx || '16.0') * 0.84;
        const tryVal = parseFloat(frame.tongueRy || '4.2');
        const tGrad = ctx.createRadialGradient(
          tcx - 1.0,
          tcy - tryVal * 0.3,
          1.0,
          tcx,
          tcy,
          Math.max(trx, tryVal)
        );
        tGrad.addColorStop(0, '#C25462');
        tGrad.addColorStop(0.65, '#963644');
        tGrad.addColorStop(1, '#581822');
        ctx.beginPath();
        ctx.ellipse(
          tcx,
          tcy,
          trx,
          tryVal,
          (frame.tilt * Math.PI) / 180 + 0.08,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = tGrad;
        ctx.fill();
        ctx.restore();
      }

      ctx.restore();
      ctx.restore();
    }

    // 3. Photorealistic Eyelid Skin & Lash Crease on Blinks / Winks
    if (frame.blinkLeft > 0.05) {
      const [x0, y0] = transformHeadPoint(434, 299, frame);
      const [xTop, yTop] = transformHeadPoint(456, 285.5, frame);
      const [xc, yc] = transformHeadPoint(456, 287 + frame.blinkLeft * 20.8, frame);
      const [x1, y1] = transformHeadPoint(479, 302, frame);
      ctx.save();
      ctx.globalAlpha = Math.min(1, frame.blinkLeft * 1.15);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(xTop, yTop, x1, y1);
      ctx.quadraticCurveTo(xc, yc, x0, y0);
      ctx.closePath();
      const lidGrad = ctx.createLinearGradient(0, yTop, 0, yc);
      lidGrad.addColorStop(0, '#A26850');
      lidGrad.addColorStop(0.65, '#86503B');
      lidGrad.addColorStop(1, '#5D3222');
      ctx.fillStyle = lidGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(xc, yc, x1, y1);
      ctx.strokeStyle = '#180805';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    if (frame.blinkRight > 0.05) {
      const [x0, y0] = transformHeadPoint(547, 304, frame);
      const [xTop, yTop] = transformHeadPoint(565, 286.5, frame);
      const [xc, yc] = transformHeadPoint(567, 288 + frame.blinkRight * 19.8, frame);
      const [x1, y1] = transformHeadPoint(585, 294, frame);
      ctx.save();
      ctx.globalAlpha = Math.min(1, frame.blinkRight * 1.15);
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(xTop, yTop, x1, y1);
      ctx.quadraticCurveTo(xc, yc, x0, y0);
      ctx.closePath();
      const lidGrad = ctx.createLinearGradient(0, yTop, 0, yc);
      lidGrad.addColorStop(0, '#85513D');
      lidGrad.addColorStop(0.65, '#693B2A');
      lidGrad.addColorStop(1, '#482518');
      ctx.fillStyle = lidGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(xc, yc, x1, y1);
      ctx.strokeStyle = '#160704';
      ctx.lineWidth = 1.6;
      ctx.lineCap = 'round';
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }
}

export const wav2lipWebGLCore = new SharedWav2LipWebGLCore();

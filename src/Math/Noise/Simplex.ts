import { Noise } from "./Noise.ts";
import * as Common from "../common.ts";

// ---------------------------------------------------------------------------
// Skew / unskew constants
// ---------------------------------------------------------------------------

// 2D: triangle grid
const F2 = 0.5 * (Math.sqrt(3) - 1); // ≈ 0.3660
const G2 = (3 - Math.sqrt(3)) / 6; // ≈ 0.2113

// 3D: tetrahedral grid
const F3 = 1 / 3;
const G3 = 1 / 6;

/**
 * Simplex noise (2D & 3D).
 *
 * Faster and has fewer directional artifacts than classic Perlin noise.
 * Uses the same seeded permutation table and API surface as {@link PerlinNoise},
 * so the two are fully interchangeable.
 *
 * @example
 * ```ts
 * const noise = new SimplexNoise(42);
 * const value = noise.sample2D(1.5, 2.3);   // in [-1, 1]
 * const cloud = noise.turbulence2D(x, y, 6); // billowy
 * ```
 */
export class SimplexNoise extends Noise {
  constructor(seed: number = 0) {
    super(seed);
  }

  // ---------------------------------------------------------------------------
  // 2D
  // ---------------------------------------------------------------------------

  override sample2D(x: number, y: number): number {
    const perm = this._perm;

    // Skew input space to determine which simplex cell we're in
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    // Unskew cell origin back to (x, y) space
    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;

    // Offsets from cell origin for the first corner
    const x0 = x - X0;
    const y0 = y - Y0;

    // Determine which simplex triangle we're in
    // Upper triangle: (0,0)->(1,0)->(1,1)
    // Lower triangle: (0,0)->(0,1)->(1,1)
    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0;
    } else {
      i1 = 0;
      j1 = 1;
    }

    // Offsets for second corner (relative to skewed simplex)
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;

    // Offsets for third corner (the shared vertex at (1,1))
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    // Wrap to 0..255 for permutation lookup
    const ii = i & 255;
    const jj = j & 255;

    // Hash each corner
    const g0 = perm[ii + perm[jj]!]!;
    const g1 = perm[ii + i1 + perm[jj + j1]!]!;
    const g2 = perm[ii + 1 + perm[jj + 1]!]!;

    // Corner contributions
    let n0 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * Common.grad2D(g0, x0, y0);
    }

    let n1 = 0;
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * Common.grad2D(g1, x1, y1);
    }

    let n2 = 0;
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * Common.grad2D(g2, x2, y2);
    }

    // Scale to [-1, 1]
    return 70.0 * (n0 + n1 + n2);
  }

  // ---------------------------------------------------------------------------
  // 3D
  // ---------------------------------------------------------------------------

  override sample3D(x: number, y: number, z: number): number {
    const perm = this._perm;

    // Skew input space
    const s = (x + y + z) * F3;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);

    // Unskew cell origin
    const t = (i + j + k) * G3;
    const X0 = i - t;
    const Y0 = j - t;
    const Z0 = k - t;

    // Offsets from cell origin
    const x0 = x - X0;
    const y0 = y - Y0;
    const z0 = z - Z0;

    // Determine which simplex tetrahedron we're in (6 possible orderings)
    let i1: number, j1: number, k1: number;
    let i2: number, j2: number, k2: number;

    if (x0 >= y0) {
      if (y0 >= z0) {
        // X >= Y >= Z
        i1 = 1; j1 = 0; k1 = 0;
        i2 = 1; j2 = 1; k2 = 0;
      } else if (x0 >= z0) {
        // X >= Z > Y
        i1 = 1; j1 = 0; k1 = 0;
        i2 = 1; j2 = 0; k2 = 1;
      } else {
        // Z > X >= Y
        i1 = 0; j1 = 0; k1 = 1;
        i2 = 1; j2 = 0; k2 = 1;
      }
    } else {
      if (y0 < z0) {
        // Z > Y > X
        i1 = 0; j1 = 0; k1 = 1;
        i2 = 0; j2 = 1; k2 = 1;
      } else if (x0 < z0) {
        // Y >= Z > X
        i1 = 0; j1 = 1; k1 = 0;
        i2 = 0; j2 = 1; k2 = 1;
      } else {
        // Y > X >= Z
        i1 = 0; j1 = 1; k1 = 0;
        i2 = 1; j2 = 1; k2 = 0;
      }
    }

    // Offsets for 2nd, 3rd, and 4th corners
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;

    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;

    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;

    // Wrap for permutation lookup
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;

    // Hash each corner
    const g0 = perm[ii + perm[jj + perm[kk]!]!]!;
    const g1 = perm[ii + i1 + perm[jj + j1 + perm[kk + k1]!]!]!;
    const g2 = perm[ii + i2 + perm[jj + j2 + perm[kk + k2]!]!]!;
    const g3 = perm[ii + 1 + perm[jj + 1 + perm[kk + 1]!]!]!;

    // Corner contributions
    let n0 = 0;
    let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * Common.grad3D(g0, x0, y0, z0);
    }

    let n1 = 0;
    let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * Common.grad3D(g1, x1, y1, z1);
    }

    let n2 = 0;
    let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * Common.grad3D(g2, x2, y2, z2);
    }

    let n3 = 0;
    let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
    if (t3 >= 0) {
      t3 *= t3;
      n3 = t3 * t3 * Common.grad3D(g3, x3, y3, z3);
    }

    // Scale to [-1, 1]
    return 32.0 * (n0 + n1 + n2 + n3);
  }
}

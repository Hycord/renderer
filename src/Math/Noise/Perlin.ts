import { lerp } from "../common.ts";
import { Noise } from "./Noise.ts";
import * as Common from "../common.ts";

/**
 * Classic Perlin "improved noise" (2002 revision).
 *
 * Uses the shared seeded permutation table from {@link Noise} and pure-scalar
 * gradient dot-product helpers — zero heap allocations in the sample hot path.
 *
 * @example
 * ```ts
 * const noise = new PerlinNoise(42);
 * const value = noise.sample2D(1.5, 2.3); // in [-1, 1]
 * const terrain = noise.fbm2D(x, y, 6);  // fractalized
 * ```
 */
export class PerlinNoise extends Noise {
  constructor(seed: number = 0) {
    super(seed);
  }

  // ---------------------------------------------------------------------------
  // 2D
  // ---------------------------------------------------------------------------

  override sample2D(x: number, y: number): number {
    const perm = this._perm;

    // Grid cell coordinates
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;

    // Local coordinates within cell [0, 1)
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    // Fade curves
    const u = Noise.fade(xf);
    const v = Noise.fade(yf);

    // Hash the four corners
    const aa = perm[perm[xi]! + yi]!;
    const ab = perm[perm[xi]! + yi + 1]!;
    const ba = perm[perm[xi + 1]! + yi]!;
    const bb = perm[perm[xi + 1]! + yi + 1]!;

    // Gradient dot products at each corner
    const n00 = Common.grad2D(aa, xf, yf);
    const n10 = Common.grad2D(ba, xf - 1, yf);
    const n01 = Common.grad2D(ab, xf, yf - 1);
    const n11 = Common.grad2D(bb, xf - 1, yf - 1);

    // Bilinear interpolation
    const nx0 = lerp(n00, n10, u);
    const nx1 = lerp(n01, n11, u);

    return lerp(nx0, nx1, v);
  }

  // ---------------------------------------------------------------------------
  // 3D
  // ---------------------------------------------------------------------------

  override sample3D(x: number, y: number, z: number): number {
    const perm = this._perm;

    // Grid cell coordinates
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;

    // Local coordinates within cell [0, 1)
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    // Fade curves
    const u = Noise.fade(xf);
    const v = Noise.fade(yf);
    const w = Noise.fade(zf);

    // Hash the eight corners
    const a = perm[xi]! + yi;
    const aa = perm[a]! + zi;
    const ab = perm[a + 1]! + zi;
    const b = perm[xi + 1]! + yi;
    const ba = perm[b]! + zi;
    const bb = perm[b + 1]! + zi;

    // Gradient dot products at each corner
    const n000 = Common.grad3D(perm[aa]!, xf, yf, zf);
    const n100 = Common.grad3D(perm[ba]!, xf - 1, yf, zf);
    const n010 = Common.grad3D(perm[ab]!, xf, yf - 1, zf);
    const n110 = Common.grad3D(perm[bb]!, xf - 1, yf - 1, zf);
    const n001 = Common.grad3D(perm[aa + 1]!, xf, yf, zf - 1);
    const n101 = Common.grad3D(perm[ba + 1]!, xf - 1, yf, zf - 1);
    const n011 = Common.grad3D(perm[ab + 1]!, xf, yf - 1, zf - 1);
    const n111 = Common.grad3D(perm[bb + 1]!, xf - 1, yf - 1, zf - 1);

    // Trilinear interpolation
    const nx00 = lerp(n000, n100, u);
    const nx10 = lerp(n010, n110, u);
    const nx01 = lerp(n001, n101, u);
    const nx11 = lerp(n011, n111, u);

    const nxy0 = lerp(nx00, nx10, v);
    const nxy1 = lerp(nx01, nx11, v);

    return lerp(nxy0, nxy1, w);
  }
}

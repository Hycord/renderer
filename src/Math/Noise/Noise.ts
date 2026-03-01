import { lerp } from "../common.ts";

/**
 * Abstract base class for coherent noise generators.
 *
 * Provides a seeded permutation table shared by all subclasses (Perlin, Simplex, etc.),
 * plus higher-order noise composition methods (FBM, turbulence, ridged) that work
 * with any noise implementation via the abstract `sample2D` / `sample3D` methods.
 *
 * Output range for all `sample*` methods is [-1, 1].
 */
export abstract class Noise {
  /** Permutation table — 512 entries (256 doubled) for wrap-free indexing. */
  protected readonly _perm: Uint8Array;

  /** Seed used to generate the permutation table. */
  public readonly seed: number;

  constructor(seed: number = 0) {
    this.seed = seed;
    this._perm = Noise._buildPermutation(seed);
  }

  // ---------------------------------------------------------------------------
  // Abstract — subclasses must implement
  // ---------------------------------------------------------------------------

  /** Sample 2D noise at (x, y). Returns a value in [-1, 1]. */
  abstract sample2D(x: number, y: number): number;

  /** Sample 3D noise at (x, y, z). Returns a value in [-1, 1]. */
  abstract sample3D(x: number, y: number, z: number): number;

  // ---------------------------------------------------------------------------
  // Smoothstep (shared by Perlin & Simplex)
  // ---------------------------------------------------------------------------

  /** Ken Perlin's improved smoothstep: 6t⁵ − 15t⁴ + 10t³ */
  protected static fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // ---------------------------------------------------------------------------
  // Composition methods — work with any noise subclass
  // ---------------------------------------------------------------------------

  /**
   * Fractal Brownian Motion (2D).
   * Sums multiple octaves of noise at increasing frequency and decreasing amplitude.
   */
  fbm2D(
    x: number,
    y: number,
    octaves: number = 6,
    lacunarity: number = 2.0,
    gain: number = 0.5,
  ): number {
    let sum = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      sum += this.sample2D(x * frequency, y * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return sum / maxAmplitude;
  }

  /**
   * Fractal Brownian Motion (3D).
   */
  fbm3D(
    x: number,
    y: number,
    z: number,
    octaves: number = 6,
    lacunarity: number = 2.0,
    gain: number = 0.5,
  ): number {
    let sum = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      sum +=
        this.sample3D(x * frequency, y * frequency, z * frequency) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return sum / maxAmplitude;
  }

  /**
   * Turbulence (2D).
   * Like FBM but sums `|sample|` — produces billowy, cloud-like patterns.
   */
  turbulence2D(
    x: number,
    y: number,
    octaves: number = 6,
    lacunarity: number = 2.0,
    gain: number = 0.5,
  ): number {
    let sum = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      sum +=
        Math.abs(this.sample2D(x * frequency, y * frequency)) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return sum / maxAmplitude;
  }

  /**
   * Turbulence (3D).
   */
  turbulence3D(
    x: number,
    y: number,
    z: number,
    octaves: number = 6,
    lacunarity: number = 2.0,
    gain: number = 0.5,
  ): number {
    let sum = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      sum +=
        Math.abs(
          this.sample3D(x * frequency, y * frequency, z * frequency),
        ) * amplitude;
      maxAmplitude += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return sum / maxAmplitude;
  }

  /**
   * Ridged noise (2D).
   * Uses `1 - |sample|` per octave — produces sharp ridge-like features (terrain, veins).
   */
  ridged2D(
    x: number,
    y: number,
    octaves: number = 6,
    lacunarity: number = 2.0,
    gain: number = 0.5,
  ): number {
    let sum = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      const signal =
        1 - Math.abs(this.sample2D(x * frequency, y * frequency));
      sum += signal * signal * amplitude;
      maxAmplitude += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return sum / maxAmplitude;
  }

  /**
   * Ridged noise (3D).
   */
  ridged3D(
    x: number,
    y: number,
    z: number,
    octaves: number = 6,
    lacunarity: number = 2.0,
    gain: number = 0.5,
  ): number {
    let sum = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxAmplitude = 0;

    for (let i = 0; i < octaves; i++) {
      const signal =
        1 -
        Math.abs(this.sample3D(x * frequency, y * frequency, z * frequency));
      sum += signal * signal * amplitude;
      maxAmplitude += amplitude;
      amplitude *= gain;
      frequency *= lacunarity;
    }

    return sum / maxAmplitude;
  }

  // ---------------------------------------------------------------------------
  // Seeded permutation table
  // ---------------------------------------------------------------------------

  /**
   * Build a deterministic 512-entry permutation table from a seed.
   * Uses xorshift32 as a fast, seedable PRNG + Fisher-Yates shuffle.
   */
  private static _buildPermutation(seed: number): Uint8Array {
    // Initialize xorshift32 state — ensure non-zero
    let state = (seed | 0) !== 0 ? seed | 0 : 1;

    const xorshift32 = (): number => {
      state ^= state << 13;
      state ^= state >> 17;
      state ^= state << 5;
      return (state >>> 0); // unsigned
    };

    // Fill 0..255
    const base = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      base[i] = i;
    }

    // Fisher-Yates shuffle
    for (let i = 255; i > 0; i--) {
      const j = xorshift32() % (i + 1);
      const tmp = base[i]!;
      base[i] = base[j]!;
      base[j] = tmp;
    }

    // Double to 512 to avoid modular indexing in hot paths
    const perm = new Uint8Array(512);
    for (let i = 0; i < 256; i++) {
      perm[i] = base[i]!;
      perm[i + 256] = base[i]!;
    }

    return perm;
  }
}
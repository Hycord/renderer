import { Vector } from "../Vector";
import * as Common from "../common";

/**
 * How to handle endpoints of an open Catmull-Rom chain:
 *
 * - `'clamped'`  – duplicate the first / last control point.
 * - `'natural'`  – linearly extrapolate a phantom point so the end
 *                  tangent matches the direction of the last segment.
 * - `'closed'`   – wrap indices so the spline forms a loop.
 */
export type EndpointMode = "clamped" | "natural" | "closed";

// ────────────────────────────────────────────────────────────────
// CatmullRomSegment — single segment between p1 and p2
// ────────────────────────────────────────────────────────────────

/**
 * A single Catmull-Rom segment defined by four control points.
 * The curve passes through **p1** (t = 0) and **p2** (t = 1),
 * while **p0** and **p3** influence the tangent direction.
 *
 * @param alpha Knot parameterisation:
 *   - `0`   — uniform  (constant speed, may overshoot)
 *   - `0.5` — centripetal  (no cusps or self-intersections)
 *   - `1`   — chordal  (follows chord lengths)
 */
export class CatmullRomSegment {
  constructor(
    public readonly p0: Vector,
    public readonly p1: Vector,
    public readonly p2: Vector,
    public readonly p3: Vector,
    public readonly alpha: number = 0,
  ) {}

  // ── Evaluation ─────────────────────────────────────────────

  /** Position on the curve at parameter t ∈ [0, 1]. */
  getPoint(t: number): Vector {
    if (this.alpha === 0) {
      return CatmullRomSegment._uniformPoint(
        this.p0,
        this.p1,
        this.p2,
        this.p3,
        t,
      );
    }
    return this._barryGoldmanPoint(t);
  }

  /** First derivative (tangent / velocity) at t ∈ [0, 1]. */
  velocity(t: number): Vector {
    if (this.alpha === 0) {
      return CatmullRomSegment._uniformVelocity(
        this.p0,
        this.p1,
        this.p2,
        this.p3,
        t,
      );
    }
    return this._numericalDerivative(t);
  }

  /** Second derivative (acceleration) at t ∈ [0, 1]. */
  acceleration(t: number): Vector {
    if (this.alpha === 0) {
      return CatmullRomSegment._uniformAcceleration(
        this.p0,
        this.p1,
        this.p2,
        this.p3,
        t,
      );
    }
    return this._numericalSecondDerivative(t);
  }

  // ── Uniform (alpha = 0): exact closed-form via basis matrix ─

  /**
   * q(t) = 0.5 · [2P₁ + (−P₀+P₂)t + (2P₀−5P₁+4P₂−P₃)t² + (−P₀+3P₁−3P₂+P₃)t³]
   */
  private static _uniformPoint(
    p0: Vector,
    p1: Vector,
    p2: Vector,
    p3: Vector,
    t: number,
  ): Vector {
    const t2 = t * t;
    const t3 = t2 * t;

    return p0
      .scale(-0.5 * t3 + t2 - 0.5 * t)
      .add(p1.scale(1.5 * t3 - 2.5 * t2 + 1))
      .add(p2.scale(-1.5 * t3 + 2 * t2 + 0.5 * t))
      .add(p3.scale(0.5 * t3 - 0.5 * t2));
  }

  /** q′(t) — derivative of the uniform basis form. */
  private static _uniformVelocity(
    p0: Vector,
    p1: Vector,
    p2: Vector,
    p3: Vector,
    t: number,
  ): Vector {
    const t2 = t * t;

    return p0
      .scale(-1.5 * t2 + 2 * t - 0.5)
      .add(p1.scale(4.5 * t2 - 5 * t))
      .add(p2.scale(-4.5 * t2 + 4 * t + 0.5))
      .add(p3.scale(1.5 * t2 - t));
  }

  /** q″(t) — second derivative of the uniform basis form. */
  private static _uniformAcceleration(
    p0: Vector,
    p1: Vector,
    p2: Vector,
    p3: Vector,
    t: number,
  ): Vector {
    return p0
      .scale(-3 * t + 2)
      .add(p1.scale(9 * t - 5))
      .add(p2.scale(-9 * t + 4))
      .add(p3.scale(3 * t - 1));
  }

  // ── General (alpha ≠ 0): Barry-Goldman recursive lerp ──────

  /**
   * Evaluates the segment using the Barry-Goldman pyramid algorithm,
   * which supports centripetal (α = 0.5) and chordal (α = 1) parameterisation.
   */
  private _barryGoldmanPoint(t: number): Vector {
    const { p0, p1, p2, p3, alpha } = this;

    // Knot values
    const t0 = 0;
    const t1 = t0 + Math.pow(p0.distanceSquared(p1), alpha * 0.5);
    const t2 = t1 + Math.pow(p1.distanceSquared(p2), alpha * 0.5);
    const t3 = t2 + Math.pow(p2.distanceSquared(p3), alpha * 0.5);

    // Map input t from [0, 1] → [t1, t2]
    const tt = Common.lerp(t1, t2, t);

    // First level
    const A1 = p0
      .scale((t1 - tt) / (t1 - t0))
      .add(p1.scale((tt - t0) / (t1 - t0)));
    const A2 = p1
      .scale((t2 - tt) / (t2 - t1))
      .add(p2.scale((tt - t1) / (t2 - t1)));
    const A3 = p2
      .scale((t3 - tt) / (t3 - t2))
      .add(p3.scale((tt - t2) / (t3 - t2)));

    // Second level
    const B1 = A1
      .scale((t2 - tt) / (t2 - t0))
      .add(A2.scale((tt - t0) / (t2 - t0)));
    const B2 = A2
      .scale((t3 - tt) / (t3 - t1))
      .add(A3.scale((tt - t1) / (t3 - t1)));

    // Third level — the point on the curve
    return B1
      .scale((t2 - tt) / (t2 - t1))
      .add(B2.scale((tt - t1) / (t2 - t1)));
  }

  /** Central-difference numerical first derivative for the general case. */
  private _numericalDerivative(t: number, h: number = 1e-5): Vector {
    const lo = Math.max(0, t - h);
    const hi = Math.min(1, t + h);
    const dt = hi - lo;
    return this.getPoint(hi).subtract(this.getPoint(lo)).scale(1 / dt);
  }

  /** Central-difference numerical second derivative for the general case. */
  private _numericalSecondDerivative(t: number, h: number = 1e-5): Vector {
    const lo = Math.max(0, t - h);
    const hi = Math.min(1, t + h);
    const dt = hi - lo;
    return this.velocity(hi).subtract(this.velocity(lo)).scale(1 / dt);
  }
}

// ────────────────────────────────────────────────────────────────
// CatmullRomChain — smooth spline through an ordered set of points
// ────────────────────────────────────────────────────────────────

/**
 * A piecewise Catmull-Rom spline that passes smoothly through every
 * point in the supplied array.
 *
 * A global parameter **t ∈ [0, 1]** is mapped uniformly across all
 * segments so that `getPoint(0)` returns the first point and
 * `getPoint(1)` returns the last (or loops back to the first when
 * `mode = 'closed'`).
 *
 * @example
 * ```ts
 * const chain = new CatmullRomChain(
 *   [new Vector(0,0), new Vector(1,2), new Vector(3,1), new Vector(4,3)],
 *   'natural',
 *   0.5,  // centripetal
 * );
 * const midpoint = chain.getPoint(0.5);
 * const samples  = chain.getPoints(60);
 * ```
 */
export class CatmullRomChain {
  private _segments: CatmullRomSegment[];
  private _points: Vector[];

  /**
   * @param points  At least 2 points that the curve will pass through.
   * @param mode    Endpoint handling strategy (default `'clamped'`).
   * @param alpha   Knot parameterisation: 0 = uniform, 0.5 = centripetal, 1 = chordal.
   */
  constructor(
    points: Vector[],
    public readonly mode: EndpointMode = "clamped",
    public readonly alpha: number = 0,
  ) {
    if (points.length < 2) {
      throw new Error("CatmullRomChain requires at least 2 points.");
    }
    this._points = points.map((p) => p.clone());
    this._segments = this._buildSegments();
  }

  // ── Accessors ──────────────────────────────────────────────

  /** Number of curve segments. */
  get segmentCount(): number {
    return this._segments.length;
  }

  /** Read-only view of the control points. */
  get points(): readonly Vector[] {
    return this._points;
  }

  /** Retrieve a single segment by index. */
  getSegment(index: number): CatmullRomSegment {
    if (index < 0 || index >= this._segments.length) {
      throw new Error(
        `Segment index ${index} out of bounds [0, ${this._segments.length}).`,
      );
    }
    return this._segments[index]!;
  }

  // ── Evaluation ─────────────────────────────────────────────

  /** Position at global parameter t ∈ [0, 1]. */
  getPoint(t: number): Vector {
    const { segment, localT } = this._mapParameter(t);
    return segment.getPoint(localT);
  }

  /** Tangent vector at global parameter t ∈ [0, 1]. */
  velocity(t: number): Vector {
    const { segment, localT } = this._mapParameter(t);
    return segment.velocity(localT);
  }

  /** Acceleration at global parameter t ∈ [0, 1]. */
  acceleration(t: number): Vector {
    const { segment, localT } = this._mapParameter(t);
    return segment.acceleration(localT);
  }

  // ── Sampling helpers ───────────────────────────────────────

  /**
   * Sample `count` points equally spaced **in parameter space**.
   * Returns an array of length `count` from t = 0 to t = 1 inclusive.
   */
  getPoints(count: number): Vector[] {
    if (count < 2) throw new Error("getPoints requires count >= 2.");
    const result: Vector[] = [];
    for (let i = 0; i < count; i++) {
      result.push(this.getPoint(i / (count - 1)));
    }
    return result;
  }

  /**
   * Approximate total arc length by summing straight-line distances
   * between `sampleCount` evenly-spaced parameter samples.
   */
  approximateLength(sampleCount: number = 100): number {
    const pts = this.getPoints(sampleCount);
    let length = 0;
    for (let i = 1; i < pts.length; i++) {
      length += pts[i]!.distance(pts[i - 1]!);
    }
    return length;
  }

  /**
   * Find the nearest point on the spline to a target point.
   * Returns `{ t, point, distance }` using a coarse-then-refine strategy.
   */
  nearest(
    target: Vector,
    coarseSamples: number = 64,
    refinePasses: number = 4,
  ): { t: number; point: Vector; distance: number } {
    let bestT = 0;
    let bestDist = Infinity;

    // Coarse pass
    for (let i = 0; i <= coarseSamples; i++) {
      const t = i / coarseSamples;
      const d = this.getPoint(t).distanceSquared(target);
      if (d < bestDist) {
        bestDist = d;
        bestT = t;
      }
    }

    // Refinement passes (golden-section style narrowing)
    let lo = Math.max(0, bestT - 1 / coarseSamples);
    let hi = Math.min(1, bestT + 1 / coarseSamples);
    for (let pass = 0; pass < refinePasses; pass++) {
      const steps = 8;
      bestDist = Infinity;
      for (let i = 0; i <= steps; i++) {
        const t = Common.lerp(lo, hi, i / steps);
        const d = this.getPoint(t).distanceSquared(target);
        if (d < bestDist) {
          bestDist = d;
          bestT = t;
        }
      }
      const half = (hi - lo) / (2 * steps);
      lo = Math.max(0, bestT - half);
      hi = Math.min(1, bestT + half);
    }

    const point = this.getPoint(bestT);
    return { t: bestT, point, distance: Math.sqrt(bestDist) };
  }

  // ── Internal: segment construction & parameter mapping ─────

  private _buildSegments(): CatmullRomSegment[] {
    const pts = this._points;
    const n = pts.length;
    const segments: CatmullRomSegment[] = [];

    if (this.mode === "closed") {
      // Closed loop: n segments, indices wrap around
      for (let i = 0; i < n; i++) {
        segments.push(
          new CatmullRomSegment(
            pts[(i - 1 + n) % n]!,
            pts[i]!,
            pts[(i + 1) % n]!,
            pts[(i + 2) % n]!,
            this.alpha,
          ),
        );
      }
    } else {
      // Open: n − 1 segments with phantom endpoints
      for (let i = 0; i < n - 1; i++) {
        segments.push(
          new CatmullRomSegment(
            this._phantomPoint(i - 1),
            pts[i]!,
            pts[i + 1]!,
            this._phantomPoint(i + 2),
            this.alpha,
          ),
        );
      }
    }

    return segments;
  }

  /**
   * Returns the control point at `index`, synthesising a phantom
   * point when the index falls outside the array bounds.
   */
  private _phantomPoint(index: number): Vector {
    const pts = this._points;
    const n = pts.length;

    if (index >= 0 && index < n) return pts[index]!;

    if (this.mode === "clamped") {
      return index < 0 ? pts[0]!.clone() : pts[n - 1]!.clone();
    }

    // 'natural': linearly extrapolate
    if (index < 0) {
      return pts[0]!.scale(2).subtract(pts[1]!);
    }
    return pts[n - 1]!.scale(2).subtract(pts[n - 2]!);
  }

  /** Maps a global t ∈ [0, 1] to a specific segment + local t. */
  private _mapParameter(t: number): {
    segment: CatmullRomSegment;
    localT: number;
  } {
    const n = this._segments.length;
    t = Common.clamp(t, 0, 1);

    const scaled = t * n;
    let index = Math.floor(scaled);
    if (index >= n) index = n - 1;

    const localT = Common.clamp(scaled - index, 0, 1);
    return { segment: this._segments[index]!, localT };
  }
}
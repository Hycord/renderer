import * as Common from "../common";

/**
 * An n-dimensional vector backed by a Float32Array.
 *
 * @example
 * const v2 = new Vector(1, 2);
 * const v3 = new Vector(1, 2, 3);
 */
export class Vector {
  private _data: Float32Array;

  constructor(...values: number[]) {
    this._data = new Float32Array(values);
  }

  /** Returns the component at `index`, or `undefined` if out of bounds. */
  get(index: number): number | undefined {
    return this._data[index];
  }

  /** Sets the component at `index`. Throws if out of bounds. */
  set(index: number, value: number): void {
    if (index < 0 || index >= this.size) {
      throw new Error(
        `Index ${index} is out of bounds for vector of size ${this.size}.`,
      );
    }
    this._data[index] = value;
  }

  /** Number of components in this vector. */
  get size(): number {
    return this._data.length;
  }

  /** Read-only view of the underlying Float32Array. */
  get data(): Readonly<Float32Array> {
    return this._data;
  }

  /** Returns a copy of the components as a standard `number[]`. */
  toArray(): number[] {
    return Array.from(this._data);
  }

  /** Enables `for...of` iteration over components. */
  [Symbol.iterator](): Iterator<number> {
    let index = 0;
    const data = this._data;
    return {
      next(): IteratorResult<number> {
        if (index < data.length) {
          const value = data[index++];
          if (value !== undefined)
            return { value, done: false } satisfies IteratorResult<number>;
          else
            return {
              value: undefined,
              done: true,
            } satisfies IteratorResult<number>;
        } else {
          return {
            value: undefined,
            done: true,
          } satisfies IteratorResult<number>;
        }
      },
    };
  }

  /** Returns a deep copy of this vector. */
  clone(): Vector {
    return new Vector(...this._data);
  }

  /** String representation for debugging. */
  toString(): string {
    return `Vector(${this._data.join(", ")})`;
  }

  // -------- Static Factories --------

  /** Creates an n-dimensional zero vector. */
  static zero(size: number): Vector {
    return new Vector(...new Array(size).fill(0));
  }

  /** Creates an n-dimensional unit vector pointing along the x-axis `(1, 0, …)`. */
  static unit(size: number): Vector {
    const data = new Array(size).fill(0);
    data[0] = 1;
    return new Vector(...data);
  }

  /**
   * Creates a 2D vector from polar coordinates.
   * @param radius Distance from the origin.
   * @param angle  Direction in radians (counterclockwise from +x).
   */
  static fromPolar(radius: number, angle: number): Vector {
    const x = radius * Math.cos(angle);
    const y = radius * Math.sin(angle);
    return new Vector(x, y);
  }

  /** Creates a vector from an existing array. */
  static fromArray(values: number[]): Vector {
    return new Vector(...values);
  }

  // -------- Immutable Arithmetic --------
  // Each method returns a new Vector, leaving the originals untouched.

  /** Component-wise addition. Both vectors must have the same size. */
  add(other: Vector): Vector {
    if (this.size !== other.size) {
      throw new Error("Vectors must be of the same size for addition.");
    }
    const result = this.clone();
    for (let i = 0; i < this.size; i++) {
      result.set(i, result.get(i)! + other.get(i)!);
    }
    return result;
  }

  /** Component-wise subtraction (`this - other`). Both vectors must have the same size. */
  subtract(other: Vector): Vector {
    if (this.size !== other.size) {
      throw new Error("Vectors must be of the same size for subtraction.");
    }
    const result = this.clone();
    for (let i = 0; i < this.size; i++) {
      result.set(i, result.get(i)! - other.get(i)!);
    }
    return result;
  }

  /** Multiplies every component by `scalar`. */
  scale(scalar: number): Vector {
    const result = this.clone();
    for (let i = 0; i < this.size; i++) {
      result.set(i, result.get(i)! * scalar);
    }
    return result;
  }

  /** Returns a new vector pointing in the opposite direction (`this * -1`). */
  negate(): Vector {
    return this.scale(-1);
  }

  // -------- Mutating Arithmetic --------
  // These modify `this` in-place and return it for chaining.

  /** In-place component-wise addition. */
  addMutable(other: Vector): Vector {
    if (this.size !== other.size) {
      throw new Error("Vectors must be of the same size for addition.");
    }
    for (let i = 0; i < this.size; i++) {
      this.set(i, this.get(i)! + other.get(i)!);
    }
    return this;
  }

  /** In-place component-wise subtraction (`this -= other`). */
  subtractMutable(other: Vector): Vector {
    if (this.size !== other.size) {
      throw new Error("Vectors must be of the same size for subtraction.");
    }
    for (let i = 0; i < this.size; i++) {
      this.set(i, this.get(i)! - other.get(i)!);
    }
    return this;
  }

  /** In-place scalar multiplication. */
  scaleMutable(scalar: number): Vector {
    for (let i = 0; i < this.size; i++) {
      this.set(i, this.get(i)! * scalar);
    }
    return this;
  }

  /** In-place negation (`this *= -1`). */
  negateMutable(): Vector {
    return this.scaleMutable(-1);
  }

  // -------- Scalar Operations --------

  normalize(): Vector {
    const length = this.magnitude();
    if (length === 0) {
      throw new Error("Cannot normalize a zero-length vector.");
    }
    return this.scale(1 / length);
  }


  /** Dot product. Both vectors must have the same size. */
  dot(other: Vector): number {
    if (this.size !== other.size) {
      throw new Error("Vectors must be of the same size for dot product.");
    }
    let result = 0;
    for (let i = 0; i < this.size; i++) {
      result += this.get(i)! * other.get(i)!;
    }
    return result;
  }

  /** Euclidean length of the vector (L2 norm). */
  magnitude(): number {
    return Math.sqrt(this.magnitudeSquared());
  }

  /** Squared magnitude — useful when you only need to compare lengths (avoids `sqrt`). */
  magnitudeSquared(): number {
    return this.dot(this);
  }

  /** Squared Euclidean distance to `other` — avoids the `sqrt` in {@link distance}. */
  distanceSquared(other: Vector): number {
    return this.subtract(other).magnitudeSquared();
  }

  /** Euclidean distance to `other`. */
  distance(other: Vector): number {
    return Math.sqrt(this.distanceSquared(other));
  }

  /**
   * Angle between this vector and `other` in radians (0 to π).
   * Throws if either vector is zero-length.
   */
  angleTo(other: Vector): number {
    const dotProduct = this.dot(other);
    const magnitudes = this.magnitude() * other.magnitude();
    if (magnitudes === 0) {
      throw new Error("Cannot calculate angle with zero-length vector.");
    }
    return Math.acos(Common.clamp(dotProduct / magnitudes, -1, 1));
  }

  equals(other: Vector, epsilon: number = Common.EPSILON): boolean {
    if (this.size !== other.size) {
      return false;
    }
    for (let i = 0; i < this.size; i++) {
      if (!Common.epsilonEquals(this.get(i)!, other.get(i)!, epsilon)) {
        return false;
      }
    }
    return true;
  }
}

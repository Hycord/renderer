import * as Common from "../common";
import { Vector } from "./Vector";

export class Vector3D extends Vector {
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    super(x, y, z);
  }

  static core = {
    up(): Vector3D {
      return new Vector3D(0, 1, 0);
    },

    down(): Vector3D {
      return new Vector3D(0, -1, 0);
    },

    left(): Vector3D {
      return new Vector3D(-1, 0, 0);
    },

    right(): Vector3D {
      return new Vector3D(1, 0, 0);
    },

    forward(): Vector3D {
      return new Vector3D(0, 0, 1);
    },

    backward(): Vector3D {
      return new Vector3D(0, 0, -1);
    },

    zero(): Vector3D {
      return new Vector3D(0, 0, 0);
    }
  };

  get x(): number {
    return this.get(0)!;
  }

  set x(value: number) {
    this.set(0, value);
  }

  get y(): number {
    return this.get(1)!;
  }

  set y(value: number) {
    this.set(1, value);
  }

  get z(): number {
    return this.get(2)!;
  }

  set z(value: number) {
    this.set(2, value);
  }

  get length(): number {
    return Math.hypot(this.x, this.y, this.z);
  }

  /** Returns a new Vector3D with the same components. */
  override clone(): Vector3D {
    return new Vector3D(this.x, this.y, this.z);
  }

  /** String representation for debugging. */
  override toString(): string {
    return `Vector3D(${this.x}, ${this.y}, ${this.z})`;
  }

  /** Returns a new Vector3D that is the sum of this vector and another. */
  override add(other: Vector): Vector3D {
    if (other.size !== 3) {
      throw new Error("Can only add another Vector3D");
    }
    return new Vector3D(
      this.x + other.get(0)!,
      this.y + other.get(1)!,
      this.z + other.get(2)!,
    );
  }

  override subtract(other: Vector3D): Vector3D {
    if (other.size !== 3) {
      throw new Error("Can only subtract another Vector3D");
    }
    return new Vector3D(
      this.x - other.get(0)!,
      this.y - other.get(1)!,
      this.z - other.get(2)!,
    );
  }

  override normalize(): Vector3D {
    const length = this.length;
    if (length === 0) {
      throw new Error("Cannot normalize a zero-length vector.");
    }
    return new Vector3D(this.x / length, this.y / length, this.z / length);
  }

  override scale(scalar: number): Vector3D {
    return new Vector3D(this.x * scalar, this.y * scalar, this.z * scalar);
  }

  /** Returns the 3D cross product of this vector and another. */
  cross(other: Vector3D): Vector3D {
    return new Vector3D(
      this.y * other.z - this.z * other.y,
      this.z * other.x - this.x * other.z,
      this.x * other.y - this.y * other.x,
    );
  }

  /** Returns a new Vector3D reflected across the given normal vector. */
  reflect(normal: Vector3D): Vector3D {
    const dot = this.x * normal.x + this.y * normal.y + this.z * normal.z;
    return new Vector3D(
      this.x - 2 * dot * normal.x,
      this.y - 2 * dot * normal.y,
      this.z - 2 * dot * normal.z,
    );
  }
}

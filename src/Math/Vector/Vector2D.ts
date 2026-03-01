import * as Common from "../common";
import { Vector } from "./Vector";

export class Vector2D extends Vector {
  constructor(x: number = 0, y: number = 0) {
    super(x, y);
  }

  static core = {
    random(length: number = 1): Vector2D {
      const angle = Math.random() * Common.TAU;
      return new Vector2D(
        length * Math.cos(angle),
        length * Math.sin(angle),
      );
    },
    up(): Vector2D {
      return new Vector2D(0, 1);
    },

    down(): Vector2D {
      return new Vector2D(0, -1);
    },

    left(): Vector2D {
      return new Vector2D(-1, 0);
    },

    right(): Vector2D {
      return new Vector2D(1, 0);
    },

    fromAngle(angleRadians: number, length: number = 1): Vector2D {
      return new Vector2D(
        length * Math.cos(angleRadians),
        length * Math.sin(angleRadians),
      );
    },

    fromAngleDegrees(angleDegrees: number, length: number = 1): Vector2D {
      const angleRadians = Common.degToRad(angleDegrees);
      return this.fromAngle(angleRadians, length);
    },

    zero(): Vector2D {
      return new Vector2D(0, 0);
    },
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

  get length(): number {
    return Math.hypot(this.x, this.y);
  }

  get angle(): number {
    return Math.atan2(this.y, this.x);
  }

  set angle(angleRadians: number) {
    const length = this.length;
    this.x = length * Math.cos(angleRadians);
    this.y = length * Math.sin(angleRadians);
  }

  /** Returns a new Vector2D with the same components. */
  override clone(): Vector2D {
    return new Vector2D(this.x, this.y);
  }

  /** String representation for debugging. */
  override toString(): string {
    return `Vector2D(${this.x}, ${this.y})`;
  }

  /** Returns a new Vector2D that is the sum of this vector and another. */
  override add(other: Vector): Vector2D {
    if (other.size !== 2) {
      throw new Error("Can only add another Vector2D");
    }
    return new Vector2D(this.x + other.get(0)!, this.y + other.get(1)!);
  }

  /** Returns a new Vector2D that is the difference of this vector and another. */
  override subtract(other: Vector): Vector2D {
    if (other.size !== 2) {
      throw new Error("Can only subtract another Vector2D");
    }
    return new Vector2D(this.x - other.get(0)!, this.y - other.get(1)!);
  }

  override normalize(): Vector2D {
    const length = this.length;
    if (length === 0) {
      throw new Error("Cannot normalize a zero-length vector.");
    }
    return new Vector2D(this.x / length, this.y / length);
  }

  override scale(factor: number): Vector2D {
    return new Vector2D(this.x * factor, this.y * factor);
  }

  /** Returns the 2D cross product (scalar) of this vector and another. */
  cross(other: Vector2D): number {
    return this.x * other.y - this.y * other.x;
  }

  /** Returns a new Vector2D that is perpendicular to this one (rotated 90 degrees counterclockwise). */
  perpendicular(): Vector2D {
    return new Vector2D(-this.y, this.x);
  }

  /** Returns a new Vector2D rotated by the given angle in radians. */
  rotateRadians(angleRadians: number): Vector2D {
    const cos = Math.cos(angleRadians);
    const sin = Math.sin(angleRadians);
    return new Vector2D(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos,
    );
  }

  /** Returns a new Vector2D rotated by the given angle in degrees. */
  rotateDefault(angleDegrees: number): Vector2D {
    const angleRadians = Common.degToRad(angleDegrees);
    return this.rotateRadians(angleRadians);
  }
}

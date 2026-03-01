import { Vector, Vector2D, Vector3D } from "../Vector";
import * as Common from "../common";

export class CubicBezier2D {
  constructor(
    public p0: Vector2D,
    public p1: Vector2D,
    public p2: Vector2D,
    public p3: Vector2D,
  ) {}

  getPoint(t: number): Vector2D {
    const u = 1 - t;

    const p = this.p0
      .scale(u * u * u) // (1-t)^3 * P0
      .add(this.p1.scale(3 * u * u * t)) // 3*(1-t)^2*t*P1
      .add(this.p2.scale(3 * u * t * t)) // 3*(1-t)*t^2*P2
      .add(this.p3.scale(t * t * t)); // t^3*P3
    return p;
  }

  velocity(t: number): Vector2D {
    const u = 1 - t;

    const dp = this.p0
      .scale(-3 * u * u) // -3*(1-t)^2*P0
      .add(this.p1.scale(3 * u * u - 6 * u * t)) // 3*(1-t)^2*P1 + 6*(1-t)*t*P1
      .add(this.p2.scale(6 * u * t - 3 * t * t)) // 6*(1-t)*t*P2 + 3*t^2*P2
      .add(this.p3.scale(3 * t * t)); // 3*t^2*P3
    return dp;
  }

  acceleration(t: number): Vector2D {
    const u = 1 - t;

    const ddp = this.p0
      .scale(6 * u) // 6*(1-t)*P0
      .add(this.p1.scale(-12 * u + 6 * t)) // -12*(1-t)*P1 + 6*t*P1
      .add(this.p2.scale(6 * u - 12 * t)) // 6*(1-t)*P2 - 12*t*P2
      .add(this.p3.scale(6 * t)); // 6*t*P3
    return ddp;
  }

  jolt(): Vector2D {
    const dddp = this.p0
      .scale(-6) // -6*P0
      .add(this.p1.scale(18)) // 18*P1
      .add(this.p2.scale(-18)) // -18*P2
      .add(this.p3.scale(6)); // 6*P3
    return dddp;
  }

  curvature(t: number): number | undefined {
    const dp = this.velocity(t);
    const ddp = this.acceleration(t);

    const numerator = dp.x * ddp.y - dp.y * ddp.x;
    const denominator = Math.pow(dp.x * dp.x + dp.y * dp.y, 1.5);

    return denominator === 0 ? undefined : numerator / denominator;
  }
}

export class CubicBezier3D {
  constructor(
    public p0: Vector3D,
    public p1: Vector3D,
    public p2: Vector3D,
    public p3: Vector3D,
  ) {}

  getPoint(t: number): Vector3D {
    const u = 1 - t;

    const p = this.p0
      .scale(u * u * u) // (1-t)^3 * P0
      .add(this.p1.scale(3 * u * u * t)) // 3*(1-t)^2*t*P1
      .add(this.p2.scale(3 * u * t * t)) // 3*(1-t)*t^2*P2
      .add(this.p3.scale(t * t * t)); // t^3*P3
    return p;
  }

  velocity(t: number): Vector3D {
    const u = 1 - t;

    const dp = this.p0
      .scale(-3 * u * u) // -3*(1-t)^2*P0
      .add(this.p1.scale(3 * u * u - 6 * u * t)) // 3*(1-t)^2*P1 + 6*(1-t)*t*P1
      .add(this.p2.scale(6 * u * t - 3 * t * t)) // 6*(1-t)*t*P2 + 3*t^2*P2
      .add(this.p3.scale(3 * t * t)); // 3*t^2*P3
    return dp;
  }

  acceleration(t: number): Vector3D {
    const u = 1 - t;

    const ddp = this.p0
      .scale(6 * u) // 6*(1-t)*P0
      .add(this.p1.scale(-12 * u + 6 * t)) // -12*(1-t)*P1 + 6*t*P1
      .add(this.p2.scale(6 * u - 12 * t)) // 6*(1-t)*P2 - 12*t*P2
      .add(this.p3.scale(6 * t)); // 6*t*P3
    return ddp;
  }

  jolt(): Vector3D {
    const dddp = this.p0
      .scale(-6) // -6*P0
      .add(this.p1.scale(18)) // 18*P1
      .add(this.p2.scale(-18)) // -18*P2
      .add(this.p3.scale(6)); // 6*P3
    return dddp;
  }

  curvature(t: number): number | undefined {
    const dp = this.velocity(t);
    const ddp = this.acceleration(t);

    const cross = new Vector3D(
      dp.y * ddp.z - dp.z * ddp.y,
      dp.z * ddp.x - dp.x * ddp.z,
      dp.x * ddp.y - dp.y * ddp.x,
    );
    const numerator = cross.length;
    const denominator = Math.pow(dp.length, 3);

    return denominator === 0 ? undefined : numerator / denominator;
  }
}

export class QuadraticBezier2D {
  constructor(
    public p0: Vector2D,
    public p1: Vector2D,
    public p2: Vector2D,
  ) {}

  getPoint(t: number): Vector2D {
    const u = 1 - t;

    const p = this.p0
      .scale(u * u) // (1-t)^2 * P0
      .add(this.p1.scale(2 * u * t)) // 2*(1-t)*t*P1
      .add(this.p2.scale(t * t)); // t^2*P2
    return p;
  }

  velocity(t: number): Vector2D {
    const u = 1 - t;

    const dp = this.p0
      .scale(-2 * u) // -2*(1-t)*P0
      .add(this.p1.scale(2 * (u - t))) // 2*(1-t)*P1 + 2*t*P1
      .add(this.p2.scale(2 * t)); // 2*t*P2
    return dp;
  }

  acceleration(): Vector2D {
    return this.p0
      .scale(2) // 2*P0
      .add(this.p1.scale(-4)) // -4*P1
      .add(this.p2.scale(2)); // 2*P2
  }

  curvature(t: number): number | undefined {
    const dp = this.velocity(t);
    const ddp = this.acceleration();

    const numerator = dp.x * ddp.y - dp.y * ddp.x;
    const denominator = Math.pow(dp.x * dp.x + dp.y * dp.y, 1.5);

    return denominator === 0 ? undefined : numerator / denominator;
  }
}

export class QuadraticBezier3D {
  constructor(
    public p0: Vector3D,
    public p1: Vector3D,
    public p2: Vector3D,
  ) {}

  getPoint(t: number): Vector3D {
    const u = 1 - t;

    const p = this.p0
      .scale(u * u) // (1-t)^2 * P0
      .add(this.p1.scale(2 * u * t)) // 2*(1-t)*t*P1
      .add(this.p2.scale(t * t)); // t^2*P2
    return p;
  }

  velocity(t: number): Vector3D {
    const u = 1 - t;

    const dp = this.p0
      .scale(-2 * u) // -2*(1-t)*P0
      .add(this.p1.scale(2 * (u - t))) // 2*(1-t)*P1 + 2*t*P1
      .add(this.p2.scale(2 * t)); // 2*t*P2
    return dp;
  }

  acceleration(): Vector3D {
    return this.p0
      .scale(2) // 2*P0
      .add(this.p1.scale(-4)) // -4*P1
      .add(this.p2.scale(2)); // 2*P2
  }

  curvature(t: number): number | undefined {
    const dp = this.velocity(t);
    const ddp = this.acceleration();

    const cross = new Vector3D(
      dp.y * ddp.z - dp.z * ddp.y,
      dp.z * ddp.x - dp.x * ddp.z,
      dp.x * ddp.y - dp.y * ddp.x,
    );
    const numerator = cross.length;
    const denominator = Math.pow(dp.length, 3);

    return denominator === 0 ? undefined : numerator / denominator;
  }
}

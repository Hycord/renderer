import * as Common from "../common";
import { Matrix } from "./Matrix";

export class Matrix3D extends Matrix {
  constructor(values: number[][] = []) {
    super(3, 3, values);
  }

  static core = {
    identity(): Matrix3D {
      return new Matrix3D([
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ]);
    },
    rotationX(angleRadians: number): Matrix3D {
      const c = Math.cos(angleRadians);
      const s = Math.sin(angleRadians);
      return new Matrix3D([
        [1, 0, 0],
        [0, c, -s],
        [0, s, c],
      ]);
    },
    rotationY(angleRadians: number): Matrix3D {
      const c = Math.cos(angleRadians);
      const s = Math.sin(angleRadians);
      return new Matrix3D([
        [c, 0, s],
        [0, 1, 0],
        [-s, 0, c],
      ]);
    },
    rotationZ(angleRadians: number): Matrix3D {
      const c = Math.cos(angleRadians);
      const s = Math.sin(angleRadians);
      return new Matrix3D([
        [c, -s, 0],
        [s, c, 0],
        [0, 0, 1],
      ]);
    },
    translation(tx: number, ty: number): Matrix3D {
      return new Matrix3D([
        [1, 0, tx],
        [0, 1, ty],
        [0, 0, 1],
      ]);
    },
    scaling(sx: number, sy: number): Matrix3D {
      return new Matrix3D([
        [sx, 0, 0],
        [0, sy, 0],
        [0, 0, 1],
      ]);
    },
    normalMatrix(modelViewMatrix: Matrix3D): Matrix3D {
      const m = modelViewMatrix.toArray();
      const a = m[0][0],
        b = m[0][1],
        c = m[0][2];
      const d = m[1][0],
        e = m[1][1],
        f = m[1][2];
      const g = m[2][0],
        h = m[2][1],
        i = m[2][2];
      const det =
        a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      if (det === 0) {
        throw new Error(
          "Cannot compute normal matrix for non-invertible modelViewMatrix",
        );
      }
      const invDet = 1 / det;
      return new Matrix3D([
        [
          (e * i - f * h) * invDet,
          (c * h - b * i) * invDet,
          (b * f - c * e) * invDet,
        ],
        [
          (f * g - d * i) * invDet,
          (a * i - c * g) * invDet,
          (c * d - a * f) * invDet,
        ],
        [
          (d * h - e * g) * invDet,
          (b * g - a * h) * invDet,
          (a * e - b * d) * invDet,
        ],
      ]);
    },
  };

  override toArray(): [
    [number, number, number],
    [number, number, number],
    [number, number, number],
  ] {
    return super.toArray() as [
      [number, number, number],
      [number, number, number],
      [number, number, number],
    ];
  }
}

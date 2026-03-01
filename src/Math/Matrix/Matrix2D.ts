import * as Common from "../common";
import { Matrix } from "./Matrix";

export class Matrix2D extends Matrix {
  constructor(values: number[][] = []) {
    super(2, 2, values);
  }

  static core = {
    identity(): Matrix2D {
      return new Matrix2D([
        [1, 0],
        [0, 1],
      ]);
    },
    
    rotation(angleRadians: number): Matrix2D {
      const c = Math.cos(angleRadians);
      const s = Math.sin(angleRadians);
      return new Matrix2D([
        [c, -s],
        [s, c],
      ]);
    },

    scaling(sx: number, sy: number): Matrix2D {
      return new Matrix2D([
        [sx, 0],
        [0, sy],
      ]);
    },

    shearing(shx: number, shy: number): Matrix2D {
      return new Matrix2D([
        [1, shx],
        [shy, 1],
      ]);
    },

    reflectionX(): Matrix2D {
      return new Matrix2D([
        [1, 0],
        [0, -1],
      ]);
    },
    
    reflectionY(): Matrix2D {
      return new Matrix2D([
        [-1, 0],
        [0, 1],
      ]);
    },

    reflectionOrigin(): Matrix2D {
      return new Matrix2D([
        [-1, 0],
        [0, -1],
      ]);
    },
    
  }

  override toArray(): [[number, number], [number, number]] {
    return super.toArray() as [[number, number], [number, number]];
  }
}

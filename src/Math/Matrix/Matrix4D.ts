import * as Common from "../common";
import { Vector, Vector3D, Vector4D } from "../Vector";
import { Quaternion } from "../Quaternion";
import { Matrix } from "./Matrix";

export class Matrix4D extends Matrix {
  constructor(values: number[][] = []) {
    super(4, 4, values);
  }

  static core = {
    identity(): Matrix4D {
      return new Matrix4D([
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ]);
    },
    translation(tx: number, ty: number, tz: number): Matrix4D {
      return new Matrix4D([
        [1, 0, 0, tx],
        [0, 1, 0, ty],
        [0, 0, 1, tz],
        [0, 0, 0, 1],
      ]);
    },
    rotationX(angleRadians: number): Matrix4D {
      const c = Math.cos(angleRadians);
      const s = Math.sin(angleRadians);
      return new Matrix4D([
        [1, 0, 0, 0],
        [0, c, -s, 0],
        [0, s, c, 0],
        [0, 0, 0, 1],
      ]);
    },
    rotationY(angleRadians: number): Matrix4D {
      const c = Math.cos(angleRadians);
      const s = Math.sin(angleRadians);
      return new Matrix4D([
        [c, 0, s, 0],
        [0, 1, 0, 0],
        [-s, 0, c, 0],
        [0, 0, 0, 1],
      ]);
    },
    rotationZ(angleRadians: number): Matrix4D {
      const c = Math.cos(angleRadians);
      const s = Math.sin(angleRadians);
      return new Matrix4D([
        [c, -s, 0, 0],
        [s, c, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
      ]);
    },
    rotationAxis(angleRadians: number, axis: Vector3D): Matrix4D {
      const c = Math.cos(angleRadians);
      const s = Math.sin(angleRadians);
      const t = 1 - c;
      const x = axis.x,
        y = axis.y,
        z = axis.z;
      return new Matrix4D([
        [t * x * x + c, t * x * y - s * z, t * x * z + s * y, 0],
        [t * x * y + s * z, t * y * y + c, t * y * z - s * x, 0],
        [t * x * z - s * y, t * y * z + s * x, t * z * z + c, 0],
        [0, 0, 0, 1],
      ]);
    },
    scaling(sx: number, sy: number, sz: number): Matrix4D {
      return new Matrix4D([
        [sx, 0, 0, 0],
        [0, sy, 0, 0],
        [0, 0, sz, 0],
        [0, 0, 0, 1],
      ]);
    },
    lookAt(eye: Vector3D, target: Vector3D, up: Vector3D): Matrix4D {
      const zAxis = eye.subtract(target).normalize();
      const xAxis = up.cross(zAxis).normalize();
      const yAxis = zAxis.cross(xAxis);

      return new Matrix4D([
        [xAxis.x, xAxis.y, xAxis.z, -xAxis.dot(eye)],
        [yAxis.x, yAxis.y, yAxis.z, -yAxis.dot(eye)],
        [zAxis.x, zAxis.y, zAxis.z, -zAxis.dot(eye)],
        [0, 0, 0, 1],
      ]);
    },
    perspective(
      fovRadians: number,
      aspect: number,
      near: number,
      far: number,
    ): Matrix4D {
      const f = 1 / Math.tan(fovRadians / 2);
      const nf = 1 / (near - far);
      return new Matrix4D([
        [f / aspect, 0, 0, 0],
        [0, f, 0, 0],
        [0, 0, (far + near) * nf, 2 * far * near * nf],
        [0, 0, -1, 0],
      ]);
    },
    orthographic(
      left: number,
      right: number,
      bottom: number,
      top: number,
      near: number,
      far: number,
    ): Matrix4D {
      const lr = 1 / (left - right);
      const bt = 1 / (bottom - top);
      const nf = 1 / (near - far);
      return new Matrix4D([
        [-2 * lr, 0, 0, (left + right) * lr],
        [0, -2 * bt, 0, (top + bottom) * bt],
        [0, 0, 2 * nf, (far + near) * nf],
        [0, 0, 0, 1],
      ]);
    },
    fromQuaternion(q: Quaternion): Matrix4D {
      const x = q.x,
        y = q.y,
        z = q.z,
        w = q.w;
      return new Matrix4D([
        [1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 0],
        [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 0],
        [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y), 0],
        [0, 0, 0, 1],
      ]);
    },
    trs(
      translation: Vector3D,
      rotation: Quaternion,
      scale: Vector3D,
    ): Matrix4D {
      const t = this.translation(translation.x, translation.y, translation.z);
      const r = this.fromQuaternion(rotation);
      const s = this.scaling(scale.x, scale.y, scale.z);
      return t.multiply(r).multiply(s);
    },
  };

  override toArray(): [
    [number, number, number, number],
    [number, number, number, number],
    [number, number, number, number],
    [number, number, number, number],
  ] {
    return super.toArray() as [
      [number, number, number, number],
      [number, number, number, number],
      [number, number, number, number],
      [number, number, number, number],
    ];
  }

  override multiply(other: Matrix): Matrix4D {
    if (other instanceof Matrix4D) {
        const base = super.multiply(other);
        return new Matrix4D(base.toArray());
    }
    throw new Error("Can only multiply with another Matrix4D.");
  }

  transformPoint(point: Vector3D): Vector3D {
    const x = point.x,
      y = point.y,
      z = point.z;
    const w = 1;
    const m = this.toArray();
    const tx = m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3] * w;
    const ty = m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3] * w;
    const tz = m[2][0] * x + m[2][1] * y + m[2][2] * z + m[2][3] * w;
    const tw = m[3][0] * x + m[3][1] * y + m[3][2] * z + m[3][3] * w;
    return new Vector3D(tx / tw, ty / tw, tz / tw);
  }

  transformDirection(direction: Vector3D): Vector3D {
    const x = direction.x,
      y = direction.y,
      z = direction.z;
    const w = 0;
    const m = this.toArray();
    const tx = m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3] * w;
    const ty = m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3] * w;
    const tz = m[2][0] * x + m[2][1] * y + m[2][2] * z + m[2][3] * w;
    return new Vector3D(tx, ty, tz).normalize();
  }

  transformVector4D(vector: Vector4D): Vector4D {
    const x = vector.x,
      y = vector.y,
      z = vector.z,
      w = vector.w;
    const m = this.toArray();
    const tx = m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3] * w;
    const ty = m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3] * w;
    const tz = m[2][0] * x + m[2][1] * y + m[2][2] * z + m[2][3] * w;
    const tw = m[3][0] * x + m[3][1] * y + m[3][2] * z + m[3][3] * w;
    return new Vector4D(tx, ty, tz, tw);
  }

  decompose(): {
    translation: Vector3D;
    rotation: Quaternion;
    scale: Vector3D;
  } {
    const m = this.toArray();
    const translation = new Vector3D(m[0][3], m[1][3], m[2][3]);

    const sx = Math.hypot(m[0][0], m[1][0], m[2][0]);
    const sy = Math.hypot(m[0][1], m[1][1], m[2][1]);
    const sz = Math.hypot(m[0][2], m[1][2], m[2][2]);
    const scale = new Vector3D(sx, sy, sz);

    const r00 = m[0][0] / sx;
    const r01 = m[0][1] / sy;
    const r02 = m[0][2] / sz;
    const r10 = m[1][0] / sx;
    const r11 = m[1][1] / sy;
    const r12 = m[1][2] / sz;
    const r20 = m[2][0] / sx;
    const r21 = m[2][1] / sy;
    const r22 = m[2][2] / sz;

    let w, x, y, z;
    if (r00 > r11 && r00 > r22) {
      const s = 2.0 * Math.sqrt(1.0 + r00 - r11 - r22);
      w = (r10 - r21) / s;
      x = 0.25 * s;
      y = (r01 + r10) / s;
      z = (r02 + r20) / s;
    } else if (r11 > r22) {
      const s = 2.0 * Math.sqrt(1.0 + r11 - r00 - r22);
      w = (r02 - r20) / s;
      x = (r01 + r10) / s;
      y = 0.25 * s;
      z = (r12 + r21) / s;
    } else {
      const s = 2.0 * Math.sqrt(1.0 + r22 - r00 - r11);
      w = (r01 - r10) / s;
      x = (r02 + r20) / s;
      y = (r12 + r21) / s;
      z = 0.25 * s;
    }

    const rotation = new Quaternion(x, y, z, w);
    return { translation, rotation, scale };
  }
}

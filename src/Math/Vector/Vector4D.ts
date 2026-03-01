import * as Common from "../common";
import { Vector } from "./Vector";
import { Vector3D } from "./Vector3D";

export class Vector4D extends Vector {
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 0) {
    super(x, y, z, w);
  }

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

  get w(): number {
    return this.get(3)!;
  }

  set w(value: number) {
    this.set(3, value);
  }

  toVector3D(): Vector3D {
    return new Vector3D(this.x / this.w, this.y / this.w, this.z / this.w);
  }
}

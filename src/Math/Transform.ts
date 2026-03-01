import { Quaternion } from "./Quaternion";
import { Vector3D } from "./Vector";
import { Matrix4D } from "./Matrix";

export class Transform {
  constructor(
    private _position: Vector3D = new Vector3D(0, 0, 0),
    private _rotation: Quaternion = Quaternion.core.identity(),
    private _scale: Vector3D = new Vector3D(1, 1, 1),
    private _parent?: Transform,
  ) {}

  get parent(): Transform | undefined {
    return this._parent;
  }

  set parent(value: Transform | undefined) {
    this._parent = value;
  }

  get position(): Vector3D {
    return this._position;
  }

  set position(value: Vector3D) {
    this._position = value;
  }

  get rotation(): Quaternion {
    return this._rotation;
  }

  set rotation(value: Quaternion) {
    this._rotation = value;
  }

  get scale(): Vector3D {
    return this._scale;
  }

  set scale(value: Vector3D) {
    this._scale = value;
  }

  localMatrix(): Matrix4D {
    const translationMatrix = Matrix4D.core.translation(
      this.position.x,
      this.position.y,
      this.position.z,
    );
    const rotationMatrix = new Matrix4D([
      [
        1 - 2 * (this.rotation.y ** 2 + this.rotation.z ** 2),
        2 *
          (this.rotation.x * this.rotation.y -
            this.rotation.z * this.rotation.w),
        2 *
          (this.rotation.x * this.rotation.z +
            this.rotation.y * this.rotation.w),
        0,
      ],
      [
        2 *
          (this.rotation.x * this.rotation.y +
            this.rotation.z * this.rotation.w),
        1 - 2 * (this.rotation.x ** 2 + this.rotation.z ** 2),
        2 *
          (this.rotation.y * this.rotation.z -
            this.rotation.x * this.rotation.w),
        0,
      ],
      [
        2 *
          (this.rotation.x * this.rotation.z -
            this.rotation.y * this.rotation.w),
        2 *
          (this.rotation.y * this.rotation.z +
            this.rotation.x * this.rotation.w),
        1 - 2 * (this.rotation.x ** 2 + this.rotation.y ** 2),
        0,
      ],
      [0, 0, 0, 1],
    ]);
    const scaleMatrix = Matrix4D.core.scaling(
      this.scale.x,
      this.scale.y,
      this.scale.z,
    );
    return translationMatrix.multiply(rotationMatrix).multiply(scaleMatrix);
  }

  worldMatrix(parent?: Transform): Matrix4D {
    const local = this.localMatrix();
    if (parent) {
      return parent.worldMatrix().multiply(local);
    }
    return local;
  }

  translate(delta: Vector3D): void {
    this.position = new Vector3D(
      this.position.x + delta.x,
      this.position.y + delta.y,
      this.position.z + delta.z,
    );
  }

  rotate(axis: Vector3D, angleRadians: number): void {
    const deltaRotation = Quaternion.core.fromAxisAngle(axis, angleRadians);
    this.rotation = new Quaternion(
      this.rotation.x + deltaRotation.x,
      this.rotation.y + deltaRotation.y,
      this.rotation.z + deltaRotation.z,
      this.rotation.w + deltaRotation.w,
    );
  }

  lookAt(target: Vector3D, up: Vector3D = Vector3D.core.up()): void {
    const forward = new Vector3D(
      target.x - this.position.x,
      target.y - this.position.y,
      target.z - this.position.z,
    ).normalize();
    const right = forward.cross(up).normalize();
    const trueUp = right.cross(forward).normalize();

    const m00 = right.x;
    const m01 = right.y;
    const m02 = right.z;
    const m10 = trueUp.x;
    const m11 = trueUp.y;
    const m12 = trueUp.z;
    const m20 = -forward.x;
    const m21 = -forward.y;
    const m22 = -forward.z;

    this.rotation = new Quaternion(
      Math.sqrt(Math.max(0, 1 + m00 + m11 + m22)) / 2,
      Math.sqrt(Math.max(0, 1 + m00 - m11 - m22)) / 2,
      Math.sqrt(Math.max(0, 1 - m00 + m11 - m22)) / 2,
      Math.sqrt(Math.max(0, 1 - m00 - m11 + m22)) / 2,
    );
  }

  forward(): Vector3D {
    const forward = new Vector3D(0, 0, 1);
    const rotationMatrix = Matrix4D.core.fromQuaternion(this.rotation);
    return rotationMatrix.transformPoint(forward);
  }

  right(): Vector3D {
    const right = new Vector3D(1, 0, 0);
    const rotationMatrix = Matrix4D.core.fromQuaternion(this.rotation);
    return rotationMatrix.transformPoint(right);
  }

  up(): Vector3D {
    const up = new Vector3D(0, 1, 0);
    const rotationMatrix = Matrix4D.core.fromQuaternion(this.rotation);
    return rotationMatrix.transformPoint(up);
  }

  left(): Vector3D {
    return this.right().scale(-1);
  }

  back(): Vector3D {
    return this.forward().scale(-1);
  }

  down(): Vector3D {
    return this.up().scale(-1);
  }
}

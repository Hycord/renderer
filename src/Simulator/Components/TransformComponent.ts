import { Transform, Vector3D, Quaternion } from "@hycord/math";
import type { Component } from "../ECS";

/**
 * Spatial transform — position, rotation, scale.
 * Wraps the math library's {@link Transform} so all its utility methods
 * (lookAt, forward, worldMatrix, …) are available.
 */
export class TransformComponent implements Component {
  static readonly TYPE = "transform";
  readonly type = TransformComponent.TYPE;

  readonly transform: Transform;

  constructor(position?: Vector3D, rotation?: Quaternion, scale?: Vector3D) {
    this.transform = new Transform(
      position ?? Vector3D.core.zero(),
      rotation ?? Quaternion.core.identity(),
      scale ?? new Vector3D(1, 1, 1),
    );
  }

  // ── Convenience accessors ─────────────────────────────────────────

  get position(): Vector3D {
    return this.transform.position;
  }
  set position(v: Vector3D) {
    this.transform.position = v;
  }

  get rotation(): Quaternion {
    return this.transform.rotation;
  }
  set rotation(q: Quaternion) {
    this.transform.rotation = q;
  }

  get scale(): Vector3D {
    return this.transform.scale;
  }
  set scale(v: Vector3D) {
    this.transform.scale = v;
  }
}

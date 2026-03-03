import { Vector3D } from "@hycord/math";
import type { Component } from "../ECS";

/**
 * Newtonian physics data.
 *
 * The {@link PhysicsSystem} integrates velocity and acceleration each frame
 * and updates the entity's {@link TransformComponent}.
 */
export class PhysicsComponent implements Component {
  static readonly TYPE = "physics";
  readonly type = PhysicsComponent.TYPE;

  velocity: Vector3D;
  acceleration: Vector3D;

  /** Mass in arbitrary units. Used for collision response. */
  mass: number;

  /** Linear drag coefficient (0 = no drag, 1 = full stop each second). */
  drag: number;

  /** Coefficient of restitution for bouncing (0 = inelastic, 1 = perfectly elastic). */
  restitution: number;

  /** Maximum speed (0 = unlimited). */
  maxSpeed: number;

  constructor(options: {
    velocity?: Vector3D;
    acceleration?: Vector3D;
    mass?: number;
    drag?: number;
    restitution?: number;
    maxSpeed?: number;
  } = {}) {
    this.velocity = options.velocity ?? Vector3D.core.zero();
    this.acceleration = options.acceleration ?? Vector3D.core.zero();
    this.mass = options.mass ?? 1;
    this.drag = options.drag ?? 0;
    this.restitution = options.restitution ?? 0.5;
    this.maxSpeed = options.maxSpeed ?? 0;
  }
}

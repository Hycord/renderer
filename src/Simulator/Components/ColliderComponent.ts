import { Vector3D } from "@hycord/math";
import type { Component } from "../ECS";

/**
 * Shape used for collision detection.
 *
 * All dimensions are in world units relative to the entity's position.
 */
export type ColliderShape =
  | { kind: "circle"; radius: number }
  | { kind: "aabb"; halfExtents: Vector3D }
  | { kind: "point" };

/**
 * Collision data component.
 *
 * Attach to an entity alongside a {@link TransformComponent} so the
 * {@link CollisionSystem} can detect overlaps.
 */
export class ColliderComponent implements Component {
  static readonly TYPE = "collider";
  readonly type = ColliderComponent.TYPE;

  shape: ColliderShape;

  /** If true the collider detects overlaps but doesn't generate a physics response. */
  isTrigger: boolean;

  /** Collision layer bitmask — colliders only interact when their masks overlap. */
  layer: number;

  /** Mask of layers this collider can collide with. */
  mask: number;

  constructor(
    shape: ColliderShape,
    options: { isTrigger?: boolean; layer?: number; mask?: number } = {},
  ) {
    this.shape = shape;
    this.isTrigger = options.isTrigger ?? false;
    this.layer = options.layer ?? 1;
    this.mask = options.mask ?? 0xffffffff;
  }

  // ── Factories ─────────────────────────────────────────────────────

  static circle(radius: number, options?: { isTrigger?: boolean; layer?: number; mask?: number }): ColliderComponent {
    return new ColliderComponent({ kind: "circle", radius }, options);
  }

  static aabb(halfExtents: Vector3D, options?: { isTrigger?: boolean; layer?: number; mask?: number }): ColliderComponent {
    return new ColliderComponent({ kind: "aabb", halfExtents }, options);
  }

  static point(options?: { isTrigger?: boolean; layer?: number; mask?: number }): ColliderComponent {
    return new ColliderComponent({ kind: "point" }, options);
  }
}

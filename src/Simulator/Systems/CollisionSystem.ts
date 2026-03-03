import { Vector3D } from "@hycord/math";
import { System, Query, type ECSWorld, type EntityId } from "../ECS";
import { TransformComponent } from "../Components/TransformComponent";
import { ColliderComponent, type ColliderShape } from "../Components/ColliderComponent";

// ── Collision event ─────────────────────────────────────────────────────────

export interface CollisionEvent {
  entityA: EntityId;
  entityB: EntityId;
  /** Normalised direction from A → B. */
  normal: Vector3D;
  /** Overlap depth (positive = penetrating). */
  depth: number;
}

export type CollisionCallback = (event: CollisionEvent) => void;

// ── CollisionSystem ─────────────────────────────────────────────────────────

/**
 * Brute-force collision detection between entities that have both a
 * {@link TransformComponent} and a {@link ColliderComponent}.
 *
 * Fires collision event callbacks so game code can react.
 * Does **not** resolve physics — use the callback to push entities
 * apart or integrate with {@link PhysicsComponent}.
 */
export class CollisionSystem extends System {
  readonly name = "collision";
  readonly query = Query.all(TransformComponent, ColliderComponent);
  override priority = 200; // after physics, before rendering

  private _callbacks: CollisionCallback[] = [];
  private _frameCollisions: CollisionEvent[] = [];

  /** Register a callback that fires for every collision pair each frame. */
  onCollision(cb: CollisionCallback): void {
    this._callbacks.push(cb);
  }

  /** Collisions detected in the most recent frame. */
  get collisions(): readonly CollisionEvent[] {
    return this._frameCollisions;
  }

  override update(
    entities: readonly EntityId[],
    world: ECSWorld,
    _dt: number,
  ): void {
    this._frameCollisions = [];

    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const a = entities[i]!;
        const b = entities[j]!;

        const colA = world.getComponent(a, ColliderComponent)!;
        const colB = world.getComponent(b, ColliderComponent)!;

        // Layer/mask check
        if ((colA.layer & colB.mask) === 0 || (colB.layer & colA.mask) === 0) {
          continue;
        }

        const posA = world.getComponent(a, TransformComponent)!.position;
        const posB = world.getComponent(b, TransformComponent)!.position;

        const event = testOverlap(a, posA, colA.shape, b, posB, colB.shape);
        if (event) {
          this._frameCollisions.push(event);
          for (const cb of this._callbacks) cb(event);
        }
      }
    }
  }
}

// ── Overlap tests ───────────────────────────────────────────────────────────

function testOverlap(
  idA: EntityId,
  posA: Vector3D,
  shapeA: ColliderShape,
  idB: EntityId,
  posB: Vector3D,
  shapeB: ColliderShape,
): CollisionEvent | null {
  if (shapeA.kind === "circle" && shapeB.kind === "circle") {
    return circleVsCircle(idA, posA, shapeA.radius, idB, posB, shapeB.radius);
  }
  if (shapeA.kind === "aabb" && shapeB.kind === "aabb") {
    return aabbVsAabb(idA, posA, shapeA.halfExtents, idB, posB, shapeB.halfExtents);
  }
  if (shapeA.kind === "circle" && shapeB.kind === "aabb") {
    return circleVsAabb(idA, posA, shapeA.radius, idB, posB, shapeB.halfExtents);
  }
  if (shapeA.kind === "aabb" && shapeB.kind === "circle") {
    const ev = circleVsAabb(idB, posB, shapeB.radius, idA, posA, shapeA.halfExtents);
    if (ev) {
      // Swap so entityA is the original A
      ev.entityA = idA;
      ev.entityB = idB;
      ev.normal = ev.normal.scale(-1) as Vector3D;
    }
    return ev;
  }
  return null;
}

function circleVsCircle(
  idA: EntityId,
  posA: Vector3D,
  rA: number,
  idB: EntityId,
  posB: Vector3D,
  rB: number,
): CollisionEvent | null {
  const diff = posB.subtract(posA) as Vector3D;
  const dist = diff.length;
  const overlap = rA + rB - dist;
  if (overlap <= 0) return null;
  const normal = dist > 0 ? (diff.scale(1 / dist) as Vector3D) : new Vector3D(1, 0, 0);
  return { entityA: idA, entityB: idB, normal, depth: overlap };
}

function aabbVsAabb(
  idA: EntityId,
  posA: Vector3D,
  halfA: Vector3D,
  idB: EntityId,
  posB: Vector3D,
  halfB: Vector3D,
): CollisionEvent | null {
  const dx = Math.abs(posB.x - posA.x);
  const dy = Math.abs(posB.y - posA.y);
  const overlapX = halfA.x + halfB.x - dx;
  const overlapY = halfA.y + halfB.y - dy;
  if (overlapX <= 0 || overlapY <= 0) return null;

  let normal: Vector3D;
  let depth: number;
  if (overlapX < overlapY) {
    depth = overlapX;
    normal = new Vector3D(posB.x > posA.x ? 1 : -1, 0, 0);
  } else {
    depth = overlapY;
    normal = new Vector3D(0, posB.y > posA.y ? 1 : -1, 0);
  }
  return { entityA: idA, entityB: idB, normal, depth };
}

function circleVsAabb(
  circleId: EntityId,
  circlePos: Vector3D,
  radius: number,
  aabbId: EntityId,
  aabbPos: Vector3D,
  halfExtents: Vector3D,
): CollisionEvent | null {
  // Closest point on AABB to circle centre
  const closestX = Math.max(aabbPos.x - halfExtents.x, Math.min(circlePos.x, aabbPos.x + halfExtents.x));
  const closestY = Math.max(aabbPos.y - halfExtents.y, Math.min(circlePos.y, aabbPos.y + halfExtents.y));
  const closest = new Vector3D(closestX, closestY, 0);

  const diff = circlePos.subtract(closest) as Vector3D;
  const dist = diff.length;
  if (dist >= radius) return null;

  const normal = dist > 0 ? (diff.scale(1 / dist) as Vector3D) : new Vector3D(1, 0, 0);
  return { entityA: circleId, entityB: aabbId, normal, depth: radius - dist };
}

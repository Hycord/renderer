import { Vector3D } from "@hycord/math";
import { System, Query, type ECSWorld, type EntityId } from "../ECS";
import { TransformComponent } from "../Components/TransformComponent";
import { PhysicsComponent } from "../Components/PhysicsComponent";
import type { AxisAlignedBoundingBox } from "../../Engine/AxisAlignedBoundingBox";

/**
 * How an entity should behave when it reaches a boundary edge.
 *
 * - `wrap`    — teleport to the opposite edge (pac-man style).
 * - `bounce`  — reverse the velocity component on the colliding axis.
 * - `clamp`   — stop at the edge.
 */
export type BoundaryMode = "wrap" | "bounce" | "clamp";

/**
 * Constrains entities to stay within an axis-aligned bounding box.
 *
 * Useful for keeping boids, particles, etc. inside a simulation viewport.
 */
export class BoundarySystem extends System {
  readonly name = "boundary";
  readonly query = Query.all(TransformComponent, PhysicsComponent);
  override priority = 150; // after physics, before rendering

  bounds: AxisAlignedBoundingBox;
  mode: BoundaryMode;

  constructor(bounds: AxisAlignedBoundingBox, mode: BoundaryMode = "wrap") {
    super();
    this.bounds = bounds;
    this.mode = mode;
  }

  override update(
    entities: readonly EntityId[],
    world: ECSWorld,
    _dt: number,
  ): void {
    const { min, max } = this.bounds;

    for (const id of entities) {
      const tc = world.getComponent(id, TransformComponent)!;
      const pc = world.getComponent(id, PhysicsComponent)!;
      const pos = tc.position;

      let nx = pos.x;
      let ny = pos.y;
      let vx = pc.velocity.x;
      let vy = pc.velocity.y;

      if (this.mode === "wrap") {
        const w = max.x - min.x;
        const h = max.y - min.y;
        if (nx < min.x) nx += w;
        else if (nx > max.x) nx -= w;
        if (ny < min.y) ny += h;
        else if (ny > max.y) ny -= h;
      } else if (this.mode === "bounce") {
        if (nx < min.x) { nx = min.x; vx = Math.abs(vx); }
        else if (nx > max.x) { nx = max.x; vx = -Math.abs(vx); }
        if (ny < min.y) { ny = min.y; vy = Math.abs(vy); }
        else if (ny > max.y) { ny = max.y; vy = -Math.abs(vy); }
      } else {
        // clamp
        nx = Math.max(min.x, Math.min(max.x, nx));
        ny = Math.max(min.y, Math.min(max.y, ny));
        if (nx === min.x || nx === max.x) vx = 0;
        if (ny === min.y || ny === max.y) vy = 0;
      }

      tc.position = new Vector3D(nx, ny, pos.z);
      pc.velocity = new Vector3D(vx, vy, pc.velocity.z);
    }
  }
}

import { Vector3D } from "@hycord/math";
import { System, Query, type ECSWorld, type EntityId } from "../ECS";
import { TransformComponent } from "../Components/TransformComponent";
import { PhysicsComponent } from "../Components/PhysicsComponent";

/**
 * Semi-implicit Euler integration for velocity and position.
 *
 * Each frame:
 * 1. `velocity += acceleration * dt`
 * 2. Apply drag: `velocity *= (1 - drag * dt)`
 * 3. Clamp to `maxSpeed` (if set)
 * 4. `position += velocity * dt`
 * 5. Reset acceleration to zero (forces must be re-applied each frame).
 */
export class PhysicsSystem extends System {
  readonly name = "physics";
  readonly query = Query.all(TransformComponent, PhysicsComponent);
  override priority = 100;

  /** Global gravity applied to every physics entity (default: none). */
  gravity: Vector3D = Vector3D.core.zero();

  override update(
    entities: readonly EntityId[],
    world: ECSWorld,
    dt: number,
  ): void {
    for (const id of entities) {
      const tc = world.getComponent(id, TransformComponent)!;
      const pc = world.getComponent(id, PhysicsComponent)!;

      // Apply gravity
      const totalAccel = pc.acceleration.add(this.gravity) as Vector3D;

      // Integrate velocity
      pc.velocity = pc.velocity.add(totalAccel.scale(dt)) as Vector3D;

      // Apply drag
      if (pc.drag > 0) {
        const factor = Math.max(0, 1 - pc.drag * dt);
        pc.velocity = pc.velocity.scale(factor) as Vector3D;
      }

      // Clamp to max speed
      if (pc.maxSpeed > 0) {
        const speed = pc.velocity.length;
        if (speed > pc.maxSpeed) {
          pc.velocity = pc.velocity.scale(pc.maxSpeed / speed) as Vector3D;
        }
      }

      // Integrate position
      tc.position = tc.position.add(pc.velocity.scale(dt)) as Vector3D;

      // Reset per-frame acceleration
      pc.acceleration = Vector3D.core.zero();
    }
  }
}

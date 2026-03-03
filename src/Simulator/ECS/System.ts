import type { Query } from "./Query";
import type { ECSWorld } from "./World";
import type { EntityId } from "./Entity";

/**
 * Base class for all ECS systems.
 *
 * A system encapsulates a single concern (physics, rendering, AI, …).
 * It declares a {@link query} that selects the entities it cares about,
 * and its {@link update} method is called every frame with those entities.
 *
 * ```ts
 * class GravitySystem extends System {
 *   readonly name = "gravity";
 *   readonly query = Query.all(PhysicsComponent);
 *   update(entities, world, dt) {
 *     for (const id of entities) {
 *       const phys = world.getComponent(id, PhysicsComponent)!;
 *       phys.velocity = phys.velocity.add(new Vector3D(0, 9.81 * dt, 0));
 *     }
 *   }
 * }
 * ```
 */
export abstract class System {
  /** Human-readable name for debugging / profiling. */
  abstract readonly name: string;

  /** Query describing which entities this system processes. */
  abstract readonly query: Query;

  /**
   * Execution priority — **lower values run first**.
   * Systems with equal priority run in insertion order.
   */
  priority = 0;

  /** Set to `false` to temporarily skip this system each frame. */
  enabled = true;

  /** Called once when the system is added to a world. Override to set up state. */
  init(_world: ECSWorld): void {}

  /** Called every frame with the entities that match {@link query}. */
  abstract update(
    entities: readonly EntityId[],
    world: ECSWorld,
    dt: number,
  ): void;

  /** Called when the system is removed. Override to tear down state. */
  destroy(_world: ECSWorld): void {}
}

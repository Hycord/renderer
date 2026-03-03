import { System, Query, type ECSWorld, type EntityId } from "../ECS";
import { TransformComponent } from "../Components/TransformComponent";
import { RenderableComponent } from "../Components/RenderableComponent";
import type { World as RenderWorld } from "../../Engine/World";

/**
 * Synchronises every entity's {@link TransformComponent} with its
 * {@link RenderableComponent}'s underlying `Renderable.transform`
 * and manages the render world's object list.
 *
 * This system should run **after** physics / movement systems so the
 * visual state reflects the latest simulation state.
 */
export class RenderSystem extends System {
  readonly name = "render";
  readonly query = Query.all(TransformComponent, RenderableComponent);
  override priority = 900; // run late

  private _renderWorld: RenderWorld;
  /** Tracks which entities are already in the render world. */
  private _tracked = new Set<EntityId>();
  /** Maps entity ID → Renderable so we can remove it even after components are deleted. */
  private _renderableMap = new Map<EntityId, import("../../Renderable/common").Renderable>();

  constructor(renderWorld: RenderWorld) {
    super();
    this._renderWorld = renderWorld;
  }

  get renderWorld(): RenderWorld {
    return this._renderWorld;
  }

  override init(world: ECSWorld): void {
    // Auto-remove renderables when entities are destroyed.
    // Note: components are already removed from stores by the time this fires,
    // so we use our own _renderableMap instead of getComponent.
    world.onEntityDestroyed((id) => {
      const renderable = this._renderableMap.get(id);
      if (renderable) {
        this._renderWorld.remove(renderable);
        this._renderableMap.delete(id);
        this._tracked.delete(id);
      }
    });
  }

  override update(
    entities: readonly EntityId[],
    world: ECSWorld,
    _dt: number,
  ): void {
    const alive = new Set(entities);

    for (const id of entities) {
      const tc = world.getComponent(id, TransformComponent)!;
      const rc = world.getComponent(id, RenderableComponent)!;

      // Sync transform → renderable
      rc.renderable.transform = tc.transform;

      // Ensure the renderable is in the render world and tracked
      if (!this._tracked.has(id)) {
        this._renderWorld.add(rc.renderable);
        this._tracked.add(id);
      }
      // Always keep the map up-to-date (handles component replacement)
      this._renderableMap.set(id, rc.renderable);
    }

    // Remove renderables for entities no longer matching
    for (const id of this._tracked) {
      if (!alive.has(id)) {
        const renderable = this._renderableMap.get(id);
        if (renderable) this._renderWorld.remove(renderable);
        this._renderableMap.delete(id);
        this._tracked.delete(id);
      }
    }
  }

  override destroy(_world: ECSWorld): void {
    // Remove all tracked renderables from the render world
    for (const [_id, renderable] of this._renderableMap) {
      this._renderWorld.remove(renderable);
    }
    this._tracked.clear();
    this._renderableMap.clear();
  }
}

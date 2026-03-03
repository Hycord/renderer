import type { Component, ComponentClass } from "./Component";
import { EntityIdGenerator, type EntityId } from "./Entity";
import { Query } from "./Query";
import type { System } from "./System";

// ── Event callback signatures ───────────────────────────────────────────────

export type EntityCallback = (entityId: EntityId) => void;
export type ComponentCallback = (
  entityId: EntityId,
  component: Component,
) => void;

// ── ECSWorld ────────────────────────────────────────────────────────────────

/**
 * The ECS World is the central registry for entities, components, and systems.
 *
 * ```ts
 * const world = new ECSWorld();
 * const e = world.createEntity();
 * world.addComponent(e, new TransformComponent(new Vector3D(10, 20, 0)));
 * world.addSystem(new PhysicsSystem());
 * // in your game loop:
 * world.update(dt);
 * ```
 */
export class ECSWorld {
  private _idGen = new EntityIdGenerator();
  private _alive = new Set<EntityId>();

  /** Component storage: componentType → (entityId → component). */
  private _stores = new Map<string, Map<EntityId, Component>>();

  /** Per-entity set of component type strings (for fast query matching). */
  private _entityComponents = new Map<EntityId, Set<string>>();

  /** Ordered list of systems. */
  private _systems: System[] = [];
  private _systemsDirty = false;

  /** Query result cache — invalidated every frame and on structural changes. */
  private _queryCache = new Map<string, EntityId[]>();
  private _queryCacheDirty = true;

  // Event listeners
  private _onEntityCreated: EntityCallback[] = [];
  private _onEntityDestroyed: EntityCallback[] = [];
  private _onComponentAdded: ComponentCallback[] = [];
  private _onComponentRemoved: ComponentCallback[] = [];

  // ── Entity management ────────────────────────────────────────────

  /** Create a new entity and return its ID. */
  createEntity(): EntityId {
    const id = this._idGen.next();
    this._alive.add(id);
    this._entityComponents.set(id, new Set());
    this._queryCacheDirty = true;
    for (const cb of this._onEntityCreated) cb(id);
    return id;
  }

  /**
   * Create an entity pre-populated with the given components.
   *
   * ```ts
   * const bird = world.spawn(
   *   new TransformComponent(pos),
   *   new PhysicsComponent(),
   *   new BoidComponent(),
   * );
   * ```
   */
  spawn(...components: Component[]): EntityId {
    const id = this.createEntity();
    for (const c of components) this.addComponent(id, c);
    return id;
  }

  /** Destroy an entity and remove all of its components. */
  destroyEntity(id: EntityId): void {
    if (!this._alive.has(id)) return;

    const types = this._entityComponents.get(id);
    if (types) {
      for (const type of types) {
        const store = this._stores.get(type);
        if (store) {
          const comp = store.get(id);
          store.delete(id);
          if (comp) {
            for (const cb of this._onComponentRemoved) cb(id, comp);
          }
        }
      }
    }

    this._entityComponents.delete(id);
    this._alive.delete(id);
    this._queryCacheDirty = true;
    for (const cb of this._onEntityDestroyed) cb(id);
  }

  /** Whether the entity is still alive. */
  isAlive(id: EntityId): boolean {
    return this._alive.has(id);
  }

  get entityCount(): number {
    return this._alive.size;
  }

  get entities(): ReadonlySet<EntityId> {
    return this._alive;
  }

  // ── Component management ─────────────────────────────────────────

  /** Attach a component to an entity. Replaces any existing component of the same type. */
  addComponent<T extends Component>(entityId: EntityId, component: T): void {
    if (!this._alive.has(entityId)) return;

    const type = component.type;
    let store = this._stores.get(type);
    if (!store) {
      store = new Map();
      this._stores.set(type, store);
    }
    store.set(entityId, component);
    this._entityComponents.get(entityId)!.add(type);
    this._queryCacheDirty = true;
    for (const cb of this._onComponentAdded) cb(entityId, component);
  }

  /** Remove a component from an entity by type. */
  removeComponent(entityId: EntityId, type: string | ComponentClass): void {
    const t = typeof type === "string" ? type : type.TYPE;
    if (!this._alive.has(entityId)) return;

    const store = this._stores.get(t);
    if (!store) return;

    const comp = store.get(entityId);
    if (!comp) return;

    store.delete(entityId);
    this._entityComponents.get(entityId)?.delete(t);
    this._queryCacheDirty = true;
    for (const cb of this._onComponentRemoved) cb(entityId, comp);
  }

  /** Get a component from an entity. Returns `undefined` if absent. */
  getComponent<T extends Component>(
    entityId: EntityId,
    type: ComponentClass<T> | string,
  ): T | undefined {
    const t = typeof type === "string" ? type : type.TYPE;
    const store = this._stores.get(t);
    return store?.get(entityId) as T | undefined;
  }

  /** Whether an entity has a given component type. */
  hasComponent(entityId: EntityId, type: string | ComponentClass): boolean {
    const t = typeof type === "string" ? type : type.TYPE;
    return this._entityComponents.get(entityId)?.has(t) ?? false;
  }

  /** Get all component type strings present on an entity. */
  getComponentTypes(entityId: EntityId): ReadonlySet<string> {
    return this._entityComponents.get(entityId) ?? new Set();
  }

  // ── Queries ──────────────────────────────────────────────────────

  /**
   * Find all entities matching a query.
   * Results are cached per frame for performance.
   */
  query(q: Query): readonly EntityId[];
  query(
    required: (string | ComponentClass)[],
    excluded?: (string | ComponentClass)[],
  ): readonly EntityId[];
  query(
    qOrRequired: Query | (string | ComponentClass)[],
    excluded?: (string | ComponentClass)[],
  ): readonly EntityId[] {
    const q =
      qOrRequired instanceof Query
        ? qOrRequired
        : new Query(qOrRequired as (string | ComponentClass)[], excluded);

    if (!this._queryCacheDirty) {
      const cached = this._queryCache.get(q.key);
      if (cached) return cached;
    }

    const result: EntityId[] = [];
    for (const id of this._alive) {
      const types = this._entityComponents.get(id)!;
      if (q.matches(types)) result.push(id);
    }

    this._queryCache.set(q.key, result);
    return result;
  }

  // ── Systems ──────────────────────────────────────────────────────

  /** Register a system. It will be initialised immediately. */
  addSystem(system: System): void {
    this._systems.push(system);
    this._systemsDirty = true;
    system.init(this);
  }

  /** Remove and destroy a system. */
  removeSystem(system: System): void {
    const idx = this._systems.indexOf(system);
    if (idx !== -1) {
      this._systems.splice(idx, 1);
      system.destroy(this);
    }
  }

  /** Look up a system by its class. */
  getSystem<T extends System>(ctor: new (...args: any[]) => T): T | undefined {
    return this._systems.find((s) => s instanceof ctor) as T | undefined;
  }

  /** All registered systems (read-only). */
  get systems(): readonly System[] {
    return this._systems;
  }

  // ── Frame update ─────────────────────────────────────────────────

  /** Advance the simulation by `dt` seconds, running every enabled system. */
  update(dt: number): void {
    // Re-sort systems by priority if the list changed.
    if (this._systemsDirty) {
      this._systems.sort((a, b) => a.priority - b.priority);
      this._systemsDirty = false;
    }

    // Invalidate query cache at the start of each frame.
    this._queryCacheDirty = true;
    this._queryCache.clear();

    for (const system of this._systems) {
      if (!system.enabled) continue;
      const matched = this.query(system.query);
      system.update(matched, this, dt);
    }
  }

  // ── Events ───────────────────────────────────────────────────────

  onEntityCreated(cb: EntityCallback): void {
    this._onEntityCreated.push(cb);
  }
  onEntityDestroyed(cb: EntityCallback): void {
    this._onEntityDestroyed.push(cb);
  }
  onComponentAdded(cb: ComponentCallback): void {
    this._onComponentAdded.push(cb);
  }
  onComponentRemoved(cb: ComponentCallback): void {
    this._onComponentRemoved.push(cb);
  }

  // ── Bulk operations ──────────────────────────────────────────────

  /** Destroy every entity (fires all removal/destruction events). */
  clear(): void {
    for (const id of [...this._alive]) {
      this.destroyEntity(id);
    }
    this._queryCache.clear();
  }
}

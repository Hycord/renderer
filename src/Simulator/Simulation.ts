import { Color } from "@hycord/math";
import type { Component } from "./ECS";
import { ECSWorld } from "./ECS";
import type { EntityId } from "./ECS";
import { World as RenderWorld } from "../Engine/World";
import { RenderSystem } from "./Systems/RenderSystem";

// ── Options ─────────────────────────────────────────────────────────────────

export interface SimulationOptions {
  /** Background colour for the simulation viewport. */
  background?: Color;
  /** If false the simulation starts paused. */
  active?: boolean;
}

// ── Simulation ──────────────────────────────────────────────────────────────

/**
 * A self-contained simulation that owns an ECS world and a render world.
 *
 * Multiple simulations can run side-by-side, each displayed in its own
 * {@link Portal} viewport on screen.
 *
 * ```ts
 * const sim = new Simulation("boids", { background: Color.core.rgb(20, 20, 40) });
 * sim.ecs.addSystem(new PhysicsSystem());
 * sim.ecs.addSystem(new BoidSystem());
 * // The RenderSystem is added automatically.
 * ```
 */
export class Simulation {
  readonly name: string;
  readonly ecs: ECSWorld;
  readonly renderWorld: RenderWorld;
  readonly renderSystem: RenderSystem;

  private _active: boolean;
  private _paused = false;
  private _timeScale = 1;

  constructor(name: string, options: SimulationOptions = {}) {
    this.name = name;
    this._active = options.active ?? true;

    this.renderWorld = new RenderWorld(
      options.background ?? Color.core.colors.black(),
    );

    this.ecs = new ECSWorld();

    // Auto-attach a RenderSystem wired to this simulation's render world
    this.renderSystem = new RenderSystem(this.renderWorld);
    this.ecs.addSystem(this.renderSystem);
  }

  // ── State ─────────────────────────────────────────────────────────

  get active(): boolean {
    return this._active;
  }
  set active(v: boolean) {
    this._active = v;
  }

  get paused(): boolean {
    return this._paused;
  }
  set paused(v: boolean) {
    this._paused = v;
  }

  get timeScale(): number {
    return this._timeScale;
  }
  set timeScale(v: number) {
    this._timeScale = Math.max(0, v);
  }

  // ── Convenience entity creation ───────────────────────────────────

  /**
   * Create an entity pre-populated with components.
   * Shorthand for `this.ecs.spawn(...)`.
   */
  spawn(...components: Component[]): EntityId {
    return this.ecs.spawn(...components);
  }

  // ── Frame update ──────────────────────────────────────────────────

  /** Advance the simulation. Respects `active`, `paused`, and `timeScale`. */
  update(dt: number): void {
    if (!this._active || this._paused) return;
    this.ecs.update(dt * this._timeScale);
    this.renderWorld.update(dt * this._timeScale);
  }
}

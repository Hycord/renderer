import type { Canvas, CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Vector3D } from "@hycord/math";
import { AxisAlignedBoundingBox } from "../Engine/AxisAlignedBoundingBox";
import { Simulation, type SimulationOptions } from "./Simulation";
import { Portal, type PortalOptions } from "./Portal";

// ── SimulationManager ───────────────────────────────────────────────────────

/**
 * Orchestrates multiple {@link Simulation}s and their on-screen {@link Portal}s.
 *
 * The manager handles:
 * - Creating / removing simulations and portals.
 * - Dispatching `update()` to every active simulation.
 * - Rendering all visible portals, sorted by layer.
 * - Hit-testing mouse coordinates to determine which portal (simulation)
 *   a click targets.
 *
 * ```ts
 * const mgr = new SimulationManager(window.canvas);
 *
 * const boidSim = mgr.createSimulation("boids");
 * boidSim.ecs.addSystem(new BoidSystem());
 *
 * mgr.createPortal(boidSim, simBounds, { cornerRadius: 10 });
 *
 * // In your run loop:
 * mgr.update(dt);
 * mgr.render(ctx);
 * ```
 */
export class SimulationManager {
  private _canvas: Canvas;
  private _simulations = new Map<string, Simulation>();
  private _portals: Portal[] = [];
  private _portalsDirty = false;

  /** Background colour drawn behind all portals each frame. */
  background: Color;

  constructor(canvas: Canvas, background?: Color) {
    this._canvas = canvas;
    this.background = background ?? Color.core.rgb(30, 30, 30);
  }

  // ── Simulations ───────────────────────────────────────────────────

  /** Create and register a new simulation. */
  createSimulation(name: string, options?: SimulationOptions): Simulation {
    if (this._simulations.has(name)) {
      throw new Error(`Simulation "${name}" already exists.`);
    }
    const sim = new Simulation(name, options);
    this._simulations.set(name, sim);
    return sim;
  }

  /** Look up a simulation by name. */
  getSimulation(name: string): Simulation | undefined {
    return this._simulations.get(name);
  }

  /** Remove a simulation and all portals that reference it. */
  removeSimulation(name: string): void {
    const sim = this._simulations.get(name);
    if (!sim) return;
    this._portals = this._portals.filter((p) => p.simulation !== sim);
    sim.ecs.clear();
    this._simulations.delete(name);
  }

  get simulations(): ReadonlyMap<string, Simulation> {
    return this._simulations;
  }

  // ── Portals ───────────────────────────────────────────────────────

  /**
   * Create a portal that displays a simulation in the given screen region.
   *
   * Multiple portals may display the same simulation (different viewpoints).
   */
  createPortal(
    simulation: Simulation,
    bounds: AxisAlignedBoundingBox,
    options?: PortalOptions,
  ): Portal {
    const portal = new Portal(simulation, this._canvas, bounds, options);
    this._portals.push(portal);
    this._portalsDirty = true;
    return portal;
  }

  /** Remove a portal from the manager. */
  removePortal(portal: Portal): void {
    const idx = this._portals.indexOf(portal);
    if (idx !== -1) this._portals.splice(idx, 1);
  }

  get portals(): readonly Portal[] {
    return this._portals;
  }

  // ── Hit testing ───────────────────────────────────────────────────

  /**
   * Return the top-most portal (highest layer) under the given screen point,
   * or `undefined` if the point doesn't hit any portal.
   */
  portalAt(x: number, y: number): Portal | undefined {
    // Search from highest layer first (last in sorted order)
    this.ensureSorted();
    for (let i = this._portals.length - 1; i >= 0; i--) {
      const p = this._portals[i]!;
      if (p.visible && p.contains(x, y)) return p;
    }
    return undefined;
  }

  /**
   * Return the simulation under the given screen point,
   * or `undefined` if the point doesn't hit any portal.
   */
  simulationAt(x: number, y: number): Simulation | undefined {
    return this.portalAt(x, y)?.simulation;
  }

  // ── Frame lifecycle ───────────────────────────────────────────────

  /** Update all active simulations. */
  update(dt: number): void {
    for (const sim of this._simulations.values()) {
      sim.update(dt);
    }
  }

  /**
   * Render all visible portals onto the given context.
   * Call this after clearing the screen or drawing your UI background.
   */
  render(ctx: CanvasRenderingContext2D): void {
    this.ensureSorted();
    for (const portal of this._portals) {
      portal.render(ctx);
    }
  }

  /**
   * Full-frame helper: clears the canvas, updates all simulations,
   * and renders all portals.
   */
  frame(ctx: CanvasRenderingContext2D, dt: number, w: number, h: number): void {
    // Clear
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.background.toRGBAString();
    ctx.fillRect(0, 0, w, h);

    this.update(dt);
    this.render(ctx);
  }

  // ── Internal ──────────────────────────────────────────────────────

  private ensureSorted(): void {
    if (this._portalsDirty) {
      this._portals.sort((a, b) => a.layer - b.layer);
      this._portalsDirty = false;
    }
  }
}

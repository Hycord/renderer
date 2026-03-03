import type { Canvas, CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Vector3D } from "@hycord/math";
import { Camera, ProjectionMode } from "../Engine/Camera";
import { AxisAlignedBoundingBox } from "../Engine/AxisAlignedBoundingBox";
import type { Simulation } from "./Simulation";

// ── Options ─────────────────────────────────────────────────────────────────

export interface PortalOptions {
  /** Corner radius for the viewport clip (0 = sharp corners). */
  cornerRadius?: number;
  /** Border colour (null = no border). */
  borderColor?: Color | null;
  /** Border width in pixels. */
  borderWidth?: number;
  /** Render layer ordering — lower draws first. */
  layer?: number;
}

// ── Portal ──────────────────────────────────────────────────────────────────

/**
 * A Portal is a rectangular viewport on screen that renders a {@link Simulation}.
 *
 * Multiple portals can display the **same** simulation (e.g. a minimap)
 * or different simulations side-by-side.
 *
 * The portal owns its own {@link Camera} so each viewport can have
 * independent zoom, pan, and projection settings.
 *
 * ```ts
 * const portal = new Portal(sim, canvas, bounds, {
 *   cornerRadius: 10,
 *   borderColor: Color.core.rgb(70, 70, 70),
 * });
 * ```
 */
export class Portal {
  simulation: Simulation;
  bounds: AxisAlignedBoundingBox;
  camera: Camera;

  cornerRadius: number;
  borderColor: Color | null;
  borderWidth: number;
  layer: number;
  visible = true;

  private _canvas: Canvas;

  constructor(
    simulation: Simulation,
    canvas: Canvas,
    bounds: AxisAlignedBoundingBox,
    options: PortalOptions = {},
  ) {
    this.simulation = simulation;
    this._canvas = canvas;
    this.bounds = bounds;
    this.cornerRadius = options.cornerRadius ?? 0;
    this.borderColor = options.borderColor ?? null;
    this.borderWidth = options.borderWidth ?? 1;
    this.layer = options.layer ?? 0;

    // Create a camera that renders in screen-space within the portal bounds
    this.camera = new Camera(canvas, simulation.renderWorld);
    this.camera.projectionMode = ProjectionMode.ScreenSpace;
  }

  // ── Geometry helpers ──────────────────────────────────────────────

  get x(): number {
    return this.bounds.min.x;
  }
  get y(): number {
    return this.bounds.min.y;
  }
  get width(): number {
    return this.bounds.max.x - this.bounds.min.x;
  }
  get height(): number {
    return this.bounds.max.y - this.bounds.min.y;
  }

  /** Check whether a screen-space point falls inside this portal. */
  contains(x: number, y: number): boolean {
    return this.bounds.contains(new Vector3D(x, y, 0));
  }

  /**
   * Convert a screen-space point to simulation-local coordinates.
   * Returns the offset from the portal's top-left corner.
   */
  toLocal(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: screenX - this.bounds.min.x,
      y: screenY - this.bounds.min.y,
    };
  }

  /** Update the portal bounds (e.g. on window resize). */
  resize(bounds: AxisAlignedBoundingBox): void {
    this.bounds = bounds;
  }

  // ── Rendering ─────────────────────────────────────────────────────

  /**
   * Render the simulation into this portal's viewport, clipped to its bounds.
   *
   * Call this from your main render loop **after** the background has been drawn.
   */
  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    const x = this.x;
    const y = this.y;
    const w = this.width;
    const h = this.height;
    const r = this.cornerRadius;

    ctx.save();

    // Clip to portal bounds
    ctx.beginPath();
    if (r > 0) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.clip();

    // Fill background
    const bg = this.simulation.renderWorld.background;
    ctx.fillStyle = bg.toRGBAString();
    ctx.fillRect(x, y, w, h);

    // Render each object in the simulation's render world
    const sorted = this.simulation.renderWorld.sorted();
    for (const renderable of sorted) {
      if (!renderable.visible) continue;

      const pos = renderable.transform.position;
      ctx.save();
      ctx.translate(x + pos.x, y + pos.y);

      const rot = renderable.transform.rotation;
      const angle = 2 * Math.atan2(
        Math.sqrt(rot.x * rot.x + rot.y * rot.y + rot.z * rot.z),
        rot.w,
      );
      if (angle !== 0) ctx.rotate(angle);

      const scl = renderable.transform.scale;
      if (scl.x !== 1 || scl.y !== 1) ctx.scale(scl.x, scl.y);

      renderable.render(ctx);
      ctx.restore();
    }

    ctx.restore();

    // Draw border on top (outside the clip region)
    if (this.borderColor) {
      ctx.save();
      ctx.strokeStyle = this.borderColor.toRGBAString();
      ctx.lineWidth = this.borderWidth;
      ctx.beginPath();
      if (r > 0) {
        ctx.roundRect(x, y, w, h, r);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}

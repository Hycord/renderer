import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color } from "@hycord/math";

// ── Options ─────────────────────────────────────────────────────────────────

export interface DebugOverlayOptions {
  /** Background colour for the debug box. */
  backgroundColor?: Color;
  /** Text colour. */
  textColor?: Color;
  /** Font size. */
  fontSize?: number;
  /** Font family. */
  fontFamily?: string;
  /** Corner radius of the background box. */
  cornerRadius?: number;
  /** Inner padding. */
  padding?: number;
  /** Number of frame samples to keep for min/max/avg calculation. */
  sampleCount?: number;
  /** How often (in seconds) to refresh the displayed FPS number. */
  refreshInterval?: number;
}

// ── DebugOverlay ────────────────────────────────────────────────────────────

/**
 * A toggleable performance overlay that displays FPS, frame timing,
 * and arbitrary custom lines.
 *
 * ```ts
 * const debug = new DebugOverlay();
 * win.onKeyDown((key) => { if (key === "\\") debug.toggle(); });
 *
 * // In your render loop:
 * debug.update(dt);
 * debug.setCustomLines(["Boids: 100", "Entities: 104"]);
 * debug.render(ctx, canvasWidth, canvasHeight);
 * ```
 */
export class DebugOverlay {
  visible: boolean;

  backgroundColor: Color;
  textColor: Color;
  fontSize: number;
  fontFamily: string;
  cornerRadius: number;
  padding: number;

  private _sampleCount: number;
  private _refreshInterval: number;

  // FPS tracking
  private _frameCount = 0;
  private _fpsAccum = 0;
  private _currentFps = 0;
  private _frameTimes: number[] = [];

  // Extra info lines
  private _customLines: string[] = [];

  constructor(options: DebugOverlayOptions = {}) {
    this.visible = false;
    this.backgroundColor = options.backgroundColor ?? Color.core.rgba(0, 0, 0, 180);
    this.textColor = options.textColor ?? Color.core.rgb(0, 255, 120);
    this.fontSize = options.fontSize ?? 12;
    this.fontFamily = options.fontFamily ?? "monospace";
    this.cornerRadius = options.cornerRadius ?? 4;
    this.padding = options.padding ?? 8;
    this._sampleCount = options.sampleCount ?? 60;
    this._refreshInterval = options.refreshInterval ?? 0.5;
  }

  // ── Public API ──────────────────────────────────────────────────

  /** Toggle visibility. */
  toggle(): void {
    this.visible = !this.visible;
  }

  /** Current displayed FPS value. */
  get fps(): number {
    return this._currentFps;
  }

  /**
   * Set additional lines to show below the performance stats.
   * Each string becomes one line.
   */
  setCustomLines(lines: string[]): void {
    this._customLines = lines;
  }

  // ── Frame update ────────────────────────────────────────────────

  /**
   * Call once per frame with the delta time in seconds.
   * Accumulates frame-time samples and updates the FPS counter.
   */
  update(dt: number): void {
    this._frameCount++;
    this._fpsAccum += dt;
    this._frameTimes.push(dt * 1000);
    if (this._frameTimes.length > this._sampleCount) this._frameTimes.shift();

    if (this._fpsAccum >= this._refreshInterval) {
      this._currentFps = Math.round(this._frameCount / this._fpsAccum);
      this._frameCount = 0;
      this._fpsAccum = 0;
    }
  }

  // ── Rendering ───────────────────────────────────────────────────

  /**
   * Render the debug overlay at the top-left of the screen.
   *
   * @param ctx  Canvas 2D context.
   * @param _w   Canvas width (unused, reserved for future anchoring).
   * @param _h   Canvas height (unused).
   */
  render(ctx: CanvasRenderingContext2D, _w: number, _h: number): void {
    if (!this.visible) return;

    const ft = this._frameTimes;
    const avgMs = ft.length > 0 ? ft.reduce((a, b) => a + b, 0) / ft.length : 0;
    const minMs = ft.length > 0 ? Math.min(...ft) : 0;
    const maxMs = ft.length > 0 ? Math.max(...ft) : 0;

    const lines = [
      `FPS: ${this._currentFps}`,
      `Frame: ${avgMs.toFixed(1)}ms avg`,
      `       ${minMs.toFixed(1)}ms min / ${maxMs.toFixed(1)}ms max`,
      ...this._customLines,
    ];

    const lineH = this.fontSize * 1.3;
    const boxW = 240;
    const boxH = lines.length * lineH + this.padding * 2;

    ctx.save();

    // Background
    ctx.beginPath();
    ctx.roundRect(this.padding, this.padding, boxW, boxH, this.cornerRadius);
    ctx.fillStyle = this.backgroundColor.toRGBAString();
    ctx.fill();

    // Text
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.textColor.toRGBAString();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, this.padding * 2, this.padding * 2 + i * lineH);
    }

    ctx.restore();
  }
}

import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color } from "@hycord/math";
import { UISlider } from "./UISlider";

// ── Options ─────────────────────────────────────────────────────────────────

export interface UIPanelOptions {
  /** Panel width in pixels. */
  width?: number;
  /** Padding inside the panel. */
  padding?: number;
  /** Corner radius. */
  cornerRadius?: number;
  /** Background colour. */
  backgroundColor?: Color;
  /** Border colour. */
  borderColor?: Color;
  /** Border width. */
  borderWidth?: number;
  /** Title text colour. */
  titleColor?: Color;
  /** Title font size. */
  titleFontSize?: number;
  /** Font family. */
  fontFamily?: string;
}

// ── UIPanel ─────────────────────────────────────────────────────────────────

/**
 * A floating control panel that contains interactive {@link UISlider} elements.
 *
 * The panel is positioned at a given pixel-space (x, y) and renders a
 * rounded-rect background with an optional title, then lays out its
 * sliders vertically with automatic spacing.
 *
 * ```ts
 * const panel = new UIPanel("Controls", { width: 220 });
 * panel.addSlider("Speed", { min: 0, max: 300, value: 100, step: 5 });
 * panel.addSlider("Count", { min: 1, max: 500, value: 100, step: 1 });
 *
 * // In your main loop:
 * panel.render(ctx, panelX, panelY, panelHeight);
 *
 * // Wire mouse events:
 * window.onMouseDown((btn, x, y) => panel.onMouseDown(x, y));
 * window.onMouseMove((x, y) => panel.onMouseMove(x, y));
 * window.onMouseUp(() => panel.onMouseUp());
 * ```
 */
export class UIPanel {
  title: string;
  width: number;
  padding: number;
  cornerRadius: number;
  backgroundColor: Color;
  borderColor: Color;
  borderWidth: number;
  titleColor: Color;
  titleFontSize: number;
  fontFamily: string;
  visible: boolean;

  private _sliders: UISlider[] = [];
  private _draggingIndex: number | null = null;

  /** Pixel position — set before render/mouseDown or use render(ctx, x, y, h). */
  x = 0;
  y = 0;

  constructor(title: string, options: UIPanelOptions = {}) {
    this.title = title;
    this.width = options.width ?? 220;
    this.padding = options.padding ?? 12;
    this.cornerRadius = options.cornerRadius ?? 8;
    this.backgroundColor = options.backgroundColor ?? Color.core.rgba(30, 30, 50, 220);
    this.borderColor = options.borderColor ?? Color.core.rgb(60, 60, 90);
    this.borderWidth = options.borderWidth ?? 1;
    this.titleColor = options.titleColor ?? Color.core.rgb(220, 220, 255);
    this.titleFontSize = options.titleFontSize ?? 14;
    this.fontFamily = options.fontFamily ?? "monospace";
    this.visible = true;
  }

  // ── Slider management ───────────────────────────────────────────

  /** Add a slider and return it for further configuration. */
  addSlider(label: string, options?: ConstructorParameters<typeof UISlider>[1]): UISlider {
    const slider = new UISlider(label, options);
    this._sliders.push(slider);
    return slider;
  }

  /** Remove a slider by reference. */
  removeSlider(slider: UISlider): void {
    const idx = this._sliders.indexOf(slider);
    if (idx !== -1) this._sliders.splice(idx, 1);
  }

  /** All sliders in this panel. */
  get sliders(): readonly UISlider[] {
    return this._sliders;
  }

  // ── Layout helpers ──────────────────────────────────────────────

  /**
   * The minimum height needed to fit title + all sliders.
   * Useful for sizing the panel dynamically.
   */
  get contentHeight(): number {
    const titleH = this.titleFontSize + this.padding;
    const slidersH = this._sliders.length * UISlider.ROW_HEIGHT;
    return titleH + slidersH + this.padding;
  }

  /** Get the pixel-space rect for a slider's track given the panel position. */
  private _sliderTrackRect(index: number): { sx: number; sy: number; sw: number } {
    const sx = this.x + this.padding;
    const sw = this.width - this.padding * 2;
    const titleH = this.titleFontSize + this.padding;
    const sy = this.y + this.padding + titleH + index * UISlider.ROW_HEIGHT + 18;
    return { sx, sy, sw };
  }

  // ── Mouse interaction ───────────────────────────────────────────

  /** Call from your window's mouseDown handler. Returns true if the panel consumed the event. */
  onMouseDown(mx: number, my: number): boolean {
    if (!this.visible) return false;
    for (let i = 0; i < this._sliders.length; i++) {
      const { sx, sy, sw } = this._sliderTrackRect(i);
      if (this._sliders[i]!.hitTest(mx, my, sx, sy, sw)) {
        this._draggingIndex = i;
        this._sliders[i]!.setFromMouseX(mx, sx, sw);
        return true;
      }
    }
    return false;
  }

  /** Call from your window's mouseMove handler. */
  onMouseMove(mx: number, _my: number): void {
    if (this._draggingIndex === null) return;
    const { sx, sw } = this._sliderTrackRect(this._draggingIndex);
    this._sliders[this._draggingIndex]!.setFromMouseX(mx, sx, sw);
  }

  /** Call from your window's mouseUp handler. */
  onMouseUp(): void {
    this._draggingIndex = null;
  }

  /** Whether a slider drag is currently active. */
  get isDragging(): boolean {
    return this._draggingIndex !== null;
  }

  // ── Rendering ───────────────────────────────────────────────────

  /**
   * Render the full panel at the given pixel position.
   *
   * @param ctx  Canvas 2D context.
   * @param x    Left edge of the panel in pixels.
   * @param y    Top edge of the panel in pixels.
   * @param h    Panel height in pixels (use {@link contentHeight} for auto-sizing).
   */
  render(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
    if (!this.visible) return;

    // Store position for hit testing
    this.x = x;
    this.y = y;

    const w = this.width;
    const r = this.cornerRadius;

    ctx.save();

    // ── Background ──────────────────────────────────────────
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = this.backgroundColor.toRGBAString();
    ctx.fill();
    ctx.strokeStyle = this.borderColor.toRGBAString();
    ctx.lineWidth = this.borderWidth;
    ctx.stroke();

    // ── Title ───────────────────────────────────────────────
    ctx.font = `bold ${this.titleFontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.titleColor.toRGBAString();
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(this.title, x + this.padding, y + this.padding);

    // ── Sliders ─────────────────────────────────────────────
    for (let i = 0; i < this._sliders.length; i++) {
      const { sx, sy, sw } = this._sliderTrackRect(i);
      this._sliders[i]!.render(ctx, sx, sy, sw);
    }

    ctx.restore();
  }
}

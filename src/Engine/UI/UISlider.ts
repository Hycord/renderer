import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color } from "@hycord/math";

// ── Options ─────────────────────────────────────────────────────────────────

export interface UISliderOptions {
  /** Minimum value. */
  min?: number;
  /** Maximum value. */
  max?: number;
  /** Step size for snapping. */
  step?: number;
  /** Initial value. */
  value?: number;
  /** Slider track height in pixels. */
  trackHeight?: number;
  /** Knob radius in pixels. */
  knobRadius?: number;
  /** Track background colour. */
  trackColor?: Color;
  /** Filled portion colour. */
  fillColor?: Color;
  /** Knob fill colour. */
  knobColor?: Color;
  /** Knob stroke colour. */
  knobStrokeColor?: Color;
  /** Label text colour. */
  labelColor?: Color;
  /** Value text colour. */
  valueColor?: Color;
  /** Font size for label and value. */
  fontSize?: number;
  /** Font family. */
  fontFamily?: string;
  /** Decimal places for display (auto if omitted). */
  decimals?: number;
  /** Called when the value changes. */
  onChange?: (value: number) => void;
}

// ── UISlider ────────────────────────────────────────────────────────────────

/**
 * A labelled horizontal slider with an interactive knob.
 *
 * The slider is positioned absolutely in pixel coordinates and renders
 * a label, value readout, filled track, and draggable knob.
 *
 * ```
 * ┌ Separation ──────── 1.5 ┐
 * │  ████████████░░░░░░○    │
 * └─────────────────────────┘
 * ```
 *
 * Use {@link hitTest} + {@link setFromMouseX} for interaction.
 */
export class UISlider {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;

  trackHeight: number;
  knobRadius: number;
  trackColor: Color;
  fillColor: Color;
  knobColor: Color;
  knobStrokeColor: Color;
  labelColor: Color;
  valueColor: Color;
  fontSize: number;
  fontFamily: string;
  decimals: number;

  onChange: ((value: number) => void) | null;

  /** Total height consumed by this slider (label + track + spacing). */
  static readonly ROW_HEIGHT = 42;

  constructor(label: string, options: UISliderOptions = {}) {
    this.label = label;
    this.min = options.min ?? 0;
    this.max = options.max ?? 1;
    this.step = options.step ?? 0.1;
    this.value = options.value ?? this.min;
    this.trackHeight = options.trackHeight ?? 6;
    this.knobRadius = options.knobRadius ?? 8;
    this.trackColor = options.trackColor ?? Color.core.rgb(50, 50, 80);
    this.fillColor = options.fillColor ?? Color.core.rgb(100, 140, 255);
    this.knobColor = options.knobColor ?? Color.core.colors.white();
    this.knobStrokeColor = options.knobStrokeColor ?? Color.core.rgb(100, 140, 255);
    this.labelColor = options.labelColor ?? Color.core.rgb(180, 180, 200);
    this.valueColor = options.valueColor ?? Color.core.rgb(220, 220, 255);
    this.fontSize = options.fontSize ?? 12;
    this.fontFamily = options.fontFamily ?? "monospace";
    this.decimals = options.decimals ?? (this.step >= 1 ? 0 : 1);
    this.onChange = options.onChange ?? null;
  }

  // ── Value manipulation ──────────────────────────────────────────

  /** Normalised position (0–1) of the current value. */
  get normalised(): number {
    return (this.value - this.min) / (this.max - this.min);
  }

  /** Set value from a normalised 0–1 input, snap to step, clamp, and fire onChange. */
  setNormalised(t: number): void {
    const raw = this.min + Math.max(0, Math.min(1, t)) * (this.max - this.min);
    const stepped = Math.round(raw / this.step) * this.step;
    const clamped = Math.max(this.min, Math.min(this.max, stepped));
    if (clamped !== this.value) {
      this.value = clamped;
      this.onChange?.(this.value);
    }
  }

  /**
   * Set the value from a screen-space mouse X coordinate.
   *
   * @param mx  Mouse X in pixels.
   * @param x   Left edge of the track in pixels.
   * @param w   Width of the track in pixels.
   */
  setFromMouseX(mx: number, x: number, w: number): void {
    this.setNormalised((mx - x) / w);
  }

  // ── Hit testing ─────────────────────────────────────────────────

  /**
   * Check whether a screen-space point is within this slider's interactive area.
   *
   * @param mx  Mouse X in pixels.
   * @param my  Mouse Y in pixels.
   * @param x   Left edge of the track.
   * @param y   Top of the track.
   * @param w   Width of the track.
   */
  hitTest(mx: number, my: number, x: number, y: number, w: number): boolean {
    const kr = this.knobRadius;
    return (
      mx >= x - kr &&
      mx <= x + w + kr &&
      my >= y - kr &&
      my <= y + this.trackHeight + kr
    );
  }

  // ── Rendering ───────────────────────────────────────────────────

  /**
   * Render the slider at the given pixel-space position.
   *
   * @param ctx  Canvas 2D context.
   * @param x    Left edge of the track.
   * @param y    Top of the track (label is drawn above).
   * @param w    Track width.
   */
  render(ctx: CanvasRenderingContext2D, x: number, y: number, w: number): void {
    const th = this.trackHeight;
    const labelY = y - this.fontSize - 4;

    // ── Label ───────────────────────────────────────────────
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.textBaseline = "top";

    ctx.fillStyle = this.labelColor.toRGBAString();
    ctx.textAlign = "left";
    ctx.fillText(this.label, x, labelY);

    // ── Value ───────────────────────────────────────────────
    ctx.fillStyle = this.valueColor.toRGBAString();
    ctx.textAlign = "right";
    ctx.fillText(this.value.toFixed(this.decimals), x + w, labelY);

    // ── Track background ────────────────────────────────────
    ctx.beginPath();
    ctx.roundRect(x, y, w, th, th / 2);
    ctx.fillStyle = this.trackColor.toRGBAString();
    ctx.fill();

    // ── Filled portion ──────────────────────────────────────
    const fillW = this.normalised * w;
    ctx.beginPath();
    ctx.roundRect(x, y, Math.max(fillW, th), th, th / 2);
    ctx.fillStyle = this.fillColor.toRGBAString();
    ctx.fill();

    // ── Knob ────────────────────────────────────────────────
    const knobX = x + fillW;
    const knobY = y + th / 2;
    ctx.beginPath();
    ctx.arc(knobX, knobY, this.knobRadius, 0, Math.PI * 2);
    ctx.fillStyle = this.knobColor.toRGBAString();
    ctx.fill();
    ctx.strokeStyle = this.knobStrokeColor.toRGBAString();
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

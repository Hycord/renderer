import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color } from "@hycord/math";

// ── Anchor ──────────────────────────────────────────────────────────────────

/**
 * Horizontal and vertical anchor for positioning overlay elements.
 *
 * Anchors define which edge of the element aligns with its position.
 * For example `{ h: "right", v: "top" }` means the element's top-right
 * corner sits at the position.
 */
export interface Anchor {
  h: "left" | "center" | "right";
  v: "top" | "middle" | "bottom";
}

// ── OverlayElement ──────────────────────────────────────────────────────────

/**
 * Base class for anything rendered on the screen overlay.
 *
 * Positions use **normalised screen coordinates**: (0, 0) is the top-left
 * corner and (1, 1) is the bottom-right corner.
 */
export abstract class OverlayElement {
  /** Normalised X position (0 = left, 1 = right). */
  x: number;
  /** Normalised Y position (0 = top, 1 = bottom). */
  y: number;
  /** Whether this element should be drawn. */
  visible: boolean;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
    this.visible = true;
  }

  /** Called every frame. Override to animate or update content. */
  update(_dt: number): void {}

  /**
   * Draw the element.
   *
   * @param ctx   The canvas 2D context.
   * @param w     Current canvas width in pixels.
   * @param h     Current canvas height in pixels.
   */
  abstract render(ctx: CanvasRenderingContext2D, w: number, h: number): void;
}

// ── TextElement ─────────────────────────────────────────────────────────────

export class TextElement extends OverlayElement {
  text: string;
  color: Color;
  fontSize: number;
  fontFamily: string;
  anchor: Anchor;
  /** Extra padding in pixels from the anchor edge. */
  padding: number;

  constructor(
    text: string,
    x = 0,
    y = 0,
    options: {
      color?: Color;
      fontSize?: number;
      fontFamily?: string;
      anchor?: Anchor;
      padding?: number;
    } = {},
  ) {
    super(x, y);
    this.text = text;
    this.color = options.color ?? Color.core.colors.white();
    this.fontSize = options.fontSize ?? 14;
    this.fontFamily = options.fontFamily ?? "monospace";
    this.anchor = options.anchor ?? { h: "left", v: "top" };
    this.padding = options.padding ?? 6;
  }

  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    ctx.font = `${this.fontSize}px ${this.fontFamily}`;
    ctx.fillStyle = this.color.toRGBAString();

    const px = this.x * w;
    const py = this.y * h;

    // Horizontal alignment
    let drawX = px;
    if (this.anchor.h === "right") {
      ctx.textAlign = "right";
      drawX = px - this.padding;
    } else if (this.anchor.h === "center") {
      ctx.textAlign = "center";
    } else {
      ctx.textAlign = "left";
      drawX = px + this.padding;
    }

    // Vertical alignment
    let drawY = py;
    if (this.anchor.v === "top") {
      ctx.textBaseline = "top";
      drawY = py + this.padding;
    } else if (this.anchor.v === "bottom") {
      ctx.textBaseline = "bottom";
      drawY = py - this.padding;
    } else {
      ctx.textBaseline = "middle";
    }

    // Support multiline text
    const lines = this.text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i]!, drawX, drawY + i * (this.fontSize * 1.2));
    }
  }
}

// ── ScreenOverlay ───────────────────────────────────────────────────────────

/**
 * A screen-space overlay that renders elements in normalised coordinates
 * on top of the world, independent of the camera transform.
 *
 * ```
 * (0,0) ┌────────────┐ (1,0)
 *       │            │
 *       │   screen   │
 *       │            │
 * (0,1) └────────────┘ (1,1)
 * ```
 *
 * Usage:
 * ```ts
 * const overlay = new ScreenOverlay();
 * const fps = new TextElement("0 FPS", 1, 0, {
 *   anchor: { h: "right", v: "top" },
 *   color: Color.core.colors.green(),
 *   fontSize: 14,
 * });
 * overlay.add(fps);
 * camera.overlay = overlay;
 * ```
 */
export class ScreenOverlay {
  private _elements: OverlayElement[] = [];

  /** Add an element to the overlay. Returns the element for chaining. */
  add<T extends OverlayElement>(element: T): T {
    this._elements.push(element);
    return element;
  }

  /** Remove an element from the overlay. */
  remove(element: OverlayElement): void {
    const idx = this._elements.indexOf(element);
    if (idx !== -1) this._elements.splice(idx, 1);
  }

  /** Remove all elements. */
  clear(): void {
    this._elements.length = 0;
  }

  /** Update all elements. */
  update(dt: number): void {
    for (const el of this._elements) {
      el.update(dt);
    }
  }

  /** Render every visible element. Called by Camera after the world pass. */
  render(ctx: CanvasRenderingContext2D, w: number, h: number): void {
    for (const el of this._elements) {
      if (!el.visible) continue;
      ctx.save();
      el.render(ctx, w, h);
      ctx.restore();
    }
  }
}

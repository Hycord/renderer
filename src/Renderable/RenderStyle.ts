import { Color } from "@hycord/math";
import type { CanvasRenderingContext2D } from "@napi-rs/canvas";

/**
 * Shared visual-styling options for any Renderable adapter.
 *
 * A `RenderStyle` describes *how* a shape is drawn (fill colour, stroke
 * colour, stroke width, global opacity) so that every adapter does not need
 * to duplicate the same properties.
 */
export class RenderStyle {
    private _fill: Color | null;
    private _stroke: Color | null;
    private _strokeWidth: number;
    private _opacity: number;

    constructor(
        fill: Color | null = Color.core.colors.white(),
        stroke: Color | null = null,
        strokeWidth: number = 1,
        opacity: number = 1,
    ) {
        this._fill = fill;
        this._stroke = stroke;
        this._strokeWidth = strokeWidth;
        this._opacity = opacity;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get fill(): Color | null {
        return this._fill;
    }

    set fill(value: Color | null) {
        this._fill = value;
    }

    get stroke(): Color | null {
        return this._stroke;
    }

    set stroke(value: Color | null) {
        this._stroke = value;
    }

    get strokeWidth(): number {
        return this._strokeWidth;
    }

    set strokeWidth(value: number) {
        this._strokeWidth = value;
    }

    get opacity(): number {
        return this._opacity;
    }

    set opacity(value: number) {
        this._opacity = Math.max(0, Math.min(1, value));
    }

    // ── Helpers ─────────────────────────────────────────────────────

    /** Apply fill & stroke settings to a canvas context before drawing. */
    applyTo(ctx: CanvasRenderingContext2D): void {
        ctx.globalAlpha = this._opacity;

        if (this._fill) {
            ctx.fillStyle = this._fill.toRGBAString();
        }

        if (this._stroke) {
            ctx.strokeStyle = this._stroke.toRGBAString();
            ctx.lineWidth = this._strokeWidth;
        }
    }

    /** Execute fill and/or stroke on the current path. */
    finishPath(ctx: CanvasRenderingContext2D): void {
        if (this._fill) {
            ctx.fill();
        }
        if (this._stroke) {
            ctx.stroke();
        }
    }

    // ── Convenient Factories ────────────────────────────────────────

    static filled(color: Color): RenderStyle {
        return new RenderStyle(color, null, 1, 1);
    }

    static stroked(color: Color, width: number = 1): RenderStyle {
        return new RenderStyle(null, color, width, 1);
    }

    static filledAndStroked(
        fill: Color,
        stroke: Color,
        strokeWidth: number = 1,
    ): RenderStyle {
        return new RenderStyle(fill, stroke, strokeWidth, 1);
    }
}

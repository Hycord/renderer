import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Transform, Vector3D } from "@hycord/math";
import { Renderable } from "../common";
import { RenderStyle } from "../RenderStyle";
import { AxisAlignedBoundingBox } from "../../Engine";

/**
 * Renders an axis-aligned rectangle defined by width and height.
 *
 * The transform position is the rectangle's centre.  The rectangle is drawn
 * centred at the local origin so that scale / rotation work naturally.
 *
 * @example
 * ```ts
 * const rect = new RenderableRect(
 *     80, 40,
 *     new Vector3D(200, 150, 0),
 *     RenderStyle.filledAndStroked(
 *         Color.core.colors.blue(),
 *         Color.core.colors.white(),
 *         2,
 *     ),
 * );
 * world.add(rect);
 * ```
 */
export class RenderableRect extends Renderable {
    private _width: number;
    private _height: number;
    private _style: RenderStyle;

    constructor(
        width: number = 1,
        height: number = 1,
        position: Vector3D = Vector3D.core.zero(),
        style: RenderStyle = RenderStyle.filled(Color.core.colors.white()),
        layer: number = 0,
    ) {
        super(new Transform(position), layer);
        this._width = width;
        this._height = height;
        this._style = style;
    }

    /** Create from an existing AxisAlignedBoundingBox (uses its XY extent). */
    static fromAABB(
        aabb: AxisAlignedBoundingBox,
        style?: RenderStyle,
        layer?: number,
    ): RenderableRect {
        const center = aabb.center();
        const w = aabb.max.x - aabb.min.x;
        const h = aabb.max.y - aabb.min.y;
        return new RenderableRect(
            w,
            h,
            center,
            style,
            layer,
        );
    }

    // ── Accessors ───────────────────────────────────────────────────

    get width(): number {
        return this._width;
    }

    set width(value: number) {
        this._width = value;
    }

    get height(): number {
        return this._height;
    }

    set height(value: number) {
        this._height = value;
    }

    get style(): RenderStyle {
        return this._style;
    }

    set style(value: RenderStyle) {
        this._style = value;
    }

    // ── Renderable overrides ────────────────────────────────────────

    override bounds(): AxisAlignedBoundingBox {
        const hw = this._width / 2;
        const hh = this._height / 2;
        return AxisAlignedBoundingBox.fromCenterExtents(
            Vector3D.core.zero(),
            new Vector3D(hw, hh, 0),
        );
    }

    override update(_deltaTime: number): void {}

    override render(ctx: CanvasRenderingContext2D): void {
        const hw = this._width / 2;
        const hh = this._height / 2;

        this._style.applyTo(ctx);
        ctx.beginPath();
        ctx.rect(-hw, -hh, this._width, this._height);
        this._style.finishPath(ctx);
    }
}

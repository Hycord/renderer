import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Transform, Vector3D } from "@hycord/math";
import { Renderable } from "../common";
import { RenderStyle } from "../RenderStyle";
import { AxisAlignedBoundingBox } from "../../Engine";

export class RenderableRoundedRect extends Renderable {
    private _width: number;
    private _height: number;
    private _radius: number | number[];
    private _style: RenderStyle;

    /**
     * @param x        Left edge in screen-space pixels.
     * @param y        Top edge in screen-space pixels.
     * @param width    Width in pixels.
     * @param height   Height in pixels.
     * @param radius   Corner radius (single number or per-corner array).
     * @param style    Fill / stroke style.
     * @param layer    Render layer (lower = further back).
     */
    constructor(
        x: number = 0,
        y: number = 0,
        width: number = 100,
        height: number = 100,
        radius: number | number[] = 8,
        style: RenderStyle = RenderStyle.filled(Color.core.colors.white()),
        layer: number = 0,
    ) {
        // Position is the top-left corner so the render path can draw from (0,0).
        super(new Transform(new Vector3D(x, y, 0)), layer);
        this._width = width;
        this._height = height;
        this._radius = radius;
        this._style = style;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get rectWidth(): number { return this._width; }
    set rectWidth(value: number) { this._width = value; }

    get rectHeight(): number { return this._height; }
    set rectHeight(value: number) { this._height = value; }

    get radius(): number | number[] { return this._radius; }
    set radius(value: number | number[]) { this._radius = value; }

    get style(): RenderStyle { return this._style; }
    set style(value: RenderStyle) { this._style = value; }

    // ── Geometry ────────────────────────────────────────────────────

    override bounds(): AxisAlignedBoundingBox {
        const hw = this._width / 2;
        const hh = this._height / 2;
        return AxisAlignedBoundingBox.fromCenterExtents(
            Vector3D.core.zero(),
            new Vector3D(hw, hh, 0),
        );
    }

    // ── Lifecycle ───────────────────────────────────────────────────

    override update(_deltaTime: number): void {}

    override render(ctx: CanvasRenderingContext2D): void {
        this._style.applyTo(ctx);
        ctx.beginPath();
        ctx.roundRect(0, 0, this._width, this._height, this._radius);
        this._style.finishPath(ctx);
    }
}

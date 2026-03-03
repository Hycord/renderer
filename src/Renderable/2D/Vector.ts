import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Transform, Vector3D } from "@hycord/math";
import { Renderable } from "../common";
import { RenderStyle } from "../RenderStyle";
import { AxisAlignedBoundingBox } from "../../Engine";

/**
 * Renders a 2-D vector as an arrow from the transform's position.
 *
 * Useful for visualising velocities, normals, forces, or any directed
 * quantity.  The arrow body is drawn as a line and the head as a small
 * triangle.
 *
 * @example
 * ```ts
 * const rv = new RenderableVector(
 *     new Vector3D(1, 0, 0),          // direction
 *     50,                              // visual length
 *     new Vector3D(100, 100, 0),       // origin
 *     RenderStyle.stroked(Color.core.colors.red(), 2),
 * );
 * world.add(rv);
 * ```
 */
export class RenderableVector extends Renderable {
    private _direction: Vector3D;
    private _length: number;
    private _headSize: number;
    private _style: RenderStyle;

    constructor(
        direction: Vector3D = new Vector3D(1, 0, 0),
        length: number = 50,
        origin: Vector3D = Vector3D.core.zero(),
        style: RenderStyle = RenderStyle.stroked(Color.core.colors.white(), 2),
        headSize: number = 8,
        layer: number = 0,
    ) {
        super(new Transform(origin), layer);
        this._direction = direction.length === 0 ? new Vector3D(1, 0, 0) : direction.normalize();
        this._length = length;
        this._headSize = headSize;
        this._style = style;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get direction(): Vector3D {
        return this._direction;
    }

    set direction(value: Vector3D) {
        this._direction = value.length === 0 ? new Vector3D(1, 0, 0) : value.normalize();
    }

    get length(): number {
        return this._length;
    }

    set length(value: number) {
        this._length = value;
    }

    get headSize(): number {
        return this._headSize;
    }

    set headSize(value: number) {
        this._headSize = value;
    }

    get style(): RenderStyle {
        return this._style;
    }

    set style(value: RenderStyle) {
        this._style = value;
    }

    // ── Renderable overrides ────────────────────────────────────────

    override bounds(): AxisAlignedBoundingBox {
        const ex = Math.abs(this._direction.x * this._length) / 2;
        const ey = Math.abs(this._direction.y * this._length) / 2;
        return AxisAlignedBoundingBox.fromCenterExtents(
            Vector3D.core.zero(),
            new Vector3D(ex + this._headSize, ey + this._headSize, 0),
        );
    }

    override update(_deltaTime: number): void {}

    override render(ctx: CanvasRenderingContext2D): void {
        const dx = this._direction.x * this._length;
        const dy = this._direction.y * this._length;

        this._style.applyTo(ctx);

        // Shaft
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(dx, dy);
        ctx.stroke();

        // Arrowhead
        const angle = Math.atan2(dy, dx);
        const hs = this._headSize;
        ctx.beginPath();
        ctx.moveTo(dx, dy);
        ctx.lineTo(
            dx - hs * Math.cos(angle - Math.PI / 6),
            dy - hs * Math.sin(angle - Math.PI / 6),
        );
        ctx.lineTo(
            dx - hs * Math.cos(angle + Math.PI / 6),
            dy - hs * Math.sin(angle + Math.PI / 6),
        );
        ctx.closePath();

        // Fill arrowhead with stroke colour (or fill colour as fallback)
        const headColor = this._style.stroke ?? this._style.fill;
        if (headColor) {
            ctx.fillStyle = headColor.toRGBAString();
            ctx.fill();
        }
    }
}

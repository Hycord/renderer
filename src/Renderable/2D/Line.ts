import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import {  Color, Transform, Vector3D } from "@hycord/math";
import { Renderable } from "../common";
import { RenderStyle } from "../RenderStyle";
import { AxisAlignedBoundingBox } from "../../Engine";

/**
 * Renders a line segment between two 3-D points.
 *
 * The transform is centred at the midpoint of the two endpoints so that
 * rotations / scales behave intuitively.  The actual drawing offsets each
 * endpoint relative to that midpoint.
 *
 * @example
 * ```ts
 * const line = new RenderableLine(
 *     new Vector3D(0, 0, 0),
 *     new Vector3D(100, 50, 0),
 *     RenderStyle.stroked(Color.core.colors.green(), 2),
 * );
 * world.add(line);
 * ```
 */
export class RenderableLine extends Renderable {
    private _start: Vector3D;
    private _end: Vector3D;
    private _style: RenderStyle;

    constructor(
        start: Vector3D = Vector3D.core.zero(),
        end: Vector3D = new Vector3D(1, 0, 0),
        style: RenderStyle = RenderStyle.stroked(Color.core.colors.white()),
        layer: number = 0,
    ) {
        const mid = new Vector3D(
            (start.x + end.x) / 2,
            (start.y + end.y) / 2,
            (start.z + end.z) / 2,
        );
        super(new Transform(mid), layer);
        this._start = start;
        this._end = end;
        this._style = style;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get start(): Vector3D {
        return this._start;
    }

    set start(value: Vector3D) {
        this._start = value;
        this._syncTransform();
    }

    get end(): Vector3D {
        return this._end;
    }

    set end(value: Vector3D) {
        this._end = value;
        this._syncTransform();
    }

    get style(): RenderStyle {
        return this._style;
    }

    set style(value: RenderStyle) {
        this._style = value;
    }

    // ── Internals ───────────────────────────────────────────────────

    private _syncTransform(): void {
        this.transform.position = new Vector3D(
            (this._start.x + this._end.x) / 2,
            (this._start.y + this._end.y) / 2,
            (this._start.z + this._end.z) / 2,
        );
    }

    // ── Renderable overrides ────────────────────────────────────────

    override bounds(): AxisAlignedBoundingBox {
        const halfDx = Math.abs(this._end.x - this._start.x) / 2;
        const halfDy = Math.abs(this._end.y - this._start.y) / 2;
        const halfDz = Math.abs(this._end.z - this._start.z) / 2;
        return AxisAlignedBoundingBox.fromCenterExtents(
            Vector3D.core.zero(),
            new Vector3D(halfDx, halfDy, halfDz),
        );
    }

    override update(_deltaTime: number): void {}

    override render(ctx: CanvasRenderingContext2D): void {
        const mid = this.transform.position;
        const sx = this._start.x - mid.x;
        const sy = this._start.y - mid.y;
        const ex = this._end.x - mid.x;
        const ey = this._end.y - mid.y;

        this._style.applyTo(ctx);
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    }
}

import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Transform, Vector3D } from "@hycord/math";
import type { Ray } from "@hycord/math";
import { Renderable } from "../common";
import { RenderStyle } from "../RenderStyle";
import { AxisAlignedBoundingBox } from "../../Engine";

/**
 * Renderable adapter for a {@link Ray} from `@hycord/math`.
 *
 * Draws the ray as a directed line from its origin along its direction,
 * with an arrowhead at the tip.  Because a mathematical ray is infinite,
 * a configurable `displayLength` controls how far it extends visually.
 *
 * @example
 * ```ts
 * const ray = new Ray(new Vector3D(0, 0, 0), new Vector3D(1, 1, 0));
 * const rr = new RenderableRay(ray, 200, RenderStyle.stroked(Color.core.colors.yellow(), 2));
 * world.add(rr);
 * ```
 */
export class RenderableRay extends Renderable {
    private _ray: Ray;
    private _displayLength: number;
    private _headSize: number;
    private _style: RenderStyle;

    constructor(
        ray: Ray,
        displayLength: number = 200,
        style: RenderStyle = RenderStyle.stroked(Color.core.colors.white(), 2),
        headSize: number = 10,
        layer: number = 0,
    ) {
        super(new Transform(ray.origin.clone()), layer);
        this._ray = ray;
        this._displayLength = displayLength;
        this._headSize = headSize;
        this._style = style;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get ray(): Ray {
        return this._ray;
    }

    set ray(value: Ray) {
        this._ray = value;
    }

    get displayLength(): number {
        return this._displayLength;
    }

    set displayLength(value: number) {
        this._displayLength = value;
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
        const d = this._ray.direction;
        const ex = Math.abs(d.x * this._displayLength) / 2;
        const ey = Math.abs(d.y * this._displayLength) / 2;
        const ez = Math.abs(d.z * this._displayLength) / 2;
        return AxisAlignedBoundingBox.fromCenterExtents(
            Vector3D.core.zero(),
            new Vector3D(ex + this._headSize, ey + this._headSize, ez),
        );
    }

    override update(_deltaTime: number): void {
        this.transform.position = this._ray.origin.clone();
    }

    override render(ctx: CanvasRenderingContext2D): void {
        const d = this._ray.direction;
        const dx = d.x * this._displayLength;
        const dy = d.y * this._displayLength;

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

        const headColor = this._style.stroke ?? this._style.fill;
        if (headColor) {
            ctx.fillStyle = headColor.toRGBAString();
            ctx.fill();
        }
    }
}

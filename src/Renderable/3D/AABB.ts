import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Transform, Vector3D } from "@hycord/math";
import { Renderable } from "../common";
import { RenderStyle } from "../RenderStyle";
import { AxisAlignedBoundingBox } from "../../Engine";

/**
 * Renderable adapter for an {@link AxisAlignedBoundingBox} from `@hycord/math`.
 *
 * Draws the AABB as a wireframe (or filled) rectangle in the XY plane.
 * The transform position is kept in sync with the AABB's centre so that
 * external mutations are reflected automatically.
 *
 * @example
 * ```ts
 * const aabb = AxisAlignedBoundingBox.fromCenterExtents(
 *     new Vector3D(100, 100, 0),
 *     new Vector3D(50, 30, 0),
 * );
 * const ra = new RenderableAABB(aabb, RenderStyle.stroked(Color.core.colors.green(), 1));
 * world.add(ra);
 * ```
 */
export class RenderableAABB extends Renderable {
    private _aabb: AxisAlignedBoundingBox;
    private _style: RenderStyle;

    constructor(
        aabb: AxisAlignedBoundingBox,
        style: RenderStyle = RenderStyle.stroked(Color.core.colors.white()),
        layer: number = 0,
    ) {
        super(new Transform(aabb.center()), layer);
        this._aabb = aabb;
        this._style = style;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get aabb(): AxisAlignedBoundingBox {
        return this._aabb;
    }

    set aabb(value: AxisAlignedBoundingBox) {
        this._aabb = value;
    }

    get style(): RenderStyle {
        return this._style;
    }

    set style(value: RenderStyle) {
        this._style = value;
    }

    // ── Renderable overrides ────────────────────────────────────────

    override bounds(): AxisAlignedBoundingBox {
        const ext = this._aabb.extents();
        return AxisAlignedBoundingBox.fromCenterExtents(Vector3D.core.zero(), ext);
    }

    override update(_deltaTime: number): void {
        this.transform.position = this._aabb.center();
    }

    override render(ctx: CanvasRenderingContext2D): void {
        const w = this._aabb.max.x - this._aabb.min.x;
        const h = this._aabb.max.y - this._aabb.min.y;
        const hw = w / 2;
        const hh = h / 2;

        this._style.applyTo(ctx);
        ctx.beginPath();
        ctx.rect(-hw, -hh, w, h);
        this._style.finishPath(ctx);
    }
}

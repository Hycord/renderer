import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import {  Color, Transform, Vector3D } from "@hycord/math";
import type { Sphere } from "@hycord/math";
import { Renderable } from "../common";
import { RenderStyle } from "../RenderStyle";
import { AxisAlignedBoundingBox } from "../../Engine";

/**
 * Renderable adapter for a {@link Sphere} from `@hycord/math`.
 *
 * On a 2-D canvas a sphere is drawn as a filled / stroked circle whose
 * radius equals the sphere's radius.  The transform position is synced
 * from `sphere.center` on every `update()`.
 *
 * @example
 * ```ts
 * const sphere = new Sphere(new Vector3D(10, 20, 0), 25);
 * const rs = new RenderableSphere(sphere, RenderStyle.filled(Color.core.colors.blue()));
 * world.add(rs);
 * ```
 */
export class RenderableSphere extends Renderable {
    private _sphere: Sphere;
    private _style: RenderStyle;

    constructor(
        sphere: Sphere,
        style: RenderStyle = RenderStyle.filled(Color.core.colors.white()),
        layer: number = 0,
    ) {
        super(new Transform(sphere.center.clone()), layer);
        this._sphere = sphere;
        this._style = style;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get sphere(): Sphere {
        return this._sphere;
    }

    set sphere(value: Sphere) {
        this._sphere = value;
    }

    get style(): RenderStyle {
        return this._style;
    }

    set style(value: RenderStyle) {
        this._style = value;
    }

    // ── Renderable overrides ────────────────────────────────────────

    override bounds(): AxisAlignedBoundingBox {
        const r = this._sphere.radius;
        return AxisAlignedBoundingBox.fromCenterExtents(
            Vector3D.core.zero(),
            new Vector3D(r, r, r),
        );
    }

    override update(_deltaTime: number): void {
        this.transform.position = this._sphere.center.clone();
    }

    override render(ctx: CanvasRenderingContext2D): void {
        this._style.applyTo(ctx);
        ctx.beginPath();
        ctx.arc(0, 0, this._sphere.radius, 0, Math.PI * 2);
        this._style.finishPath(ctx);
    }
}

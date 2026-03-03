import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Transform, Vector3D } from "@hycord/math";
import type { Circle } from "@hycord/math";
import { Renderable } from "../common";
import { RenderStyle } from "../RenderStyle";
import { AxisAlignedBoundingBox } from "../../Engine";

/**
 * Renderable adapter for a {@link Circle} from `@hycord/math`.
 *
 * The circle's `center` is mapped to the Renderable's transform position
 * (promoted to 3-D with z = 0) and the `radius` is read directly from the
 * math object so any external mutations are reflected automatically.
 *
 * @example
 * ```ts
 * const circle = new Circle(new Vector2D(100, 50), 30);
 * const rc = new RenderableCircle(circle, RenderStyle.stroked(Color.core.colors.red(), 2));
 * world.add(rc);
 * ```
 */
export class RenderableCircle extends Renderable {
    private _circle: Circle;
    private _style: RenderStyle;

    constructor(
        circle: Circle,
        style: RenderStyle = RenderStyle.filled(Color.core.colors.white()),
        layer: number = 0,
    ) {
        super(
            new Transform(new Vector3D(circle.center.x, circle.center.y, 0)),
            layer,
        );
        this._circle = circle;
        this._style = style;
    }

    // ── Accessors ───────────────────────────────────────────────────

    /** The underlying math Circle. */
    get circle(): Circle {
        return this._circle;
    }

    set circle(value: Circle) {
        this._circle = value;
    }

    get style(): RenderStyle {
        return this._style;
    }

    set style(value: RenderStyle) {
        this._style = value;
    }

    // ── Renderable overrides ────────────────────────────────────────

    override bounds(): AxisAlignedBoundingBox {
        const r = this._circle.radius;
        return AxisAlignedBoundingBox.fromCenterExtents(
            Vector3D.core.zero(),
            new Vector3D(r, r, 0),
        );
    }

    override update(_deltaTime: number): void {
        // Sync transform position from the math Circle's center.
        this.transform.position = new Vector3D(
            this._circle.center.x,
            this._circle.center.y,
            0,
        );
    }

    override render(ctx: CanvasRenderingContext2D): void {
        this._style.applyTo(ctx);
        ctx.beginPath();
        ctx.arc(0, 0, this._circle.radius, 0, Math.PI * 2);
        this._style.finishPath(ctx);
    }
}

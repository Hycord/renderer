import { Color, Transform, Vector3D, type Vector2D } from "@hycord/math";
import { RenderStyle } from "../RenderStyle";
import { Renderable } from "../common";
import { AxisAlignedBoundingBox } from "../../Engine";
import type { CanvasRenderingContext2D } from "@napi-rs/canvas";

export class RenderablePolygon extends Renderable {
    private _points: Vector2D[];
    private _style: RenderStyle;

    constructor(
        points: Vector2D[] = [],
        style: RenderStyle = RenderStyle.filled(Color.core.colors.white()),
        layer: number = 0,
    ) {
        super(new Transform(), layer);
        this._points = points;
        this._style = style;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get points(): Vector2D[] {
        return this._points;
    }

    set points(value: Vector2D[]) {
        this._points = value;
    }

    get style(): RenderStyle {
        return this._style;
    }

    set style(value: RenderStyle) {
        this._style = value;
    }

    // ── Geometry ────────────────────────────────────────────────────

    override bounds(): AxisAlignedBoundingBox | null {
        if (this._points.length === 0) return null;
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        for (const p of this._points) {
            if (p.x < minX) minX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.x > maxX) maxX = p.x;
            if (p.y > maxY) maxY = p.y;
        }
        return new AxisAlignedBoundingBox(
            new Vector3D(minX, minY, 0),
            new Vector3D(maxX, maxY, 0),
        );
    }

    // ── Lifecycle ───────────────────────────────────────────────────

    override update(_deltaTime: number): void {}

    override render(ctx: CanvasRenderingContext2D): void {
        if (this._points.length < 2) return;
        this._style.applyTo(ctx);
        ctx.beginPath();
        const first = this._points[0]!;
        ctx.moveTo(first.x, first.y);
        for (let i = 1; i < this._points.length; i++) {
            const pt = this._points[i]!;
            ctx.lineTo(pt.x, pt.y);
        }
        ctx.closePath();
        this._style.finishPath(ctx);
    }
}
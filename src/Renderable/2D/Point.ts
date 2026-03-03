import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Transform, Vector3D } from "@hycord/math";
import { Renderable } from "../common";
import { AxisAlignedBoundingBox } from "../../Engine";

export class RenderablePoint extends Renderable {
    private _radius: number;
    private _color: Color;

    constructor(
        position: Vector3D = new Vector3D(),
        radius: number = 2,
        color: Color = Color.core.colors.white(),
    ) {
        super(new Transform(position));
        this._radius = radius;
        this._color = color;
    }

    get radius(): number {
        return this._radius;
    }

    set radius(value: number) {
        this._radius = value;
    }

    get color(): Color {
        return this._color;
    }

    set color(value: Color) {
        this._color = value;
    }

    /** Visual bounding box: a cube whose half-size equals the point radius. */
    override bounds(): AxisAlignedBoundingBox {
        const r = this._radius;
        return AxisAlignedBoundingBox.fromCenterExtents(
            Vector3D.core.zero(),
            new Vector3D(r, r, 0),
        );
    }

    override update(_deltaTime: number): void {}

    override render(context: CanvasRenderingContext2D): void {
        context.fillStyle = this._color.toRGBAString();
        context.beginPath();
        context.arc(0, 0, this._radius, 0, Math.PI * 2);
        context.fill();
    }
}
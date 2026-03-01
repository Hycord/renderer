import * as common from "../common";
import { Vector2D, Vector3D } from "../Vector";

export class Circle {
    private _center: Vector2D;
    private _radius: number;

    constructor(center: Vector2D = Vector2D.core.zero(), radius: number = 1) {
        this._center = center;
        this._radius = radius;
    }

    get center(): Vector2D {
        return this._center;
    }

    set center(value: Vector2D) {
        this._center = value;
    }

    get radius(): number {
        return this._radius;
    }

    set radius(value: number) {
        this._radius = value;
    }

    containsPoint(point: Vector2D): boolean {
        const distanceSquared = this._center.subtract(point).magnitudeSquared();
        return distanceSquared <= this._radius * this._radius;
    }

    circumference(): number {
        return 2 * common.PI * this._radius;
    }

    area(): number {
        return common.PI * this._radius * this._radius;
    }
}
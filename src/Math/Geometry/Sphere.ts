import * as common from "../common";
import { Vector3D } from "../Vector";

export class Sphere {
    private _center: Vector3D;
    private _radius: number;

    constructor(center: Vector3D = Vector3D.core.zero(), radius: number = 1) {
        this._center = center;
        this._radius = radius;
    }

    get center(): Vector3D {
        return this._center;
    }

    set center(value: Vector3D) {
        this._center = value;
    }

    get radius(): number {
        return this._radius;
    }

    set radius(value: number) {
        this._radius = value;
    } 
    
    
    containsPoint(point: Vector3D): boolean {
        const distanceSquared = this._center.subtract(point).magnitudeSquared();
        return distanceSquared <= this._radius * this._radius;
    }

    surfaceArea(): number {
        return 4 * common.PI * this._radius * this._radius;
    }

    volume(): number {
        return (4 / 3) * common.PI * Math.pow(this._radius, 3);
    }
}
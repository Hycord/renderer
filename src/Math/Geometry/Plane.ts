import * as Common from "../common"
import { Vector3D } from "../Vector";

export class Plane {
    private _normal: Vector3D;
    private _distance: number;

    constructor(normal: Vector3D, distance: number = Common.MAX_DISTANCE) {
        this._normal = normal.normalize();
        this._distance = distance;
    }

    get normal(): Vector3D {
        return this._normal;
    }

    set normal(value: Vector3D) {
        this._normal = value.normalize();
    }

    get distance(): number {
        return this._distance;
    }

    set distance(value: number) {
        this._distance = value;
    }

    distanceToPoint(point: Vector3D): number {
        return this._normal.x * point.x + this._normal.y * point.y + this._normal.z * point.z - this._distance;
    }

    projectPoint(point: Vector3D): Vector3D {
        const distance = this.distanceToPoint(point);
        return new Vector3D(
            point.x - this._normal.x * distance,
            point.y - this._normal.y * distance,
            point.z - this._normal.z * distance,
        );
    }

    side(point: Vector3D): "BEHIND" | "IN_FRONT" | "ON_PLANE" {
        const distance = this.distanceToPoint(point);
        if (distance > Common.EPSILON) return "IN_FRONT"; // In front of the plane
        if (distance < -Common.EPSILON) return "BEHIND"; // Behind the plane
        return 'ON_PLANE'; // On the plane
    }

}
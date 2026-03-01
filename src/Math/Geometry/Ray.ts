import * as Common from "../common";
import { Vector3D } from "../Vector";

export class Ray {
    private _origin: Vector3D;
    private _direction: Vector3D;

    constructor(origin: Vector3D = Vector3D.core.zero(), direction: Vector3D = Vector3D.core.forward()) {
        this._origin = origin;
        this._direction = direction.normalize();
    }

    get origin(): Vector3D {
        return this._origin;
    }

    set origin(value: Vector3D) {
        this._origin = value;
    }

    get direction(): Vector3D {
        return this._direction;
    }

    set direction(value: Vector3D) {
        this._direction = value.normalize();
    }

    pointAt(t: number): Vector3D {
        return new Vector3D(
            this._origin.x + this._direction.x * t,
            this._origin.y + this._direction.y * t,
            this._origin.z + this._direction.z * t,
        );
    }
}
import type { Matrix4D } from "../Matrix";
import { Vector3D } from "../Vector";

export class AxisAlignedBoundingBox {
    private _min: Vector3D;
    private _max: Vector3D;

    constructor(min: Vector3D, max: Vector3D) {
        this._min = min;
        this._max = max;
    }

    get min(): Vector3D {
        return this._min;
    }

    set min(value: Vector3D) {
        this._min = value;
    }

    get max(): Vector3D {
        return this._max;
    }

    set max(value: Vector3D) {
        this._max = value;
    }

    center(): Vector3D {
        return new Vector3D(
            (this._min.x + this._max.x) / 2,
            (this._min.y + this._max.y) / 2,
            (this._min.z + this._max.z) / 2,
        );
    }

    /** Returns the extents of the AABB, which is half the size of the box in each dimension. */
    extents(): Vector3D {
        return new Vector3D(
            (this._max.x - this._min.x) / 2,
            (this._max.y - this._min.y) / 2,
            (this._max.z - this._min.z) / 2,
        );
    }

    contains(point: Vector3D): boolean {
        return (
            point.x >= this._min.x &&
            point.x <= this._max.x &&
            point.y >= this._min.y &&
            point.y <= this._max.y &&
            point.z >= this._min.z &&
            point.z <= this._max.z
        );
    }

    expand(point: Vector3D): void {
        this._min.x = Math.min(this._min.x, point.x);
        this._min.y = Math.min(this._min.y, point.y);
        this._min.z = Math.min(this._min.z, point.z);

        this._max.x = Math.max(this._max.x, point.x);
        this._max.y = Math.max(this._max.y, point.y);
        this._max.z = Math.max(this._max.z, point.z);
    }

    merge(other: AxisAlignedBoundingBox): void {
        this.expand(other.min);
        this.expand(other.max);
    }

    transform(matrix: Matrix4D): AxisAlignedBoundingBox {
        const corners = [
            new Vector3D(this._min.x, this._min.y, this._min.z),
            new Vector3D(this._min.x, this._min.y, this._max.z),
            new Vector3D(this._min.x, this._max.y, this._min.z),
            new Vector3D(this._min.x, this._max.y, this._max.z),
            new Vector3D(this._max.x, this._min.y, this._min.z),
            new Vector3D(this._max.x, this._min.y, this._max.z),
            new Vector3D(this._max.x, this._max.y, this._min.z),
            new Vector3D(this._max.x, this._max.y, this._max.z),
        ];

        const transformedCorners = corners.map((corner) =>
            matrix.transformPoint(corner),
        );

        const newMin = transformedCorners.reduce(
            (acc, corner) => new Vector3D(
                Math.min(acc.x, corner.x),
                Math.min(acc.y, corner.y),
                Math.min(acc.z, corner.z),
            ),
            new Vector3D(Infinity, Infinity, Infinity),
        );

        const newMax = transformedCorners.reduce(
            (acc, corner) => new Vector3D(
                Math.max(acc.x, corner.x),
                Math.max(acc.y, corner.y),
                Math.max(acc.z, corner.z),
            ),
            new Vector3D(-Infinity, -Infinity, -Infinity),
        );

        return new AxisAlignedBoundingBox(newMin, newMax);
    }
}
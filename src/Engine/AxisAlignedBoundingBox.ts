import { Matrix4D, Transform, Vector3D } from "@hycord/math";

export class AxisAlignedBoundingBox {
    private _min: Vector3D;
    private _max: Vector3D;

    constructor(min: Vector3D, max: Vector3D) {
        this._min = min;
        this._max = max;
    }

    // ── Static Factories ────────────────────────────────────────────

    /** Create an AABB centred at `center` with half-sizes given by `extents`. */
    static fromCenterExtents(center: Vector3D, extents: Vector3D): AxisAlignedBoundingBox {
        return new AxisAlignedBoundingBox(
            new Vector3D(center.x - extents.x, center.y - extents.y, center.z - extents.z),
            new Vector3D(center.x + extents.x, center.y + extents.y, center.z + extents.z),
        );
    }

    /** Create an AABB centred at `center` with the given full `size` in each dimension. */
    static fromCenterSize(center: Vector3D, size: Vector3D): AxisAlignedBoundingBox {
        return AxisAlignedBoundingBox.fromCenterExtents(
            center,
            new Vector3D(size.x / 2, size.y / 2, size.z / 2),
        );
    }

    /** Compute the smallest AABB that contains every point in the array. */
    static fromPoints(points: Vector3D[]): AxisAlignedBoundingBox {
        if (points.length === 0) {
            return new AxisAlignedBoundingBox(Vector3D.core.zero(), Vector3D.core.zero());
        }
        const min = new Vector3D(Infinity, Infinity, Infinity);
        const max = new Vector3D(-Infinity, -Infinity, -Infinity);
        for (const p of points) {
            min.x = Math.min(min.x, p.x);
            min.y = Math.min(min.y, p.y);
            min.z = Math.min(min.z, p.z);
            max.x = Math.max(max.x, p.x);
            max.y = Math.max(max.y, p.y);
            max.z = Math.max(max.z, p.z);
        }
        return new AxisAlignedBoundingBox(min, max);
    }

    /** Create a unit cube AABB (0,0,0) → (1,1,1). */
    static unit(): AxisAlignedBoundingBox {
        return new AxisAlignedBoundingBox(Vector3D.core.zero(), new Vector3D(1, 1, 1));
    }

    // ── Accessors ───────────────────────────────────────────────────

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

    // ── Measurements ────────────────────────────────────────────────

    /** Centre point of the AABB. */
    center(): Vector3D {
        return new Vector3D(
            (this._min.x + this._max.x) / 2,
            (this._min.y + this._max.y) / 2,
            (this._min.z + this._max.z) / 2,
        );
    }

    /** Half-size of the box in each dimension. */
    extents(): Vector3D {
        return new Vector3D(
            (this._max.x - this._min.x) / 2,
            (this._max.y - this._min.y) / 2,
            (this._max.z - this._min.z) / 2,
        );
    }

    /** Full size of the box in each dimension. */
    size(): Vector3D {
        return new Vector3D(
            this._max.x - this._min.x,
            this._max.y - this._min.y,
            this._max.z - this._min.z,
        );
    }

    /** Volume of the AABB. */
    volume(): number {
        const s = this.size();
        return s.x * s.y * s.z;
    }

    /** Surface area of the AABB. */
    surfaceArea(): number {
        const s = this.size();
        return 2 * (s.x * s.y + s.y * s.z + s.z * s.x);
    }

    /** All 8 corner points of the AABB. */
    corners(): Vector3D[] {
        return [
            new Vector3D(this._min.x, this._min.y, this._min.z),
            new Vector3D(this._min.x, this._min.y, this._max.z),
            new Vector3D(this._min.x, this._max.y, this._min.z),
            new Vector3D(this._min.x, this._max.y, this._max.z),
            new Vector3D(this._max.x, this._min.y, this._min.z),
            new Vector3D(this._max.x, this._min.y, this._max.z),
            new Vector3D(this._max.x, this._max.y, this._min.z),
            new Vector3D(this._max.x, this._max.y, this._max.z),
        ];
    }

    // ── Queries ─────────────────────────────────────────────────────

    /** True if `point` lies inside or on the surface of this AABB. */
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

    /** True if `other` is entirely inside this AABB. */
    containsBox(other: AxisAlignedBoundingBox): boolean {
        return this.contains(other.min) && this.contains(other.max);
    }

    /** True if this AABB overlaps `other` in all three axes. */
    intersects(other: AxisAlignedBoundingBox): boolean {
        return (
            this._min.x <= other._max.x &&
            this._max.x >= other._min.x &&
            this._min.y <= other._max.y &&
            this._max.y >= other._min.y &&
            this._min.z <= other._max.z &&
            this._max.z >= other._min.z
        );
    }

    /** Returns the overlapping region of two AABBs, or null if they don't overlap. */
    intersection(other: AxisAlignedBoundingBox): AxisAlignedBoundingBox | null {
        if (!this.intersects(other)) return null;
        return new AxisAlignedBoundingBox(
            new Vector3D(
                Math.max(this._min.x, other._min.x),
                Math.max(this._min.y, other._min.y),
                Math.max(this._min.z, other._min.z),
            ),
            new Vector3D(
                Math.min(this._max.x, other._max.x),
                Math.min(this._max.y, other._max.y),
                Math.min(this._max.z, other._max.z),
            ),
        );
    }

    /** Returns the closest point on or inside the AABB to the given point. */
    closestPoint(point: Vector3D): Vector3D {
        return new Vector3D(
            Math.max(this._min.x, Math.min(point.x, this._max.x)),
            Math.max(this._min.y, Math.min(point.y, this._max.y)),
            Math.max(this._min.z, Math.min(point.z, this._max.z)),
        );
    }

    /** Shortest distance from `point` to the surface of the AABB (0 if inside). */
    distanceTo(point: Vector3D): number {
        const closest = this.closestPoint(point);
        const dx = point.x - closest.x;
        const dy = point.y - closest.y;
        const dz = point.z - closest.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    // ── Mutations (in-place) ────────────────────────────────────────

    /** Grow the AABB so it also contains `point`. */
    expand(point: Vector3D): void {
        this._min.x = Math.min(this._min.x, point.x);
        this._min.y = Math.min(this._min.y, point.y);
        this._min.z = Math.min(this._min.z, point.z);

        this._max.x = Math.max(this._max.x, point.x);
        this._max.y = Math.max(this._max.y, point.y);
        this._max.z = Math.max(this._max.z, point.z);
    }

    /** Grow the AABB so it also contains `other`. */
    merge(other: AxisAlignedBoundingBox): void {
        this.expand(other.min);
        this.expand(other.max);
    }

    // ── Immutable Builders ──────────────────────────────────────────

    /** Return a new AABB translated by `offset`. */
    translated(offset: Vector3D): AxisAlignedBoundingBox {
        return new AxisAlignedBoundingBox(
            new Vector3D(this._min.x + offset.x, this._min.y + offset.y, this._min.z + offset.z),
            new Vector3D(this._max.x + offset.x, this._max.y + offset.y, this._max.z + offset.z),
        );
    }

    /** Return a new AABB uniformly grown (or shrunk if negative) by `amount` on every side. */
    grown(amount: number): AxisAlignedBoundingBox {
        return new AxisAlignedBoundingBox(
            new Vector3D(this._min.x - amount, this._min.y - amount, this._min.z - amount),
            new Vector3D(this._max.x + amount, this._max.y + amount, this._max.z + amount),
        );
    }

    /** Return a new AABB padded by different amounts per axis. */
    padded(padding: Vector3D): AxisAlignedBoundingBox {
        return new AxisAlignedBoundingBox(
            new Vector3D(this._min.x - padding.x, this._min.y - padding.y, this._min.z - padding.z),
            new Vector3D(this._max.x + padding.x, this._max.y + padding.y, this._max.z + padding.z),
        );
    }

    /** Return a new AABB scaled around its centre by the given factors. */
    scaled(factors: Vector3D): AxisAlignedBoundingBox {
        const c = this.center();
        const e = this.extents();
        return AxisAlignedBoundingBox.fromCenterExtents(
            c,
            new Vector3D(e.x * factors.x, e.y * factors.y, e.z * factors.z),
        );
    }

    /** Transform all 8 corners by a 4×4 matrix and return the resulting AABB. */
    transform(matrix: Matrix4D): AxisAlignedBoundingBox {
        const transformedCorners = this.corners().map((corner) =>
            matrix.transformPoint(corner),
        );
        return AxisAlignedBoundingBox.fromPoints(transformedCorners);
    }

    /**
     * Convenience: apply a full Transform (position + rotation + scale)
     * and return the resulting world-space AABB.
     */
    transformBy(transform: Transform): AxisAlignedBoundingBox {
        return this.transform(transform.worldMatrix());
    }

    /** Deep copy. */
    clone(): AxisAlignedBoundingBox {
        return new AxisAlignedBoundingBox(this._min.clone(), this._max.clone());
    }

    /** True if both min and max are component-wise equal. */
    equals(other: AxisAlignedBoundingBox): boolean {
        return (
            this._min.x === other._min.x &&
            this._min.y === other._min.y &&
            this._min.z === other._min.z &&
            this._max.x === other._max.x &&
            this._max.y === other._max.y &&
            this._max.z === other._max.z
        );
    }

    toString(): string {
        return `AABB(min: ${this._min}, max: ${this._max})`;
    }

}
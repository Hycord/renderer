import { AxisAlignedBoundingBox, Vector3D } from "@hycord/math";
import type { Renderable } from "../Renderable/common";

/**
 * Pairs with a Renderable to add physics behaviour.
 *
 * The hitbox can be supplied explicitly or it will fall through to
 * the Renderable's own hitbox / visual bounds automatically via
 * `worldHitbox()`.
 */
export class PhysicsObject {
    private _velocity: Vector3D;
    private _acceleration: Vector3D;
    private _mass: number;

    /**
     * Optional local-space hitbox override.  
     * When null the renderable's `worldHitbox()` is used instead.
     */
    private _hitbox: AxisAlignedBoundingBox | null;

    /** The visual counterpart of this physics body. */
    private _renderable: Renderable | null;

    constructor(
        velocity: Vector3D = Vector3D.core.zero(),
        acceleration: Vector3D = Vector3D.core.zero(),
        mass: number = 1,
        hitbox: AxisAlignedBoundingBox | null = null,
        renderable: Renderable | null = null,
    ) {
        this._velocity = velocity;
        this._acceleration = acceleration;
        this._mass = mass;
        this._hitbox = hitbox;
        this._renderable = renderable;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get velocity(): Vector3D {
        return this._velocity;
    }

    set velocity(value: Vector3D) {
        this._velocity = value;
    }

    get acceleration(): Vector3D {
        return this._acceleration;
    }

    set acceleration(value: Vector3D) {
        this._acceleration = value;
    }

    get mass(): number {
        return this._mass;
    }

    set mass(value: number) {
        this._mass = value;
    }

    get hitbox(): AxisAlignedBoundingBox | null {
        return this._hitbox;
    }

    set hitbox(value: AxisAlignedBoundingBox | null) {
        this._hitbox = value;
    }

    get renderable(): Renderable | null {
        return this._renderable;
    }

    set renderable(value: Renderable | null) {
        this._renderable = value;
    }

    // ── Queries ─────────────────────────────────────────────────────

    /**
     * The world-space AABB used for collision detection.
     *
     * Resolution order:
     * 1. Explicit `_hitbox` transformed by the renderable's transform.
     * 2. The renderable's own `worldHitbox()`.
     * 3. null (no collision possible).
     */
    worldHitbox(): AxisAlignedBoundingBox | null {
        if (this._hitbox && this._renderable) {
            return this._hitbox.transform(this._renderable.transform.localMatrix());
        }
        if (this._hitbox) {
            return this._hitbox;
        }
        return this._renderable?.worldHitbox() ?? null;
    }

    /** Quick broad-phase overlap test against another PhysicsObject. */
    overlaps(other: PhysicsObject): boolean {
        const a = this.worldHitbox();
        const b = other.worldHitbox();
        if (!a || !b) return false;
        return a.intersects(b);
    }
}
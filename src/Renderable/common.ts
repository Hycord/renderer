import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Transform } from "@hycord/math";
import type { Matrix4D } from "@hycord/math";
import type { AxisAlignedBoundingBox } from "../Engine";


export abstract class Renderable {
    private _transform: Transform;
    private _visible: boolean;
    private _layer: number;
    private _hitbox: AxisAlignedBoundingBox | null;
    
    constructor(
        transform: Transform = new Transform(),
        layer: number = 0,
        hitbox: AxisAlignedBoundingBox | null = null,
    ) {
        this._transform = transform;
        this._visible = true;
        this._layer = layer;
        this._hitbox = hitbox;
    }

    get transform(): Transform {
        return this._transform;
    }

    set transform(value: Transform) {
        this._transform = value;
    }

    get visible(): boolean {
        return this._visible;
    }

    set visible(value: boolean) {
        this._visible = value;
    }

    get layer(): number {
        return this._layer;
    }

    set layer(value: number) {
        this._layer = value;
    }

    /**
     * Custom physics / collision hitbox in local space.
     * When set, `worldHitbox()` will transform it by the current transform.
     */
    get hitbox(): AxisAlignedBoundingBox | null {
        return this._hitbox;
    }

    set hitbox(value: AxisAlignedBoundingBox | null) {
        this._hitbox = value;
    }

    /**
     * The visual bounding box of this renderable in local space.
     * Subclasses should override this to return their actual visual extent.
     */
    bounds(): AxisAlignedBoundingBox | null {
        return null;
    }

    /** Visual bounding box transformed into world space. */
    worldBounds(): AxisAlignedBoundingBox | null {
        const local = this.bounds();
        return local?.transform(this._transform.worldMatrix()) ?? null;
    }

    /**
     * Physics hitbox transformed into world space.
     * Falls back to `worldBounds()` if no explicit hitbox is set.
     */
    worldHitbox(): AxisAlignedBoundingBox | null {
        if (this._hitbox) {
            return this._hitbox.transform(this._transform.worldMatrix());
        }
        return this.worldBounds();
    }

    abstract update(deltaTime: number): void;
    abstract render(context: CanvasRenderingContext2D): void;

    /**
     * Optional 3-D–aware rendering path.  When implemented the camera will
     * call this *instead of* `render()`, passing the view-projection matrix
     * and screen dimensions so the renderable can project its own vertices.
     */
    renderProjected?(
        ctx: CanvasRenderingContext2D,
        vp: Matrix4D ,
        screenW: number,
        screenH: number,
    ): void;
}
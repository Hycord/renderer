import type { CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Transform, Vector3D } from "@hycord/math";
import type { Plane, Matrix4D } from "@hycord/math";
import { Renderable } from "../common";
import { RenderStyle } from "../RenderStyle";
import { AxisAlignedBoundingBox } from "../../Engine";

/**
 * Renderable adapter for a {@link Plane} from `@hycord/math`.
 *
 * A mathematical plane is infinite, so this adapter draws a finite
 * rectangle centred at the projection of the world origin onto the
 * plane.  A short normal-indicator line is also drawn to indicate the
 * plane's facing direction.
 *
 * @example
 * ```ts
 * const plane = new Plane(new Vector3D(0, 1, 0), 0);
 * const rp = new RenderablePlane(
 *     plane, 400, 400,
 *     RenderStyle.filledAndStroked(
 *         Color.core.rgba(100, 100, 255, 40),
 *         Color.core.colors.blue(),
 *         1,
 *     ),
 * );
 * world.add(rp);
 * ```
 */
export class RenderablePlane extends Renderable {
    private _plane: Plane;
    private _displayWidth: number;
    private _displayHeight: number;
    private _normalLength: number;
    private _style: RenderStyle;

    constructor(
        plane: Plane,
        displayWidth: number = 400,
        displayHeight: number = 400,
        style: RenderStyle = RenderStyle.stroked(Color.core.colors.white()),
        normalLength: number = 30,
        layer: number = 0,
    ) {
        // Position the renderable on the closest point of the plane to the origin.
        const origin = Vector3D.core.zero();
        const position = plane.projectPoint(origin);
        super(new Transform(position), layer);

        this._plane = plane;
        this._displayWidth = displayWidth;
        this._displayHeight = displayHeight;
        this._normalLength = normalLength;
        this._style = style;
    }

    // ── Accessors ───────────────────────────────────────────────────

    get plane(): Plane {
        return this._plane;
    }

    set plane(value: Plane) {
        this._plane = value;
    }

    get displayWidth(): number {
        return this._displayWidth;
    }

    set displayWidth(value: number) {
        this._displayWidth = value;
    }

    get displayHeight(): number {
        return this._displayHeight;
    }

    set displayHeight(value: number) {
        this._displayHeight = value;
    }

    get normalLength(): number {
        return this._normalLength;
    }

    set normalLength(value: number) {
        this._normalLength = value;
    }

    get style(): RenderStyle {
        return this._style;
    }

    set style(value: RenderStyle) {
        this._style = value;
    }

    // ── Renderable overrides ────────────────────────────────────────

    override bounds(): AxisAlignedBoundingBox {
        const hw = this._displayWidth / 2;
        const hh = this._displayHeight / 2;
        const [t1, t2] = this._tangents();
        // Compute the actual world-space extent of the quad
        const c1 = t1.scale(hw).add(t2.scale(hh)) as Vector3D;
        const c2 = t1.scale(hw).add(t2.scale(-hh)) as Vector3D;
        const c3 = t1.scale(-hw).add(t2.scale(-hh)) as Vector3D;
        const c4 = t1.scale(-hw).add(t2.scale(hh)) as Vector3D;
        const minX = Math.min(c1.x, c2.x, c3.x, c4.x);
        const minY = Math.min(c1.y, c2.y, c3.y, c4.y);
        const minZ = Math.min(c1.z, c2.z, c3.z, c4.z);
        const maxX = Math.max(c1.x, c2.x, c3.x, c4.x);
        const maxY = Math.max(c1.y, c2.y, c3.y, c4.y);
        const maxZ = Math.max(c1.z, c2.z, c3.z, c4.z);
        return new AxisAlignedBoundingBox(
            new Vector3D(minX, minY, minZ),
            new Vector3D(maxX, maxY, maxZ),
        );
    }

    override update(_deltaTime: number): void {
        const origin = Vector3D.core.zero();
        this.transform.position = this._plane.projectPoint(origin);
    }

    override render(ctx: CanvasRenderingContext2D): void {
        const hw = this._displayWidth / 2;
        const hh = this._displayHeight / 2;

        // Draw the plane surface
        this._style.applyTo(ctx);
        ctx.beginPath();
        ctx.rect(-hw, -hh, this._displayWidth, this._displayHeight);
        this._style.finishPath(ctx);

        // Draw the normal indicator
        const n = this._plane.normal;
        const nx = n.x * this._normalLength;
        const ny = n.y * this._normalLength;

        const normalColor = this._style.stroke ?? this._style.fill ?? Color.core.colors.white();
        ctx.strokeStyle = normalColor.toRGBAString();
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(nx, ny);
        ctx.stroke();
    }

    // ── 3-D projected rendering ────────────────────────────────────

    /**
     * Compute two tangent vectors that lie on the plane surface.
     */
    private _tangents(): [Vector3D, Vector3D] {
        const n = this._plane.normal;
        // Pick a vector not parallel to the normal for a cross product
        const ref = Math.abs(n.y) < 0.99
            ? new Vector3D(0, 1, 0)
            : new Vector3D(1, 0, 0);
        const t1 = n.cross(ref).normalize();
        const t2 = n.cross(t1).normalize();
        return [t1, t2];
    }

    /**
     * Project world point → clip → screen.  Returns null when the
     * point is behind the near plane (w ≤ 0 after projection).
     */
    private _project(
        point: Vector3D,
        vp: Matrix4D,
        sw: number,
        sh: number,
    ): [number, number] | null {
        // Manual transform to get raw w before perspective divide
        const m = vp.toArray();
        const x = point.x, y = point.y, z = point.z;
        const cw = m[3][0] * x + m[3][1] * y + m[3][2] * z + m[3][3];
        if (cw <= 0) return null;   // behind camera
        const cx = m[0][0] * x + m[0][1] * y + m[0][2] * z + m[0][3];
        const cy = m[1][0] * x + m[1][1] * y + m[1][2] * z + m[1][3];
        const ndcX = cx / cw;
        const ndcY = cy / cw;
        return [
            (ndcX * 0.5 + 0.5) * sw,
            (1 - (ndcY * 0.5 + 0.5)) * sh,
        ];
    }

    /**
     * Compute the clip-space w for a world point (positive = in front).
     */
    private _clipW(point: Vector3D, vp: Matrix4D): number {
        const m = vp.toArray();
        return m[3][0] * point.x + m[3][1] * point.y + m[3][2] * point.z + m[3][3];
    }

    /**
     * Sutherland–Hodgman clip of a polygon against the near plane (w > ε).
     * Returns an array of world-space points forming the clipped polygon.
     */
    private _clipNearPlane(polygon: Vector3D[], vp: Matrix4D): Vector3D[] {
        const W_EPSILON = 0.001;
        const out: Vector3D[] = [];

        const lerp3 = (a: Vector3D, b: Vector3D, t: number): Vector3D =>
            new Vector3D(
                a.x + (b.x - a.x) * t,
                a.y + (b.y - a.y) * t,
                a.z + (b.z - a.z) * t,
            );

        for (let i = 0; i < polygon.length; i++) {
            const cur = polygon[i]!;
            const next = polygon[(i + 1) % polygon.length]!;
            const wCur = this._clipW(cur, vp);
            const wNext = this._clipW(next, vp);
            const curInside = wCur > W_EPSILON;
            const nextInside = wNext > W_EPSILON;

            if (curInside) {
                out.push(cur);
                if (!nextInside) {
                    // Edge exits – compute intersection
                    const t = (wCur - W_EPSILON) / (wCur - wNext);
                    out.push(lerp3(cur, next, t));
                }
            } else if (nextInside) {
                // Edge enters – compute intersection
                const t = (wCur - W_EPSILON) / (wCur - wNext);
                out.push(lerp3(cur, next, t));
            }
        }

        return out;
    }

    override renderProjected(
        ctx: CanvasRenderingContext2D,
        vp: Matrix4D,
        screenW: number,
        screenH: number,
    ): void {
        const center = this.transform.position;
        const hw = this._displayWidth / 2;
        const hh = this._displayHeight / 2;
        const [t1, t2] = this._tangents();

        // Four world-space corners of the displayed rectangle
        const corners: Vector3D[] = [
            center.add(t1.scale(hw)).add(t2.scale(hh)) as Vector3D,
            center.add(t1.scale(hw)).add(t2.scale(-hh)) as Vector3D,
            center.add(t1.scale(-hw)).add(t2.scale(-hh)) as Vector3D,
            center.add(t1.scale(-hw)).add(t2.scale(hh)) as Vector3D,
        ];

        // Clip polygon against the near plane
        const clipped = this._clipNearPlane(corners, vp);
        if (clipped.length < 3) return;

        // Project all clipped vertices to screen space
        const screenPts = clipped.map(c => this._project(c, vp, screenW, screenH));
        const visible = screenPts.filter((p): p is [number, number] => p !== null);
        if (visible.length < 3) return;

        this._style.applyTo(ctx);
        ctx.beginPath();
        ctx.moveTo(visible[0]![0], visible[0]![1]);
        for (let i = 1; i < visible.length; i++) {
            ctx.lineTo(visible[i]![0], visible[i]![1]);
        }
        ctx.closePath();
        this._style.finishPath(ctx);
    }
}

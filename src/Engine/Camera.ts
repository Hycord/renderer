import type { Canvas, CanvasRenderingContext2D } from "@napi-rs/canvas";
import { Color, Transform, Vector2D, Vector3D, Matrix4D, Common } from "@hycord/math";
import type { Renderable } from "../Renderable/common";
import type { World } from "./World";
import type { ScreenOverlay } from "./ScreenOverlay";

export enum ProjectionMode {
  Orthographic,
  Perspective,
  /** World coordinates = screen pixels. (0,0) is top-left, y points down. */
  ScreenSpace,
}

export class Camera {
  private _canvas: Canvas;
  private _context: CanvasRenderingContext2D;
  private _transform: Transform;
  private _world: World | null;
  private _overlay: ScreenOverlay | null;

  private _projectionMode: ProjectionMode;
  private _fieldOfView: number;
  private _nearPlane: number;
  private _farPlane: number;
  private _zoom: number;

  constructor(canvas: Canvas, world?: World) {
    this._canvas = canvas;
    this._context = canvas.getContext("2d");
    this._transform = new Transform();
    this._world = world ?? null;
    this._overlay = null;
    this._projectionMode = ProjectionMode.Orthographic;
    this._fieldOfView = Common.degToRad(60);
    this._nearPlane = 0.1;
    this._farPlane = 1000;
    this._zoom = 1;
  }

  get canvas(): Canvas {
    return this._canvas;
  }

  get context(): CanvasRenderingContext2D {
    return this._context;
  }

  get width(): number {
    return this._canvas.width;
  }

  get height(): number {
    return this._canvas.height;
  }

  get aspectRatio(): number {
    return this._canvas.width / this._canvas.height;
  }

  get transform(): Transform {
    return this._transform;
  }

  set transform(value: Transform) {
    this._transform = value;
  }

  get world(): World | null {
    return this._world;
  }

  set world(value: World | null) {
    this._world = value;
  }

  get overlay(): ScreenOverlay | null {
    return this._overlay;
  }

  set overlay(value: ScreenOverlay | null) {
    this._overlay = value;
  }

  get projectionMode(): ProjectionMode {
    return this._projectionMode;
  }

  set projectionMode(value: ProjectionMode) {
    this._projectionMode = value;
  }

  get fieldOfView(): number {
    return this._fieldOfView;
  }

  set fieldOfView(radians: number) {
    this._fieldOfView = radians;
  }

  get nearPlane(): number {
    return this._nearPlane;
  }

  set nearPlane(value: number) {
    this._nearPlane = value;
  }

  get farPlane(): number {
    return this._farPlane;
  }

  set farPlane(value: number) {
    this._farPlane = value;
  }

  get zoom(): number {
    return this._zoom;
  }

  set zoom(value: number) {
    this._zoom = Math.max(Common.EPSILON, value);
  }

  viewMatrix(): Matrix4D {
    if (this._projectionMode === ProjectionMode.ScreenSpace) {
      return Matrix4D.core.identity();
    }
    return Matrix4D.core.lookAt(
      this._transform.position,
      this._transform.position.add(this._transform.forward()) as Vector3D,
      this._transform.up(),
    );
  }

  projectionMatrix(): Matrix4D {
    if (this._projectionMode === ProjectionMode.ScreenSpace) {
      // Map world (0,0) → top-left, (width,height) → bottom-right
      return Matrix4D.core.orthographic(
        0, this.width,   // left, right
        this.height, 0,  // bottom, top  (flipped for y-down)
        -1, 1,           // near, far
      );
    }

    if (this._projectionMode === ProjectionMode.Perspective) {
      return Matrix4D.core.perspective(
        this._fieldOfView,
        this.aspectRatio,
        this._nearPlane,
        this._farPlane,
      );
    }

    const halfW = this.width / (2 * this._zoom);
    const halfH = this.height / (2 * this._zoom);
    return Matrix4D.core.orthographic(
      -halfW,
      halfW,
      -halfH,
      halfH,
      this._nearPlane,
      this._farPlane,
    );
  }

  viewProjectionMatrix(): Matrix4D {
    return this.projectionMatrix().multiply(this.viewMatrix());
  }

  worldToScreen(point: Vector3D): Vector2D {
    const clip = this.viewProjectionMatrix().transformPoint(point);
    const sx = (clip.x * 0.5 + 0.5) * this.width;
    const sy = (1 - (clip.y * 0.5 + 0.5)) * this.height;
    return new Vector2D(sx, sy);
  }

  screenToWorld(screen: Vector2D, depth: number = 0): Vector3D {
    const nx = (screen.x / this.width) * 2 - 1;
    const ny = 1 - (screen.y / this.height) * 2;
    const clip = new Vector3D(nx, ny, depth);

    try {
      const inverse = this.viewProjectionMatrix().inverse();
      return inverse.transformPoint(clip);
    } catch {
      return new Vector3D();
    }
  }

  isInView(renderable: Renderable): boolean {
    const aabb = renderable.bounds();
    if (!aabb) {
      return true;
    }

    const corners = [
      aabb.min,
      aabb.max,
      new Vector3D(aabb.min.x, aabb.max.y, aabb.min.z),
      new Vector3D(aabb.max.x, aabb.min.y, aabb.min.z),
      new Vector3D(aabb.min.x, aabb.min.y, aabb.max.z),
      new Vector3D(aabb.max.x, aabb.max.y, aabb.min.z),
      new Vector3D(aabb.min.x, aabb.max.y, aabb.max.z),
      new Vector3D(aabb.max.x, aabb.min.y, aabb.max.z),
    ];

    const vp = this.viewProjectionMatrix();
    for (const corner of corners) {
      const clip = vp.transformPoint(corner);
      if (
        clip.x >= -1 && clip.x <= 1 &&
        clip.y >= -1 && clip.y <= 1 &&
        clip.z >= -1 && clip.z <= 1
      ) {
        return true;
      }
    }

    return false;
  }

  clear(color?: Color): void {
    const bg = color ?? this._world?.background ?? Color.core.colors.black();
    this._context.clearRect(0, 0, this.width, this.height);
    this._context.fillStyle = bg.toRGBAString();
    this._context.fillRect(0, 0, this.width, this.height);
  }

  /**
   * Compute a pixels-per-world-unit scale factor for an object at the given
   * eye-space depth.  This ensures objects shrink with distance in
   * perspective mode and honour `zoom` in orthographic mode.
   */
  private scaleAtDepth(eyeDepth: number): number {
    if (this._projectionMode === ProjectionMode.ScreenSpace) {
      return 1;
    }
    if (this._projectionMode === ProjectionMode.Perspective) {
      const d = Math.max(eyeDepth, Common.EPSILON);
      return (this.height / 2) / (d * Math.tan(this._fieldOfView / 2));
    }
    return this._zoom;
  }

  render(): void {
    if (!this._world) return;

    this.clear();

    const view = this.viewMatrix();
    const vp = this.viewProjectionMatrix();
    const sorted = this._world.sorted();

    // Painter's algorithm: sort by eye-space depth (far → near)
    sorted.sort((a, b) => {
      const layerDiff = a.layer - b.layer;
      if (layerDiff !== 0) return layerDiff;
      // Use eye-space Z for proper depth comparison
      const ea = view.transformPoint(a.transform.position);
      const eb = view.transformPoint(b.transform.position);
      return ea.z - eb.z;  // more negative Z = farther in eye space → draw first
    });

    for (const renderable of sorted) {
      if (!renderable.visible) continue;

      // ── 3-D projected path (planes, meshes, etc.) ───────────────
      // These handle their own clipping, so skip the isInView check.
      if (renderable.renderProjected) {
        this._context.save();
        renderable.renderProjected(this._context, vp, this.width, this.height);
        this._context.restore();
        continue;
      }

      // ── Billboard / point-object path ────────────────────────────
      if (!this.isInView(renderable)) continue;

      const worldPos = renderable.transform.position;

      // Project the renderable's world position to clip space
      const clip = vp.transformPoint(worldPos);

      // Frustum cull on Z
      if (clip.z < -1 || clip.z > 1) continue;

      // Clip → screen
      const sx = (clip.x * 0.5 + 0.5) * this.width;
      const sy = (1 - (clip.y * 0.5 + 0.5)) * this.height;

      // Eye-space depth for perspective scaling
      const eyePos = view.transformPoint(worldPos);
      const depth = -eyePos.z; // camera looks down -Z in eye space
      const scale = this.scaleAtDepth(depth);

      this._context.save();
      this._context.translate(sx, sy);

      // Local rotation
      const rot = renderable.transform.rotation;
      const angle = 2 * Math.atan2(
        Math.sqrt(rot.x * rot.x + rot.y * rot.y + rot.z * rot.z),
        rot.w,
      );
      this._context.rotate(angle);

      // Scale: perspective (or zoom) × local scale
      const scl = renderable.transform.scale;
      this._context.scale(scale * scl.x, scale * scl.y);

      renderable.render(this._context);
      this._context.restore();
    }

    // ── Screen overlay (HUD) ──────────────────────────────────────────
    if (this._overlay) {
      this._overlay.render(this._context, this.width, this.height);
    }
  }

  resize(width: number, height: number): void {
    (this._canvas as any).width = width;
    (this._canvas as any).height = height;
  }

  lookAt(target: Vector3D): void {
    this._transform.lookAt(target);
  }

  moveTo(position: Vector3D): void {
    this._transform.position = position;
  }

  moveBy(delta: Vector3D): void {
    this._transform.translate(delta);
  }

  /**
   * Create a camera in screen-space mode where world coordinates map
   * directly to pixel coordinates: (0,0) is top-left, y points down,
   * and 1 world unit = 1 pixel.
   */
  static screenSpace(canvas: Canvas, world?: World): Camera {
    const cam = new Camera(canvas, world);
    cam.projectionMode = ProjectionMode.ScreenSpace;
    return cam;
  }
}


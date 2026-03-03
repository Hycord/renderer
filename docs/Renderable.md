# Renderable Module

The **Renderable** module defines the abstract drawing primitive and a library of concrete adapters for 2-D shapes, 3-D geometric objects, and a shared visual-styling system.

---

## Table of Contents

- [Renderable (abstract base)](#renderable-abstract-base)
- [RenderStyle](#renderstyle)
- [2-D Adapters](#2-d-adapters)
  - [RenderableCircle](#renderablecircle)
  - [RenderableLine](#renderableline)
  - [RenderablePoint](#renderablepoint)
  - [RenderablePolygon](#renderablepolygon)
  - [RenderableRect](#renderablerect)
  - [RenderableRoundedRect](#renderableroundedrect)
  - [RenderableVector](#renderablevector)
- [3-D Adapters](#3-d-adapters)
  - [RenderableSphere](#renderablesphere)
  - [RenderablePlane](#renderableplane)
  - [RenderableRay](#renderableray)
  - [RenderableAABB](#renderableaabb)

---

## Renderable (abstract base)

`src/Renderable/common.ts`

All drawable objects extend `Renderable`. The `Camera` calls `update(dt)` and `render(ctx)` (or `renderProjected(...)` for 3-D objects) each frame.

### Constructor

```ts
new Renderable(
  transform?: Transform,
  layer?: number,
  hitbox?: AxisAlignedBoundingBox | null,
)
```

### Properties

| Property    | Type                   | Description                                                   |
|-------------|------------------------|---------------------------------------------------------------|
| `transform` | `Transform`            | Position, rotation, and scale                                 |
| `visible`   | `boolean`              | Whether the camera draws this object                          |
| `layer`     | `number`               | Draw order — lower values draw first                          |
| `hitbox`    | `AABB \| null`         | Optional local-space collision override                       |

### Methods

| Method              | Returns        | Description                                                     |
|---------------------|----------------|-----------------------------------------------------------------|
| `bounds()`          | `AABB \| null` | Local-space visual bounding box                                 |
| `worldBounds()`     | `AABB \| null` | `bounds()` transformed to world space                           |
| `worldHitbox()`     | `AABB \| null` | Explicit hitbox → `worldBounds()` fallback                      |
| `update(dt)`        | `void`         | **Abstract** — called once per frame before rendering           |
| `render(ctx)`       | `void`         | **Abstract** — draw in the camera's local coordinate space      |
| `renderProjected?(ctx, vp, w, h)` | `void` | Optional 3-D path — camera passes VP matrix; called instead of `render()` when present |

### Custom renderables

```ts
class MyObject extends Renderable {
  constructor() {
    super(new Transform(new Vector3D(100, 100, 0)), 0);
  }
  override update(_dt: number) {}
  override render(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = "red";
    ctx.fill();
  }
}
```

---

## RenderStyle

`src/Renderable/RenderStyle.ts`

Encapsulates fill colour, stroke colour, stroke width, and opacity.  Pass to any adapter's constructor or swap it at runtime.

### Constructor

```ts
new RenderStyle(
  fill?: Color | null,
  stroke?: Color | null,
  strokeWidth?: number,
  opacity?: number,
)
```

### Static Factories

| Factory                               | Description                  |
|---------------------------------------|------------------------------|
| `RenderStyle.filled(color)`           | Fill only, no stroke         |
| `RenderStyle.stroked(color, width?)`  | Stroke only, no fill         |
| `RenderStyle.filledAndStroked(fill, stroke, width?)` | Both fill and stroke |

### Methods

| Method           | Description                                                        |
|------------------|--------------------------------------------------------------------|
| `applyTo(ctx)`   | Set `fillStyle`, `strokeStyle`, `lineWidth`, `globalAlpha` on `ctx`|
| `finishPath(ctx)`| Call `fill()` and/or `stroke()` on the current path               |

---

## 2-D Adapters

All 2-D adapters extend `Renderable` and sync their transform position with the underlying math object's `center` on each `update()` call.

### RenderableCircle

`src/Renderable/2D/Circle.ts`

Wraps a `@hycord/math` `Circle`. Draws a circle arc centred at the origin of the local coordinate space (the camera translates/rotates before calling `render`).

```ts
new RenderableCircle(circle: Circle, style?: RenderStyle, layer?: number)
```

| Property | Type         | Description              |
|----------|--------------|--------------------------|
| `circle` | `Circle`     | Underlying math object   |
| `style`  | `RenderStyle`| Visual styling           |

---

### RenderableLine

`src/Renderable/2D/Line.ts`

Renders a line segment between two 3-D endpoints. The transform is centred at the midpoint.

```ts
new RenderableLine(start?: Vector3D, end?: Vector3D, style?: RenderStyle, layer?: number)
```

| Property | Type         | Description           |
|----------|--------------|------------------------|
| `start`  | `Vector3D`   | First endpoint         |
| `end`    | `Vector3D`   | Second endpoint        |
| `style`  | `RenderStyle`| Visual styling         |

Setting `start` or `end` automatically re-centres the transform at the new midpoint.

---

### RenderablePoint

`src/Renderable/2D/Point.ts`

Renders a filled dot at a 3-D position, with configurable radius.

```ts
new RenderablePoint(position?: Vector3D, radius?: number, style?: RenderStyle, layer?: number)
```

---

### RenderablePolygon

`src/Renderable/2D/Polygon.ts`

Renders a closed polygon from an array of `Vector2D` vertices.

```ts
new RenderablePolygon(points?: Vector2D[], style?: RenderStyle, layer?: number)
```

The `bounds()` method computes the axis-aligned envelope of all vertices for frustum culling.

---

### RenderableRect

`src/Renderable/2D/Rect.ts`

Renders an axis-aligned rectangle.

```ts
new RenderableRect(position?: Vector3D, width?: number, height?: number, style?: RenderStyle, layer?: number)
```

---

### RenderableRoundedRect

`src/Renderable/2D/RoundedRect.ts`

Renders a rectangle with rounded corners.

```ts
new RenderableRoundedRect(position?, width?, height?, cornerRadius?, style?, layer?)
```

---

### RenderableVector

`src/Renderable/2D/Vector.ts`

Renders a 2-D vector as an arrow (shaft + arrowhead) originating from a base position.

```ts
new RenderableVector(origin?: Vector3D, direction?: Vector2D, style?, arrowSize?, layer?)
```

---

## 3-D Adapters

3-D adapters implement the optional `renderProjected(ctx, vp, w, h)` path so the camera passes the view-projection matrix directly.  This lets them project their own vertices correctly in perspective and orthographic modes.

### RenderableSphere

`src/Renderable/3D/Sphere.ts`

Wraps a `@hycord/math` `Sphere`. On a 2-D canvas it draws a circle with the sphere's radius. The transform position syncs from `sphere.center` each frame.

```ts
new RenderableSphere(sphere: Sphere, style?: RenderStyle, layer?: number)
```

---

### RenderablePlane

`src/Renderable/3D/Plane.ts`

Wraps a `@hycord/math` `Plane`. Draws a finite rectangle centred at the plane's closest point to the world origin, plus a short normal-indicator line.  Uses `renderProjected` for accurate 3-D projection.

```ts
new RenderablePlane(
  plane: Plane,
  displayWidth?: number,   // default 400
  displayHeight?: number,  // default 400
  style?: RenderStyle,
  normalLength?: number,   // default 30
  layer?: number,
)
```

---

### RenderableRay

`src/Renderable/3D/Ray.ts`

Wraps a `@hycord/math` `Ray`. Draws an arrow from the ray's origin in the ray's direction, projected in 3-D.

```ts
new RenderableRay(ray: Ray, length?: number, style?, arrowSize?, layer?)
```

---

### RenderableAABB

`src/Renderable/3D/AABB.ts`

Draws the 12 edges of an `AxisAlignedBoundingBox` projected into screen space.

```ts
new RenderableAABB(aabb: AxisAlignedBoundingBox, style?, layer?)
```

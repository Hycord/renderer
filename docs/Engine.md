# Engine Module

The **Engine** module provides the core rendering primitives: world management, camera projection, axis-aligned bounding boxes, physics bodies, a screen-space HUD overlay system, and a collection of immediate-mode UI widgets.

---

## Table of Contents

- [World](#world)
- [Camera](#camera)
- [AxisAlignedBoundingBox](#axisalignedboundingbox)
- [PhysicsObject](#physicsobject)
- [ScreenOverlay / OverlayElement / TextElement](#screenoverlay--overlayelement--textelement)
- [UI: UISlider](#uislider)
- [UI: UIPanel](#uipanel)
- [UI: DebugOverlay](#debugoverlay)

---

## World

`src/Engine/World.ts`

A simple scene-graph container for `Renderable` objects. The `Camera` reads a `World` each frame to determine what to draw.

### Constructor

```ts
new World(background?: Color)
```

| Parameter    | Type    | Default | Description                        |
|--------------|---------|---------|------------------------------------|
| `background` | `Color` | black   | Clear colour used before each draw |

### Properties

| Name          | Type                      | Description                              |
|---------------|---------------------------|------------------------------------------|
| `background`  | `Color`                   | Read/write background colour             |
| `renderables` | `ReadonlySet<Renderable>` | All registered renderables               |
| `size`        | `number`                  | Number of registered renderables         |

### Methods

| Method                         | Description                                           |
|--------------------------------|-------------------------------------------------------|
| `add(...renderables)`          | Register one or more renderables                      |
| `remove(...renderables)`       | Unregister one or more renderables                    |
| `has(renderable)`              | Test membership                                       |
| `clear()`                      | Remove all renderables                                |
| `sorted()`                     | Return a copy sorted ascending by `layer`             |
| `update(deltaTime)`            | Call `update(dt)` on every registered renderable      |

### Example

```ts
const world = new World(Color.core.rgb(20, 20, 40));
world.add(new RenderableCircle(circle));

const camera = Camera.screenSpace(canvas, world);
world.update(dt);
camera.render();
```

---

## Camera

`src/Engine/Camera.ts`

Projects a `World` onto a `@napi-rs/canvas` `Canvas`.  Supports three projection modes: orthographic, perspective, and screen-space.

### Projection Modes

```ts
enum ProjectionMode {
  Orthographic,  // centred orthographic with zoom
  Perspective,   // perspective with FoV
  ScreenSpace,   // (0,0) top-left, 1 unit = 1 pixel
}
```

### Constructor

```ts
new Camera(canvas: Canvas, world?: World)
```

### Key Properties

| Name              | Type              | Description                                  |
|-------------------|-------------------|----------------------------------------------|
| `canvas`          | `Canvas`          | Underlying canvas (read-only)                |
| `context`         | `CanvasRenderingContext2D` | 2D drawing context                  |
| `width / height`  | `number`          | Canvas dimensions                            |
| `aspectRatio`     | `number`          | `width / height`                             |
| `transform`       | `Transform`       | Camera position/rotation                     |
| `world`           | `World \| null`   | Scene to render                              |
| `overlay`         | `ScreenOverlay \| null` | HUD drawn after the world              |
| `projectionMode`  | `ProjectionMode`  | Active projection                            |
| `fieldOfView`     | `number`          | FoV in radians (perspective only)            |
| `nearPlane`       | `number`          | Near clip distance                           |
| `farPlane`        | `number`          | Far clip distance                            |
| `zoom`            | `number`          | Scale factor (orthographic/screen-space)     |

### Methods

| Method                           | Returns     | Description                                              |
|----------------------------------|-------------|----------------------------------------------------------|
| `viewMatrix()`                   | `Matrix4D`  | World → eye-space transform                              |
| `projectionMatrix()`             | `Matrix4D`  | Eye → clip-space transform                               |
| `viewProjectionMatrix()`         | `Matrix4D`  | Combined VP matrix                                       |
| `worldToScreen(point)`           | `Vector2D`  | Project a 3-D world point to 2-D screen pixels           |
| `screenToWorld(screen, depth?)`  | `Vector3D`  | Unproject a screen pixel to the world                    |
| `isInView(renderable)`           | `boolean`   | Frustum-cull check                                       |
| `clear(color?)`                  | `void`      | Fill canvas with background colour                       |
| `render()`                       | `void`      | Full draw pass: clear → sort → draw → overlay            |
| `resize(width, height)`          | `void`      | Update canvas dimensions                                 |
| `lookAt(target)`                 | `void`      | Orient the camera toward a point                         |
| `moveTo(position)`               | `void`      | Teleport the camera                                      |
| `moveBy(delta)`                  | `void`      | Translate the camera                                     |
| `Camera.screenSpace(canvas, world?)` | `Camera` | **Static factory** — create a screen-space camera       |

### Render pipeline

1. Clears canvas with the world's background colour.
2. Sorts renderables: first by `layer`, then by eye-space Z (painter's algorithm).
3. For each visible renderable:
   - If `renderProjected` is defined, calls it with the VP matrix (for 3-D meshes/planes that project their own vertices).
   - Otherwise frustum-culls, projects the world position to screen, applies rotation and depth scale, and calls `render(ctx)`.
4. Renders the `ScreenOverlay` (if any) on top.

---

## AxisAlignedBoundingBox

`src/Engine/AxisAlignedBoundingBox.ts`

An AABB (axis-aligned bounding box) defined by `min` and `max` corner points in 3-D space. Used for frustum culling, collision detection, and portal sizing.

### Constructor

```ts
new AxisAlignedBoundingBox(min: Vector3D, max: Vector3D)
```

### Static Factories

| Factory                           | Description                                                |
|-----------------------------------|------------------------------------------------------------|
| `fromCenterExtents(center, extents)` | AABB centred at `center` with half-sizes `extents`      |
| `fromCenterSize(center, size)`    | AABB centred at `center` with full dimensions `size`       |
| `fromPoints(points)`              | Smallest AABB containing all points                        |
| `unit()`                          | Unit cube (0,0,0) → (1,1,1)                                |

### Measurements

| Method          | Returns   | Description                     |
|-----------------|-----------|---------------------------------|
| `center()`      | `Vector3D`| Midpoint of the box              |
| `extents()`     | `Vector3D`| Half-sizes per axis              |
| `size()`        | `Vector3D`| Full dimensions per axis         |
| `volume()`      | `number`  | `sx * sy * sz`                   |
| `surfaceArea()` | `number`  | `2(xy + yz + zx)`                |
| `corners()`     | `Vector3D[]` | All 8 corner points           |

### Queries

| Method              | Returns                         | Description                                     |
|---------------------|---------------------------------|-------------------------------------------------|
| `contains(point)`   | `boolean`                       | True if point is inside or on the surface       |
| `containsBox(other)`| `boolean`                       | True if `other` is entirely inside this         |
| `intersects(other)` | `boolean`                       | True if the two boxes overlap                   |
| `intersection(other)` | `AABB \| null`                | Overlapping region, or null                     |
| `closestPoint(point)` | `Vector3D`                    | Nearest point on/inside the AABB                |
| `distanceTo(point)` | `number`                        | Distance from point to surface (0 if inside)    |

### Transformations (immutable — return new AABB)

| Method               | Description                                    |
|----------------------|------------------------------------------------|
| `translated(offset)` | Shift the box by a vector                      |
| `grown(amount)`      | Uniform padding on all sides                   |
| `padded(padding)`    | Per-axis padding                               |
| `scaled(factors)`    | Scale around the centre                        |
| `transform(matrix)`  | Apply a 4×4 matrix to all 8 corners            |
| `transformBy(transform)` | Apply a full `Transform` object           |
| `clone()`            | Deep copy                                      |

### Mutations (in-place)

| Method          | Description                             |
|-----------------|-----------------------------------------|
| `expand(point)` | Grow the box to contain `point`         |
| `merge(other)`  | Grow the box to contain `other`         |

---

## PhysicsObject

`src/Engine/PhysicsObject.ts`

Pairs with a `Renderable` to add Newtonian physics behaviour — velocity, acceleration, mass, and an optional hitbox override. This is the **engine-level** physics helper (not the ECS component); use `PhysicsComponent` in simulations.

### Constructor

```ts
new PhysicsObject(
  velocity?: Vector3D,
  acceleration?: Vector3D,
  mass?: number,
  hitbox?: AxisAlignedBoundingBox | null,
  renderable?: Renderable | null,
)
```

### Properties

| Name           | Type                        | Description                                               |
|----------------|-----------------------------|-----------------------------------------------------------|
| `velocity`     | `Vector3D`                  | Current velocity                                          |
| `acceleration` | `Vector3D`                  | Per-frame acceleration                                    |
| `mass`         | `number`                    | Mass (default 1)                                          |
| `hitbox`       | `AABB \| null`              | Local-space hitbox override                               |
| `renderable`   | `Renderable \| null`        | Associated visual                                         |

### Methods

| Method          | Returns       | Description                                                                           |
|-----------------|---------------|---------------------------------------------------------------------------------------|
| `worldHitbox()` | `AABB \| null`| World-space AABB: explicit hitbox (transformed) → renderable's `worldHitbox()` → null |

---

## ScreenOverlay / OverlayElement / TextElement

`src/Engine/ScreenOverlay.ts`

A HUD layer rendered after the world pass in normalised screen coordinates — (0,0) top-left, (1,1) bottom-right.

### Anchor interface

```ts
interface Anchor {
  h: "left" | "center" | "right";
  v: "top" | "middle" | "bottom";
}
```

### OverlayElement (abstract)

Base class for all overlay items. Positions are normalised.

| Property  | Type      | Description                             |
|-----------|-----------|-----------------------------------------|
| `x`       | `number`  | Normalised X (0–1)                      |
| `y`       | `number`  | Normalised Y (0–1)                      |
| `visible` | `boolean` | Whether the element is drawn            |

Override `update(dt)` and implement `render(ctx, w, h)`.

### TextElement

A multiline text label with configurable font, colour, anchor, and padding.

```ts
new TextElement(text, x?, y?, {
  color?, fontSize?, fontFamily?, anchor?, padding?,
})
```

### ScreenOverlay

| Method            | Description                              |
|-------------------|------------------------------------------|
| `add(element)`    | Register an element (returns it)         |
| `remove(element)` | Unregister an element                    |
| `clear()`         | Remove all elements                      |
| `update(dt)`      | Tick all elements                        |
| `render(ctx,w,h)` | Draw all visible elements                |

### Example

```ts
const overlay = new ScreenOverlay();
const fps = overlay.add(new TextElement("0 FPS", 1, 0, {
  anchor: { h: "right", v: "top" },
  color: Color.core.colors.green(),
}));
camera.overlay = overlay;

// each frame
overlay.update(dt);
fps.text = `${Math.round(1 / dt)} FPS`;
```

---

## UISlider

`src/Engine/UI/UISlider.ts`

An interactive horizontal slider with a label, value readout, filled track, and draggable knob. Rendered directly to a `CanvasRenderingContext2D`.

### Constructor

```ts
new UISlider(label: string, options?: UISliderOptions)
```

### UISliderOptions

| Option           | Type                 | Default | Description                             |
|------------------|----------------------|---------|-----------------------------------------|
| `min`            | `number`             | `0`     | Minimum value                           |
| `max`            | `number`             | `1`     | Maximum value                           |
| `step`           | `number`             | `0.1`   | Snap interval                           |
| `value`          | `number`             | `min`   | Initial value                           |
| `trackHeight`    | `number`             | `6`     | Track bar height in pixels              |
| `knobRadius`     | `number`             | `8`     | Knob circle radius in pixels            |
| `trackColor`     | `Color`              | dark    | Track background                        |
| `fillColor`      | `Color`              | blue    | Filled portion colour                   |
| `knobColor`      | `Color`              | white   | Knob fill                               |
| `labelColor`     | `Color`              | grey    | Label text colour                       |
| `valueColor`     | `Color`              | white   | Value readout colour                    |
| `fontSize`       | `number`             | `12`    | Font size                               |
| `fontFamily`     | `string`             | monospace | Font family                           |
| `decimals`       | `number`             | auto    | Display decimals (auto from step)       |
| `onChange`       | `(v: number) => void`| —       | Fired when value changes                |

### Key Members

| Member                           | Description                                        |
|----------------------------------|----------------------------------------------------|
| `value`                          | Current value                                      |
| `normalised`                     | Read-only 0–1 position                             |
| `setNormalised(t)`               | Set value from a 0–1 input, snap & clamp           |
| `setFromMouseX(mx, x, w)`        | Convert screen pixel to value                      |
| `hitTest(mx,my,x,y,w)`           | True if the mouse is over the interactive area     |
| `render(ctx, x, y, w)`           | Draw the slider at the specified pixel position    |
| `UISlider.ROW_HEIGHT`            | `42` — vertical space consumed per slider          |

---

## UIPanel

`src/Engine/UI/UIPanel.ts`

A floating control panel that lays out `UISlider` instances vertically inside a rounded-rect background.

### Constructor

```ts
new UIPanel(title: string, options?: UIPanelOptions)
```

### UIPanelOptions

| Option            | Type    | Default | Description              |
|-------------------|---------|---------|--------------------------|
| `width`           | `number`| `220`   | Panel width in pixels    |
| `padding`         | `number`| `12`    | Inner padding            |
| `cornerRadius`    | `number`| `8`     | Rounded-rect radius      |
| `backgroundColor` | `Color` | dark    | Background               |
| `borderColor`     | `Color` | grey    | Border colour            |
| `borderWidth`     | `number`| `1`     | Border thickness         |
| `titleColor`      | `Color` | light   | Title text colour        |
| `titleFontSize`   | `number`| `14`    | Title font size          |
| `fontFamily`      | `string`| monospace | Font family            |

### Methods

| Method                      | Description                                              |
|-----------------------------|----------------------------------------------------------|
| `addSlider(label, options?)` | Add a slider and return it                              |
| `removeSlider(slider)`      | Remove a slider                                          |
| `sliders`                   | Read-only list of all sliders                            |
| `contentHeight`             | Minimum height to show all content                       |
| `onMouseDown(mx, my)`       | Forward window mouse-down event; returns true if consumed|
| `onMouseMove(mx, my)`       | Forward window mouse-move event                          |
| `onMouseUp()`               | Forward window mouse-up event                            |
| `render(ctx, x, y, maxH)`   | Draw the panel at `(x, y)` clipped to `maxH`            |

### Example

```ts
const panel = new UIPanel("Controls", { width: 220 });
panel.addSlider("Speed", { min: 0, max: 300, value: 100, step: 5,
  onChange: (v) => { myObj.speed = v; }
});

// Wire events
win.onMouseDown((_btn, x, y) => panel.onMouseDown(x, y));
win.onMouseMove((x, y) => panel.onMouseMove(x, y));
win.onMouseUp(() => panel.onMouseUp());

// Each frame
panel.render(ctx, panelX, PAD, win.height - PAD * 2);
```

---

## DebugOverlay

`src/Engine/UI/DebugOverlay.ts`

A toggleable performance HUD showing FPS, min/max/avg frame time, and arbitrary custom lines. Rendered as a rounded-rect text box in the top-left corner.

### Constructor

```ts
new DebugOverlay(options?: DebugOverlayOptions)
```

### DebugOverlayOptions

| Option            | Type    | Default  | Description                                |
|-------------------|---------|----------|--------------------------------------------|
| `backgroundColor` | `Color` | semi-transparent black | Box background          |
| `textColor`       | `Color` | green    | Text colour                                |
| `fontSize`        | `number`| `12`     | Font size                                  |
| `fontFamily`      | `string`| monospace| Font family                                |
| `cornerRadius`    | `number`| `4`      | Box corner radius                          |
| `padding`         | `number`| `8`      | Inner padding                              |
| `sampleCount`     | `number`| `60`     | Frame time ring-buffer size                |
| `refreshInterval` | `number`| `0.5`    | How often (seconds) the FPS display updates|

### Methods

| Method                   | Description                                           |
|--------------------------|-------------------------------------------------------|
| `toggle()`               | Show/hide the overlay                                 |
| `fps`                    | Current displayed FPS (read-only)                     |
| `update(dt)`             | Call once per frame to accumulate timing data         |
| `setCustomLines(lines[])`| Replace extra info lines shown below perf stats       |
| `render(ctx, w, h)`      | Draw the overlay                                      |

### Example

```ts
const debug = new DebugOverlay();
win.onKeyDown((key) => { if (key === "\\") debug.toggle(); });

// In run loop:
debug.update(dt);
debug.setCustomLines([`Entities: ${world.size}`, `FPS: ${debug.fps}`]);
debug.render(ctx, win.width, win.height);
```

# @hycord/render

A native-window 2-D/3-D rendering engine for Bun, built on top of **SDL2** (for the OS window) and **`@napi-rs/canvas`** (for the drawing surface).

---

## Modules

| Module | Docs | Description |
|---|---|---|
| **Engine** | [docs/Engine.md](docs/Engine.md) | World, Camera, AABB, PhysicsObject, ScreenOverlay, UIPanel, UISlider, DebugOverlay |
| **Renderable** | [docs/Renderable.md](docs/Renderable.md) | Abstract base + 2-D/3-D shape adapters, RenderStyle |
| **Simulator** | [docs/Simulator.md](docs/Simulator.md) | ECS (Entity–Component–System), Simulation, SimulationManager, Portal, Graph |
| **Window** | [docs/Window.md](docs/Window.md) | Native SDL2 window, event loop, input, text-input mode |

---

## Quick start

```ts
import { Color, Vector3D, Transform } from "@hycord/math";
import { Window } from "@hycord/render/Window";
import { World, Camera } from "@hycord/render/Engine";
import { Renderable } from "@hycord/render/Renderable";

// 1. Open a native window
const win = new Window({ title: "Hello", width: 800, height: 600 });

// 2. Create a render world and a screen-space camera
const world = new World(Color.core.rgb(20, 20, 40));
const camera = Camera.screenSpace(win.canvas, world);

// 3. Add something to draw
class Dot extends Renderable {
  constructor() { super(new Transform(new Vector3D(400, 300, 0))); }
  update(_dt: number) {}
  render(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
  }
}
world.add(new Dot());

// 4. Run
win.run((dt) => {
  world.update(dt);
  camera.render();
});
```

---

## ECS / Simulation quick start

```ts
import { Window } from "@hycord/render/Window";
import { SimulationManager, PhysicsSystem, BoidSystem, BoundarySystem,
         TransformComponent, PhysicsComponent, BoidComponent, RenderableComponent }
  from "@hycord/render/Simulator";
import { AxisAlignedBoundingBox } from "@hycord/render/Engine";
import { Camera, World } from "@hycord/render/Engine";
import { Color, Vector3D } from "@hycord/math";

const win = new Window({ title: "Boids", width: 900, height: 600 });

const mgr  = new SimulationManager(win.canvas);
const sim  = mgr.createSimulation("boids", { background: Color.core.rgb(20, 20, 40) });

sim.ecs.addSystem(new BoidSystem());
sim.ecs.addSystem(new PhysicsSystem());

const bounds = new AxisAlignedBoundingBox(
  new Vector3D(10, 10, 0),
  new Vector3D(890, 590, 0),
);
sim.ecs.addSystem(new BoundarySystem(bounds, "wrap"));
mgr.createPortal(sim, bounds, { cornerRadius: 8 });

// Spawn 100 boids
for (let i = 0; i < 100; i++) {
  sim.spawn(
    new TransformComponent(new Vector3D(Math.random() * 880 + 10, Math.random() * 580 + 10, 0)),
    new PhysicsComponent({ velocity: new Vector3D((Math.random()-0.5)*100, (Math.random()-0.5)*100, 0), maxSpeed: 120 }),
    new BoidComponent({ group: "birds" }),
    // new RenderableComponent(myBoidRenderable),
  );
}

const world  = new World(Color.core.rgb(20, 20, 40));
const camera = Camera.screenSpace(win.canvas, world);

win.run((dt) => {
  camera.render();
  mgr.frame(camera.context, dt, win.width, win.height);
});
```

---

## Package structure

```
src/
├── Engine/
│   ├── AxisAlignedBoundingBox.ts  — AABB geometry & collision helpers
│   ├── Camera.ts                  — Orthographic / Perspective / ScreenSpace camera
│   ├── PhysicsObject.ts           — Simple physics body (non-ECS)
│   ├── ScreenOverlay.ts           — HUD elements in normalised screen coordinates
│   ├── World.ts                   — Scene-graph container for Renderables
│   └── UI/
│       ├── DebugOverlay.ts        — Toggleable FPS / frame-time overlay
│       ├── UIPanel.ts             — Floating control panel
│       └── UISlider.ts            — Interactive horizontal slider
├── Renderable/
│   ├── common.ts                  — Abstract Renderable base class
│   ├── RenderStyle.ts             — Fill / stroke / opacity container
│   ├── 2D/
│   │   ├── Circle.ts              — Adapter for @hycord/math Circle
│   │   ├── Line.ts                — Line segment adapter
│   │   ├── Point.ts               — Dot adapter
│   │   ├── Polygon.ts             — Arbitrary polygon adapter
│   │   ├── Rect.ts                — Rectangle adapter
│   │   ├── RoundedRect.ts         — Rounded-rect adapter
│   │   └── Vector.ts              — 2-D vector / arrow adapter
│   └── 3D/
│       ├── AABB.ts                — AABB wireframe adapter
│       ├── Plane.ts               — Infinite plane adapter (finite display)
│       ├── Ray.ts                 — Ray / arrow adapter
│       └── Sphere.ts              — Sphere adapter (draws as circle)
├── Simulator/
│   ├── Simulation.ts              — Self-contained ECS + render world
│   ├── SimulationManager.ts       — Orchestrates simulations and portals
│   ├── Portal.ts                  — Clipped viewport for a Simulation
│   ├── Components/
│   │   ├── BoidComponent.ts       — Flocking parameters
│   │   ├── ColliderComponent.ts   — Collision shape
│   │   ├── PhysicsComponent.ts    — Velocity / acceleration / mass
│   │   ├── RenderableComponent.ts — Visible representation
│   │   ├── TagComponent.ts        — Arbitrary string tags
│   │   └── TransformComponent.ts  — Position / rotation / scale
│   ├── ECS/
│   │   ├── Component.ts           — Component interface & helpers
│   │   ├── Entity.ts              — EntityId type & ID generator
│   │   ├── Query.ts               — Component requirement declarations
│   │   ├── System.ts              — Abstract system base class
│   │   └── World.ts               — ECS registry (entities, components, systems)
│   ├── Graph/
│   │   ├── Connection.ts          — Directed edge between ports
│   │   ├── Graph.ts               — Graph container
│   │   ├── Node.ts                — Named node with ports
│   │   ├── Nodes.ts               — Node factory helpers
│   │   └── Port.ts                — Single data endpoint on a node
│   └── Systems/
│       ├── BoidSystem.ts          — Reynolds flocking algorithm
│       ├── BoundarySystem.ts      — Wrap / bounce / clamp at viewport edges
│       ├── CollisionSystem.ts     — Shape-based overlap detection
│       ├── PhysicsSystem.ts       — Semi-implicit Euler integration
│       └── RenderSystem.ts        — Sync transforms → renderables
└── Window/
    ├── SDL2.ts                    — Bun FFI bindings for libSDL2
    └── Window.ts                  — Native OS window, event loop, input
```

---

## Dependencies

| Package | Purpose |
|---|---|
| `@napi-rs/canvas` | High-performance Canvas 2D API (Node/Bun native addon) |
| `@hycord/math` | Vectors, matrices, quaternions, geometric primitives |
| SDL2 (system library) | OS window creation, hardware rendering, input events |

---

## Requirements

- **Bun** ≥ 1.0 (FFI required for SDL2 bindings)
- **SDL2** installed on the host (`brew install sdl2` / `apt install libsdl2-dev`)

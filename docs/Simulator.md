# Simulator Module

The **Simulator** module is a self-contained ECS (Entity–Component–System) engine paired with a portal-based viewport system. It lets you run one or more independent physics/AI simulations and display each inside a clipped, camera-backed rectangular window on screen.

---

## Table of Contents

- [Architecture overview](#architecture-overview)
- [ECS Core](#ecs-core)
  - [Component](#component)
  - [Entity](#entity)
  - [Query](#query)
  - [System](#system)
  - [ECSWorld](#ecsworld)
- [Components](#components)
  - [TransformComponent](#transformcomponent)
  - [PhysicsComponent](#physicscomponent)
  - [BoidComponent](#boidcomponent)
  - [ColliderComponent](#collidercomponent)
  - [RenderableComponent](#renderablecomponent)
  - [TagComponent](#tagcomponent)
- [Systems](#systems)
  - [PhysicsSystem](#physicssystem)
  - [BoidSystem](#boidsystem)
  - [BoundarySystem](#boundarysystem)
  - [CollisionSystem](#collisionsystem)
  - [RenderSystem](#rendersystem)
- [Simulation](#simulation)
- [SimulationManager](#simulationmanager)
- [Portal](#portal)
- [Graph](#graph)

---

## Architecture overview

```
SimulationManager
 ├─ Simulation "boids"
 │   ├─ ECSWorld
 │   │   ├─ Entity 0  [TransformComponent, PhysicsComponent, BoidComponent, RenderableComponent]
 │   │   ├─ Entity 1  …
 │   │   └─ Systems: BoidSystem → PhysicsSystem → BoundarySystem → RenderSystem
 │   └─ RenderWorld   (managed by RenderSystem)
 └─ Portal (bounds: AABB, camera: Camera)  ←─ draws Simulation.renderWorld
```

---

## ECS Core

### Component

`src/Simulator/ECS/Component.ts`

Components are **pure data containers** — they store state but contain no logic.

```ts
interface Component {
  readonly type: string;   // unique type string, e.g. "physics"
}

interface ComponentClass<T extends Component = Component> {
  readonly TYPE: string;
  new (...args: any[]): T;
}
```

Every concrete component class must expose a static `TYPE` field matching the instance's `type` property.

---

### Entity

`src/Simulator/ECS/Entity.ts`

An entity is just a numeric ID (`EntityId = number`).  `EntityIdGenerator` produces monotonically increasing IDs.

---

### Query

`src/Simulator/ECS/Query.ts`

Declares which component types a system requires (and optionally which it must *not* see).

```ts
// Entity must have all three:
const q = Query.all(TransformComponent, PhysicsComponent, BoidComponent);

// Entity must have TransformComponent but NOT BoidComponent:
const q = new Query([TransformComponent], [BoidComponent]);
```

| Factory               | Description                             |
|-----------------------|-----------------------------------------|
| `Query.all(...types)` | Entity must have every listed type      |
| `Query.none(...types)`| Entity must not have any listed type    |

`Query.matches(componentTypes)` returns `true` if the entity's component set satisfies the query.

---

### System

`src/Simulator/ECS/System.ts`

Abstract base class. Implement `name`, `query`, and `update`.

```ts
abstract class System {
  abstract readonly name: string;
  abstract readonly query: Query;
  priority = 0;           // lower runs first
  enabled = true;

  init(world: ECSWorld): void {}   // called once on addSystem
  abstract update(entities: readonly EntityId[], world: ECSWorld, dt: number): void;
  destroy(world: ECSWorld): void {}
}
```

Systems are sorted by `priority` before each update tick.

---

### ECSWorld

`src/Simulator/ECS/World.ts`

The central registry — manages entities, components, and systems.

#### Entity management

| Method                      | Description                                         |
|-----------------------------|-----------------------------------------------------|
| `createEntity()`            | Create a new entity, return its ID                  |
| `spawn(...components)`      | Create entity and add components in one call        |
| `destroyEntity(id)`         | Remove entity and all its components                |
| `isAlive(id)`               | True if the entity exists                           |
| `entityCount`               | Number of live entities                             |

#### Component management

| Method                           | Description                              |
|----------------------------------|------------------------------------------|
| `addComponent(id, component)`    | Attach a component to an entity          |
| `removeComponent(id, Class)`     | Detach a component from an entity        |
| `getComponent(id, Class)`        | Retrieve a component (or undefined)      |
| `hasComponent(id, Class)`        | Test presence                            |

#### System management

| Method              | Description                                   |
|---------------------|-----------------------------------------------|
| `addSystem(system)` | Register a system; calls `system.init(world)` |
| `removeSystem(system)` | Unregister and call `system.destroy(world)` |
| `systems`           | Ordered list of registered systems            |

#### Frame update

```ts
world.update(dt);   // runs all enabled systems in priority order
```

#### Events

| Method                        | Description                                      |
|-------------------------------|--------------------------------------------------|
| `onEntityCreated(cb)`         | Fired after an entity is created                 |
| `onEntityDestroyed(cb)`       | Fired after an entity is destroyed               |
| `onComponentAdded(cb)`        | Fired after a component is attached              |
| `onComponentRemoved(cb)`      | Fired after a component is detached              |

#### Query helpers

```ts
world.query(Query.all(PhysicsComponent));  // returns EntityId[]
```

---

## Components

### TransformComponent

`src/Simulator/Components/TransformComponent.ts`

Spatial state — wraps `@hycord/math` `Transform`.

```ts
new TransformComponent(position?, rotation?, scale?)
```

| Property   | Type         |
|------------|--------------|
| `position` | `Vector3D`   |
| `rotation` | `Quaternion` |
| `scale`    | `Vector3D`   |
| `transform`| `Transform`  |

---

### PhysicsComponent

`src/Simulator/Components/PhysicsComponent.ts`

Newtonian physics data integrated by `PhysicsSystem`.

```ts
new PhysicsComponent({
  velocity?, acceleration?, mass?, drag?, restitution?, maxSpeed?,
})
```

| Property      | Type      | Default | Description                                     |
|---------------|-----------|---------|-------------------------------------------------|
| `velocity`    | `Vector3D`| zero    | Units per second                                |
| `acceleration`| `Vector3D`| zero    | Reset to zero each frame after integration      |
| `mass`        | `number`  | `1`     | Used for collision response                     |
| `drag`        | `number`  | `0`     | Linear drag coefficient (0 = none, 1 = full)    |
| `restitution` | `number`  | `0.5`   | Bounce factor (0 = inelastic, 1 = elastic)      |
| `maxSpeed`    | `number`  | `0`     | Speed cap (0 = unlimited)                       |

---

### BoidComponent

`src/Simulator/Components/BoidComponent.ts`

Flocking parameters for the `BoidSystem`.

```ts
new BoidComponent({
  perceptionRadius?, separationWeight?, alignmentWeight?,
  cohesionWeight?, maxSteerForce?, group?,
})
```

| Property           | Default | Description                                     |
|--------------------|---------|-------------------------------------------------|
| `perceptionRadius` | `50`    | How far the boid sees neighbours                |
| `separationWeight` | `1.5`   | Strength of "steer away" rule                   |
| `alignmentWeight`  | `1.0`   | Strength of "match heading" rule                |
| `cohesionWeight`   | `1.0`   | Strength of "move toward centre" rule           |
| `maxSteerForce`    | `200`   | Maximum steering acceleration per frame         |
| `group`            | `"default"` | Boids only flock with the same group        |

---

### ColliderComponent

`src/Simulator/Components/ColliderComponent.ts`

Shape used for collision detection by `CollisionSystem`.

```ts
// Factory helpers:
ColliderComponent.circle(radius, options?)
ColliderComponent.aabb(halfExtents, options?)
ColliderComponent.point(options?)
```

Supported shapes: `circle`, `aabb`, `point`.

| Option      | Default        | Description                                              |
|-------------|----------------|----------------------------------------------------------|
| `isTrigger` | `false`        | Detect without physics response                          |
| `layer`     | `1`            | Collision layer bitmask                                  |
| `mask`      | `0xffffffff`   | Layers this collider interacts with                      |

---

### RenderableComponent

`src/Simulator/Components/RenderableComponent.ts`

Links an entity to a `Renderable` object managed by `RenderSystem`.

```ts
new RenderableComponent(renderable: Renderable)
```

---

### TagComponent

`src/Simulator/Components/TagComponent.ts`

Attaches one or more string tags to an entity for filtering.

```ts
new TagComponent(...tags: string[])
```

---

## Systems

All systems extend the abstract `System` base and are registered with `sim.ecs.addSystem(...)`.

### PhysicsSystem

`src/Simulator/Systems/PhysicsSystem.ts`

Semi-implicit Euler integration — runs at `priority = 100`.

**Each frame per entity:**
1. `velocity += (acceleration + gravity) * dt`
2. Drag: `velocity *= (1 - drag * dt)`
3. Clamp velocity to `maxSpeed` (if set)
4. `position += velocity * dt`
5. Reset `acceleration` to zero

```ts
const phys = new PhysicsSystem();
phys.gravity = new Vector3D(0, 9.81, 0);   // optional global gravity
sim.ecs.addSystem(phys);
```

---

### BoidSystem

`src/Simulator/Systems/BoidSystem.ts`

Classic Reynolds (1987) flocking — runs at `priority = 50` (before physics).

For each boid, queries all neighbours within `perceptionRadius` sharing the same `group` and computes three weighted steering forces:

| Rule           | Effect                                              |
|----------------|-----------------------------------------------------|
| **Separation** | Steer away (weighted inversely by distance)         |
| **Alignment**  | Match average neighbour heading                     |
| **Cohesion**   | Steer toward average neighbour position             |

The combined steering force is clamped to `maxSteerForce` and written to `PhysicsComponent.acceleration`.

---

### BoundarySystem

`src/Simulator/Systems/BoundarySystem.ts`

Keeps entities inside an `AxisAlignedBoundingBox` — runs at `priority = 150`.

```ts
type BoundaryMode = "wrap" | "bounce" | "clamp";

const boundary = new BoundarySystem(simBounds, "wrap");
boundary.bounds = newBounds;   // update at runtime (e.g. on resize)
```

| Mode     | Behaviour                                                  |
|----------|------------------------------------------------------------|
| `wrap`   | Teleport to opposite edge (Pac-Man style)                  |
| `bounce` | Reverse velocity component on the colliding axis           |
| `clamp`  | Stop at the edge, zero velocity on that axis               |

---

### CollisionSystem

`src/Simulator/Systems/CollisionSystem.ts`

Detects overlaps between `ColliderComponent`s. Entities are only tested against others whose `layer` and `mask` bitmasks overlap.  Trigger colliders fire events without physics response.

---

### RenderSystem

`src/Simulator/Systems/RenderSystem.ts`

Synchronises `TransformComponent → Renderable.transform` and manages the `RenderWorld` object list — runs at `priority = 900` (last).

- Adds a renderable to the render world when first seen.
- Removes it when the entity is destroyed or loses one of the required components.
- Uses `world.onEntityDestroyed` to clean up asynchronously.

---

## Simulation

`src/Simulator/Simulation.ts`

A named, self-contained simulation that owns an `ECSWorld` and a `RenderWorld`. The `RenderSystem` is added automatically.

```ts
const sim = new Simulation("boids", {
  background: Color.core.rgb(20, 20, 40),
  active: true,
});
```

### Properties / state

| Property     | Type      | Description                                    |
|--------------|-----------|------------------------------------------------|
| `name`       | `string`  | Unique name                                    |
| `ecs`        | `ECSWorld`| The ECS registry                               |
| `renderWorld`| `World`   | The render-engine scene graph                  |
| `active`     | `boolean` | When false, `update()` is a no-op              |
| `paused`     | `boolean` | When true, `update()` is a no-op               |
| `timeScale`  | `number`  | Time multiplier (0 = paused, 2 = double speed) |

### Methods

| Method                  | Description                                        |
|-------------------------|----------------------------------------------------|
| `spawn(...components)`  | Shorthand for `this.ecs.spawn(...)`                |
| `update(dt)`            | Advance ECS and render world, honouring time scale |

---

## SimulationManager

`src/Simulator/SimulationManager.ts`

Orchestrates multiple `Simulation`s and `Portal`s, providing a single entry point for the main loop.

```ts
const mgr = new SimulationManager(win.canvas);

const sim = mgr.createSimulation("boids", { background: colBg });
mgr.createPortal(sim, simBounds, { cornerRadius: 8 });

// In the main loop:
mgr.frame(ctx, dt, win.width, win.height);
```

### Simulation management

| Method                            | Description                                          |
|-----------------------------------|------------------------------------------------------|
| `createSimulation(name, options?)`| Create and register a simulation                     |
| `getSimulation(name)`             | Look up by name                                      |
| `removeSimulation(name)`          | Destroy simulation and its portals                   |
| `simulations`                     | `ReadonlyMap<string, Simulation>`                    |

### Portal management

| Method                                  | Description                                     |
|-----------------------------------------|-------------------------------------------------|
| `createPortal(sim, bounds, options?)`   | Create a portal for a simulation                |
| `removePortal(portal)`                  | Remove a portal                                 |
| `portals`                               | `readonly Portal[]`                             |

### Per-frame

| Method                           | Description                                                  |
|----------------------------------|--------------------------------------------------------------|
| `frame(ctx, dt, width, height)`  | Update all active simulations and render all visible portals |
| `update(dt)`                     | Update only (no render)                                      |
| `render(ctx)`                    | Render only                                                  |
| `hitTest(x, y)`                  | Return the topmost portal whose bounds contain `(x, y)`      |

---

## Portal

`src/Simulator/Portal.ts`

A rectangular viewport that renders one `Simulation` using its own `Camera`. Multiple portals can display the same simulation (e.g. a minimap).

```ts
new Portal(simulation, canvas, bounds, {
  cornerRadius?: number,   // clip radius (default 0)
  borderColor?: Color | null,
  borderWidth?: number,
  layer?: number,
})
```

### Properties

| Property       | Type                  | Description                               |
|----------------|-----------------------|-------------------------------------------|
| `simulation`   | `Simulation`          | The simulation being viewed               |
| `bounds`       | `AABB`                | Screen-space rectangle of the viewport    |
| `camera`       | `Camera`              | Per-portal camera (screen-space mode)     |
| `layer`        | `number`              | Draw order — lower draws first            |
| `visible`      | `boolean`             | Toggle visibility                         |
| `x/y/width/height` | `number`          | Convenience rect accessors                |

### Methods

| Method            | Description                               |
|-------------------|-------------------------------------------|
| `resize(bounds)`  | Update the viewport region                |
| `render(ctx)`     | Draw the simulation into the clipped rect |

---

## Graph

`src/Simulator/Graph/`

A generic directed graph data structure for building node-based systems (behaviour trees, visual scripting, neural nets, etc.).  Not tied to the ECS — import separately.

### Classes

| Class        | Description                                                         |
|--------------|---------------------------------------------------------------------|
| `Graph`      | Container for `Node`s and `Connection`s                             |
| `Node`       | A named node with typed input/output `Port`s                        |
| `Port`       | A single data endpoint (input or output) on a node                  |
| `Connection` | A directed edge between one output port and one input port          |
| `Nodes`      | (namespace) factory helpers for common node types                   |

### Quick start

```ts
import { Graph, Node, Port } from "@hycord/render/Simulator";

const graph = new Graph();
const a = graph.addNode(new Node("A"));
const b = graph.addNode(new Node("B"));
a.addOutput(new Port("out"));
b.addInput(new Port("in"));
graph.connect(a, "out", b, "in");
```

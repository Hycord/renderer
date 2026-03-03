import { Color, Transform, Vector2D, Vector3D } from "@hycord/math";
import { AxisAlignedBoundingBox, Camera, DebugOverlay, UIPanel, World } from "./Engine";
import { Renderable } from "./Renderable";
import { Window } from "./Window";
import {
  BoidComponent,
  BoidSystem,
  BoundarySystem,
  PhysicsComponent,
  PhysicsSystem,
  RenderableComponent,
  SimulationManager,
  TransformComponent,
} from "./Simulator";
import type { CanvasRenderingContext2D } from "@napi-rs/canvas";

export * as Engine from "./Engine";
export * as Renderable from "./Renderable";
export * as WindowModule from "./Window";
export * as Simulator from "./Simulator";

// ── Layout constants ────────────────────────────────────────────────────────

const PAD = 10;
const CORNER = 8;
const PANEL_WIDTH = 220;

// ── Colours ─────────────────────────────────────────────────────────────────

const colBg = Color.core.rgb(20, 20, 40);

// ── Simulation bounds helper ────────────────────────────────────────────────

function simBounds(): AxisAlignedBoundingBox {
  return new AxisAlignedBoundingBox(
    new Vector3D(PAD, PAD, 0),
    new Vector3D(win.width - PANEL_WIDTH - PAD * 2, win.height - PAD, 0),
  );
}

// ── Create a native window ─────────────────────────────────────────────────

const win = new Window({
  title: "Boids Simulation",
  width: 900,
  height: 600,
});

// ── Boid renderable ─────────────────────────────────────────────────────────

class BoidRenderable extends Renderable {
  velocity: Vector3D;

  constructor(position: Vector3D, velocity: Vector3D) {
    super(new Transform(position), 0);
    this.velocity = velocity;
  }

  override update(_dt: number): void {}

  override render(ctx: CanvasRenderingContext2D): void {
    const angle = Math.atan2(this.velocity.y, this.velocity.x);
    ctx.save();
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(-10, 5);
    ctx.lineTo(-10, -5);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();
  }
}

// ── Tuneable parameters ─────────────────────────────────────────────────────

const params = {
  separationWeight: 1.5,
  alignmentWeight: 1.0,
  cohesionWeight: 1.0,
  maxSpeed: 100,
  boidCount: 100,
};

// ── Set up the ECS simulation ───────────────────────────────────────────────

const mgr = new SimulationManager(win.canvas);
const sim = mgr.createSimulation("boids", { background: colBg });

const boidSystem = new BoidSystem();
const physicsSystem = new PhysicsSystem();
const boundarySystem = new BoundarySystem(simBounds(), "wrap");

sim.ecs.addSystem(boidSystem);
sim.ecs.addSystem(physicsSystem);
sim.ecs.addSystem(boundarySystem);

const boidEntities: { entityId: number; renderable: BoidRenderable }[] = [];

function spawnBoid() {
  const b = simBounds();
  const s = b.size();
  const position = new Vector3D(
    b.min.x + Math.random() * s.x,
    b.min.y + Math.random() * s.y,
    0,
  );
  const velocity = new Vector3D(...Vector2D.core.random(params.maxSpeed * 0.6));
  const boid = new BoidRenderable(position, velocity);

  const entityId = sim.spawn(
    new TransformComponent(position),
    new PhysicsComponent({ velocity, maxSpeed: params.maxSpeed }),
    new BoidComponent({
      group: "birds",
      separationWeight: params.separationWeight,
      alignmentWeight: params.alignmentWeight,
      cohesionWeight: params.cohesionWeight,
    }),
    new RenderableComponent(boid),
  );
  boidEntities.push({ entityId, renderable: boid });
}

function despawnBoid() {
  const entry = boidEntities.pop();
  if (entry) sim.ecs.destroyEntity(entry.entityId);
}

function syncBoidCount(target: number) {
  while (boidEntities.length < target) spawnBoid();
  while (boidEntities.length > target) despawnBoid();
}

function applyParams() {
  for (const { entityId } of boidEntities) {
    const bc = sim.ecs.getComponent(entityId, BoidComponent);
    const pc = sim.ecs.getComponent(entityId, PhysicsComponent);
    if (bc) {
      bc.separationWeight = params.separationWeight;
      bc.alignmentWeight = params.alignmentWeight;
      bc.cohesionWeight = params.cohesionWeight;
    }
    if (pc) {
      pc.maxSpeed = params.maxSpeed;
    }
  }
}

// Spawn initial boids
for (let i = 0; i < params.boidCount; i++) spawnBoid();

mgr.createPortal(sim, simBounds(), { cornerRadius: CORNER });

// ── World + Camera ──────────────────────────────────────────────────────────

const world = new World(colBg);
const camera = Camera.screenSpace(win.canvas, world);

// ── Control panel ───────────────────────────────────────────────────────────

const panel = new UIPanel("Controls", { width: PANEL_WIDTH });

panel.addSlider("Separation", {
  min: 0, max: 5, step: 0.1, value: params.separationWeight,
  onChange: (v) => { params.separationWeight = v; applyParams(); },
});
panel.addSlider("Alignment", {
  min: 0, max: 5, step: 0.1, value: params.alignmentWeight,
  onChange: (v) => { params.alignmentWeight = v; applyParams(); },
});
panel.addSlider("Cohesion", {
  min: 0, max: 5, step: 0.1, value: params.cohesionWeight,
  onChange: (v) => { params.cohesionWeight = v; applyParams(); },
});
panel.addSlider("Max Speed", {
  min: 10, max: 300, step: 5, value: params.maxSpeed,
  onChange: (v) => { params.maxSpeed = v; applyParams(); },
});
panel.addSlider("Boid Count", {
  min: 1, max: 500, step: 1, value: params.boidCount,
  onChange: (v) => { params.boidCount = Math.round(v); syncBoidCount(params.boidCount); },
});

// ── Debug overlay ───────────────────────────────────────────────────────────

const debug = new DebugOverlay();

// ── Input ───────────────────────────────────────────────────────────────────

win.addState("running", { keyboard: true, mouse: true, mouseMode: "free" });
win.setState("running");

win.onKeyDown((key) => {
  if (key === "\\") debug.toggle();
});

win.onMouseDown((_button, x, y) => {
  panel.onMouseDown(x, y);
});

win.onMouseMove((x, y, _dx, _dy) => {
  panel.onMouseMove(x, y);
});

win.onMouseUp((_button, _x, _y) => {
  panel.onMouseUp();
});

// ── Resize handling ─────────────────────────────────────────────────────────

win.onResize(() => {
  camera.resize(win.width, win.height);
  boundarySystem.bounds = simBounds();
  const portals = mgr.portals;
  if (portals.length > 0) portals[0]!.resize(simBounds());
});

// ── Main loop ───────────────────────────────────────────────────────────────

win.run((dt) => {
  // Update debug timing
  debug.update(dt);
  debug.setCustomLines([
    `Boids: ${boidEntities.length}`,
    `Entities: ${sim.ecs.entityCount}`,
    `Systems: ${sim.ecs.systems.length}`,
  ]);

  // Sync velocity for heading rotation
  for (const { entityId, renderable } of boidEntities) {
    const pc = sim.ecs.getComponent(entityId, PhysicsComponent);
    if (pc) renderable.velocity = pc.velocity;
  }

  // Render world background
  camera.render();

  // Render boid simulation portal
  const ctx = camera.context;
  mgr.frame(ctx, dt, win.width, win.height);

  // Draw control panel
  const panelX = win.width - PANEL_WIDTH - PAD;
  const panelH = win.height - PAD * 2;
  panel.render(ctx, panelX, PAD, panelH);

  // Draw debug overlay
  debug.render(ctx, win.width, win.height);
});

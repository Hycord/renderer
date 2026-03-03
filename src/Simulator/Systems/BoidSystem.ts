import { Vector3D } from "@hycord/math";
import { System, Query, type ECSWorld, type EntityId } from "../ECS";
import { TransformComponent } from "../Components/TransformComponent";
import { PhysicsComponent } from "../Components/PhysicsComponent";
import { BoidComponent } from "../Components/BoidComponent";

/**
 * Classic Boids flocking algorithm (Reynolds, 1987).
 *
 * For each boid the system computes three steering forces from its
 * neighbours within {@link BoidComponent.perceptionRadius}:
 *
 * 1. **Separation** — steer away from neighbours that are too close.
 * 2. **Alignment** — steer toward the average heading of neighbours.
 * 3. **Cohesion** — steer toward the average position of neighbours.
 *
 * The combined steering force is clamped to {@link BoidComponent.maxSteerForce}
 * and written into the entity's {@link PhysicsComponent.acceleration}.
 *
 * Boids only flock with other boids in the **same group**.
 */
export class BoidSystem extends System {
  readonly name = "boid";
  readonly query = Query.all(TransformComponent, PhysicsComponent, BoidComponent);
  override priority = 50; // before physics integration

  override update(
    entities: readonly EntityId[],
    world: ECSWorld,
    _dt: number,
  ): void {
    // Pre-fetch component data for all boids
    const data = entities.map((id) => ({
      id,
      tc: world.getComponent(id, TransformComponent)!,
      pc: world.getComponent(id, PhysicsComponent)!,
      bc: world.getComponent(id, BoidComponent)!,
    }));

    for (const self of data) {
      let separation = Vector3D.core.zero();
      let alignment = Vector3D.core.zero();
      let cohesion = Vector3D.core.zero();
      let neighbourCount = 0;

      const pos = self.tc.position;
      const maxSpeed = self.pc.maxSpeed > 0 ? self.pc.maxSpeed : 100;
      const r2 = self.bc.perceptionRadius * self.bc.perceptionRadius;

      for (const other of data) {
        if (other.id === self.id) continue;
        if (other.bc.group !== self.bc.group) continue;

        const diff = pos.subtract(other.tc.position) as Vector3D;
        const distSq = diff.x * diff.x + diff.y * diff.y + diff.z * diff.z;
        if (distSq > r2 || distSq === 0) continue;

        const dist = Math.sqrt(distSq);
        neighbourCount++;

        // Separation: weight inversely by distance (closer = stronger push)
        // Clamp minimum distance to avoid numerical explosion
        const safeDist = Math.max(dist, 5);
        separation = separation.add(diff.scale(1 / (safeDist * safeDist))) as Vector3D;

        // Alignment: accumulate neighbours' velocities
        alignment = alignment.add(other.pc.velocity) as Vector3D;

        // Cohesion: accumulate neighbours' positions
        cohesion = cohesion.add(other.tc.position) as Vector3D;
      }

      if (neighbourCount === 0) continue;

      // Separation: steer away from close neighbours (don't average — sum is intentional)
      const steerSep = steer(separation, self.pc.velocity, maxSpeed, self.bc.maxSteerForce);

      // Alignment: steer toward average neighbour heading
      alignment = alignment.scale(1 / neighbourCount) as Vector3D;
      const steerAli = steer(alignment, self.pc.velocity, maxSpeed, self.bc.maxSteerForce);

      // Cohesion: steer toward average neighbour position
      cohesion = (cohesion.scale(1 / neighbourCount) as Vector3D).subtract(pos) as Vector3D;
      const steerCoh = steer(cohesion, self.pc.velocity, maxSpeed, self.bc.maxSteerForce);

      // Combine weighted forces
      let force = Vector3D.core.zero();
      force = force.add(steerSep.scale(self.bc.separationWeight)) as Vector3D;
      force = force.add(steerAli.scale(self.bc.alignmentWeight)) as Vector3D;
      force = force.add(steerCoh.scale(self.bc.cohesionWeight)) as Vector3D;

      // Clamp total steering
      const fl = force.length;
      if (fl > self.bc.maxSteerForce) {
        force = force.scale(self.bc.maxSteerForce / fl) as Vector3D;
      }

      // Add to acceleration (PhysicsSystem will integrate)
      self.pc.acceleration = self.pc.acceleration.add(force) as Vector3D;
    }
  }
}

/**
 * Reynolds-style steering: compute a force that redirects `velocity`
 * toward the `desired` direction at `maxSpeed`, clamped to `maxForce`.
 */
function steer(
  desired: Vector3D,
  velocity: Vector3D,
  maxSpeed: number,
  maxForce: number,
): Vector3D {
  const dl = desired.length;
  if (dl === 0) return Vector3D.core.zero();

  // Desired velocity = desired direction × maxSpeed
  const desiredVel = desired.scale(maxSpeed / dl) as Vector3D;

  // Steering = desired velocity − current velocity
  let s = desiredVel.subtract(velocity) as Vector3D;
  const sl = s.length;
  if (sl > maxForce) {
    s = s.scale(maxForce / sl) as Vector3D;
  }
  return s;
}

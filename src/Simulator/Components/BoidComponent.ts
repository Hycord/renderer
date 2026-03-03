import type { Component } from "../ECS";

/**
 * Boid flocking parameters.
 *
 * Attach to an entity alongside {@link TransformComponent} and
 * {@link PhysicsComponent} to make it participate in flocking via the
 * {@link BoidSystem}.
 *
 * Each weight controls how strongly that steering rule influences the boid.
 */
export class BoidComponent implements Component {
  static readonly TYPE = "boid";
  readonly type = BoidComponent.TYPE;

  /** How far the boid can "see" neighbours (world units). */
  perceptionRadius: number;

  /** Weight of the separation rule (steer away from nearby boids). */
  separationWeight: number;

  /** Weight of the alignment rule (steer towards neighbours' average heading). */
  alignmentWeight: number;

  /** Weight of the cohesion rule (steer towards neighbours' average position). */
  cohesionWeight: number;

  /** Maximum steering force applied per frame. */
  maxSteerForce: number;

  /** Optional flock ID — boids only flock with others sharing the same group. */
  group: string;

  constructor(options: {
    perceptionRadius?: number;
    separationWeight?: number;
    alignmentWeight?: number;
    cohesionWeight?: number;
    maxSteerForce?: number;
    group?: string;
  } = {}) {
    this.perceptionRadius = options.perceptionRadius ?? 50;
    this.separationWeight = options.separationWeight ?? 1.5;
    this.alignmentWeight = options.alignmentWeight ?? 1.0;
    this.cohesionWeight = options.cohesionWeight ?? 1.0;
    this.maxSteerForce = options.maxSteerForce ?? 200;
    this.group = options.group ?? "default";
  }
}

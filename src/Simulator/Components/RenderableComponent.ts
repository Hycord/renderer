import type { Component } from "../ECS";
import type { Renderable } from "../../Renderable/common";

/**
 * Attaches a {@link Renderable} to an entity so it can be drawn by the
 * {@link RenderSystem}.
 *
 * The system keeps the Renderable's transform in sync with the entity's
 * {@link TransformComponent} each frame.
 */
export class RenderableComponent implements Component {
  static readonly TYPE = "renderable";
  readonly type = RenderableComponent.TYPE;

  /** The underlying renderable object managed by the render engine. */
  renderable: Renderable;

  constructor(renderable: Renderable) {
    this.renderable = renderable;
  }
}

import { Color } from "@hycord/math";
import type { Renderable } from "../Renderable/common";

export class World {
  private _renderables: Set<Renderable> = new Set();
  private _background: Color;

  constructor(background: Color = Color.core.colors.black()) {
    this._background = background;
  }

  get background(): Color {
    return this._background;
  }

  set background(value: Color) {
    this._background = value;
  }

  get renderables(): ReadonlySet<Renderable> {
    return this._renderables;
  }

  get size(): number {
    return this._renderables.size;
  }

  add(...renderables: Renderable[]): void {
    for (const renderable of renderables) {
      this._renderables.add(renderable);
    }
  }

  remove(...renderables: Renderable[]): void {
    for (const renderable of renderables) {
      this._renderables.delete(renderable);
    }
  }

  has(renderable: Renderable): boolean {
    return this._renderables.has(renderable);
  }

  clear(): void {
    this._renderables.clear();
  }

  sorted(): Renderable[] {
    return Array.from(this._renderables).sort((a, b) => a.layer - b.layer);
  }

  update(deltaTime: number): void {
    for (const renderable of this._renderables) {
      renderable.update(deltaTime);
    }
  }
}

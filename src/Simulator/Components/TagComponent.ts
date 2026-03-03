import type { Component } from "../ECS";

/**
 * Lightweight tags for filtering entities without creating new component types.
 *
 * ```ts
 * world.addComponent(e, new TagComponent("enemy", "flying"));
 * // Later:
 * const tags = world.getComponent(e, TagComponent)!;
 * if (tags.has("flying")) { ... }
 * ```
 */
export class TagComponent implements Component {
  static readonly TYPE = "tag";
  readonly type = TagComponent.TYPE;

  private _tags: Set<string>;

  constructor(...tags: string[]) {
    this._tags = new Set(tags);
  }

  has(tag: string): boolean {
    return this._tags.has(tag);
  }

  add(tag: string): void {
    this._tags.add(tag);
  }

  remove(tag: string): void {
    this._tags.delete(tag);
  }

  get all(): ReadonlySet<string> {
    return this._tags;
  }
}

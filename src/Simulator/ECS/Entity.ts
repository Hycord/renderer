/** An entity is simply a unique numeric identifier. */
export type EntityId = number;

/**
 * Generates unique, monotonically increasing entity IDs.
 * @internal Used by {@link ECSWorld}.
 */
export class EntityIdGenerator {
  private _next = 0;

  /** Allocate the next unique ID. */
  next(): EntityId {
    return this._next++;
  }

  /** Total number of IDs ever allocated. */
  get count(): number {
    return this._next;
  }
}

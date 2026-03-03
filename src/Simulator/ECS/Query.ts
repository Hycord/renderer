import type { ComponentClass } from "./Component";

/**
 * Describes a set of component requirements used to match entities.
 *
 * - `required` — component types the entity **must** have.
 * - `excluded` — component types the entity **must not** have.
 *
 * Queries are used by Systems to declare which entities they operate on.
 */
export class Query {
  /** Component types the entity must have. */
  readonly required: readonly string[];

  /** Component types the entity must NOT have. */
  readonly excluded: readonly string[];

  /**
   * Deterministic cache key for this query.
   * Two queries with the same required/excluded sets produce the same key.
   */
  readonly key: string;

  constructor(
    required: (string | ComponentClass)[] = [],
    excluded: (string | ComponentClass)[] = [],
  ) {
    this.required = required
      .map((r) => (typeof r === "string" ? r : r.TYPE))
      .sort();
    this.excluded = excluded
      .map((e) => (typeof e === "string" ? e : e.TYPE))
      .sort();
    this.key = `+${this.required.join(",")}-${this.excluded.join(",")}`;
  }

  /** Check whether a set of component types satisfies this query. */
  matches(componentTypes: ReadonlySet<string>): boolean {
    for (const r of this.required) {
      if (!componentTypes.has(r)) return false;
    }
    for (const e of this.excluded) {
      if (componentTypes.has(e)) return false;
    }
    return true;
  }

  // ── Convenience factories ─────────────────────────────────────────

  /** Query matching entities that have ALL of the listed component types. */
  static all(...types: (string | ComponentClass)[]): Query {
    return new Query(types);
  }

  /** Query matching entities that have ANY combination, excluding the listed types. */
  static none(...types: (string | ComponentClass)[]): Query {
    return new Query([], types);
  }
}

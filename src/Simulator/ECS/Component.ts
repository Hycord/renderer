/**
 * Base interface for all ECS components.
 * Components are pure data containers — logic lives in Systems.
 */
export interface Component {
  /** Unique string identifying this component type. */
  readonly type: string;
}

/**
 * Static interface for component classes.
 * Every component class should expose a static `TYPE` field matching its instance `type`.
 */
export interface ComponentClass<T extends Component = Component> {
  readonly TYPE: string;
  new (...args: any[]): T;
}

/**
 * Extract the component type string from either a class or an instance.
 */
export function componentType(classOrInstance: ComponentClass | Component): string {
  if ("TYPE" in classOrInstance) return (classOrInstance as ComponentClass).TYPE;
  return (classOrInstance as Component).type;
}

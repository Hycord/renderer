/**
 * Data types that can flow through graph connections.
 */
export type PortDataType =
  | "number"
  | "vector2"
  | "vector3"
  | "color"
  | "boolean"
  | "string"
  | "entity"
  | "entity[]"
  | "any";

/**
 * Describes a port's static shape — its name, data type, and optional default.
 */
export interface PortDefinition {
  readonly name: string;
  readonly dataType: PortDataType;
  readonly defaultValue?: unknown;
}

/**
 * Runtime input port on a {@link GraphNode}.
 */
export class InputPort {
  readonly definition: PortDefinition;
  private _value: unknown;
  connected = false;

  constructor(definition: PortDefinition) {
    this.definition = definition;
    this._value = definition.defaultValue;
  }

  get name(): string {
    return this.definition.name;
  }
  get dataType(): PortDataType {
    return this.definition.dataType;
  }

  get value(): unknown {
    return this._value;
  }
  set value(v: unknown) {
    this._value = v;
  }
}

/**
 * Runtime output port on a {@link GraphNode}.
 */
export class OutputPort {
  readonly definition: PortDefinition;
  private _value: unknown;

  constructor(definition: PortDefinition) {
    this.definition = definition;
    this._value = definition.defaultValue;
  }

  get name(): string {
    return this.definition.name;
  }
  get dataType(): PortDataType {
    return this.definition.dataType;
  }

  get value(): unknown {
    return this._value;
  }
  set value(v: unknown) {
    this._value = v;
  }
}

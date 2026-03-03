import { GraphNode } from "./Node";

// ── ValueNode ───────────────────────────────────────────────────────────────

/**
 * Outputs a constant value. Useful as a graph "knob" or parameter input.
 */
export class ValueNode extends GraphNode {
  readonly name = "Value";
  private _value: unknown;

  constructor(value: unknown = 0, dataType: import("./Port").PortDataType = "number", id?: string) {
    super(id);
    this._value = value;
    this.addOutput({ name: "value", dataType, defaultValue: value });
  }

  get value(): unknown {
    return this._value;
  }
  set value(v: unknown) {
    this._value = v;
  }

  process(): void {
    this.setOutput("value", this._value);
  }
}

// ── MathNode ────────────────────────────────────────────────────────────────

export type MathOp = "add" | "subtract" | "multiply" | "divide" | "modulo" | "power" | "min" | "max";

/**
 * Performs a binary math operation on two number inputs.
 */
export class MathNode extends GraphNode {
  readonly name = "Math";
  op: MathOp;

  constructor(op: MathOp = "add", id?: string) {
    super(id);
    this.op = op;
    this.addInput({ name: "a", dataType: "number", defaultValue: 0 });
    this.addInput({ name: "b", dataType: "number", defaultValue: 0 });
    this.addOutput({ name: "result", dataType: "number" });
  }

  process(): void {
    const a = this.getInput<number>("a") ?? 0;
    const b = this.getInput<number>("b") ?? 0;
    let result: number;
    switch (this.op) {
      case "add":      result = a + b; break;
      case "subtract": result = a - b; break;
      case "multiply": result = a * b; break;
      case "divide":   result = b !== 0 ? a / b : 0; break;
      case "modulo":   result = b !== 0 ? a % b : 0; break;
      case "power":    result = Math.pow(a, b); break;
      case "min":      result = Math.min(a, b); break;
      case "max":      result = Math.max(a, b); break;
    }
    this.setOutput("result", result);
  }
}

// ── CompareNode ─────────────────────────────────────────────────────────────

export type CompareOp = "==" | "!=" | "<" | "<=" | ">" | ">=";

/**
 * Compares two numbers and outputs a boolean.
 */
export class CompareNode extends GraphNode {
  readonly name = "Compare";
  op: CompareOp;

  constructor(op: CompareOp = "==", id?: string) {
    super(id);
    this.op = op;
    this.addInput({ name: "a", dataType: "number", defaultValue: 0 });
    this.addInput({ name: "b", dataType: "number", defaultValue: 0 });
    this.addOutput({ name: "result", dataType: "boolean" });
  }

  process(): void {
    const a = this.getInput<number>("a") ?? 0;
    const b = this.getInput<number>("b") ?? 0;
    let result: boolean;
    switch (this.op) {
      case "==": result = a === b; break;
      case "!=": result = a !== b; break;
      case "<":  result = a < b;   break;
      case "<=": result = a <= b;  break;
      case ">":  result = a > b;   break;
      case ">=": result = a >= b;  break;
    }
    this.setOutput("result", result);
  }
}

// ── BranchNode ──────────────────────────────────────────────────────────────

/**
 * Passes through one of two values based on a boolean condition.
 *
 * If `condition` is truthy, output = `ifTrue`; otherwise output = `ifFalse`.
 */
export class BranchNode extends GraphNode {
  readonly name = "Branch";

  constructor(id?: string) {
    super(id);
    this.addInput({ name: "condition", dataType: "boolean", defaultValue: false });
    this.addInput({ name: "ifTrue", dataType: "any", defaultValue: null });
    this.addInput({ name: "ifFalse", dataType: "any", defaultValue: null });
    this.addOutput({ name: "result", dataType: "any" });
  }

  process(): void {
    const condition = this.getInput<boolean>("condition");
    this.setOutput(
      "result",
      condition ? this.getInput("ifTrue") : this.getInput("ifFalse"),
    );
  }
}

// ── ClampNode ───────────────────────────────────────────────────────────────

/**
 * Clamps a number between min and max.
 */
export class ClampNode extends GraphNode {
  readonly name = "Clamp";

  constructor(id?: string) {
    super(id);
    this.addInput({ name: "value", dataType: "number", defaultValue: 0 });
    this.addInput({ name: "min", dataType: "number", defaultValue: 0 });
    this.addInput({ name: "max", dataType: "number", defaultValue: 1 });
    this.addOutput({ name: "result", dataType: "number" });
  }

  process(): void {
    const v = this.getInput<number>("value") ?? 0;
    const lo = this.getInput<number>("min") ?? 0;
    const hi = this.getInput<number>("max") ?? 1;
    this.setOutput("result", Math.max(lo, Math.min(hi, v)));
  }
}

// ── MapRangeNode ────────────────────────────────────────────────────────────

/**
 * Maps a value from one range to another (linear interpolation).
 */
export class MapRangeNode extends GraphNode {
  readonly name = "Map Range";

  constructor(id?: string) {
    super(id);
    this.addInput({ name: "value", dataType: "number", defaultValue: 0 });
    this.addInput({ name: "fromMin", dataType: "number", defaultValue: 0 });
    this.addInput({ name: "fromMax", dataType: "number", defaultValue: 1 });
    this.addInput({ name: "toMin", dataType: "number", defaultValue: 0 });
    this.addInput({ name: "toMax", dataType: "number", defaultValue: 1 });
    this.addOutput({ name: "result", dataType: "number" });
  }

  process(): void {
    const v = this.getInput<number>("value") ?? 0;
    const fromMin = this.getInput<number>("fromMin") ?? 0;
    const fromMax = this.getInput<number>("fromMax") ?? 1;
    const toMin = this.getInput<number>("toMin") ?? 0;
    const toMax = this.getInput<number>("toMax") ?? 1;
    const range = fromMax - fromMin;
    const t = range !== 0 ? (v - fromMin) / range : 0;
    this.setOutput("result", toMin + t * (toMax - toMin));
  }
}

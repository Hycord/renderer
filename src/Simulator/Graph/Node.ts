import { InputPort, OutputPort, type PortDefinition } from "./Port";

let _nextNodeId = 0;

/**
 * Base class for all graph nodes.
 *
 * A node has typed input and output ports. During graph evaluation
 * the engine pushes values into inputs (from connected outputs) and
 * then calls {@link process} to compute the outputs.
 *
 * Subclass this to create custom nodes:
 *
 * ```ts
 * class AddNode extends GraphNode {
 *   readonly name = "Add";
 *   constructor() {
 *     super();
 *     this.addInput({ name: "a", dataType: "number", defaultValue: 0 });
 *     this.addInput({ name: "b", dataType: "number", defaultValue: 0 });
 *     this.addOutput({ name: "result", dataType: "number" });
 *   }
 *   process() {
 *     this.setOutput("result", this.getInput<number>("a") + this.getInput<number>("b"));
 *   }
 * }
 * ```
 */
export abstract class GraphNode {
  /** Unique identifier within the graph. */
  readonly id: string;

  /** Human-readable name for the editor UI. */
  abstract readonly name: string;

  /** Position in the visual editor (pixels). */
  x = 0;
  y = 0;

  readonly inputs = new Map<string, InputPort>();
  readonly outputs = new Map<string, OutputPort>();

  constructor(id?: string) {
    this.id = id ?? `node_${_nextNodeId++}`;
  }

  // ── Port registration ─────────────────────────────────────────────

  protected addInput(definition: PortDefinition): InputPort {
    const port = new InputPort(definition);
    this.inputs.set(definition.name, port);
    return port;
  }

  protected addOutput(definition: PortDefinition): OutputPort {
    const port = new OutputPort(definition);
    this.outputs.set(definition.name, port);
    return port;
  }

  // ── Value access ──────────────────────────────────────────────────

  /** Read a typed value from an input port. */
  getInput<T = unknown>(name: string): T {
    return this.inputs.get(name)?.value as T;
  }

  /** Write a value to an output port. */
  setOutput(name: string, value: unknown): void {
    const port = this.outputs.get(name);
    if (port) port.value = value;
  }

  // ── Processing ────────────────────────────────────────────────────

  /**
   * Compute output values from the current inputs.
   * Called by the graph evaluator after all upstream nodes have processed.
   */
  abstract process(): void;
}

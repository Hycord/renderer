import type { GraphNode } from "./Node";
import { Connection } from "./Connection";

/**
 * A directed acyclic graph (DAG) of {@link GraphNode}s connected
 * by {@link Connection}s.
 *
 * The graph can be **evaluated** — nodes are topologically sorted so
 * every node processes only after all its upstream dependencies.
 *
 * ```ts
 * const graph = new Graph();
 * graph.addNode(valueNode);
 * graph.addNode(addNode);
 * graph.connect(valueNode.id, "value", addNode.id, "a");
 * graph.evaluate();
 * console.log(graph.getOutput(addNode.id, "result"));
 * ```
 */
export class Graph {
  private _nodes = new Map<string, GraphNode>();
  private _connections: Connection[] = [];
  private _sortedOrder: string[] | null = null;

  // ── Nodes ─────────────────────────────────────────────────────────

  addNode(node: GraphNode): void {
    this._nodes.set(node.id, node);
    this._sortedOrder = null; // invalidate topo cache
  }

  removeNode(id: string): void {
    this._nodes.delete(id);
    this._connections = this._connections.filter(
      (c) => c.fromNodeId !== id && c.toNodeId !== id,
    );
    this._sortedOrder = null;
  }

  getNode<T extends GraphNode = GraphNode>(id: string): T | undefined {
    return this._nodes.get(id) as T | undefined;
  }

  get nodes(): ReadonlyMap<string, GraphNode> {
    return this._nodes;
  }

  // ── Connections ───────────────────────────────────────────────────

  /**
   * Connect an output port of one node to an input port of another.
   *
   * Throws if the connection would create a cycle.
   */
  connect(
    fromNodeId: string,
    fromPort: string,
    toNodeId: string,
    toPort: string,
  ): Connection {
    // Validate nodes exist
    const fromNode = this._nodes.get(fromNodeId);
    const toNode = this._nodes.get(toNodeId);
    if (!fromNode) throw new Error(`Node "${fromNodeId}" not found.`);
    if (!toNode) throw new Error(`Node "${toNodeId}" not found.`);

    // Validate ports exist
    if (!fromNode.outputs.has(fromPort)) {
      throw new Error(`Output port "${fromPort}" not found on "${fromNodeId}".`);
    }
    if (!toNode.inputs.has(toPort)) {
      throw new Error(`Input port "${toPort}" not found on "${toNodeId}".`);
    }

    // Remove any existing connection to this input port
    this._connections = this._connections.filter(
      (c) => !(c.toNodeId === toNodeId && c.toPort === toPort),
    );

    const conn = new Connection(fromNodeId, fromPort, toNodeId, toPort);
    this._connections.push(conn);

    // Validate no cycles
    try {
      this.topologicalSort();
    } catch {
      // Undo — this connection creates a cycle
      this._connections.pop();
      this._sortedOrder = null;
      throw new Error(
        `Connection ${fromNodeId}.${fromPort} → ${toNodeId}.${toPort} creates a cycle.`,
      );
    }

    // Mark the input port as connected
    toNode.inputs.get(toPort)!.connected = true;
    return conn;
  }

  disconnect(connectionId: string): void {
    const idx = this._connections.findIndex((c) => c.id === connectionId);
    if (idx === -1) return;
    const conn = this._connections[idx]!;

    this._connections.splice(idx, 1);
    this._sortedOrder = null;

    // Mark the input port as disconnected (if no other connection targets it)
    const stillConnected = this._connections.some(
      (c) => c.toNodeId === conn.toNodeId && c.toPort === conn.toPort,
    );
    if (!stillConnected) {
      const node = this._nodes.get(conn.toNodeId);
      if (node) {
        const port = node.inputs.get(conn.toPort);
        if (port) port.connected = false;
      }
    }
  }

  get connections(): readonly Connection[] {
    return this._connections;
  }

  // ── Evaluation ────────────────────────────────────────────────────

  /**
   * Evaluate the entire graph:
   * 1. Topologically sort nodes.
   * 2. For each node (in dependency order), propagate upstream
   *    output values into its inputs, then call `process()`.
   */
  evaluate(): void {
    const order = this.topologicalSort();

    for (const nodeId of order) {
      const node = this._nodes.get(nodeId)!;

      // Push connected output values into this node's inputs
      for (const conn of this._connections) {
        if (conn.toNodeId !== nodeId) continue;
        const fromNode = this._nodes.get(conn.fromNodeId);
        if (!fromNode) continue;

        const outputPort = fromNode.outputs.get(conn.fromPort);
        const inputPort = node.inputs.get(conn.toPort);
        if (outputPort && inputPort) {
          inputPort.value = outputPort.value;
        }
      }

      node.process();
    }
  }

  /** Read the current value of a specific output port. */
  getOutput(nodeId: string, portName: string): unknown {
    return this._nodes.get(nodeId)?.outputs.get(portName)?.value;
  }

  // ── Topological sort (Kahn's algorithm) ───────────────────────────

  private topologicalSort(): string[] {
    if (this._sortedOrder) return this._sortedOrder;

    const inDegree = new Map<string, number>();
    for (const id of this._nodes.keys()) inDegree.set(id, 0);

    for (const conn of this._connections) {
      inDegree.set(conn.toNodeId, (inDegree.get(conn.toNodeId) ?? 0) + 1);
    }

    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
      if (deg === 0) queue.push(id);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      for (const conn of this._connections) {
        if (conn.fromNodeId !== current) continue;
        const newDeg = (inDegree.get(conn.toNodeId) ?? 1) - 1;
        inDegree.set(conn.toNodeId, newDeg);
        if (newDeg === 0) queue.push(conn.toNodeId);
      }
    }

    if (sorted.length !== this._nodes.size) {
      throw new Error("Graph contains a cycle.");
    }

    this._sortedOrder = sorted;
    return sorted;
  }
}

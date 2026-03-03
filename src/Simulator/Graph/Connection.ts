/**
 * A directed edge in the node graph, linking an output port of one node
 * to an input port of another.
 */
export class Connection {
  readonly id: string;
  readonly fromNodeId: string;
  readonly fromPort: string;
  readonly toNodeId: string;
  readonly toPort: string;

  constructor(
    fromNodeId: string,
    fromPort: string,
    toNodeId: string,
    toPort: string,
  ) {
    this.id = `${fromNodeId}.${fromPort}->${toNodeId}.${toPort}`;
    this.fromNodeId = fromNodeId;
    this.fromPort = fromPort;
    this.toNodeId = toNodeId;
    this.toPort = toPort;
  }
}

// ── ECS Core ────────────────────────────────────────────────────────────────
export * from "./ECS";

// ── Built-in Components ─────────────────────────────────────────────────────
export * from "./Components";

// ── Built-in Systems ────────────────────────────────────────────────────────
export * from "./Systems";

// ── Simulation / Portal / Manager ───────────────────────────────────────────
export { Simulation } from "./Simulation";
export type { SimulationOptions } from "./Simulation";
export { Portal } from "./Portal";
export type { PortalOptions } from "./Portal";
export { SimulationManager } from "./SimulationManager";

// ── Node Graph ──────────────────────────────────────────────────────────────
export * as Graph from "./Graph";

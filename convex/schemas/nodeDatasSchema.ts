import { v } from "convex/values";
import { nodeTypeValidator } from "./nodeTypeSchema";

// ── Sub-validators ──────────────────────────────────────────────────────

const agentConfigValidator = v.object({
  model: v.string(),
  instructions: v.string(),
  touchableFields: v.optional(v.array(v.string())),
});

const dataProcessingValidator = v.object({
  field: v.string(),
  sourceNode: v.id("nodeDatas"),
  expression: v.string(),
});

const dependencyValidator = v.object({
  nodeDataId: v.id("nodeDatas"),
  field: v.optional(v.string()),
  type: v.union(v.literal("input"), v.literal("output")),
  degree: v.optional(v.number()),
  shouldTriggerUpdate: v.optional(v.boolean()),
});

const nodeDataStatusValidator = v.optional(
  v.union(v.literal("idle"), v.literal("working"), v.literal("error")),
);

const automationProgressValidator = v.optional(
  v.object({
    currentStepType: v.optional(v.string()),
    currentStepData: v.optional(v.record(v.string(), v.any())),
    currentStepStartedAt: v.optional(v.number()),
    workStartedAt: v.optional(v.number()),
  }),
);

// ── Main validator ──────────────────────────────────────────────────────

const nodeDatasValidator = v.object({
  canvasId: v.id("canvases"),
  type: nodeTypeValidator,
  updatedAt: v.number(),
  removedFromCanvasAt: v.optional(v.number()),
  values: v.record(v.string(), v.any()),

  status: nodeDataStatusValidator,
  automationProgress: automationProgressValidator,

  agent: v.optional(agentConfigValidator),
  dataProcessing: v.optional(v.array(dataProcessingValidator)),
  automationMode: v.optional(
    v.union(v.literal("agent"), v.literal("dataProcessing"), v.literal("off")),
  ),
  dependencies: v.optional(v.array(dependencyValidator)),
});

export {
  nodeDatasValidator,
  nodeDataStatusValidator,
  automationProgressValidator,
  agentConfigValidator,
  dataProcessingValidator,
  dependencyValidator,
};

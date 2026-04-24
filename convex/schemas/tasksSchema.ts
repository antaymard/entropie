import { v } from "convex/values";
import { threadId } from "worker_threads";

const tasksValidator = v.object({
  id: v.string(), // llmId format
  canvasId: v.id("canvases"),
  name: v.string(),
  instructions: v.string(),
  //   recipeId: v.string(), // TODO later
  status: v.union(
    v.literal("ready"),
    v.literal("running"),
    v.literal("pending"),
    v.literal("success"),
    v.literal("error"),
    v.literal("stopped"),
  ),
  currentStep: v.optional(v.string()),
  nodeId: v.optional(v.string()), // canvasNodeId, llmId format
  startTime: v.optional(v.number()), // timestamp
  endTime: v.optional(v.number()), // timestamp
  threadId: v.optional(v.id("threads")), // supervisor threadId
  resultMessage: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
});

export { tasksValidator };

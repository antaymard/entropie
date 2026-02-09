import { z } from "zod";
import { zodToConvex, zid } from "convex-helpers/server/zod4";
import { v } from "convex/values";

const agentConfigSchema = z.object({
  model: z.string(),
  instructions: z.string(),
  touchableFields: z.array(z.string()).optional(),
});

const dataProcessingSchema = z.object({
  field: z.string(), // Field to update with the processed data
  sourceNode: zid("nodeDatas"),
  expression: z.string(), // JSONata expression to process the data
});

const dependencySchema = z.object({
  nodeDataId: zid("nodeDatas"),
  field: z.string().optional(),
  type: z.union([z.literal("input"), z.literal("output")]),
  degree: z.number().optional(),
  shouldTriggerUpdate: z.boolean().optional(),
});

const nodeDatasSchema = z.object({
  // _id et _creationTime sont ajoutés automatiquement par Convex
  templateId: zid("nodeTemplates").optional(),
  template: z.any().optional(), // Override templateId if on the spot template is needed
  type: z.string(),
  updatedAt: z.number(),
  removedFromCanvasAt: z.number().optional(),

  values: z.record(z.string(), z.any()), // Field values
  status: z
    .union([z.literal("idle"), z.literal("working"), z.literal("error")])
    .optional(),

  agent: agentConfigSchema.optional(),
  dataProcessing: z.array(dataProcessingSchema).optional(),
  automationMode: z
    .union([z.literal("agent"), z.literal("dataProcessing"), z.literal("off")])
    .optional(),
  dependencies: z.array(dependencySchema).optional(),
});

// Validators
const agentConfigValidator = zodToConvex(agentConfigSchema);
const dataProcessingValidator = zodToConvex(dataProcessingSchema);
const dependencyValidator = zodToConvex(dependencySchema);
const nodeDatasValidator = zodToConvex(nodeDatasSchema);
const nodeDatasWithIdValidator = v.object({
  _id: v.id("nodeDatas"),
  ...nodeDatasValidator.fields,
});

// Types TS
export type AgentConfig = z.infer<typeof agentConfigSchema>;
export type DataProcessing = z.infer<typeof dataProcessingSchema>;
export type Dependency = z.infer<typeof dependencySchema>;
export type NodeData = z.infer<typeof nodeDatasSchema>;

export {
  nodeDatasSchema,
  agentConfigSchema,
  dataProcessingSchema,
  dependencySchema,
  nodeDatasValidator,
  nodeDatasWithIdValidator,
  agentConfigValidator,
  dataProcessingValidator,
  dependencyValidator,
};

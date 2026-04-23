import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { tasksValidator } from "../schemas/tasksSchema";
import * as TaskModels from "../models/taskModels";

export const create = internalMutation({
  args: tasksValidator.fields,
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    return TaskModels.createTask(ctx, args);
  },
});

export const run = internalMutation({
  args: {
    id: tasksValidator.fields.id,
    startTime: v.optional(tasksValidator.fields.startTime),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return TaskModels.runTask(ctx, args);
  },
});

export const read = internalQuery({
  args: {
    id: tasksValidator.fields.id,
  },
  handler: async (ctx, args) => {
    return TaskModels.readTask(ctx, args);
  },
});

export const update = internalMutation({
  args: {
    id: tasksValidator.fields.id,
    name: v.optional(tasksValidator.fields.name),
    instructions: v.optional(tasksValidator.fields.instructions),
    status: v.optional(tasksValidator.fields.status),
    nodeId: v.optional(tasksValidator.fields.nodeId),
    startTime: v.optional(tasksValidator.fields.startTime),
    endTime: v.optional(tasksValidator.fields.endTime),
    resultMessage: v.optional(tasksValidator.fields.resultMessage),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    return TaskModels.updateTask(ctx, { id, patch });
  },
});

export const stop = internalMutation({
  args: {
    id: tasksValidator.fields.id,
    endTime: v.optional(tasksValidator.fields.endTime),
    resultMessage: v.optional(tasksValidator.fields.resultMessage),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    return TaskModels.stopTask(ctx, args);
  },
});

import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import * as AiMemoryModels from "../models/aiMemoryModels";
import {
  subjectTypeValidator,
  subjectIdValidator,
  memoryTypeValidator,
} from "../schemas/aiMemorySchema";

export const upsert = internalMutation({
  args: {
    subjectType: subjectTypeValidator,
    subjectId: subjectIdValidator,
    memoryType: memoryTypeValidator,
    content: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => AiMemoryModels.upsert(ctx, args),
});

export const read = internalQuery({
  args: {
    subjectId: subjectIdValidator,
    memoryType: memoryTypeValidator,
  },
  handler: async (ctx, args) => AiMemoryModels.read(ctx, args),
});

export const list = internalQuery({
  args: {
    subjectId: subjectIdValidator,
  },
  handler: async (ctx, args) => AiMemoryModels.list(ctx, args),
});

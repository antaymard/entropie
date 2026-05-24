import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import * as MessageMetadataModels from "../models/messageMetadataModels";

export const recordAssistantUsage = internalMutation({
  args: {
    threadId: v.string(),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    usage: v.optional(
      v.object({
        inputTokens: v.number(),
        outputTokens: v.number(),
        totalTokens: v.number(),
        cachedInputTokens: v.optional(v.number()),
      }),
    ),
  },
  handler: async (ctx, args) =>
    MessageMetadataModels.recordAssistantUsage(ctx, args),
});

import { v } from "convex/values";

const messageMetadataValidator = v.object({
  messageId: v.string(),
  threadId: v.string(),
  role: v.union(v.literal("user"), v.literal("assistant")),

  // assistant only (filled by usageHandler)
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
  costUsd: v.optional(v.number()),

  // user only (filled by saveMessage)
  attachments: v.optional(
    v.object({
      nodes: v.optional(
        v.array(
          v.object({
            id: v.string(),
            type: v.string(),
            title: v.string(),
          }),
        ),
      ),
      position: v.optional(v.object({ x: v.number(), y: v.number() })),
      page: v.optional(
        v.object({
          title: v.optional(v.string()),
          url: v.optional(v.string()),
        }),
      ),
    }),
  ),
});

export { messageMetadataValidator };

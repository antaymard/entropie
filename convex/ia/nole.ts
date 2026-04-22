import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { baseAgent, chatModelOptions, vChatModelValues } from "./agents";
import { requireAuth } from "../lib/auth";
import { internal } from "../_generated/api";

export const vMetadata = v.optional(
  v.object({
    messageContext: v.optional(v.any()),
    model: v.optional(vChatModelValues),
  }),
);

export type NoleMessageMetadata = typeof vMetadata.type;

export const listChatModels = query({
  args: {},
  handler: async () => {
    return chatModelOptions;
  },
});

// Public entrypoint: persist user message, then schedule async streaming.
export const saveMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    metadata: vMetadata,
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { threadId, prompt, metadata, canvasId }) => {
    const authUserId = await requireAuth(ctx);

    // 1) Persist the user message first so it exists in thread history.
    const { messageId } = await baseAgent.saveMessage(ctx, {
      threadId,
      prompt,
    });

    // 2) Schedule the response generation in background.
    void ctx.scheduler.runAfter(0, internal.ia.noleCompletion.streamResponse, {
      authUserId: authUserId,
      threadId,
      promptMessageId: messageId,
      userPrompt: prompt,
      metadata,
      canvasId,
    });

    return { messageId };
  },
});

import { v } from "convex/values";
import { action, internalAction, mutation } from "../_generated/server";
import { baseAgent, createNoleAgent } from "./agents";
import { anyApi } from "convex/server";
import { requireAuth } from "../lib/auth";
import z from "zod";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateBrainSystemPrompt } from "./nole/brain/brainAgent";

// Save user message, then stream response asynchronously
export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    canvasId: v.id("canvases"),
  },
  returns: v.union(
    v.object({
      messageId: v.string(),
    }),
    v.object({
      success: v.boolean(),
      error: v.string(),
    }),
  ),
  handler: async (ctx, { threadId, prompt, canvasId }) => {
    const authUserId = await requireAuth(ctx);
    if (!authUserId) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      };
    }

    // Save the user message
    const { messageId } = await baseAgent.saveMessage(ctx, {
      threadId,
      prompt,
    });

    // Schedule the streaming action (no await needed for scheduler)
    void ctx.scheduler.runAfter(0, anyApi.ia.nole.streamResponse, {
      authUserId: authUserId,
      threadId,
      promptMessageId: messageId,
      canvasId,
    });

    return { messageId };
  },
});

// Internal action that handles streaming
export const streamResponse = internalAction({
  args: {
    authUserId: v.id("users"),
    promptMessageId: v.string(),
    threadId: v.string(),
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { authUserId, promptMessageId, threadId, canvasId }) => {
    // Generate brain context (canvas + user context)
    const brainInstructions = await generateBrainSystemPrompt({
      canvasId,
      userId: authUserId,
      ctx,
    });

    const noleAgent = createNoleAgent({
      readCanvasInternal: anyApi.ia.helpers.canvasHelpers.getCanvasInternal,
    });
    const result = await noleAgent.streamText(
      ctx,
      { threadId, userId: authUserId },
      {
        promptMessageId,
        system: brainInstructions,
      },
      {
        saveStreamDeltas: {
          chunking: "word", // Stream word by word
          throttleMs: 200, // 200ms between each update
        },
      },
    );

    // Consume the stream to ensure it finishes
    await result.consumeStream();
    return null;
  },
});

export const updateThreadTitle = action({
  args: { threadId: v.string(), onlyIfUntitled: v.optional(v.boolean()) },
  handler: async (ctx, { threadId, onlyIfUntitled }) => {
    // await authorizeThreadAccess(ctx, threadId);
    await requireAuth(ctx);
    const noleAgent = createNoleAgent({
      model: openrouter("mistralai/ministral-14b-2512"),
      readCanvasInternal: anyApi.ia.helpers.canvasHelpers.getCanvasInternal,
    });
    const { thread } = await noleAgent.continueThread(ctx, { threadId });
    if (onlyIfUntitled) {
      const metadata = await thread.getMetadata();
      if (metadata.title && metadata.title.trim().length > 0) {
        return;
      }
    }
    const {
      object: { title },
    } = await thread.generateObject(
      {
        schema: z.object({
          title: z.string().describe("The new title for the thread"),
          // summary: z.string().describe("The new summary for the thread"),
        }),
        prompt: "Generate a title for this thread.",
      },
      { storageOptions: { saveMessages: "none" } },
    );
    await thread.updateMetadata({ title });
  },
});

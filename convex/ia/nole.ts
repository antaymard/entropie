import { v } from "convex/values";
import { internalAction, mutation } from "../_generated/server";
import { baseAgent, createNoleAgent } from "./agents";
import { requireAuth } from "../lib/auth";
import { generateNoleSystemPrompt } from "./nole/noleSystemPrompt";
import { internal } from "../_generated/api";

function isExpectedAbortedStreamError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("stream") &&
    message.includes("aborted") &&
    (message.includes("trying to finish") || message.includes("finish"))
  );
}

// Save user message, then stream response asynchronously
export const saveMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
    context: v.optional(
      v.object({
        messageContext: v.string(), // Déja balisé
      }),
    ),
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, { threadId, prompt, context, canvasId }) => {
    const authUserId = await requireAuth(ctx);

    // Save the user message
    const { messageId } = await baseAgent.saveMessage(ctx, {
      threadId,
      prompt,
    });

    // Schedule the streaming action (no await needed for scheduler)
    void ctx.scheduler.runAfter(0, internal.ia.nole.streamResponse, {
      authUserId: authUserId,
      threadId,
      promptMessageId: messageId,
      userPrompt: prompt,
      context,
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
    userPrompt: v.string(),
    threadId: v.string(),
    context: v.optional(
      v.object({
        messageContext: v.string(), // Déja balisé
      }),
    ),
    canvasId: v.id("canvases"),
  },
  handler: async (
    ctx,
    { authUserId, promptMessageId, userPrompt, threadId, context, canvasId },
  ) => {
    // Generate nole context (canvas + user context)
    const noleSystemPrompt = await generateNoleSystemPrompt({
      canvasId,
      userId: authUserId,
      ctx,
    });

    const noleAgent = createNoleAgent({
      runtimeContext: {
        authUserId,
        canvasId,
      },
    });
    const llmPrompt = context?.messageContext?.trim()
      ? `${context.messageContext}\n\n<user_message>\n${userPrompt}\n</user_message>`
      : userPrompt;
    try {
      const result = await noleAgent.streamText(
        ctx,
        { threadId, userId: authUserId },
        {
          promptMessageId,
          prompt: llmPrompt,
          system: noleSystemPrompt,
        },
        {
          saveStreamDeltas: {
            chunking: "line", // Stream line by line
            throttleMs: 200, // 200ms between each update
          },
        },
      );

      // Consume the stream to ensure it finishes.
      await result.consumeStream();
    } catch (error) {
      if (isExpectedAbortedStreamError(error)) {
        return null;
      }
      throw error;
    }

    return null;
  },
});

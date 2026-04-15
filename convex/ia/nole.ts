import { v } from "convex/values";
import { internalAction, mutation } from "../_generated/server";
import { baseAgent, createNoleAgent } from "./agents";
import { requireAuth } from "../lib/auth";
import { generateNoleSystemPrompt } from "./systemPrompts/noleSystemPrompt";
import { components, internal } from "../_generated/api";

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

// Public entrypoint: persist user message, then schedule async streaming.
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

    // 1) Persist the user message first so it exists in thread history.
    const { messageId } = await baseAgent.saveMessage(ctx, {
      threadId,
      prompt,
    });

    // 2) Schedule the response generation in background.
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
    // A) Build system prompt (long-lived context for this run).
    const noleSystemPrompt = await generateNoleSystemPrompt({
      canvasId,
      userId: authUserId,
      ctx,
    });

    const noleAgent = createNoleAgent({
      threadCtx: {
        authUserId,
        canvasId,
      },
    });

    // B) Retrieve the immediately previous message in the thread.
    // We request two messages including `promptMessageId`, then keep the other one.
    const previousMessages = await ctx.runQuery(
      components.agent.messages.listMessagesByThreadId,
      {
        threadId,
        order: "desc",
        excludeToolMessages: true,
        upToAndIncludingMessageId: promptMessageId,
        paginationOpts: {
          cursor: null,
          numItems: 2,
        },
      },
    );

    const previousMessage = previousMessages.page.find(
      (message) => message._id !== promptMessageId,
    );

    // C) Compute canvas changes since that previous message and format as XML.
    // This is runtime-only context injected into the current prompt (not persisted).
    const canvasChangesSinceLastMessageXml = previousMessage
      ? await ctx.runQuery(
          internal.ia.helpers.getCanvasChangesSinceLastMessage
            .getCanvasChangesSinceLastMessage,
          {
            canvasId,
            lastMessageAt: previousMessage._creationTime,
          },
        )
      : "";

    // D) Merge optional external messageContext + computed canvas changes context.
    const runtimeMessageContext = [
      context?.messageContext?.trim() ?? "",
      canvasChangesSinceLastMessageXml,
    ]
      .filter((part) => part.length > 0)
      .join("\n\n");

    // E) Build final user prompt payload.
    const llmPrompt = runtimeMessageContext
      ? `${runtimeMessageContext}\n\n<user_message>\n${userPrompt}\n</user_message>`
      : userPrompt;

    try {
      // F) Stream assistant response and persist deltas progressively.
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

      // Ensure the stream is fully consumed to completion.
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

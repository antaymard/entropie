import { v } from "convex/values";
import { action, internalAction, mutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { noleAgent } from "./agents";
import {
  createThread,
  listUIMessages,
  syncStreams,
  vStreamArgs,
} from "@convex-dev/agent";
import { components } from "../_generated/api";
import { paginationOptsValidator } from "convex/server";
import { getAuth } from "../lib/auth";

// Get the latest thread for the user
export const getLatestThread = query({
  args: {},
  returns: v.union(
    v.object({
      threadId: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    const authUserId = await getAuth(ctx);
    if (!authUserId) {
      return null;
    }

    // Get the latest thread from the agent component
    const result = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      {
        userId: authUserId,
        order: "desc",
        paginationOpts: { numItems: 1, cursor: null },
      }
    );

    if (!result || result.page.length === 0) {
      return null;
    }

    return { threadId: result.page[0]._id };
  },
});

// Create a new thread for the user
export const startThread = action({
  args: {},
  returns: v.union(
    v.object({
      threadId: v.string(),
    }),
    v.object({
      success: v.boolean(),
      error: v.string(),
    })
  ),
  handler: async (ctx) => {
    const authUserId = await getAuth(ctx);
    if (!authUserId) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      };
    }
    const threadId = await createThread(ctx, components.agent, {
      userId: authUserId,
    });
    return { threadId };
  },
});

// Save user message, then stream response asynchronously
export const sendMessage = mutation({
  args: {
    threadId: v.string(),
    prompt: v.string(),
  },
  returns: v.union(
    v.object({
      messageId: v.string(),
    }),
    v.object({
      success: v.boolean(),
      error: v.string(),
    })
  ),
  handler: async (ctx, { threadId, prompt }) => {
    const authUserId = await getAuth(ctx);
    if (!authUserId) {
      return {
        success: false,
        error: "Utilisateur non authentifié",
      };
    }

    // Save the user message
    const { messageId } = await noleAgent.saveMessage(ctx, {
      threadId,
      prompt,
    });

    // Schedule the streaming action (no await needed for scheduler)
    void ctx.scheduler.runAfter(0, internal.ia.nole.streamResponse, {
      threadId,
      promptMessageId: messageId,
    });

    return { messageId };
  },
});

// Internal action that handles streaming
export const streamResponse = internalAction({
  args: {
    promptMessageId: v.string(),
    threadId: v.string(),
  },
  handler: async (ctx, { promptMessageId, threadId }) => {
    const result = await noleAgent.streamText(
      ctx,
      { threadId },
      { promptMessageId },
      {
        saveStreamDeltas: {
          chunking: "word", // Stream word by word
          throttleMs: 100, // 50ms between each update
        },
      }
    );

    // Consume the stream to ensure it finishes
    await result.consumeStream();
    return null;
  },
});

// Query to retrieve and subscribe to messages
export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  // returns: v.object({
  //   page: v.array(v.any()),
  //   isDone: v.boolean(),
  //   continueCursor: v.string(),
  //   streams: v.any(),
  // }),
  handler: async (ctx, { threadId, paginationOpts, streamArgs }) => {
    // Sync ongoing streams
    const streams = await syncStreams(ctx, components.agent, {
      threadId,
      streamArgs,
    });

    // Retrieve messages with pagination
    const paginated = await listUIMessages(ctx, components.agent, {
      threadId,
      paginationOpts,
    });

    return {
      ...paginated,
      streams,
    };
  },
});

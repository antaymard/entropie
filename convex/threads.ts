import { action, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";
import { components } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";
import { listUIMessages, syncStreams, vStreamArgs } from "@convex-dev/agent";
import errors from "./config/errorsConfig";

export const listUserThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuth(ctx);

    if (!authUserId) {
      return {
        success: false,
        threads: [],
        error: errors.UNAUTHORIZED_USER,
      };
    }

    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId: authUserId, paginationOpts: args.paginationOpts },
    );

    return { success: true, threads };
  },
});

export const getThreadInfo = query({
  args: {
    threadId: v.string(),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const authUserId = await requireAuth(ctx);
    if (!authUserId) return null;

    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId: args.threadId,
    });

    if (!thread || thread.userId !== authUserId) return null;

    return {
      _id: thread._id,
      _creationTime: thread._creationTime,
      title: thread.title ?? null,
      summary: thread.summary ?? null,
    };
  },
});

export const listMessages = query({
  args: {
    threadId: v.string(),
    paginationOpts: paginationOptsValidator,
    streamArgs: vStreamArgs,
  },
  handler: async (ctx, { threadId, paginationOpts, streamArgs }) => {
    const authUserId = await requireAuth(ctx);
    if (!authUserId) {
      throw new Error(errors.UNAUTHORIZED_USER);
    }

    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId,
    });
    if (!thread || thread.userId !== authUserId) {
      throw new Error(errors.THREAD_NOT_FOUND_OR_FORBIDDEN);
    }

    const streams = await syncStreams(ctx, components.agent, {
      threadId,
      streamArgs,
    });

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

export const deleteThread = action({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId }) => {
    const authUserId = await requireAuth(ctx);
    if (!authUserId) {
      throw new Error(errors.UNAUTHORIZED_USER);
    }

    const thread = await ctx.runQuery(components.agent.threads.getThread, {
      threadId,
    });
    if (!thread || thread.userId !== authUserId) {
      throw new Error(errors.THREAD_NOT_FOUND_OR_FORBIDDEN);
    }

    await ctx.runMutation(components.agent.threads.deleteAllForThreadIdAsync, {
      threadId,
    });

    return { success: true };
  },
});

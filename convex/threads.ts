import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";
import { components } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

export const listUserThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const authUserId = await requireAuth(ctx);

    if (!authUserId) {
      return {
        success: false,
        threads: [],
        error: "Utilisateur non authentifié",
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

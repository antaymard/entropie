import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuth } from "./lib/auth";
import { components } from "./_generated/api";
import { paginationOptsValidator } from "convex/server";

export const listUserThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const authUserId = await getAuth(ctx);

    if (!authUserId) {
      return {
        success: false,
        threads: [],
        error: "Utilisateur non authentifié",
      };
    }

    const threads = await ctx.runQuery(
      components.agent.threads.listThreadsByUserId,
      { userId: authUserId, paginationOpts: args.paginationOpts }
    );

    return { success: true, threads };
  },
});

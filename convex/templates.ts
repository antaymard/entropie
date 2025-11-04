import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth } from "./lib/auth";

export const getUserTemplates = query({
  args: {},
  handler: async (ctx) => {
    const authUserId = await requireAuth(ctx);

    const templates = await ctx.db
      .query("nodeTemplates")
      .withIndex("by_creator", (q) => q.eq("creatorId", authUserId))
      .collect();

    return templates;
  },
});

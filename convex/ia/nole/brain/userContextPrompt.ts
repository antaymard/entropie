import { v } from "convex/values";
import { internalQuery } from "../../../_generated/server";

export const create = internalQuery({
  args: { userId: v.id("users") },
  returns: v.string(),
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);

    const userContext = "## User Context";

    if (!user) {
      return userContext + "\nNo user context found.";
    }

    return userContext + `\nUser name: ${user.name}`;
  },
});

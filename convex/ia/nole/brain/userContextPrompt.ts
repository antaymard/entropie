import { v } from "convex/values";
import { internalQuery } from "../../../_generated/server";

export const userContextPrompt = internalQuery({
  args: { userId: v.id("users") },
  returns: v.string(),
  handler: async (ctx, { userId }) => {
    return `
    ## User Context

    The user is called Antoine.
    `;
  },
});

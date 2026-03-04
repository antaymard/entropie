import { v } from "convex/values";
import { internalQuery } from "../../../_generated/server";

export const userContextPrompt = internalQuery({
  args: { canvasId: v.id("canvases") },
  handler: async (ctx, { canvasId }) => {
    return `
    ## Canvas Context

    
    `;
  },
});

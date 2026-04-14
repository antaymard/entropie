import { internalQuery } from "../_generated/server";
import { v } from "convex/values";
import { readCanvasById } from "../models/canvasModels";

export const read = internalQuery({
  args: {
    canvasId: v.id("canvases"),
  },
  handler: async (ctx, args) => {
    return await readCanvasById(ctx, { canvasId: args.canvasId });
  },
});

import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import * as SearchableChunkModels from "../models/searchableChunkModels";
import { searchableChunksValidator } from "../schemas/searchableChunksSchema";

const chunkInputValidator = v.object(searchableChunksValidator.fields);

export const upsertChunks = internalMutation({
  args: {
    nodeDataId: v.id("nodeDatas"),
    chunks: v.array(chunkInputValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await SearchableChunkModels.upsertChunks(ctx, args);
    return null;
  },
});

export const deleteByNodeDataId = internalMutation({
  args: {
    nodeDataId: v.id("nodeDatas"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await SearchableChunkModels.deleteByNodeDataId(ctx, args);
    return null;
  },
});

export const deleteByCanvasId = internalMutation({
  args: {
    canvasId: v.id("canvases"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await SearchableChunkModels.deleteByCanvasId(ctx, args);
    return null;
  },
});

export const listByNodeDataId = internalQuery({
  args: {
    nodeDataId: v.id("nodeDatas"),
  },
  handler: async (ctx, args) =>
    SearchableChunkModels.listByNodeDataId(ctx, args),
});

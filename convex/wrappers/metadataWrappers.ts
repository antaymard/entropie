import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import * as MetadataModels from "../models/metadataModels";
import {
  subjectTypeValidator,
  subjectIdValidator,
  memoryTypeValidator,
} from "../schemas/metadataSchema";

export const upsert = internalMutation({
  args: {
    subjectType: subjectTypeValidator,
    subjectId: subjectIdValidator,
    memoryType: memoryTypeValidator,
    content: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => MetadataModels.upsert(ctx, args),
});

export const read = internalQuery({
  args: {
    subjectId: subjectIdValidator,
    memoryType: memoryTypeValidator,
  },
  handler: async (ctx, args) => MetadataModels.read(ctx, args),
});

export const list = internalQuery({
  args: {
    subjectId: subjectIdValidator,
  },
  handler: async (ctx, args) => MetadataModels.list(ctx, args),
});

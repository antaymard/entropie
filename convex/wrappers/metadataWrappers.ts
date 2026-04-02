import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import * as MetadataModels from "../models/metadataModels";
import {
  subjectTypeValidator,
  subjectIdValidator,
  typeValidator,
} from "../schemas/metadatasSchema";

export const upsert = internalMutation({
  args: {
    subjectType: subjectTypeValidator,
    subjectId: subjectIdValidator,
    type: typeValidator,
    content: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => MetadataModels.upsert(ctx, args),
});

export const read = internalQuery({
  args: {
    subjectId: subjectIdValidator,
    type: typeValidator,
  },
  handler: async (ctx, args) => MetadataModels.read(ctx, args),
});

export const list = internalQuery({
  args: {
    subjectId: subjectIdValidator,
  },
  handler: async (ctx, args) => MetadataModels.list(ctx, args),
});

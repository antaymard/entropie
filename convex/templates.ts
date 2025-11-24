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

export const getTemplateById = query({
  args: {
    templateId: v.id("nodeTemplates"),
  },
  handler: async (ctx, args) => {
    const { templateId } = args;
    const authUserId = await requireAuth(ctx);

    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    if (template.creatorId !== authUserId) {
      throw new Error("Unauthorized");
    }

    return template;
  },
});

export const createOrUpdateTemplate = mutation({
  args: {
    templateId: v.optional(v.union(v.id("nodeTemplates"), v.literal("new"))),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const authUserId = await requireAuth(ctx);
    const { templateId, data } = args;

    if (!templateId) return;

    const now = Date.now();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _creationTime, ...sanitizedData } = data;

    if (templateId !== "new") {
      // Update existing template
      const existing = await ctx.db.get(templateId);
      if (!existing) throw new Error("Template not found");
      if (existing.creatorId !== authUserId) throw new Error("Unauthorized");

      await ctx.db.patch(templateId, {
        ...sanitizedData,
        updatedAt: now,
      });
    } else {
      // Create new template
      await ctx.db.insert("nodeTemplates", {
        ...sanitizedData,
        creatorId: authUserId,
        isSystem: false,
        updatedAt: now,
      });
    }
  },
});

export const deleteTemplate = mutation({
  args: {
    templateId: v.id("nodeTemplates"),
  },
  handler: async (ctx, args) => {
    const { templateId } = args;
    const authUserId = await requireAuth(ctx);
    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");
    if (template.creatorId !== authUserId) throw new Error("Unauthorized");

    await ctx.db.delete(templateId);
  },
});

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAuth, getAuth } from "./lib/auth";

export const getUserTemplates = query({
  args: {
    canvasId: v.optional(v.id("canvases")),
  },
  handler: async (ctx, args) => {
    const { canvasId } = args;
    let userId;

    // If canvasId is provided, get the creatorId of the canvas (when no user is logged in)
    if (canvasId) {
      const canvas = await ctx.db.get(canvasId);
      if (!canvas) {
        return {
          success: false,
        };
      }
      userId = canvas.creatorId;
    }
    // Otherwise, get the authenticated user's ID
    else {
      userId = await getAuth(ctx);
    }

    if (!userId) {
      return {
        success: false,
      };
    }

    const templates = await ctx.db
      .query("nodeTemplates")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();

    return { success: true, templates };
  },
});

export const getTemplateById = query({
  args: {
    templateId: v.id("nodeTemplates"),
  },
  handler: async (ctx, args) => {
    const { templateId } = args;
    const authUserId = await getAuth(ctx);

    if (!authUserId) {
      return {
        success: false,
        template: null,
        error: "Utilisateur non authentifié",
      };
    }

    const template = await ctx.db.get(templateId);
    if (!template) throw new Error("Template not found");

    if (template.creatorId !== authUserId) {
      throw new Error("Unauthorized");
    }

    return { success: true, template };
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

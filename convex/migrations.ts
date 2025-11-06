import { internalMutation } from "./_generated/server";

/**
 * Migration: Remove createdAt field from canvases
 * Run once with: npx convex run migrations:removeCreatedAtFromCanvases
 */
export const removeCreatedAtFromCanvases = internalMutation({
  args: {},
  handler: async (ctx) => {
    const canvases = await ctx.db.query("canvases").collect();

    let migrated = 0;
    for (const canvas of canvases) {
      // @ts-expect-error - createdAt exists in old data but not in schema
      if (canvas.createdAt !== undefined) {
        await ctx.db.patch(canvas._id, {
          // @ts-expect-error - removing field by setting to undefined
          createdAt: undefined,
        });
        migrated++;
      }
    }

    return { total: canvases.length, migrated };
  },
});

/**
 * Migration: Remove createdAt field from nodeTemplates
 * Run once with: npx convex run migrations:removeCreatedAtFromTemplates
 */
export const removeCreatedAtFromTemplates = internalMutation({
  args: {},
  handler: async (ctx) => {
    const templates = await ctx.db.query("nodeTemplates").collect();

    let migrated = 0;
    for (const template of templates) {
      // @ts-expect-error - createdAt exists in old data but not in schema
      if (template.createdAt !== undefined) {
        await ctx.db.patch(template._id, {
          // @ts-expect-error - removing field by setting to undefined
          createdAt: undefined,
        });
        migrated++;
      }
    }

    return { total: templates.length, migrated };
  },
});

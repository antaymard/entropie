import { internalMutation } from "./_generated/server";

/**
 * Migration: Rename frameless to headerless in canvases
 * Run once with: npx convex run migrations:renameFramelessToHeaderlessInCanvases
 */
export const renameFramelessToHeaderlessInCanvases = internalMutation({
  args: {},
  handler: async (ctx) => {
    const canvases = await ctx.db.query("canvases").collect();

    let migrated = 0;
    for (const canvas of canvases) {
      if (canvas.nodes && Array.isArray(canvas.nodes)) {
        let hasFrameless = false;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedNodes = canvas.nodes.map((node: any) => {
          if (node.frameless !== undefined) {
            hasFrameless = true;
            const { frameless, ...rest } = node;
            return { ...rest, headerless: frameless };
          }
          return node;
        });

        if (hasFrameless) {
          await ctx.db.patch(canvas._id, { nodes: updatedNodes });
          migrated++;
        }
      }
    }

    return { total: canvases.length, migrated };
  },
});

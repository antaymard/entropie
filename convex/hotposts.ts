import { mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { requireAuth, requireCanvasAccess } from "./lib/auth";
import { hotspotsValidator } from "./schemas/canvasesSchema";

export const create = mutation({
  args: {
    canvasId: v.id("canvases"),
    name: v.string(),
    id: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    viewport: v.any(),
  },
  returns: v.null(),
  handler: async (
    ctx,
    { canvasId, name, id, description, color, viewport },
  ) => {
    const authUserId = await requireAuth(ctx);
    const { canvas } = await requireCanvasAccess(
      ctx,
      canvasId,
      authUserId,
      "editor",
    );

    const currentHotspots = canvas.hotspots || [];
    const alreadyExists = currentHotspots.some((h) => h.id === id);

    if (alreadyExists) {
      throw new ConvexError("A hotspot with this id already exists.");
    }

    await ctx.db.patch(canvasId, {
      hotspots: [
        ...currentHotspots,
        { id, name, description, color, viewport },
      ],
    });

    return null;
  },
});

export const update = mutation({
  args: {
    canvasId: v.id("canvases"),
    hotspot: hotspotsValidator,
  },
  returns: hotspotsValidator,
  handler: async (ctx, { canvasId, hotspot }) => {
    const authUserId = await requireAuth(ctx);
    const { canvas } = await requireCanvasAccess(
      ctx,
      canvasId,
      authUserId,
      "editor",
    );

    const currentHotspots = canvas.hotspots || [];
    const hotspotExists = currentHotspots.some((h) => h.id === hotspot.id);

    if (!hotspotExists) {
      throw new ConvexError("Hotspot not found.");
    }

    const updatedHotspots = currentHotspots.map((h) =>
      h.id === hotspot.id ? hotspot : h,
    );

    await ctx.db.patch(canvasId, { hotspots: updatedHotspots });

    return hotspot;
  },
});

export const reorder = mutation({
  args: {
    canvasId: v.id("canvases"),
    orderedIds: v.array(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, { canvasId, orderedIds }) => {
    const authUserId = await requireAuth(ctx);
    const { canvas } = await requireCanvasAccess(
      ctx,
      canvasId,
      authUserId,
      "editor",
    );

    const currentHotspots = canvas.hotspots || [];
    const hotspotMap = new Map(currentHotspots.map((h) => [h.id, h]));

    const reordered = orderedIds
      .map((id) => hotspotMap.get(id))
      .filter((h): h is NonNullable<typeof h> => h !== undefined);

    await ctx.db.patch(canvasId, { hotspots: reordered });

    return null;
  },
});

export const remove = mutation({
  args: {
    canvasId: v.id("canvases"),
    id: v.string(),
  },
  returns: v.string(),
  handler: async (ctx, { canvasId, id }) => {
    const authUserId = await requireAuth(ctx);
    const { canvas } = await requireCanvasAccess(
      ctx,
      canvasId,
      authUserId,
      "editor",
    );

    const currentHotspots = canvas.hotspots || [];
    const remaining = currentHotspots.filter((h) => h.id !== id);

    if (remaining.length === currentHotspots.length) {
      throw new ConvexError("Hotspot not found.");
    }

    await ctx.db.patch(canvasId, { hotspots: remaining });

    return id;
  },
});

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAuth } from "./lib/auth";
import nodeDatasSchema from "./schemas_and_validators/nodeDatasSchema";

export const create = mutation({
  args: nodeDatasSchema,
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const nodeDataId = await ctx.db.insert("nodeDatas", {
      ...args,
    });

    return nodeDataId;
  },
});

export const listNodeDatasFromIds = query({
  args: { nodeDataIds: v.array(v.id("nodeDatas")) },
  handler: async (ctx, { nodeDataIds }) => {
    await requireAuth(ctx);
    console.log("Fetching nodeDatas for IDs:", nodeDataIds);

    // Créer les promises pour chaque nodeDataId
    // const nodeDataPromises = nodeDataIds.map((id) =>
    //   ctx.db.get("nodeDatas", id),
    // );

    // const nodeDatas = await Promise.all(nodeDataPromises);

    const nodeDatas = await ctx.db.query("nodeDatas").collect();

    return nodeDatas;
  },
});

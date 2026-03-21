import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

type FloatingTextLevel = "h1" | "h2" | "h3" | "p";

function normalizeFloatingTextLevel(level: unknown): FloatingTextLevel {
	if (level === "h1" || level === "h2" || level === "h3" || level === "p") {
		return level;
	}
	return "p";
}

export const migrateFloatingTextToNodeData = internalMutation({
	args: {
		dryRun: v.optional(v.boolean()),
	},
	returns: v.object({
		dryRun: v.boolean(),
		canvasesScanned: v.number(),
		canvasesUpdated: v.number(),
		floatingTextNodesFound: v.number(),
		nodeDatasCreated: v.number(),
		nodesAlreadyMigrated: v.number(),
	}),
	handler: async (ctx, { dryRun }) => {
		const isDryRun = dryRun ?? true;
		const canvases = await ctx.db.query("canvases").collect();

		let canvasesUpdated = 0;
		let floatingTextNodesFound = 0;
		let nodeDatasCreated = 0;
		let nodesAlreadyMigrated = 0;

		for (const canvas of canvases) {
			const nodes = canvas.nodes ?? [];
			let canvasChanged = false;

			const nextNodes = await Promise.all(
				nodes.map(async (node) => {
					if (node.type !== "floatingText") return node;

					floatingTextNodesFound += 1;

					if (node.nodeDataId) {
						nodesAlreadyMigrated += 1;
						return node;
					}

					const rawData = node.data ?? {};
					const text = typeof rawData.text === "string" ? rawData.text : "";
					const level = normalizeFloatingTextLevel(rawData.level);

					let nodeDataId = node.nodeDataId;

					if (!isDryRun) {
						nodeDataId = await ctx.db.insert("nodeDatas", {
							type: "floatingText",
							values: {
								text,
								level,
							},
							updatedAt: Date.now(),
						});
						nodeDatasCreated += 1;
					}

					const { text: _text, level: _level, ...remainingData } = rawData;
					const hasRemainingData = Object.keys(remainingData).length > 0;

					canvasChanged = true;
					return {
						...node,
						...(nodeDataId ? { nodeDataId } : {}),
						...(hasRemainingData ? { data: remainingData } : { data: undefined }),
					};
				}),
			);

			if (!isDryRun && canvasChanged) {
				await ctx.db.patch(canvas._id, {
					nodes: nextNodes,
					updatedAt: Date.now(),
				});
				canvasesUpdated += 1;
			}
		}

		return {
			dryRun: isDryRun,
			canvasesScanned: canvases.length,
			canvasesUpdated,
			floatingTextNodesFound,
			nodeDatasCreated,
			nodesAlreadyMigrated,
		};
	},
});

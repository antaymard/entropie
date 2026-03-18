import { createThread } from "@convex-dev/agent";
import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { components, internal } from "../../_generated/api";
import { Doc } from "../../_generated/dataModel";
import { plateJsonToMarkdown } from "../helpers/plateMarkdownConverter";
import { createAbstractorAgent } from "../agents";

const abstractorAgent = createAbstractorAgent();

export const abstractNodeData = internalAction({
  args: { nodeDataId: v.id("nodeDatas") },
  returns: v.string(),
  handler: async (ctx, args): Promise<string> => {
    console.log(`Starting abstraction for nodeDataId: ${args.nodeDataId}`);

    const nodeData: Doc<"nodeDatas"> | null = await ctx.runQuery(
      internal.ia.abstractor.helpers.readNodeData,
      {
        nodeDataId: args.nodeDataId,
      },
    );

    if (!nodeData) {
      throw new Error("Node data not found");
    }

    // Transform the content of the nodeData into a format that can be easily ingested by the model, depending on its type
    if (nodeData.type === "document") {
      const doc = nodeData.values.doc;
      if (Array.isArray(doc)) {
        return plateJsonToMarkdown(doc);
      }
      nodeData.values.doc = typeof doc === "string" ? doc : JSON.stringify(doc);
    }

    const threadId = await createThread(ctx, components.agent);
    const response = await abstractorAgent.generateText(
      ctx,
      { threadId },
      {
        prompt: JSON.stringify(nodeData),
      },
    );

    await ctx.runMutation(
      internal.ia.abstractor.helpers.updateAbstractAndRemoveJob,
      {
        nodeDataId: args.nodeDataId,
        aiAbstract: response.text,
      },
    );

    console.log(`Abstraction completed for nodeDataId: ${args.nodeDataId}`);

    return response.text;
  },
});

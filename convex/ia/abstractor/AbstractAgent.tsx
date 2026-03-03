import { Agent, createThread } from "@convex-dev/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { components, internal } from "../../_generated/api";
import { Doc } from "../../_generated/dataModel";
import { openWebPageTool } from "../tools/openWebPageTool";
import { readPdfTool } from "../tools/readPdfTool";
import { viewImageTool } from "../tools/viewImageTool";
import { plateJsonToMarkdown } from "../helpers/plateMarkdownConverter";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

const abstractorAgent = new Agent(components.agent, {
  name: "abstractor",
  maxSteps: 5,
  languageModel: openrouter.chat("nvidia/nemotron-3-nano-30b-a3b:free"),
  tools: {
    open_web_page: openWebPageTool,
    read_pdf: readPdfTool,
    view_image: viewImageTool,
  },
  instructions:
    "You are a concise summarizer. Extract the relevant information and provide a summary that can be used by an agent to understand the content and context of a node. Focus on key details such as the main topic, any important entities mentioned, and the overall purpose of the node. If the node is a url, extract the main content of the page. If it's a pdf, extract the main insights. If it's an image, describe its content. Be concise and factual. The abstract will be used by an agent to understand the content and context of a node, so include information that would be relevant for that purpose. !! The length of the summary should ideally be between 50 and 150 words. !! No formatting, and no title. Only the abstract in plain text.",
});

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

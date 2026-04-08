import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { generateText } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { makeNodeDataLLMFriendly } from "./makeNodeDataLLMFriendly";

export const generate = internalAction({
  args: { nodeDataId: v.id("nodeDatas") },
  returns: v.null(),
  handler: async (ctx, { nodeDataId }) => {
    // 1. Lire le nodeData
    const nodeData = await ctx.runQuery(
      internal.wrappers.nodeDataWrappers.readNodeData,
      { _id: nodeDataId },
    );
    const nodeType = nodeData?.type ?? "unknown";

    // 2. Générer le contexte markdown
    const llmFriendlyContent = makeNodeDataLLMFriendly(nodeData);

    // 3. Récupérer le one-liner existant (si présent)
    const existingOneLiner = await ctx.runQuery(
      internal.wrappers.memoryWrappers.read,
      { subjectId: nodeDataId, type: "one-liner" },
    );

    // If the one-liner is newer than the nodeData, we can skip regeneration.
    if (
      existingOneLiner &&
      existingOneLiner.updatedAt > (nodeData?.updatedAt ?? 0)
    ) {
      return null;
    }
    console.log("🚧 Generating one-liner for nodeDataId:", nodeDataId);

    const previousOneLinerContext = existingOneLiner
      ? `\nOne-liner précédent :\n${existingOneLiner.content}\n`
      : "";

    // 4. Appel LLM one-shot
    const { text } = await generateText({
      model: openrouter("mistralai/mistral-small-2603"),
      prompt: `Summarize the following content into a one-liner. Do not fabricate information. Be factual and synthetic.

      Here is the current one-liner of the content (if applicable):
      ${previousOneLinerContext}

      Here is the full content to summarize:
      ${llmFriendlyContent}

      The content may not have been modified since the last one-liner generation. If the content has not been modified, you can respond with a more concise reformulation of the previous one-liner or with the same one-liner if you consider it already optimal.

      <guidelines for summarization>
      ${getGuidelinesFromNodeType(nodeType)}
      </guidelines for summarization>

      <examples of outputs>
      ${getExamplesFromNodeType(nodeType)}
      </examples of outputs>
`,
    });

    // 5. Persister le one-liner via memory
    await ctx.runMutation(internal.wrappers.memoryWrappers.upsert, {
      subjectType: "nodeData",
      subjectId: nodeDataId,
      type: "one-liner",
      content: text,
      canvasId: nodeData?.canvasId,
    });

    console.log("✅ Generated one-liner for nodeDataId:", nodeDataId);

    return null;
  },
});

export const generateMany = internalAction({
  args: { nodeDataIds: v.array(v.id("nodeDatas")) },
  returns: v.null(),
  handler: async (ctx, { nodeDataIds }) => {
    await Promise.all(
      nodeDataIds.map((nodeDataId) =>
        ctx.runAction(internal.ia.helpers.oneLinerGenerator.generate, {
          nodeDataId,
        }),
      ),
    );
    return null;
  },
});

function getExamplesFromNodeType(nodeType: string): string {
  const examplesByType: Record<string, string> = {
    text: `- The document (h1 as title, or generate one) contains a meeting note about the project timeline and deliverables.`,
    image: `- The image (imageUrl) represents a chart showing the sales growth of the company over the last quarter.`,
    link: `- The link (https://example.com | pageTitle) leads to a research paper discussing the impact of climate change on polar bear populations.`,
    value: `- The value ($value + $unit) is a numerical representation of the average customer satisfaction score for the month of June.`,
    file: `- The file (fileName.pdf) is a financial report detailing the quarterly earnings and expenses of the company.`,
    floatingText: `For floatingtext, return the text if short (< 100 chars) or a concise summary if long (e.g. "a long note about project updates").`,
    embed: `- An embed of a YouTube video entitled "10 signs of a healthy relationship".`,
    table: `- The table contains $nb rows of team members, their roles, and contact information`,
  };
  return (
    examplesByType[nodeType] || `- No specific example available for this type.`
  );
}
function getGuidelinesFromNodeType(nodeType: string): string {
  const guidelinesByType: Record<string, string> = {
    text: `The document is passed to you as markdown. Read it and summarize it in one line.`,
    image: `The image is passed to you. First, describe objectively what the image represents (without interpretation). Then, if possible, summarize it in one line. If the image is a diagram or chart, focus on the key insights it conveys rather than describing every element.`,
    link: `The link is passed to you with its URL and page title. First, go to the site using the URL and read its content. Then, describe objectively what the page represents (without interpretation). Finally, summarize it in one line.`,
    value: `The value is passed to you. First, describe objectively what the value represents (without interpretation). Then, if possible, summarize it in one line.`,
    file: `The file is passed to you. First, describe objectively what the file represents (without interpretation). Then, if possible, summarize it in one line.`,
    floatingText: `For floatingtext, return the text if short (< 100 chars) or a concise summary if long (e.g. "a long note about project updates").`,
    embed: `The embed is passed to you. First, describe objectively what the embed represents (without interpretation). Then, if possible, summarize it in one line.`,
    table: `The table is passed to you in a tanstack-table compatible format. Use the columns names to understand the structure. Check how many rows are already in the table. Don't hallucinate the purpose of the table, just describe it objectively, even if it does not make sense to you.`,
  };
  return (
    guidelinesByType[nodeType] ||
    `- No specific guideline available for this type.`
  );
}

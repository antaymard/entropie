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

    // 2. Générer le contexte markdown
    const llmFriendlyContent = makeNodeDataLLMFriendly(nodeData);

    // 3. Récupérer l'abstract existant (si présent)
    const existingMemory = await ctx.runQuery(
      internal.wrappers.aiMemoryWrappers.read,
      { subjectId: nodeDataId, memoryType: "abstract" },
    );

    // If abstract.updateAt is newer thant nodeData.updatedAt, we can skip regeneration
    if (
      existingMemory &&
      existingMemory.updatedAt > (nodeData?.updatedAt ?? 0)
    ) {
      return null;
    }
    console.log("🚧 Generating abstract for nodeDataId:", nodeDataId);

    const previousAbstractContext = existingMemory
      ? `\nAbstract précédent :\n${existingMemory.content}\n`
      : "";

    // 4. Appel LLM one-shot
    const { text } = await generateText({
      model: openrouter("mistralai/mistral-small-2603"),
      prompt: `Résume le contenu suivant en un abstract concis.
Ne fabrique pas d'information. Sois factuel et synthétique.
${previousAbstractContext}
Contenu :
${llmFriendlyContent}`,
    });

    // 5. Persister l'abstract via aiMemory
    await ctx.runMutation(internal.wrappers.aiMemoryWrappers.upsert, {
      subjectType: "nodeData",
      subjectId: nodeDataId,
      memoryType: "abstract",
      content: text,
    });

    console.log("✅ Generated abstract for nodeDataId:", nodeDataId);

    return null;
  },
});

export const generateMany = internalAction({
  args: { nodeDataIds: v.array(v.id("nodeDatas")) },
  returns: v.null(),
  handler: async (ctx, { nodeDataIds }) => {
    await Promise.all(
      nodeDataIds.map((nodeDataId) =>
        ctx.runAction(internal.ia.helpers.abstractGenerator.generate, {
          nodeDataId,
        }),
      ),
    );
    return null;
  },
});

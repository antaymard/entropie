import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { createAutomationAgent } from "./automation/automationAgent";
import { createThread } from "@convex-dev/agent";
import { requireAuth } from "./lib/auth";
import { nodeDataConfig } from "./schemas_and_validators/nodeDataConfig";
import updateNodeDataValuesTool from "./ia/tools/updateNodeDataValuesTool";

export const trigger = action({
  args: {
    nodeDataId: v.id("nodeDatas"),
  },
  handler: async (ctx, { nodeDataId }) => {
    try {
      console.log("Automation triggered");
      const userId = await requireAuth(ctx);

      const currentNodeData = await ctx.runQuery(
        internal.automation.helpers.readNodeData,
        { _id: nodeDataId },
      );

      // 1. Passer le statut en working
      await ctx.runMutation(internal.automation.helpers.updateStatus, {
        _id: nodeDataId,
        status: "working",
      });

      // 2. Charger les nodeData input du noeud courant
      const inputNodeDatas = await ctx.runQuery(
        internal.automation.helpers.listNodeDataDependencies,
        {
          nodeDataId,
          type: "input",
        },
      );

      const inputSchema = nodeDataConfig.find(
        (ndc) => ndc.type === currentNodeData.type,
      )?.toolInputSchema;
      if (!inputSchema) {
        throw new ConvexError(
          "Schéma d'entrée non trouvé pour le type de nodeData.",
        );
      }

      // 3. Exécuter l'agent associé au noeud courant
      const automationAgent = createAutomationAgent({
        updateNodeDataValuesTool: updateNodeDataValuesTool({
          ctx,
          nodeData: currentNodeData,
          inputSchema,
        }),
      });
      const threadId = await createThread(ctx, components.agent, {
        userId,
      });
      const response = await automationAgent.generateText(
        { ...ctx, currentNodeData } as any,
        { threadId },
        {
          prompt: `Voici les données d'entrée disponibles pour le noeud actuel : ${inputNodeDatas
            .map(
              (nd) =>
                `\n- NodeData ID: ${nd._id}, Type: ${nd.type}, Values: ${JSON.stringify(nd.values)}`,
            )
            .join("")}  
          ${currentNodeData?.agent?.instructions}`,
        },
      );

      console.log("Agent response:", response.text);

      // 5. Repasser le statut en idle
      await ctx.runMutation(internal.automation.helpers.updateStatus, {
        _id: nodeDataId,
        status: "idle",
      });

      // X. Lancer les automations des noeuds suivants (à implémenter)
    } catch (error) {
      console.error(
        "Erreur lors du déclenchement de l'automatisation :",
        error,
      );
      // En cas d'erreur, passer le statut en error
      await ctx.runMutation(internal.automation.helpers.updateStatus, {
        _id: nodeDataId,
        status: "error",
      });
    }
  },
});

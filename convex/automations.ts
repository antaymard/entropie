import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { createAutomationAgent } from "./automation/automationAgent";
import { createThread } from "@convex-dev/agent";
import { requireAuth } from "./lib/auth";
import { nodeDataConfig } from "./schemas/nodeDataConfig";
import updateNodeDataValuesTool from "./ia/tools/updateNodeDataValuesTool";
import {
  generateInputNodesContext,
  generateNodeContext,
} from "./ia/helpers/contextGenerator";
import { createProgressReporter } from "./automation/progressReporter";

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

      // 1. Passer le statut en working et initialiser les infos d'automationProgress
      const reportProgress = createProgressReporter(ctx, nodeDataId);
      await ctx.runMutation(internal.automation.helpers.updateStatus, {
        _id: nodeDataId,
        status: "working",
      });
      await reportProgress({
        stepType: "automation_started",
      });

      // 2. Charger les nodeData input du noeud courant
      const inputNodeDatas = await ctx.runQuery(
        internal.automation.helpers.listNodeDataDependencies,
        {
          nodeDataId,
          type: "input",
        },
      );

      // Get the toolInputSchema for the current nodeData type,
      // for the model to know how to use the updateNodeDataValuesTool
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
          reportProgress,
        }),
      });
      const threadId = await createThread(ctx, components.agent, {
        userId,
      });
      const response = await automationAgent.generateText(
        { ...ctx, currentNodeData, reportProgress } as any,
        { threadId },
        {
          prompt: `Voici les données d'entrée disponibles pour le noeud actuel :
${generateInputNodesContext(inputNodeDatas)}

          Voici les données actuelles du noeud (saisies par l'utilisateur, ou par toi lors d'une exécution précédente) :
${generateNodeContext(currentNodeData)}
          Si c'est pertinent, garde ces données à l'esprit pour produire ta réponse (structure, format, contraintes). Si les résultats de ton travail sont très différents, privilégie la qualité de ta réponse plutôt que la conformité aux données précédentes.

          ------

          Instructions de l'utilisateur pour ce noeud :
          ${currentNodeData?.agent?.instructions}`,
        },
      );

      console.log("Agent response:", response.text);

      // 5. Repasser le statut en idle
      await ctx.runMutation(internal.automation.helpers.updateStatus, {
        _id: nodeDataId,
        status: "idle",
      });
      await reportProgress({
        stepType: "automation_finished",
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

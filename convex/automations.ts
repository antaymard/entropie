import { ConvexError, v } from "convex/values";
import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { createAutomationAgent } from "./automation/automationAgent";
import { createThread } from "@convex-dev/agent";
import { requireAuth } from "./lib/auth";

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

      // 3. Exécuter l'agent associé au noeud courant
      const automationAgent = createAutomationAgent();
      const threadId = await createThread(ctx, components.agent, {
        userId,
      });
      const response = await automationAgent.generateText(
        ctx,
        { threadId },
        {
          prompt: "Peux tu faire une recherche sur les actus de tibo inshape ?",
          toolChoice: "required",
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

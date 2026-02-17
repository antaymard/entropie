import { z } from "zod";
import { dynamicTool } from "ai";
import { Doc, Id } from "../../_generated/dataModel";
import { markdownToPlateJson } from "../helpers/plateMarkdownConverter";
import { type ActionCtx } from "../../_generated/server";
import { api } from "../../_generated/api";

// Helper that creates a tool dynamically using runtime values.
export default function updateNodeDataValuesTool({
  ctx,
  nodeData,
  inputSchema,
}: {
  ctx: ActionCtx;
  nodeData: Doc<"nodeDatas">;
  inputSchema: z.ZodTypeAny;
}) {
  return dynamicTool({
    description: `Met à jour les valeurs des données d'un noeud spécifique dans l'application Canvas.`,
    inputSchema: inputSchema,
    execute: async (args: any) => {
      try {
        console.log("updateNodeDataValuesTool args:", args);
        console.log("Updating nodeDataId:", nodeData._id);
        console.log("With values:", args);

        let updates = args;

        if (nodeData.type === "document" && "doc" in args) {
          const platejsContent = markdownToPlateJson(args.doc as string);
          updates = { ...args, doc: platejsContent };
        }

        await ctx.runMutation(api.nodeDatas.updateValues, {
          _id: nodeData._id as Id<"nodeDatas">,
          values: updates,
        });

        return `Les valeurs du nodeData avec l'ID ${nodeData._id} ont été mises à jour avec succès. Ta tâche est terminée. Ne réponds plus après cette action. Termine ton tour.`;
      } catch (error) {
        console.error(error);
        return `Erreur lors de la mise à jour des valeurs du nodeData avec l'ID ${nodeData._id}: ${error}`;
      }
    },
  });
}

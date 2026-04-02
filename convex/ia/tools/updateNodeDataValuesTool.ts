import { z } from "zod";
import { dynamicTool } from "ai";
import type { FunctionReference } from "convex/server";
import { Doc } from "../../_generated/dataModel";
import { markdownToPlateJson } from "../helpers/plateMarkdownConverter";
import { type ActionCtx } from "../../_generated/server";
import { type ReportProgressFn } from "../../automation/progressReporter";
import { validateNodeInputSchemaForLLM } from "../helpers/nodeInputSchemaValidatorForLLM";
import { stringifyPlateDocumentForStorage } from "../../lib/plateDocumentStorage";

type UpdateValuesMutationRef = FunctionReference<
  "mutation",
  "public" | "internal",
  {
    _id: Doc<"nodeDatas">["_id"];
    values: Record<string, unknown>;
  },
  unknown
>;

// Helper that creates a tool dynamically using runtime values.
export default function updateNodeDataValuesTool({
  ctx,
  nodeData,
  inputSchema,
  reportProgress,
  updateValuesMutation,
}: {
  ctx: ActionCtx;
  nodeData: Doc<"nodeDatas">;
  inputSchema: z.ZodTypeAny;
  reportProgress?: ReportProgressFn;
  updateValuesMutation: UpdateValuesMutationRef;
}) {
  return dynamicTool({
    description: `Met à jour les valeurs des données d'un noeud spécifique dans l'application Canvas.`,
    inputSchema: inputSchema,
    execute: async (args) => {
      try {
        await reportProgress?.({
          stepType: "tool_launched=update_node_data_values",
        });

        console.log("updateNodeDataValuesTool args:", args);

        const rawArgs =
          typeof args === "object" && args !== null
            ? (args as Record<string, unknown>)
            : {};

        const validationError = validateNodeInputSchemaForLLM({
          nodeType: nodeData.type,
          input: rawArgs,
        });
        if (validationError) {
          return validationError;
        }

        let updates: Record<string, unknown> = rawArgs;

        if (nodeData.type === "document" && typeof rawArgs.doc === "string") {
          const platejsContent = markdownToPlateJson(rawArgs.doc);
          updates = {
            ...rawArgs,
            doc: stringifyPlateDocumentForStorage(platejsContent),
          };
        }

        await ctx.runMutation(updateValuesMutation, {
          _id: nodeData._id,
          values: updates,
        });

        await reportProgress?.({
          stepType: "tool_completed=update_node_data_values",
          data: {},
        });

        return `Les valeurs du nodeData avec l'ID ${nodeData._id} ont été mises à jour avec succès. Ta tâche est terminée. Ne réponds plus après cette action. Termine ton tour.`;
      } catch (error) {
        console.error(error);
        return `Erreur lors de la mise à jour des valeurs du nodeData avec l'ID ${nodeData._id}: ${error}`;
      }
    },
  });
}

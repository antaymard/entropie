import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import type { Id } from "../../_generated/dataModel";
import { internal } from "../../_generated/api";
import {
  markdownToPlateJson,
  plateJsonToMarkdown,
} from "../helpers/plateMarkdownConverter";
import {
  parseStoredPlateDocument,
  stringifyPlateDocumentForStorage,
} from "../../lib/plateDocumentStorage";

const ERROR_TARGET_NOT_DOCUMENT = "Error: Target node must be a document.";
const ERROR_INVALID_PLATE_DOC =
  "Error: Document content is not valid PlateJSON.";

function countExactMatches(source: string, search: string): number {
  if (!search) return 0;

  let count = 0;
  let index = 0;

  while (true) {
    const foundAt = source.indexOf(search, index);
    if (foundAt === -1) break;
    count += 1;
    index = foundAt + search.length;
  }

  return count;
}

export default function stringReplaceDocumentContentTool({
  canvasId,
}: {
  canvasId: Id<"canvases">;
}) {
  return createTool({
    description:
      "Replace an exact string inside a document node content from the current canvas.",
    args: z.object({
      nodeId: z.string().describe("The node ID in the current canvas."),
      old_string: z
        .string()
        .min(1)
        .describe(
          "Exact string to replace. Provide just enough context to make it unique in the document. Include the exact original markdown formatting and whitespace. ",
        ),
      new_str: z
        .string()
        .describe(
          "The replacement string to paste in place of old_string. Can be empty if you just want to delete the old_string. Use markdown formatting.",
        ),
      explanation: z.string().describe("3-5 words explaining the edit intent."),
    }),
    handler: async (ctx, args): Promise<string> => {
      console.log(
        `📝 String replace requested on node ${args.nodeId} - old_string: "${args.old_string}", new_str: "${args.new_str}"`,
      );

      try {
        const { nodeId, old_string, new_str } = args;

        const { node, nodeData } = await ctx.runQuery(
          internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
          {
            canvasId,
            nodeId,
          },
        );

        if (node.type !== "document" || nodeData.type !== "document") {
          return ERROR_TARGET_NOT_DOCUMENT;
        }

        const storedDoc = nodeData.values.doc;
        const parsedDoc = parseStoredPlateDocument(storedDoc);
        if (!parsedDoc) {
          return ERROR_INVALID_PLATE_DOC;
        }

        const markdownSource = plateJsonToMarkdown(parsedDoc);

        const matches = countExactMatches(markdownSource, old_string);
        console.log(
          `🔎 Replacement search found ${matches} match(es) for node ${nodeId}`,
        );

        if (matches === 0) {
          return "Error: No match found for replacement. Please check your text and try again.";
        }

        if (matches > 1) {
          return `Error: Found ${matches} matches for replacement text. Please provide more context to make a unique match.`;
        }

        const updatedMarkdown = markdownSource.replace(old_string, new_str);

        const updatedPlateDocument = markdownToPlateJson(updatedMarkdown);
        const serializedUpdatedDocument =
          stringifyPlateDocumentForStorage(updatedPlateDocument);

        await ctx.runMutation(internal.wrappers.nodeDataWrappers.updateValues, {
          _id: nodeData._id,
          values: {
            ...nodeData.values,
            doc: serializedUpdatedDocument,
          },
        });

        console.log(`✅ String replace complete for node ${nodeId}`);

        return "Successfully replaced text at exactly one location.";
      } catch (error) {
        console.error("String replace tool error:", error);
        return `Error: ${error instanceof Error ? error.message : String(error)}`;
      }
    },
  });
}

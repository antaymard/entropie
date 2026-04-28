import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";
import { getNodeDataTitle } from "../../lib/getNodeDataTitle";
import { escapeXmlText, toXmlCdata } from "../../lib/xml";
import { makeNodeDataLLMFriendly } from "../helpers/makeNodeDataLLMFriendly";
import {
  buildPdfPagesMarkdown,
  buildPdfTocMarkdown,
} from "../helpers/pdfChunkFormatters";
import type { PdfPageChunk } from "../../models/searchableChunkModels";
import { toolAgentNames, type ThreadCtx } from "../agentConfig";
import { nodeDataConfig } from "../../config/nodeConfig";
import { type ToolConfig, toolError } from "./toolHelpers";

const PDF_HINTS = {
  toc: "Call read_nodes with pdfPages=[{nodeId, pages:[…]}] to read full markdown of specific pages.",
  notIndexed:
    "PDF content not yet indexed (Mistral OCR pending or failed). Files are listed above; retry later.",
  noHeadings:
    "No headings detected in OCR output. Use pdfPages to read pages directly by 1-based page number.",
  truncated:
    "Output truncated: too many pages or characters requested. Re-call with fewer pages.",
  notAPdf: "pdfPages was provided for a non-pdf node and was ignored.",
} as const;

type PdfFile = { url?: string; filename?: string; mimeType?: string };

function renderPdfFiles(files: PdfFile[]): string {
  if (files.length === 0) {
    return "<pdfFiles />";
  }
  const lines = files.map((f) => {
    const filename = f.filename ?? "(no filename)";
    const mimeType = f.mimeType ?? "(no mime type)";
    const url = f.url ?? "";
    return `- ${filename} | ${mimeType} | ${url}`;
  });
  return `<pdfFiles>\n${lines.join("\n")}\n</pdfFiles>`;
}

function renderPdfTocBlock(pageChunks: PdfPageChunk[]): string {
  const toc = buildPdfTocMarkdown(pageChunks);
  const inner = toc.structured
    ? `\n${toXmlCdata(toc.markdown)}\n`
    : escapeXmlText(PDF_HINTS.noHeadings);
  return [
    `<pdfToc totalPages="${toc.totalPages}" structured="${toc.structured}">${inner}</pdfToc>`,
    `<pdfHint>${escapeXmlText(PDF_HINTS.toc)}</pdfHint>`,
  ].join("\n");
}

function renderPdfPagesBlock(
  pageChunks: PdfPageChunk[],
  requestedPages: number[],
): string {
  const result = buildPdfPagesMarkdown(pageChunks, requestedPages);
  const pagesXml = result.pages
    .map((p) => {
      if ("error" in p) {
        return `<pdfPage n="${p.n}" error="page not found" />`;
      }
      const totalAttr =
        typeof p.totalPages === "number" ? ` totalPages="${p.totalPages}"` : "";
      return `<pdfPage n="${p.n}"${totalAttr}>\n${toXmlCdata(p.markdown)}\n</pdfPage>`;
    })
    .join("\n");
  const truncatedHint = result.truncated
    ? `\n<pdfHint>${escapeXmlText(PDF_HINTS.truncated)}</pdfHint>`
    : "";
  return `${pagesXml}${truncatedHint}`;
}

function buildPdfNodeBody(opts: {
  files: PdfFile[];
  pageChunks: PdfPageChunk[];
  requestedPages: number[] | undefined;
}): string {
  const filesXml = renderPdfFiles(opts.files);

  if (opts.pageChunks.length === 0) {
    return `${filesXml}\n<pdfStatus>${escapeXmlText(PDF_HINTS.notIndexed)}</pdfStatus>`;
  }

  if (!opts.requestedPages) {
    return `${filesXml}\n${renderPdfTocBlock(opts.pageChunks)}`;
  }

  return `${filesXml}\n${renderPdfPagesBlock(opts.pageChunks, opts.requestedPages)}`;
}

function getPdfTotalPages(pageChunks: PdfPageChunk[]): number | undefined {
  for (const chunk of pageChunks) {
    if (typeof chunk.totalPages === "number") return chunk.totalPages;
  }
  return undefined;
}

export const readNodesToolConfig: ToolConfig = {
  name: "read_nodes",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
    toolAgentNames.worker,
  ],
};

function getExpectedNodeDataSchemaString(nodeType: string): string | null {
  if (nodeType === "document" || nodeType === "table") {
    return null;
  }

  const config = nodeDataConfig.find((item) => item.type === nodeType);
  if (!config) {
    return null;
  }

  const schema = config.toolInputSchema ?? config.dataValuesSchema;

  try {
    const zodWithJson = z as unknown as {
      toJSONSchema?: (input: z.ZodTypeAny) => unknown;
    };

    if (typeof zodWithJson.toJSONSchema === "function") {
      return JSON.stringify(zodWithJson.toJSONSchema(schema), null, 2);
    }
  } catch {
    // Ignore serialization failures and fallback below.
  }

  return "Schema JSON serialization is unavailable.";
}

// is v1.0
export default function readNodesTool({ threadCtx }: { threadCtx: ThreadCtx }) {
  const { canvasId } = threadCtx;

  return createTool({
    description:
      "A tool to read multiple nodes from the current canvas and return their nodeData as LLM-friendly XML. " +
      "For pdf nodes, by default returns a paginated table of contents in markdown ('# Heading [pageNumber]') along with the total page count. " +
      "Pass `pdfPages=[{nodeId, pages:[…]}]` to read the full OCR markdown of specific 1-based pages instead. " +
      "PDF chunks come from cached Mistral OCR; nodes not yet indexed are flagged.",
    inputSchema: z.object({
      nodeIds: z
        .array(z.string())
        .min(1)
        .describe("The list of node IDs to read"),
      withPosition: z
        .boolean()
        .optional()
        .describe(
          "Whether to include x/y position and dimensions attributes in each node tag",
        ),
      pdfPages: z
        .array(
          z.object({
            nodeId: z.string(),
            pages: z.array(z.number().int().positive()).min(1),
          }),
        )
        .optional()
        .describe(
          "For pdf nodes only: request specific 1-based page numbers per nodeId. " +
            "If omitted, the pdf returns its paginated table of contents and a hint.",
        ),
    }),
    execute: async (ctx, input): Promise<string> => {
      console.log(
        `🖼️ Reading ${input.nodeIds.length} node(s) from canvas ${canvasId}`,
      );

      try {
        const withPosition = input.withPosition ?? true;
        const { nodes: canvasNodes, edges: canvasEdges } = await ctx.runQuery(
          internal.wrappers.canvasNodeWrappers.getCanvasNodesAndEdges,
          {
            canvasId: canvasId as Id<"canvases">,
          },
        );

        const canvasNodeTypeById = new Map(
          canvasNodes.map((node) => [node.id, node.type]),
        );

        const requestedNodeIdSet = new Set(input.nodeIds);

        const pdfPagesByNodeId = new Map<string, number[]>();
        for (const entry of input.pdfPages ?? []) {
          pdfPagesByNodeId.set(entry.nodeId, entry.pages);
        }

        const nodes = await Promise.all(
          input.nodeIds.map(async (nodeId) => {
            try {
              const { node, nodeData } = await ctx.runQuery(
                internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
                {
                  canvasId: canvasId as Id<"canvases">,
                  nodeId,
                },
              );

              const embed =
                node.type === "embed" &&
                typeof nodeData.values.embed === "object" &&
                nodeData.values.embed !== null
                  ? (nodeData.values.embed as {
                      url?: unknown;
                      embedUrl?: unknown;
                      type?: unknown;
                    })
                  : null;

              let content = makeNodeDataLLMFriendly(nodeData);
              let pdfBody: string | null = null;
              let pdfTotalPages: number | null = null;

              if (node.type === "pdf") {
                const files =
                  (nodeData.values.files as PdfFile[] | undefined) ?? [];
                const pageChunks = await ctx.runQuery(
                  internal.wrappers.searchableChunkWrappers
                    .listPdfPagesByNodeDataId,
                  { nodeDataId: nodeData._id },
                );
                const requestedPages = pdfPagesByNodeId.get(nodeId);
                pdfBody = buildPdfNodeBody({
                  files,
                  pageChunks,
                  requestedPages,
                });
                pdfTotalPages = getPdfTotalPages(pageChunks) ?? null;
              } else if (pdfPagesByNodeId.has(nodeId)) {
                content = `<warning>${escapeXmlText(PDF_HINTS.notAPdf)}</warning>\n${content}`;
              }

              return {
                nodeId,
                nodeType: node.type,
                positionX: Math.trunc(node.position.x),
                positionY: Math.trunc(node.position.y),
                width:
                  typeof node.width === "number"
                    ? Math.trunc(node.width)
                    : null,
                height:
                  typeof node.height === "number"
                    ? Math.trunc(node.height)
                    : null,
                title: getNodeDataTitle(nodeData),
                content,
                pdfBody,
                pdfTotalPages,
                embedUrl:
                  typeof embed?.url === "string" && embed.url.length > 0
                    ? embed.url
                    : null,
                embedIframeUrl:
                  typeof embed?.embedUrl === "string" &&
                  embed.embedUrl.length > 0
                    ? embed.embedUrl
                    : null,
                embedType:
                  typeof embed?.type === "string" && embed.type.length > 0
                    ? embed.type
                    : null,
                error: null as string | null,
              };
            } catch (error) {
              return {
                nodeId,
                nodeType: canvasNodeTypeById.get(nodeId) ?? "unknown",
                positionX: null as number | null,
                positionY: null as number | null,
                width: null as number | null,
                height: null as number | null,
                title: "Untitled",
                content: "",
                pdfBody: null as string | null,
                pdfTotalPages: null as number | null,
                embedUrl: null as string | null,
                embedIframeUrl: null as string | null,
                embedType: null as string | null,
                error:
                  error instanceof Error
                    ? error.message
                    : "Unknown node read error",
              };
            }
          }),
        );

        const nodeInfoById = new Map<string, { type: string; title: string }>(
          nodes.map((node) => [
            node.nodeId,
            {
              type: node.nodeType,
              title: node.title,
            },
          ]),
        );

        const connectedNodeIdsToFetch = new Set<string>();
        for (const edge of canvasEdges) {
          if (requestedNodeIdSet.has(edge.source)) {
            connectedNodeIdsToFetch.add(edge.target);
          }
          if (requestedNodeIdSet.has(edge.target)) {
            connectedNodeIdsToFetch.add(edge.source);
          }
        }

        const missingNodeIds = [...connectedNodeIdsToFetch].filter(
          (nodeId) => !nodeInfoById.has(nodeId),
        );

        await Promise.all(
          missingNodeIds.map(async (nodeId) => {
            const fallbackType = canvasNodeTypeById.get(nodeId) ?? "unknown";

            try {
              const { nodeData } = await ctx.runQuery(
                internal.wrappers.canvasNodeWrappers.getNodeWithNodeData,
                {
                  canvasId: canvasId as Id<"canvases">,
                  nodeId,
                },
              );

              nodeInfoById.set(nodeId, {
                type: fallbackType,
                title: getNodeDataTitle(nodeData),
              });
            } catch {
              nodeInfoById.set(nodeId, {
                type: fallbackType,
                title: "Untitled",
              });
            }
          }),
        );

        const formatConnection = (nodeId: string) => {
          const connectedNode = nodeInfoById.get(nodeId);
          const nodeType = connectedNode?.type ?? "unknown";
          const nodeTitle = connectedNode?.title ?? "Untitled";
          return `${nodeId} | ${nodeType} | ${nodeTitle}`;
        };

        const sourceNodesByNodeId = new Map<string, Array<string>>();
        const targetNodesByNodeId = new Map<string, Array<string>>();

        for (const edge of canvasEdges) {
          if (requestedNodeIdSet.has(edge.target)) {
            const values = sourceNodesByNodeId.get(edge.target) ?? [];
            values.push(formatConnection(edge.source));
            sourceNodesByNodeId.set(edge.target, values);
          }

          if (requestedNodeIdSet.has(edge.source)) {
            const values = targetNodesByNodeId.get(edge.source) ?? [];
            values.push(formatConnection(edge.target));
            targetNodesByNodeId.set(edge.source, values);
          }
        }

        const xml = [
          // One schema/tool descriptor per node type.
          // If multiple nodes share the same type, we expose it only once.
          // This keeps the output compact and avoids redundant instructions.
          ...(() => {
            const uniqueNodeTypes = [
              ...new Set(nodes.map((node) => node.nodeType)),
            ];

            return [
              "<nodes>",
              ...nodes.map(
                ({
                  nodeId,
                  nodeType,
                  positionX,
                  positionY,
                  width,
                  height,
                  title,
                  content,
                  pdfBody,
                  pdfTotalPages,
                  embedUrl,
                  embedIframeUrl,
                  embedType,
                  error,
                }) => {
                  const sourceNodes = sourceNodesByNodeId.get(nodeId) ?? [];
                  const targetNodes = targetNodesByNodeId.get(nodeId) ?? [];

                  const positionAttributes =
                    withPosition && positionX !== null && positionY !== null
                      ? `${` x="${String(positionX)}" y="${String(positionY)}"`}${width !== null ? ` width="${String(width)}"` : ""}${height !== null ? ` height="${String(height)}"` : ""}`
                      : "";

                  if (nodeType === "embed") {
                    return `<node id="${nodeId}" type="embed" title="${title}"${embedUrl ? ` url="${embedUrl}"` : ""}${embedIframeUrl ? ` embedUrl="${embedIframeUrl}"` : ""}${embedType ? ` embedType="${embedType}"` : ""}${error ? ` readError="${error}"` : ""}${positionAttributes} />`;
                  }

                  if (nodeType === "pdf" && pdfBody !== null) {
                    const totalPagesAttr =
                      pdfTotalPages !== null
                        ? ` totalPages="${pdfTotalPages}"`
                        : "";
                    return `<node id="${nodeId}" type="pdf" sourceNodes="${sourceNodes.join(" ; ")}" targetNodes="${targetNodes.join(" ; ")}"${positionAttributes} title="${title}"${totalPagesAttr}>
${error ? `<readError>${toXmlCdata(error)}</readError>\n` : ""}${pdfBody}
</node>`;
                  }

                  return `<node id="${nodeId}" type="${nodeType}" sourceNodes="${sourceNodes.join(" ; ")}" targetNodes="${targetNodes.join(" ; ")}"${positionAttributes} title="${title}">
    ${error ? `<readError>${toXmlCdata(error)}</readError>` : ""}
${toXmlCdata(content)}
</node>`;
                },
              ),
              "</nodes>",
              "<nodeDataSchemas>",
              ...uniqueNodeTypes.map((nodeType) => {
                if (nodeType === "document") {
                  return '<schema nodeType="document" edition_tools="insert_document_content,string_replace_document_content"></schema>';
                }

                if (nodeType === "table") {
                  return '<schema nodeType="table" edition_tools="table_update_schema,table_insert_rows,table_update_rows,table_delete_rows"></schema>';
                }

                const schema = getExpectedNodeDataSchemaString(nodeType);
                if (!schema) {
                  return `<schema nodeType="${nodeType}" edition_tool="set_node_data">Schema JSON serialization is unavailable.</schema>`;
                }

                return `<schema nodeType="${nodeType}" edition_tool="set_node_data">${toXmlCdata(schema)}</schema>`;
              }),
              "</nodeDataSchemas>",
            ];
          })(),
        ].join("\n");

        console.log("✅ Node read complete");
        return xml;
      } catch (error) {
        console.error("Read nodes error:", error);
        return toolError(
          `Failed to read nodes: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the IDs and try again.`,
        );
      }
    },
  });
}

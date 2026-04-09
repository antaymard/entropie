import type { CanvasNode } from "@/types";
import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import { getNodeDataTitle } from "@/components/utils/nodeDataDisplayUtils";
import type { Doc, Id } from "@/../convex/_generated/dataModel";

type ViewportState = {
  x: number;
  y: number;
  zoom: number;
};

type ViewportBounds = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

type MessageContextParams = {
  nodes: CanvasNode[];
  openedNodeIds: string[];
  attachedNodes: CanvasNode[];
  attachedPosition: { x: number; y: number } | null;
  viewport: ViewportState;
  viewportWidth: number;
  viewportHeight: number;
  getNodeTitle: (node: CanvasNode) => string;
  time?: Date;
};

type NodeDatasMap = Map<Id<"nodeDatas">, Doc<"nodeDatas">>;

export function getCanvasNodeTitle(
  node: CanvasNode,
  nodeDatas: NodeDatasMap,
): string {
  const nodeConfig = prebuiltNodesConfig.find(
    (config) => config.type === node.type,
  );
  const nodeDataId =
    node.nodeDataId ?? (node.data?.nodeDataId as Id<"nodeDatas"> | undefined);
  const nodeData = nodeDataId ? nodeDatas.get(nodeDataId) : undefined;

  return nodeData ? getNodeDataTitle(nodeData) : nodeConfig?.label || node.type;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function nodeToXml(
  node: CanvasNode,
  getNodeTitle: (node: CanvasNode) => string,
) {
  return `    <node id="${escapeXml(node.id)}" type="${escapeXml(node.type)}" title="${escapeXml(getNodeTitle(node))}" />`;
}

function formatTimeNaturalLanguage(time: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(time);
}

function getViewportBounds(
  viewport: ViewportState,
  viewportWidth: number,
  viewportHeight: number,
): ViewportBounds {
  const x1 = -viewport.x / viewport.zoom;
  const y1 = -viewport.y / viewport.zoom;
  const x2 = (viewportWidth - viewport.x) / viewport.zoom;
  const y2 = (viewportHeight - viewport.y) / viewport.zoom;

  return { x1, y1, x2, y2 };
}

function isNodeVisibleInBounds(
  node: CanvasNode,
  bounds: ViewportBounds,
): boolean {
  const nodeWidth = Math.max(1, node.width ?? 200);
  const nodeHeight = Math.max(1, node.height ?? 100);
  const nodeX1 = node.position.x;
  const nodeY1 = node.position.y;
  const nodeX2 = nodeX1 + nodeWidth;
  const nodeY2 = nodeY1 + nodeHeight;

  return !(
    nodeX2 < bounds.x1 ||
    nodeX1 > bounds.x2 ||
    nodeY2 < bounds.y1 ||
    nodeY1 > bounds.y2
  );
}

function dedupeNodes(nodes: CanvasNode[]): CanvasNode[] {
  const seen = new Set<string>();
  const result: CanvasNode[] = [];

  for (const node of nodes) {
    if (!seen.has(node.id)) {
      seen.add(node.id);
      result.push(node);
    }
  }

  return result;
}

export function generateMessageContext({
  nodes,
  openedNodeIds,
  attachedNodes,
  attachedPosition,
  viewport,
  viewportWidth,
  viewportHeight,
  getNodeTitle,
  time = new Date(),
}: MessageContextParams): string {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const openedNodes = dedupeNodes(
    openedNodeIds
      .map((nodeId) => nodesById.get(nodeId))
      .filter((node): node is CanvasNode => Boolean(node)),
  );
  const viewportBounds = getViewportBounds(
    viewport,
    viewportWidth,
    viewportHeight,
  );
  const visibleNodes = dedupeNodes(
    nodes.filter((node) => isNodeVisibleInBounds(node, viewportBounds)),
  );
  const uniqueAttachedNodes = dedupeNodes(attachedNodes);

  const boundsAttr = `${Math.round(viewportBounds.x1)},${Math.round(viewportBounds.y1)},${Math.round(viewportBounds.x2)},${Math.round(viewportBounds.y2)}`;

  const openNodesXml = openedNodes
    .map((node) => nodeToXml(node, getNodeTitle))
    .join("\n");

  const visibleNodeIdsXml =
    visibleNodes.length > 0
      ? `    <in_viewport_node_ids>${escapeXml(visibleNodes.map((node) => node.id).join(" | "))}</in_viewport_node_ids>`
      : "    <!-- No nodes visible in the current viewport -->";

  const attachedNodesXml = uniqueAttachedNodes
    .map((node) => nodeToXml(node, getNodeTitle))
    .join("\n");

  const openNodesSection =
    openedNodes.length > 0
      ? [
          "<open_nodes>",
          "<hint>Nodes currently open in windows.</hint>",
          openNodesXml,
          "</open_nodes>",
          "",
        ]
      : [];

  const attachedNodesSection =
    uniqueAttachedNodes.length > 0
      ? [
          "<attached_nodes>",
          "<hint>Nodes explicitly attached to this message.</hint>",
          attachedNodesXml,
          "</attached_nodes>",
        ]
      : [];

  const attachedPositionSection = attachedPosition
    ? [
        "<attached_position>",
        "<hint>Empty position the user attached to this message. Use it to create new nodes or place existing nodes.</hint>",
        `    <position x="${Math.round(attachedPosition.x)}" y="${Math.round(attachedPosition.y)}" />`,
        "</attached_position>",
      ]
    : [];

  return [
    "<message_context>",
    "<hint>Context snapshot generated when the user sent this message.</hint>",
    `<time>${escapeXml(formatTimeNaturalLanguage(time))}</time>`,
    "",
    ...openNodesSection,
    `<viewport bounds="${escapeXml(boundsAttr)}">`,
    "<hint>Use the viewport coordinates to place new nodes, if relevant to the question asked. Visible nodes and current viewport may or may not be relevant to the current task.</hint>",
    visibleNodeIdsXml,
    "</viewport>",
    ...(attachedPositionSection.length > 0
      ? ["", ...attachedPositionSection]
      : []),
    ...(attachedNodesSection.length > 0 ? ["", ...attachedNodesSection] : []),
    "</message_context>",
  ].join("\n");
}

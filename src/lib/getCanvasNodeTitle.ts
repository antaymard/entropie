import type { CanvasNode } from "@/types";
import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import type { Doc, Id } from "@/../convex/_generated/dataModel";
import { getNodeDataTitle } from "@/../convex/lib/getNodeDataTitle";

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

import { memo, useCallback, useMemo, useRef } from "react";
import { type Node, useStoreApi } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { areNodePropsEqual } from "../areNodePropsEqual";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { useAppNodeBridge } from "@/hooks/useAppNodeBridge";
import { buildSrcdoc } from "@/lib/buildSrcdoc";
import NodeFrame from "../NodeFrame";
import { getNodeDataTitle } from "@/components/utils/nodeDataDisplayUtils";

type SourceNode = {
  id: string;
  type: string;
  name: string;
  columns?: { id: string; name: string; type: string }[];
  rows?: Record<string, unknown>[];
  value?: string | number;
  markdown?: string;
  url?: string;
  title?: string;
};

function resolveSourceNode(
  nodeData: Record<string, unknown> & { type: string; values?: Record<string, unknown> },
  nodeId: string,
): SourceNode {
  const type = nodeData.type;
  const name = getNodeDataTitle(nodeData as any);
  const base: SourceNode = { id: nodeId, type, name };

  switch (type) {
    case "table": {
      const table = nodeData.values?.table as
        | { columns?: SourceNode["columns"]; rows?: SourceNode["rows"] }
        | undefined;
      return { ...base, columns: table?.columns, rows: table?.rows };
    }
    case "value": {
      const val = nodeData.values?.value as { value?: string | number } | undefined;
      return { ...base, value: val?.value };
    }
    case "document": {
      return { ...base, markdown: undefined };
    }
    case "image": {
      const images = nodeData.values?.images as Array<{ url?: string }> | undefined;
      return { ...base, url: images?.[0]?.url };
    }
    case "link": {
      const link = nodeData.values?.link as
        | { href?: string; pageTitle?: string }
        | undefined;
      return { ...base, url: link?.href, title: link?.pageTitle };
    }
    default:
      return base;
  }
}

function AppNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rfStore = useStoreApi();

  const updateValuesMutation = useMutation(api.nodeDatas.updateValues);

  const resolveConnected = useCallback(async () => {
    const { edges, nodes } = rfStore.getState();
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const result: Record<string, SourceNode> = {};
    for (const edge of edges) {
      if (edge.target !== xyNode.id) continue;
      const sourceNode = nodeMap.get(edge.source);
      if (!sourceNode) continue;
      const sourceNodeDataId = sourceNode.data?.nodeDataId as
        | Id<"nodeDatas">
        | undefined;
      if (!sourceNodeDataId) continue;
      const nodeData = useNodeDataStore.getState().getNodeData(sourceNodeDataId);
      if (!nodeData) continue;
      result[sourceNode.id] = resolveSourceNode(nodeData as any, sourceNode.id);
    }
    return result;
  }, [rfStore, xyNode.id]);

  const updateState = useCallback(
    async (state: unknown) => {
      if (!nodeDataId) return;
      await updateValuesMutation({ _id: nodeDataId, values: { state } });
    },
    [nodeDataId, updateValuesMutation],
  );

  useAppNodeBridge(iframeRef, xyNode.id, resolveConnected, updateState);

  const srcdoc = useMemo(() => {
    const code = (values?.code as string) ?? "";
    const state = values?.state ?? null;
    return buildSrcdoc(code, state);
  }, [values?.code, values?.state]);

  return (
    <NodeFrame xyNode={xyNode}>
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
        sandbox="allow-scripts"
        className="w-full h-full border-0"
        title="App Node"
      />
    </NodeFrame>
  );
}

export default memo(AppNode, areNodePropsEqual);

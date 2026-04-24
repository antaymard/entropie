import { useCallback, useMemo, useRef, useEffect } from "react";
import { useStoreApi } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { buildSrcdoc } from "@/lib/buildSrcdoc";
import {
  type SourceNode,
  resolveSourceNode,
} from "@/components/utils/appNodeUtils";

type BridgeMessage =
  | { type: "nolenor:getData"; requestId: string }
  | { type: "nolenor:saveState"; requestId: string; state: unknown };

export function useAppNodeRunner(
  xyNodeId: string,
  nodeDataId: Id<"nodeDatas"> | undefined,
  values: Record<string, unknown> | null | undefined,
  refreshKey: number,
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rfStore = useStoreApi();
  const updateValuesMutation = useMutation(api.nodeDatas.updateValues);

  const resolveConnected = useCallback(async () => {
    const { edges, nodes } = rfStore.getState();
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const result: Record<string, SourceNode> = {};
    for (const edge of edges) {
      if (edge.target !== xyNodeId) continue;
      const sourceNode = nodeMap.get(edge.source);
      if (!sourceNode) continue;
      const sourceNodeDataId = sourceNode.data?.nodeDataId as
        | Id<"nodeDatas">
        | undefined;
      if (!sourceNodeDataId) continue;
      const nodeData = useNodeDataStore.getState().getNodeData(sourceNodeDataId);
      if (!nodeData) continue;
      result[sourceNode.id] = resolveSourceNode(
        nodeData as Record<string, unknown> & {
          type: string;
          values?: Record<string, unknown>;
        },
        sourceNode.id,
      );
    }
    return result;
  }, [rfStore, xyNodeId]);

  const updateState = useCallback(
    async (state: unknown) => {
      if (!nodeDataId) return;
      await updateValuesMutation({ _id: nodeDataId, values: { state } });
    },
    [nodeDataId, updateValuesMutation],
  );

  // App Node Bridge (handles messages from the iframe)
  useEffect(() => {
    const handler = async (e: MessageEvent<BridgeMessage>) => {
      if (e.source !== iframeRef.current?.contentWindow) return;

      const { type, requestId } = e.data;
      let payload: unknown;

      if (type === "nolenor:getData") {
        payload = await resolveConnected();
      } else if (type === "nolenor:saveState") {
        // e.data.state relies on the type coercion, so we cast it quietly
        await updateState((e.data as { state: unknown }).state);
        payload = { ok: true };
      } else {
        return;
      }

      iframeRef.current?.contentWindow?.postMessage(
        { requestId, payload },
        "*",
      );
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [resolveConnected, updateState]);

  const srcdoc = useMemo(() => {
    if (!values) return "";
    const code = (values.code as string) ?? "";
    const state = values.state ?? null;
    return buildSrcdoc(code, state);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values?.code, refreshKey]); // state exclu intentionnellement : saveState ne doit pas recharger l'iframe

  return { iframeRef, srcdoc };
}

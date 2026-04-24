import { useEffect } from "react";

type BridgeMessage =
  | { type: "nolenor:getData"; requestId: string }
  | { type: "nolenor:saveState"; requestId: string; state: unknown };

export function useAppNodeBridge(
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  _appNodeId: string,
  resolveConnectedNodes: () => Promise<Record<string, unknown>>,
  updateState: (state: unknown) => Promise<void>,
) {
  useEffect(() => {
    const handler = async (e: MessageEvent<BridgeMessage>) => {
      if (e.source !== iframeRef.current?.contentWindow) return;

      const { type, requestId } = e.data;
      let payload: unknown;

      if (type === "nolenor:getData") {
        payload = await resolveConnectedNodes();
      } else if (type === "nolenor:saveState") {
        await updateState(e.data.state);
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
  }, [iframeRef, _appNodeId, resolveConnectedNodes, updateState]);
}

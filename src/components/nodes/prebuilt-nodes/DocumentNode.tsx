import { memo, useCallback } from "react";
import { type Node } from "@xyflow/react";
import { areNodePropsEqual } from "../areNodePropsEqual";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { useNodeTitle } from "@/hooks/useNodeTitle";
import type { Id } from "@/../convex/_generated/dataModel";
import { normalizeNodeId, type Value } from "platejs";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import DocumentStaticField from "@/components/fields/document-fields/DocumentStaticField";
import { Button } from "@/components/shadcn/button";
import { TbMaximize, TbNews } from "react-icons/tb";
import { useWindowsStore } from "@/stores/windowsStore";

const defaultValue: Value = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

function DocumentNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);

  const openWindow = useWindowsStore((s) => s.openWindow);

  const handleOpenWindow = useCallback(() => {
    if (!nodeDataId) return;
    openWindow({ xyNodeId: xyNode.id, nodeDataId, nodeType: "document" });
  }, [nodeDataId, openWindow, xyNode.id]);

  // Récupère la valeur depuis le store NodeData
  const currentValue: Value =
    (values?.doc as Value | undefined) ?? defaultValue;

  const documentTitle = useNodeTitle(nodeDataId) ?? "Document";

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Button
          size="icon"
          variant="outline"
          disabled={!nodeDataId}
          onClick={handleOpenWindow}
        >
          <TbMaximize />
        </Button>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode}>
        {!xyNode.data.variant ||
          (xyNode.data.variant === "default" && (
            <div className="h-full overflow-auto">
              <DocumentStaticField
                value={{ doc: currentValue }}
                allowDrag={!xyNode.selected}
              />
            </div>
          ))}
        {xyNode.data.variant === "title" && (
          <div className="flex items-center gap-2 px-2 min-w-0 h-full group/linknode relative">
            <TbNews size={18} className="shrink-0" />
            <p className="truncate flex-1 min-w-0" title={documentTitle}>
              {documentTitle}
            </p>
          </div>
        )}
      </NodeFrame>
    </>
  );
}

export default memo(DocumentNode, areNodePropsEqual);

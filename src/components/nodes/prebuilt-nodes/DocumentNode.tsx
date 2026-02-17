import { memo } from "react";
import { type Node } from "@xyflow/react";
import { useNodeDataValues } from "@/hooks/useNodeData";
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

function getDocumentTitle(value: Value): string {
  if (!value || value.length === 0) return "Document";
  const firstBlock = value[0];
  if (firstBlock.type === "h1" || firstBlock.type === "h2") {
    return (
      firstBlock.children.map((child) => child.text).join(" ") || "Document"
    );
  }
  return "Document";
}

export default function DocumentNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);

  const openWindow = useWindowsStore((s) => s.openWindow);

  // Récupère la valeur depuis le store NodeData
  const currentValue: Value =
    (values?.doc as Value | undefined) ?? defaultValue;

  const documentTitle = getDocumentTitle(currentValue);

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Button
          size="icon"
          variant="outline"
          onClick={() => openWindow(xyNode.id)}
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

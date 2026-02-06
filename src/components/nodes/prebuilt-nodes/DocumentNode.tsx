import { memo, useState, useCallback } from "react";
import { type Node } from "@xyflow/react";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import { useNodeDataValues } from "@/hooks/useNodeData";
import type { Id } from "@/../convex/_generated/dataModel";
import { normalizeNodeId, type Value } from "platejs";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import DocumentStaticField from "@/components/fields/document-fields/DocumentStaticField";
import DocumentEditorField from "@/components/fields/document-fields/DocumentEditorField";
import { EditorKit } from "@/components/plate/editor-kit";
import { Button } from "@/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/dialog";
import { TbMaximize } from "react-icons/tb";
import { useWindowsStore } from "@/stores/windowsStore";
import type { nodeTypes } from "@/types/nodeData.types";

const defaultValue: Value = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

const DocumentNode = memo(
  function DocumentNode(xyNode: Node) {
    const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
    const values = useNodeDataValues(nodeDataId);
    const { updateNodeDataValues } = useUpdateNodeDataValues();

    const openWindow = useWindowsStore((s) => s.openWindow);

    // Récupère la valeur depuis le store NodeData
    const currentValue: Value =
      (values?.doc as Value | undefined) ?? defaultValue;

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
          <div className="h-full overflow-auto">
            <DocumentStaticField
              value={{ doc: currentValue }}
              allowDrag={!xyNode.selected}
            />
          </div>
        </NodeFrame>
      </>
    );
  },
  (prev, next) => {
    // Les values viennent du store Zustand (useNodeDataValues)
    // On compare seulement les props ReactFlow pertinentes
    return (
      prev.id === next.id &&
      prev.selected === next.selected &&
      prev.data?.nodeDataId === next.data?.nodeDataId &&
      prev.data?.color === next.data?.color &&
      prev.data?.name === next.data?.name
    );
  },
);

export default DocumentNode;

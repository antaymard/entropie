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
import { CanvasEditorKit } from "@/components/plate/canvas-editor-kit";
import AutomationSettingsButton from "../toolbar/AutomationSettingsButton";

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
    const [isEditing, setIsEditing] = useState(false);

    // Récupère la valeur depuis le store NodeData
    const currentValue: Value =
      (values?.doc as Value | undefined) ?? defaultValue;

    const handleDoubleClick = useCallback(() => {
      if (xyNode.selected) {
        setIsEditing(true);
      }
    }, [xyNode.selected]);

    const handleChange = useCallback(
      (newValue: { doc: Value }) => {
        if (nodeDataId) {
          updateNodeDataValues({
            nodeDataId,
            values: { doc: newValue.doc },
          });
        }
      },
      [updateNodeDataValues, nodeDataId],
    );

    const handleBlur = useCallback(() => {
      setIsEditing(false);
    }, []);

    return (
      <>
        <CanvasNodeToolbar xyNode={xyNode}>
          <AutomationSettingsButton xyNode={xyNode} />
        </CanvasNodeToolbar>
        <NodeFrame xyNode={xyNode}>
          {isEditing ? (
            <div className="h-full" onBlur={handleBlur}>
              <DocumentEditorField
                editorId={xyNode.id}
                value={{ doc: currentValue }}
                onChange={handleChange}
                plugins={CanvasEditorKit}
              />
            </div>
          ) : (
            <div className="h-full" onDoubleClick={handleDoubleClick}>
              <DocumentStaticField value={{ doc: currentValue }} />
            </div>
          )}
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

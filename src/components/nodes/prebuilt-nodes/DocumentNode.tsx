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
import { TbPencil } from "react-icons/tb";

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

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [localValue, setLocalValue] = useState<Value | null>(null);

    // Récupère la valeur depuis le store NodeData
    const currentValue: Value =
      (values?.doc as Value | undefined) ?? defaultValue;

    const handleOpenDialog = useCallback(() => {
      setLocalValue(currentValue);
      setIsDialogOpen(true);
    }, [currentValue]);

    const handleLocalChange = useCallback((newValue: { doc: Value }) => {
      setLocalValue(newValue.doc);
    }, []);

    const handleCancel = useCallback(() => {
      setLocalValue(null);
      setIsDialogOpen(false);
    }, []);

    const handleSave = useCallback(() => {
      if (nodeDataId && localValue) {
        updateNodeDataValues({
          nodeDataId,
          values: { doc: localValue },
        });
      }
      setLocalValue(null);
      setIsDialogOpen(false);
    }, [nodeDataId, localValue, updateNodeDataValues]);

    return (
      <>
        <CanvasNodeToolbar xyNode={xyNode}>
          <Button size="icon" variant="outline" onClick={handleOpenDialog}>
            <TbPencil />
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

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent
            showCloseButton={false}
            className="max-w-5xl w-[90vw] h-[80vh] flex flex-col"
            onInteractOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>Éditer le document</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 min-h-0 h-full border rounded-md">
              {isDialogOpen && localValue && (
                <DocumentEditorField
                  editorId={`${xyNode.id}-dialog`}
                  value={{ doc: localValue }}
                  onChange={handleLocalChange}
                  plugins={EditorKit}
                />
              )}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={handleCancel}>
                Annuler
              </Button>
              <Button onClick={handleSave}>Valider</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

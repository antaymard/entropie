import { useReactFlow, type Node } from "@xyflow/react";
import NodeFrame from "./NodeFrame";
import { useTemplate } from "@/stores/templateStore";
import type { Id } from "convex/_generated/dataModel";
import CustomTemplateRenderer from "../renderers/CustomTemplateRenderer";
import { useCallback } from "react";
import CanvasNodeToolbar from "./toolbar/CanvasNodeToolbar";

export default function CustomNode(xyNode: Node) {
  const template = useTemplate(xyNode.data?.templateId as Id<"nodeTemplates">);

  //   const nodeLayout = template?.visuals.node.default;

  const { updateNodeData } = useReactFlow();

  const handleSaveData = useCallback(
    (fieldId: string, data: unknown) => {
      updateNodeData(xyNode.id, { [fieldId]: data });
    },
    [updateNodeData, xyNode.id]
  );

  if (!template) return null;

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode} />
      <NodeFrame xyNode={xyNode} nodeContentClassName="p-0">
        <CustomTemplateRenderer
          template={template}
          visualType="node"
          nodeData={xyNode.data}
          onSaveNodeData={handleSaveData}
        />
      </NodeFrame>
    </>
  );
}

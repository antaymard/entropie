import { useReactFlow, type Node } from "@xyflow/react";
import NodeFrame from "./NodeFrame";
import { useTemplate } from "@/stores/templateStore";
import type { Id } from "convex/_generated/dataModel";
import CustomTemplateRenderer from "../renderers/CustomTemplateRenderer";
import { useCallback } from "react";
import CanvasNodeToolbar from "./toolbar/CanvasNodeToolbar";

export default function CustomNode(xyNode: Node) {
  const template = useTemplate(xyNode.data?.templateId as Id<"nodeTemplates">);

  const { updateNodeData } = useReactFlow();

  const handleSaveData = useCallback(
    (fieldId: string, data: unknown) => {
      updateNodeData(xyNode.id, { [fieldId]: data });
    },
    [updateNodeData, xyNode.id]
  );

  if (!template) return null;

  // Get the default variant for node visual
  const defaultVariantId = template.defaultVisuals.node || "default";
  const layout = template.visuals.node?.[defaultVariantId]?.layout;

  // Extract settings from the root element's data
  const rootData = layout?.data as Record<string, unknown> | undefined;
  const headerless = Boolean(rootData?.headerless);
  const resizable = Boolean(rootData?.resizable);
  const disableDoubleClickToOpenWindow = Boolean(rootData?.disableDoubleClickToOpenWindow);

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode} />
      <NodeFrame
        xyNode={xyNode}
        nodeContentClassName="p-0"
        headerless={headerless}
        notResizable={!resizable}
        disableDoubleClickToOpenWindow={disableDoubleClickToOpenWindow}
      >
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

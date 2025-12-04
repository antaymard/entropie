import { useReactFlow, useStore } from "@xyflow/react";
import { memo, useCallback } from "react";
import type { Node } from "@xyflow/react";
import WindowFrame from "./WindowFrame";
import { useTemplate } from "@/stores/templateStore";
import type { Id } from "convex/_generated/dataModel";
import CustomTemplateRenderer from "@/components/renderers/CustomTemplateRenderer";

interface CustomWindowProps {
  windowId: string;
}

function CustomWindow({ windowId }: CustomWindowProps) {
  // Récupère uniquement la data du node, re-render uniquement quand elle change
  const nodeData = useStore(
    (state) => state.nodes.find((n: Node) => n.id === windowId)?.data
  );

  const templateId = nodeData?.templateId as Id<"nodeTemplates"> | undefined;
  const template = useTemplate(templateId);

  const { updateNodeData } = useReactFlow();

  const handleSaveData = useCallback(
    (fieldId: string, data: unknown) => {
      updateNodeData(windowId, { [fieldId]: data });
    },
    [updateNodeData, windowId]
  );

  if (!template) {
    return (
      <WindowFrame windowId={windowId}>
        <div className="text-gray-500 text-sm">Template non trouvé</div>
      </WindowFrame>
    );
  }

  return (
    <WindowFrame windowId={windowId} contentClassName="p-0!">
      <CustomTemplateRenderer
        template={template}
        visualType="window"
        nodeData={nodeData as Record<string, unknown>}
        onSaveNodeData={handleSaveData}
      />
    </WindowFrame>
  );
}

export default memo(CustomWindow);

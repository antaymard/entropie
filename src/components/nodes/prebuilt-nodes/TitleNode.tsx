import { memo, useState } from "react";
import { type Node } from "@xyflow/react";
import { areNodePropsEqual } from "../areNodePropsEqual";
import NodeFrame from "../NodeFrame";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import { BiParagraph } from "react-icons/bi";
import InlineEditableText from "../../form-ui/InlineEditableText";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import { colors } from "@/components/ui/styles";
import type { colorsEnum } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import type { Id } from "@/../convex/_generated/dataModel";

function TitleNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const { updateNodeDataValues } = useUpdateNodeDataValues();

  const levels = [
    { value: "h1", icon: <LuHeading1 />, className: "text-3xl font-semibold" },
    { value: "h2", icon: <LuHeading2 />, className: "text-2xl font-semibold" },
    { value: "h3", icon: <LuHeading3 />, className: "text-lg font-semibold" },
    { value: "p", icon: <BiParagraph />, className: "text-base font-normal" },
  ];

  const text = (values?.text as string) || "";
  const level = (values?.level as string) || "p";

  const textClassName = levels.find((l) => l.value === level)?.className || "";
  const textColor =
    colors[(xyNode.data.color as colorsEnum) || "default"]?.textColor;

  const [editing, setEditing] = useState(false);
  const [editingText, setEditingText] = useState("");

  if (!xyNode || !nodeDataId) return null;

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        {/* Change heading */}
        <ToggleGroup
          type="single"
          variant="outline"
          className="bg-card"
          value={level}
          onValueChange={(value) => {
            // Only update if value is not null (prevent unclicking)
            if (value && nodeDataId) {
              updateNodeDataValues({
                nodeDataId,
                values: { level: value },
              });
            }
          }}
        >
          {levels.map((level) => (
            <ToggleGroupItem key={level.value} value={level.value}>
              {level.icon}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CanvasNodeToolbar>

      <NodeFrame xyNode={xyNode}>
        <div className={cn(textClassName, textColor, "p-1 px-2")}>
          <InlineEditableText
            value={text}
            onSave={(newText) => {
              if (nodeDataId) {
                // Sauvegarder le texte
                updateNodeDataValues({
                  nodeDataId,
                  values: { text: newText },
                });
              }
            }}
            placeholder="Double-click to edit..."
          />
        </div>
      </NodeFrame>
    </>
  );
}

export default memo(TitleNode, areNodePropsEqual);

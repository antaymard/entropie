import { memo } from "react";
import { type Node, useReactFlow } from "@xyflow/react";
import { useParams } from "@tanstack/react-router";
import NodeFrame from "../NodeFrame";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import { LuHeading1, LuHeading2, LuHeading3 } from "react-icons/lu";
import { BiParagraph } from "react-icons/bi";
import InlineEditableText from "../../form-ui/InlineEditableText";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import type {
  XyNodeData,
  FloatingTextCanvasNodeData,
} from "@/types/canvasNodeData.types";
import { colors } from "@/components/ui/styles";
import type { colorsEnum } from "@/types/style.types";
import { cn } from "@/lib/utils";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

function FloatingTextNode(
  xyNode: Node<XyNodeData<FloatingTextCanvasNodeData>>,
) {
  const { canvasId }: { canvasId: Id<"canvases"> } = useParams({
    from: "/canvas/$canvasId",
  });
  const updateCanvasNode = useMutation(api.canvasNodes.updateCanvasNodes);

  const levels = [
    { value: "h1", icon: <LuHeading1 />, className: "text-3xl font-semibold" },
    { value: "h2", icon: <LuHeading2 />, className: "text-2xl font-semibold" },
    { value: "h3", icon: <LuHeading3 />, className: "text-lg font-semibold" },
    { value: "p", icon: <BiParagraph />, className: "text-base font-normal" },
  ];
  const textClassName =
    levels.find((l) => l.value === xyNode.data.level)?.className || "";
  const textColor =
    colors[(xyNode.data.color as colorsEnum) || "default"]?.textColor;

  if (!xyNode) return null;

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        {/* Change heading */}
        <ToggleGroup
          type="single"
          variant="outline"
          className="bg-card"
          value={xyNode.data.level || "h1"}
          onValueChange={(value) =>
            updateCanvasNode({
              canvasId: canvasId,
              nodeProps: [{ id: xyNode.id, data: { level: value } }],
            })
          }
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
            multiline
            value={xyNode.data.text || ""}
            onSave={(text) => console.log("Save text:", text)}
            placeholder="Double-cliquez pour éditer..."
          />
        </div>
      </NodeFrame>
    </>
  );
}

export default memo(FloatingTextNode);

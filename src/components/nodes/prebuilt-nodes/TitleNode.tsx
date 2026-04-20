import { memo, useLayoutEffect, useRef } from "react";
import {
  NodeResizeControl,
  useReactFlow,
  type Node,
} from "@xyflow/react";
import { useMutation } from "convex/react";
import { useParams } from "@tanstack/react-router";
import { areNodePropsEqual } from "../areNodePropsEqual";
import NodeFrame from "../NodeFrame";
import { ToggleGroup, ToggleGroupItem } from "@/components/shadcn/toggle-group";
import {
  LuHeading1,
  LuHeading2,
  LuHeading3,
  LuMove,
  LuMoveHorizontal,
  LuWrapText,
} from "react-icons/lu";
import { BiParagraph } from "react-icons/bi";
import InlineEditableText from "../../form-ui/InlineEditableText";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import { colors } from "@/components/ui/styles";
import type { colorsEnum } from "@/types/domain";
import { cn } from "@/lib/utils";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { useUpdateNodeDataValues } from "@/hooks/useUpdateNodeDataValues";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";

type AutoresizeMode = "off" | "line" | "height";

const levels = [
  { value: "h1", icon: <LuHeading1 />, className: "text-3xl font-semibold" },
  { value: "h2", icon: <LuHeading2 />, className: "text-2xl font-semibold" },
  { value: "h3", icon: <LuHeading3 />, className: "text-lg font-semibold" },
  { value: "p", icon: <BiParagraph />, className: "text-base font-normal" },
] as const;

const autoresizeModes: { value: AutoresizeMode; icon: React.ReactNode }[] = [
  { value: "off", icon: <LuMove /> },
  { value: "line", icon: <LuMoveHorizontal /> },
  { value: "height", icon: <LuWrapText /> },
];

// NodeFrame border is 1px per side.
const BORDER_PX = 2;
const PLACEHOLDER = "Double-click to edit...";

function TitleNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const { updateNodeDataValues } = useUpdateNodeDataValues();
  const { setNodes } = useReactFlow();
  const { canvasId } = useParams({ from: "/canvas/$canvasId" }) as {
    canvasId: Id<"canvases">;
  };
  const updateDimensions = useMutation(
    api.canvasNodes.updatePositionOrDimensions,
  );

  const text = (values?.text as string) || "";
  const level = (values?.level as string) || "p";
  const autoresize = ((values?.autoresize as AutoresizeMode) || "line") as AutoresizeMode;

  const textClassName =
    levels.find((l) => l.value === level)?.className || "";
  const textColor =
    colors[(xyNode.data.color as colorsEnum) || "default"]?.textColor;

  const sizerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (autoresize === "off") return;
    const sizer = sizerRef.current;
    if (!sizer) return;

    const rect = sizer.getBoundingClientRect();
    const measuredW = Math.ceil(rect.width) + BORDER_PX;
    const measuredH = Math.ceil(rect.height) + BORDER_PX;

    const currentW = xyNode.width ?? 0;
    const currentH = xyNode.height ?? 0;

    const newWidth = autoresize === "line" ? measuredW : currentW;
    const newHeight = measuredH;

    if (newWidth === currentW && newHeight === currentH) return;

    setNodes((nodes) =>
      nodes.map((n) =>
        n.id === xyNode.id
          ? {
              ...n,
              width: newWidth,
              height: newHeight,
              measured: { width: newWidth, height: newHeight },
            }
          : n,
      ),
    );

    updateDimensions({
      canvasId,
      nodeChanges: [
        {
          type: "dimensions",
          id: xyNode.id,
          dimensions: { width: newWidth, height: newHeight },
        },
      ],
    });
  }, [
    text,
    level,
    autoresize,
    xyNode.id,
    xyNode.width,
    xyNode.height,
    canvasId,
    setNodes,
    updateDimensions,
  ]);

  if (!xyNode || !nodeDataId) return null;

  const sizerWidth =
    autoresize === "height"
      ? Math.max(0, (xyNode.width ?? 0) - BORDER_PX)
      : undefined;

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
            if (value && nodeDataId) {
              updateNodeDataValues({
                nodeDataId,
                values: { level: value },
              });
            }
          }}
        >
          {levels.map((l) => (
            <ToggleGroupItem key={l.value} value={l.value}>
              {l.icon}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {/* Autoresize mode */}
        <ToggleGroup
          type="single"
          variant="outline"
          className="bg-card"
          value={autoresize}
          onValueChange={(value) => {
            if (value && nodeDataId) {
              updateNodeDataValues({
                nodeDataId,
                values: { autoresize: value as AutoresizeMode },
              });
            }
          }}
        >
          {autoresizeModes.map((m) => (
            <ToggleGroupItem key={m.value} value={m.value}>
              {m.icon}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </CanvasNodeToolbar>

      {/* Width-only resize handles in height mode */}
      {autoresize === "height" && xyNode.selected && (
        <>
          <NodeResizeControl
            position="left"
            style={{
              background: "transparent",
              border: "none",
              width: 6,
            }}
          />
          <NodeResizeControl
            position="right"
            style={{
              background: "transparent",
              border: "none",
              width: 6,
            }}
          />
        </>
      )}

      <NodeFrame xyNode={xyNode} resizable={autoresize === "off"}>
        <div className={cn(textClassName, textColor, "p-1 px-2")}>
          <InlineEditableText
            multiline={autoresize !== "line"}
            value={text}
            onSave={(nextText) => {
              if (nodeDataId) {
                updateNodeDataValues({
                  nodeDataId,
                  values: { text: nextText },
                });
              }
            }}
            placeholder={PLACEHOLDER}
          />
        </div>
      </NodeFrame>

      {/* Off-screen sizer used to measure the natural content dimensions */}
      <div
        ref={sizerRef}
        aria-hidden
        className={cn(textClassName, "p-1 px-2")}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          visibility: "hidden",
          pointerEvents: "none",
          whiteSpace: autoresize === "line" ? "nowrap" : "pre-wrap",
          wordBreak: "break-word",
          width: sizerWidth,
        }}
      >
        {text || PLACEHOLDER}
      </div>
    </>
  );
}

export default memo(TitleNode, areNodePropsEqual);

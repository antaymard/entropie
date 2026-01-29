import FloatingTextNode from "./FloatingTextNode";
import type {
  FloatingTextCanvasNodeData,
  XyNodeData,
} from "@/types/canvasNodeData.types";

// Icons
import { RiTextBlock } from "react-icons/ri";
import type { Node } from "@xyflow/react";

const prebuiltNodesConfig = [
  {
    nodeLabel: "Texte flottant",
    nodeIcon: RiTextBlock,
    nodeComponent: FloatingTextNode,

    disableDoubleClickToOpenWindow: true,
    canBeTransparent: true,

    node: {
      id: "",
      type: "floatingText",
      height: 28,
      width: 150,
      position: { x: 0, y: 0 },
      data: {
        // Pas de nodeDataId ici, car les données
        // restent dans canvas.node.data
        // Plus tard, il y aura locked, color etc
        color: "transparent",
        // Actual data
        text: "Texte flottant",
        level: "p",
      } satisfies Omit<XyNodeData<FloatingTextCanvasNodeData>, "nodeDataId">,
    } as Node,
  },
] as const;

export default prebuiltNodesConfig;

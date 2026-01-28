import FloatingTextNode from "./FloatingTextNode";
import type { Node as XyNode } from "@xyflow/react";

// Icons
import { RiTextBlock } from "react-icons/ri";

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
        nodeDataId: "",
        // Plus tard, il y aura locked, color etc
        // Actual data
        text: "Texte flottant",
        level: "p",
      },
    } as XyNode & { type: string },
  },
] as const;

export default prebuiltNodesConfig;

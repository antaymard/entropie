import type {
  FloatingTextCanvasNodeData,
  XyNodeData,
} from "@/types/canvasNodeData.types";
import type { Node } from "@xyflow/react";

// Icons
import { TbFile, TbAbc } from "react-icons/tb";

// Node Components
import DocumentNode from "./DocumentNode";
import FloatingTextNode from "./FloatingTextNode";

const prebuiltNodesConfig = [
  {
    nodeLabel: "Texte flottant",
    nodeIcon: TbAbc,
    nodeComponent: FloatingTextNode,

    disableNodeDataCreation: true,

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
        color: "transparent",
        // Actual data
        text: "Texte flottant",
        level: "p",
      } satisfies Omit<XyNodeData<FloatingTextCanvasNodeData>, "nodeDataId">,
    } as Node,
  },
  {
    nodeLabel: "Document",
    nodeIcon: TbFile,
    nodeComponent: DocumentNode,

    node: {
      id: "",
      type: "document",
      height: 220,
      width: 220,
      position: { x: 0, y: 0 },
      data: {
        color: "transparent",
        // Actual data
      } satisfies Omit<XyNodeData, "nodeDataId">,
    } as Node,
  },
] as const;

export default prebuiltNodesConfig;

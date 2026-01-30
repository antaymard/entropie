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

type PrebuiltNodeConfig = {
  nodeLabel: string;
  nodeIcon: React.ComponentType;
  nodeComponent: React.ComponentType<any>;
  skipNodeDataCreation?: boolean;
  disableDoubleClickToOpenWindow?: boolean;
  canBeTransparent?: boolean;
  node: Node;
};

const prebuiltNodesConfig: Array<PrebuiltNodeConfig> = [
  {
    nodeLabel: "Texte flottant",
    nodeIcon: TbAbc,
    nodeComponent: FloatingTextNode,

    skipNodeDataCreation: true,

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
        color: "default",
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
        color: "default",
        // Actual data
      } satisfies Omit<XyNodeData, "nodeDataId">,
    } as Node,
  },
];

export default prebuiltNodesConfig;

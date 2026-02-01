import type {
  FloatingTextCanvasNodeData,
  XyNodeData,
} from "@/types/canvasNodeData.types";
import type { Node } from "@xyflow/react";

// Icons
import { TbFile, TbAbc, TbPhoto, TbLink } from "react-icons/tb";

// Node Components
import DocumentNode from "./DocumentNode";
import FloatingTextNode from "./FloatingTextNode";
import ImageNode from "./ImageNode";
import LinkNode from "./LinkNode";

type PrebuiltNodeConfig = {
  nodeLabel: string;
  nodeIcon: React.ComponentType;
  nodeComponent: React.ComponentType<any>;
  skipNodeDataCreation?: boolean;
  node: Node;
};

const prebuiltNodesConfig: Array<PrebuiltNodeConfig> = [
  {
    nodeLabel: "Texte flottant",
    nodeIcon: TbAbc,
    nodeComponent: FloatingTextNode,
    skipNodeDataCreation: true,

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
      height: 320,
      width: 320,
      position: { x: 0, y: 0 },
      data: {
        color: "default",
        // Actual data
      } satisfies Omit<XyNodeData, "nodeDataId">,
    } as Node,
  },
  {
    nodeLabel: "Image",
    nodeIcon: TbPhoto,
    nodeComponent: ImageNode,

    node: {
      id: "",
      type: "image",
      height: 320,
      width: 320,
      position: { x: 0, y: 0 },
      data: {
        color: "default",
        // Actual data
      } satisfies Omit<XyNodeData, "nodeDataId">,
    } as Node,
  },
  {
    nodeLabel: "Link",
    nodeIcon: TbLink,
    nodeComponent: LinkNode,

    node: {
      id: "",
      type: "link",
      height: 33,
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

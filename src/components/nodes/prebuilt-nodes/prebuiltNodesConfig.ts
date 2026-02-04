import type {
  FloatingTextCanvasNodeData,
  XyNodeData,
} from "@/types/canvasNodeData.types";
import type { Node } from "@xyflow/react";

// Icons
import { TbFile, TbAbc, TbPhoto, TbLink, TbTag } from "react-icons/tb";

// Node Components
import DocumentNode from "./DocumentNode";
import FloatingTextNode from "./FloatingTextNode";
import ImageNode from "./ImageNode";
import LinkNode from "./LinkNode";
import ValueNode from "./ValueNode";
import z from "zod";

type PrebuiltNodeConfig = {
  nodeLabel: string;
  nodeIcon: React.ComponentType;
  nodeComponent: React.ComponentType<any>;
  skipNodeDataCreation?: boolean;
  node: Node;
  nodeDataValuesSchema?: object | null;
  canHaveAutomation?: boolean;
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

    nodeDataValuesSchema: null,
  },
  {
    nodeLabel: "Document",
    nodeIcon: TbFile,
    nodeComponent: DocumentNode,
    canHaveAutomation: true,

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

    nodeDataValuesSchema: {
      doc: z.array(z.object()),
    },
  },
  {
    nodeLabel: "Image",
    nodeIcon: TbPhoto,
    nodeComponent: ImageNode,
    canHaveAutomation: true,

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

    nodeDataValuesSchema: {
      images: z.array(
        z.object({
          url: z.string(),
        }),
      ),
    },
  },
  {
    nodeLabel: "Lien",
    nodeIcon: TbLink,
    nodeComponent: LinkNode,
    canHaveAutomation: true,

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

    nodeDataValuesSchema: {
      link: z.object({
        href: z.string(),
        pageDescription: z.optional(z.string()),
        pageImage: z.optional(z.string()),
        pageTitle: z.optional(z.string()),
        siteName: z.optional(z.string()),
      }),
    },
  },
  {
    nodeLabel: "Valeur",
    nodeIcon: TbTag,
    nodeComponent: ValueNode,
    canHaveAutomation: true,

    node: {
      id: "",
      type: "value",
      height: 120,
      width: 220,
      position: { x: 0, y: 0 },
      data: {
        color: "default",
        // Actual data
      } satisfies Omit<XyNodeData, "nodeDataId">,
    } as Node,

    nodeDataValuesSchema: {
      value: z.object({
        label: z.optional(z.string()),
        type: z.string(),
        unit: z.optional(z.string()),
        value: z.boolean(),
      }),
    },
  },
];

export default prebuiltNodesConfig;

import type { FloatingTextCanvasNodeData, XyNodeData } from "@/types/domain";
import type { Node } from "@xyflow/react";

// Icons
import {
  TbFileTypePdf,
  TbAbc,
  TbPhoto,
  TbLink,
  TbTag,
  TbApi,
  TbNews,
} from "react-icons/tb";

// Node Components
import DocumentNode from "./DocumentNode";
import FloatingTextNode from "./FloatingTextNode";
import ImageNode from "./ImageNode";
import LinkNode from "./LinkNode";
import ValueNode from "./ValueNode";
import FetchNode from "./FetchNode";
import z from "zod";
import FileNode from "./FileNode";

type PrebuiltNodeConfig = {
  nodeLabel: string;
  nodeIcon: React.ComponentType;
  nodeComponent: React.ComponentType<any>;
  variants?: Record<
    string,
    {
      label: string;
      defaultHeight: number;
      defaultWidth: number;
      resizable?: boolean;
    }
  >;
  skipNodeDataCreation?: boolean;
  node: Node;
  nodeDataValuesSchema?: object | null;
  canHaveAutomation?: boolean;
};

const prebuiltNodesConfig: Array<PrebuiltNodeConfig> = [
  {
    nodeLabel: "Floating text",
    nodeIcon: TbAbc,
    nodeComponent: FloatingTextNode,
    skipNodeDataCreation: true,

    node: {
      id: "",
      type: "floatingText",
      height: 33,
      width: 220,
      position: { x: 0, y: 0 },
      data: {
        // Pas de nodeDataId ici, car les données
        // restent dans canvas.node.data
        color: "transparent",
        // Actual data
        text: "Floating text",
        level: "p",
      } satisfies Omit<XyNodeData<FloatingTextCanvasNodeData>, "nodeDataId">,
    } as Node,

    nodeDataValuesSchema: null,
  },
  {
    nodeLabel: "Document",
    nodeIcon: TbNews,
    nodeComponent: DocumentNode,
    variants: {
      default: {
        label: "Preview",
        defaultHeight: 320,
        defaultWidth: 320,
      },
      title: {
        label: "Title",
        defaultHeight: 33,
        defaultWidth: 220,
        resizable: false,
      },
    },
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
    nodeLabel: "Link",
    nodeIcon: TbLink,
    nodeComponent: LinkNode,
    variants: {
      default: {
        label: "Default",
        defaultHeight: 33,
        defaultWidth: 220,
      },
      preview: {
        label: "Preview",
        defaultHeight: 120,
        defaultWidth: 320,
      },
    },
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
    nodeLabel: "File",
    nodeIcon: TbFileTypePdf,
    nodeComponent: FileNode,
    canHaveAutomation: true,

    node: {
      id: "",
      type: "file",
      height: 33,
      width: 220,
      position: { x: 0, y: 0 },
      data: {
        color: "default",
        // Actual data
      } satisfies Omit<XyNodeData, "nodeDataId">,
    } as Node,

    nodeDataValuesSchema: {
      files: z.array(
        z.object({
          url: z.string(),
          filename: z.string(),
          mimeType: z.string(),
          size: z.number(),
          uploadedAt: z.number(),
          key: z.string(),
        }),
      ),
    },
  },
  {
    nodeLabel: "Value",
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
  {
    nodeLabel: "Fetch",
    nodeIcon: TbApi,
    nodeComponent: FetchNode,
    canHaveAutomation: false,

    node: {
      id: "",
      type: "fetch",
      height: 120,
      width: 220,
      position: { x: 0, y: 0 },
      data: {
        color: "default",
        // Actual data
      } satisfies Omit<XyNodeData, "nodeDataId">,
    } as Node,

    nodeDataValuesSchema: {
      fetch: z.object({
        params: z.object({
          url: z.string().default(""),
          method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
          headers: z
            .array(z.object({ key: z.string(), value: z.string() }))
            .optional()
            .default([]),
          queryParams: z.array(
            z.object({ key: z.string(), value: z.string() }),
          ),
          body: z.optional(z.string()),
        }),
        result: z.optional(z.any()),
        lastFetchedAt: z.optional(z.string()),
        error: z.optional(z.string()),
      }),
    },
  },
];

export default prebuiltNodesConfig;

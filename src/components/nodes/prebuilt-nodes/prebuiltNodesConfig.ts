import type { XyNodeData } from "@/types/domain";
import type { Node } from "@xyflow/react";

// Node Components
import DocumentNode from "./DocumentNode";
import FloatingTextNode from "./FloatingTextNode";
import ImageNode from "./ImageNode";
import LinkNode from "./LinkNode";
import ValueNode from "./ValueNode";
import FetchNode from "./FetchNode";
import z from "zod";
import FileNode from "./FileNode";
import EmbedNode from "./EmbedNode";
import { NODE_TYPE_ICON_MAP } from "./nodeIconMap";

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
  node: Node;
  nodeDataValuesSchema?: object | null;
  canHaveAutomation?: boolean;
};

const prebuiltNodesConfig: Array<PrebuiltNodeConfig> = [
  {
    nodeLabel: "Floating text",
    nodeIcon: NODE_TYPE_ICON_MAP.floatingText,
    nodeComponent: FloatingTextNode,
    canHaveAutomation: true,

    node: {
      id: "",
      type: "floatingText",
      height: 33,
      width: 220,
      position: { x: 0, y: 0 },
      data: {
        color: "transparent",
      } satisfies Omit<XyNodeData, "nodeDataId">,
    } as Node,

    nodeDataValuesSchema: {
      text: z.string(),
      level: z.enum(["h1", "h2", "h3", "p"]),
    },
  },
  {
    nodeLabel: "Document",
    nodeIcon: NODE_TYPE_ICON_MAP.document,
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
    nodeIcon: NODE_TYPE_ICON_MAP.image,
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
    nodeLabel: "Link",
    nodeIcon: NODE_TYPE_ICON_MAP.link,
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
    nodeIcon: NODE_TYPE_ICON_MAP.file,
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
    nodeIcon: NODE_TYPE_ICON_MAP.value,
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
    nodeIcon: NODE_TYPE_ICON_MAP.fetch,
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
  {
    nodeLabel: "Embed",
    nodeIcon: NODE_TYPE_ICON_MAP.embed,
    nodeComponent: EmbedNode,
    canHaveAutomation: false,

    node: {
      id: "",
      type: "embed",
      height: 320,
      width: 480,
      position: { x: 0, y: 0 },
      data: {
        color: "default",
      } satisfies Omit<XyNodeData, "nodeDataId">,
    } as Node,

    nodeDataValuesSchema: {
      embed: z.object({
        url: z.string(),
        embedUrl: z.string(),
        title: z.optional(z.string()),
        type: z.enum([
          "youtube",
          "google-docs",
          "google-sheets",
          "google-slides",
          "generic",
        ]),
      }),
    },
  },
];

export default prebuiltNodesConfig;

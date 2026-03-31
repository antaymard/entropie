import { z } from "zod";
import { nodeTypeValues } from "../schemas/nodeTypeSchema";

const nodeTypeZodValidator = z.enum(nodeTypeValues);

type NodeVariant = {
  label: string;
  defaultWidth: number;
  defaultHeight: number;
  resizable?: boolean;
  isDefault?: boolean;
};

type NodeDataConfigItem = {
  type: z.infer<typeof nodeTypeZodValidator>;
  label: string;
  description: string;
  defaultDimensions: {
    width: number;
    height: number;
    resizable?: boolean;
  };
  variants?: Record<string, NodeVariant>;
  canHaveAutomation: boolean;
  defaultColor?: string;
  dataValuesSchema: z.ZodTypeAny;
  toolInputSchema?: z.ZodTypeAny; // Optional schema specifically for tool inputs, if different from dataValuesSchema
};

const nodeDataConfig: Array<NodeDataConfigItem> = [
  {
    type: "floatingText",
    label: "Floating text",
    description:
      "Node for free text labels on the canvas. Supports h1/h2/h3/p heading levels. Does not support rich markdown.",
    defaultDimensions: { width: 220, height: 33, resizable: true },
    canHaveAutomation: true,
    defaultColor: "transparent",
    dataValuesSchema: z
      .object({
        text: z.string().describe("The text content of the label.").default(""),
        level: z
          .enum(["h1", "h2", "h3", "p"])
          .describe("The heading level of the text.")
          .default("p"),
      })
      .default({ text: "", level: "p" }),
  },
  {
    type: "link",
    label: "Link",
    description: "Node for storing a link.",
    defaultDimensions: { width: 220, height: 33, resizable: false },
    variants: {
      default: {
        label: "Default",
        defaultWidth: 220,
        defaultHeight: 33,
        isDefault: true,
      },
      preview: {
        label: "Preview",
        defaultWidth: 320,
        defaultHeight: 120,
      },
    },
    canHaveAutomation: true,

    dataValuesSchema: z
      .object({
        link: z
          .object({
            href: z
              .string()
              .describe(
                "The url of the link. You can visit the page using the open_web_page tool.",
              )
              .default(""),
            pageTitle: z
              .string()
              .describe("The title of the linked page.")
              .default(""),
          })
          .default({ href: "", pageTitle: "" }),
      })
      .default({ link: { href: "", pageTitle: "" } }),
  },
  {
    type: "image",
    label: "Image",
    description: "Node for storing an image.",
    defaultDimensions: { width: 320, height: 320, resizable: true },
    canHaveAutomation: true,

    dataValuesSchema: z
      .object({
        images: z
          .array(
            z.object({
              url: z
                .string()
                .describe(
                  "The URL of the image. Use the view_image tool to view it.",
                ),
            }),
          )
          .default([]),
      })
      .default({ images: [] }),
  },
  {
    type: "document",
    label: "Document",
    description: "Node for storing a rich text document (Plate.js / markdown).",
    defaultDimensions: { width: 320, height: 320, resizable: true },
    variants: {
      default: {
        label: "Preview",
        defaultWidth: 320,
        defaultHeight: 320,
        isDefault: true,
      },
      title: {
        label: "Title",
        defaultWidth: 220,
        defaultHeight: 33,
        resizable: false,
      },
    },
    canHaveAutomation: true,

    dataValuesSchema: z
      .object({
        doc: z.any().default([]),
      })
      .default({ doc: [] }),
    toolInputSchema: z.object({
      doc: z.string().describe("The markdown content of the document."),
    }),
  },
  {
    type: "value",
    label: "Value",
    description: "Node for storing a value (text, number, boolean).",
    defaultDimensions: { width: 220, height: 120, resizable: true },
    canHaveAutomation: true,

    dataValuesSchema: z
      .object({
        value: z
          .object({
            type: z
              .enum(["text", "number", "boolean"])
              .describe(
                "The type of the value: 'text', 'number', or 'boolean'.",
              )
              .default("text"),
            value: z
              .union([z.string(), z.number(), z.boolean()])
              .describe("The actual value stored in the node.")
              .default(""),
            unit: z
              .string()
              .optional()
              .describe(
                "The unit of the value, if applicable (e.g., 'kg', 'm', etc.).",
              ),
            label: z
              .string()
              .optional()
              .describe("An optional label for the value."),
          })
          .default({ type: "text", value: "" }),
      })
      .default({ value: { type: "text", value: "" } }),
  },
  {
    type: "embed",
    label: "Embed",
    description:
      "Node for storing embedded content (YouTube, Google Docs/Sheets/Slides, or generic iframe).",
    defaultDimensions: { width: 480, height: 320, resizable: true },
    canHaveAutomation: false,

    dataValuesSchema: z
      .object({
        embed: z
          .object({
            url: z
              .string()
              .describe("The original URL or source used to create the embed.")
              .default(""),
            embedUrl: z
              .string()
              .describe("The embeddable URL used in the iframe source.")
              .default(""),
            title: z
              .string()
              .optional()
              .describe("An optional title for the embedded content."),
            type: z
              .enum([
                "youtube",
                "google-docs",
                "google-sheets",
                "google-slides",
                "generic",
              ])
              .describe("The embed provider/type inferred from the URL.")
              .default("generic"),
          })
          .default({ url: "", embedUrl: "", type: "generic" }),
      })
      .default({ embed: { url: "", embedUrl: "", type: "generic" } }),
  },
  {
    type: "file",
    label: "File",
    description: "Node for storing uploaded files.",
    defaultDimensions: { width: 220, height: 33, resizable: false },
    canHaveAutomation: true,

    dataValuesSchema: z
      .object({
        files: z
          .array(
            z.object({
              url: z.string().describe("The public URL of the uploaded file."),
              filename: z.string().describe("The display filename."),
              mimeType: z.string().describe("The MIME type of the file."),
              size: z.number().describe("The file size in bytes."),
              uploadedAt: z
                .number()
                .describe("Upload timestamp (epoch milliseconds)."),
              key: z.string().describe("The storage key/path of the file."),
            }),
          )
          .default([]),
      })
      .default({ files: [] }),
  },
  {
    type: "table",
    label: "Table",
    description:
      "Node for structured tabular data with typed columns (text, number, checkbox, date).",
    defaultDimensions: { width: 400, height: 300, resizable: true },
    canHaveAutomation: false,

    dataValuesSchema: z
      .object({
        table: z
          .object({
            columns: z
              .array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  type: z.enum(["text", "number", "checkbox", "date"]),
                }),
              )
              .default([]),
            rows: z
              .array(
                z.object({
                  id: z.string(),
                  cells: z.record(
                    z.string(),
                    z.union([z.string(), z.number(), z.boolean(), z.null()]),
                  ),
                }),
              )
              .default([]),
          })
          .default({ columns: [], rows: [] }),
      })
      .default({ table: { columns: [], rows: [] } }),
  },
];

function getDefaultNodeDataValues(
  nodeType: z.infer<typeof nodeTypeZodValidator>,
) {
  const config = nodeDataConfig.find((item) => item.type === nodeType);
  if (!config) {
    return null;
  }
  return config.dataValuesSchema.parse(undefined);
}

export { nodeDataConfig, nodeTypeZodValidator, getDefaultNodeDataValues };
export type { NodeDataConfigItem, NodeVariant };

import { z } from "zod";
import { nodeTypeValues } from "../schemas/nodeTypeSchema";

const nodeTypeZodValidator = z.enum(nodeTypeValues);

type NodeDataConfigItem = {
  type: z.infer<typeof nodeTypeZodValidator>;
  description: string;
  dataValuesSchema: z.ZodTypeAny;
  toolInputSchema?: z.ZodTypeAny;
};

const nodeDataConfig: Array<NodeDataConfigItem> = [
  {
    type: "link",
    description: "Node for storing a link.",
    dataValuesSchema: z.object({
      link: z.object({
        href: z
          .string()
          .describe(
            "The url of the link. You can visit the page using the open_web_page tool.",
          ),
        pageTitle: z.string().describe("The title of the linked page."),
      }),
    }),
  },
  {
    type: "image",
    description: "Node for storing an image.",
    dataValuesSchema: z.object({
      images: z.array(
        z.object({
          url: z
            .string()
            .describe(
              "The URL of the image. Use the view_image tool to view it.",
            ),
        }),
      ),
    }),
  },
  {
    type: "document",
    description: "Node for storing a markdown document.",
    dataValuesSchema: z.any(),
    toolInputSchema: z.object({
      doc: z.string().describe("The markdown content of the document."),
    }),
  },
  {
    type: "value",
    description: "Node for storing a value (text, number, boolean).",
    dataValuesSchema: z.object({
      value: z.object({
        type: z
          .enum(["text", "number", "boolean"])
          .describe("The type of the value: 'text', 'number', or 'boolean'."),
        value: z
          .union([z.string(), z.number(), z.boolean()])
          .describe("The actual value stored in the node."),
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
      }),
    }),
  },
  {
    type: "embed",
    description: "Node for storing embedded content.",
    dataValuesSchema: z.object({
      embed: z.object({
        url: z
          .string()
          .describe("The original URL or source used to create the embed."),
        embedUrl: z
          .string()
          .describe("The embeddable URL used in the iframe source."),
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
          .describe("The embed provider/type inferred from the URL."),
      }),
    }),
  },
  {
    type: "file",
    description: "Node for storing uploaded files.",
    dataValuesSchema: z.object({
      files: z.array(
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
      ),
    }),
  },
];

export { nodeDataConfig, nodeTypeZodValidator };

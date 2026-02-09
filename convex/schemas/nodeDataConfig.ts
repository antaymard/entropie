import { z } from "zod";

const nodeDataConfig = [
  {
    type: "link",
    description: "Node for storing a link.",
    toolInputSchema: z.object({
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
    toolInputSchema: z.object({
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
    toolInputSchema: z.object({
      doc: z.string().describe("The markdown content of the document."),
    }),
  },
  {
    type: "value",
    description: "Node for storing a value (text, number, boolean).",
    toolInputSchema: z.object({
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
];

export { nodeDataConfig };

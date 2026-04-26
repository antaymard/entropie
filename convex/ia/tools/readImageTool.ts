"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { toolAgentNames } from "../agentConfig";
import { type ToolConfig } from "./toolHelpers";

export const readImageToolConfig: ToolConfig = {
  name: "read_image",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
    toolAgentNames.worker,
  ],
};

type ReadImageOutput =
  | { success: true; data: string; mediaType: string }
  | { success: false; message: string };

export const readImageTool = createTool({
  description: "See an image from an URL (not a nodeId).",
  inputSchema: z.object({
    url: z.string().describe("The URL of the image to fetch and view."),
  }),
  execute: async (_ctx, input): Promise<ReadImageOutput> => {
    console.log(`🖼️ Reading image from URL: ${input.url}`);

    try {
      const response = await fetch(input.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const mediaType =
        response.headers.get("content-type")?.split(";")[0]?.trim() ??
        "image/jpeg";

      if (!mediaType.startsWith("image/")) {
        throw new Error(
          `Resource is not an image (content-type: ${mediaType})`,
        );
      }

      const buffer = await response.arrayBuffer();
      let nodeBuffer: Buffer = Buffer.from(buffer);
      let outputMediaType = mediaType;

      const ONE_MB = 1024 * 1024;
      if (nodeBuffer.length > ONE_MB) {
        console.log(`Image size is ${nodeBuffer.length} bytes, resizing...`);
        const sharp = (await import("sharp")).default;
        nodeBuffer = await sharp(nodeBuffer)
          .resize({
            width: 1024,
            height: 1024,
            fit: "inside",
            withoutEnlargement: true,
          })
          .jpeg({ quality: 80 })
          .toBuffer();
        outputMediaType = "image/jpeg";
      }

      const data = nodeBuffer.toString("base64");

      console.log(
        `✅ Image fetched (${nodeBuffer.length} bytes, ${outputMediaType})`,
      );
      return { success: true, data, mediaType: outputMediaType };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Read image error:", error);
      return {
        success: false,
        message: `Failed to read image: ${message}. Please verify the URL and try again.`,
      };
    }
  },
  toModelOutput: (_ctx, { output }) => {
    if (!output.success) {
      return { type: "error-text", value: output.message };
    }
    return {
      type: "content",
      value: [
        {
          type: "image-data",
          data: output.data,
          mediaType: output.mediaType,
        },
      ],
    };
  },
});

export default readImageTool;

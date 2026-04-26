"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { reportToolProgress } from "../../automation/progressReporter";
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
  description:
    "Fetch an image from a URL and inject it into the conversation so the multimodal model can see it directly. Use this when you need to visually inspect an image rather than receiving a textual description from another model.",
  inputSchema: z.object({
    url: z.string().describe("The URL of the image to fetch and view."),
  }),
  execute: async (ctx, input): Promise<ReadImageOutput> => {
    console.log(`🖼️ Reading image from URL: ${input.url}`);

    await reportToolProgress(ctx, {
      stepType: "tool_launched=view_image",
    });

    try {
      const response = await fetch(input.url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const mediaType =
        response.headers.get("content-type")?.split(";")[0]?.trim() ??
        "image/jpeg";

      if (!mediaType.startsWith("image/")) {
        throw new Error(`Resource is not an image (content-type: ${mediaType})`);
      }

      const buffer = await response.arrayBuffer();
      const data = Buffer.from(buffer).toString("base64");

      await reportToolProgress(ctx, {
        stepType: "tool_completed=view_image",
        data: {},
      });

      console.log(
        `✅ Image fetched (${buffer.byteLength} bytes, ${mediaType})`,
      );
      return { success: true, data, mediaType };
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

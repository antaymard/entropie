import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { reportToolProgress } from "../../automation/progressReporter";

export const toolTemplate = createTool({
  description: "Description",
  inputSchema: z.object({
    url: z.string().describe("The URL of the image to analyze"),
    objective: z
      .string()
      .describe(
        "THIS MUST BE IN ENGLISH. Natural-language description of what information you're looking for concerning the image. The AI will analyze the image and provide a response focused on this objective.",
      ),
  }),
  execute: async (ctx, input): Promise<string> => {
    console.log(`🖼️ Analyzing image from URL: ${input.url}`);
    console.log(`📋 Objective: ${input.objective}`);

    await reportToolProgress(ctx, {
      stepType: "tool_launched=view_image",
    });

    try {
      await reportToolProgress(ctx, {
        stepType: "tool_completed=view_image",
        data: {},
      });
      console.log(`✅ Image analysis complete`);
      return "result.text";
    } catch (error) {
      console.error("View image error:", error);
      throw new Error(
        `Failed to analyze image: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the URL and try again.`,
      );
    }
  },
});

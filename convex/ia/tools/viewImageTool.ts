"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText } from "ai";
import { mistral } from "@ai-sdk/mistral";

export const viewImageTool = createTool({
  description:
    "Analyze an image from a URL using AI vision. Returns a natural-language description of the image content based on the specified objective.",
  args: z.object({
    url: z.string().describe("The URL of the image to analyze"),
    objective: z
      .string()
      .describe(
        "THIS MUST BE IN ENGLISH. Natural-language description of what information you're looking for concerning the image. The AI will analyze the image and provide a response focused on this objective.",
      ),
  }),
  handler: async (ctx, args): Promise<string> => {
    console.log(`🖼️ Analyzing image from URL: ${args.url}`);
    console.log(`📋 Objective: ${args.objective}`);

    try {
      // Analyser l'image avec Anthropic (supporte les URLs directement)
      console.log(`🤖 Sending image for analysis...`);
      const result = await generateText({
        model: anthropic("claude-haiku-4-5"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                image: args.url,
              },
              {
                type: "text",
                text: args.objective,
              },
            ],
          },
        ],
      });

      console.log(`✅ Image analysis complete`);
      return result.text;
    } catch (error) {
      console.error("View image error:", error);
      throw new Error(
        `Failed to analyze image: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the URL and try again.`,
      );
    }
  },
});

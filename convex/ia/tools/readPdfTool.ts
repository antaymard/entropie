"use node";

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText } from "ai";
import { reportToolProgress } from "../../automation/progressReporter";

export const readPdfTool = createTool({
  description:
    "Analyze a pdf from a URL using AI. Returns a natural-language description of the pdf content based on the specified objective.",
  args: z.object({
    url: z.string().describe("The URL of the pdf to analyze"),
    objective: z
      .string()
      .describe(
        "THIS MUST BE IN ENGLISH. Natural-language description of what information you're looking for concerning the pdf. The AI will analyze the pdf and provide a response focused on this objective.",
      ),
  }),
  handler: async (ctx, args): Promise<string> => {
    console.log(`📄 Analyzing pdf from URL: ${args.url}`);
    console.log(`📋 Objective: ${args.objective}`);

    await reportToolProgress(ctx, {
      stepType: "tool_launched=read_pdf",
    });

    try {
      // Analyser le pdf avec Anthropic (supporte les URLs directement)
      console.log(`🤖 Sending pdf to Anthropic for analysis...`);
      const result = await generateText({
        model: openrouter("anthropic/claude-sonnet-4-5"),
        messages: [
          {
            role: "user",
            content: [
              {
                type: "file",
                data: new URL(args.url),
                mediaType: "application/pdf",
              },
              {
                type: "text",
                text: args.objective,
              },
            ],
          },
        ],
      });

      await reportToolProgress(ctx, {
        stepType: "tool_completed=read_pdf",
      });

      console.log(`✅ PDF analysis complete`);
      return result.text;
    } catch (error) {
      console.error("View PDF error:", error);
      await reportToolProgress(ctx, {
        stepType: "tool_error=read_pdf",
      });
      throw new Error(
        `Failed to analyze PDF: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the URL and try again.`,
      );
    }
  },
});

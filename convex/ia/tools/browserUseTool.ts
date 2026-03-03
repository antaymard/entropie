import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { reportToolProgress } from "../../automation/progressReporter";

export const browserUseTool = createTool({
  description:
    "The browser tool can navigate to the page and interact with it like a human would, allowing it to access content that traditional extraction tools can't handle. **This tool is costly and slow to process. So use it when the webpages you tried to fetch with the traditional 'openWebPage' tool were too difficult or impossible to extract from, or when multi-step interactions are needed to access the content. This tool cannot use credentials to access protected content, or the user's personal information.**",
  inputSchema: z.object({
    task: z
      .string()
      .describe(
        "A single automation job executed by an AI agent in a browser environment. Tasks contain your instructions for what the AI should accomplish. Be specific: “Extract product names and prices from first page” vs “get product info”. Set boundaries: Specify pages to visit, items to process. Include context when needed: Mention login requirements, data format  \nExample: “Search for top 10 Hacker News posts and return titles and URLs” | “Extract product prices from this URL”.",
      ),
    startUrl: z
      .string()
      .optional()
      .describe("URL to navigate to before starting the task."),
    structuredOutput: z
      .string()
      .optional()
      .describe("JSON schema string for structured response format"),
  }),
  execute: async (ctx, { task, startUrl, structuredOutput }) => {
    console.log(
      `🤖 Browser use started: ${task}, starting in ${startUrl} and structured output: ${structuredOutput}`,
    );

    await reportToolProgress(ctx, {
      stepType: "tool_launched=browser_use",
      data: {
        task,
        startUrl,
        structuredOutput,
      },
    });

    try {
      const result: string = await ctx.runAction(
        internal.ia.tools.browserUseAction.run,
        { task, startUrl, structuredOutput },
      );

      console.log("✅ Browser use result:", result);

      await reportToolProgress(ctx, {
        stepType: "tool_completed=browser_use",
        data: {},
      });

      return result;
    } catch (error: any) {
      console.error("❌ Browser use error :", error);
      await reportToolProgress(ctx, {
        stepType: "tool_error=browser_use",
        data: {
          message: error.message,
        },
      });
      return `Extraction failed: ${JSON.stringify(error)}. Please try rephrasing your query.`;
    }
  },
});

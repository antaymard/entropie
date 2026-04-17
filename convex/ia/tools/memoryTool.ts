import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { ToolConfig, toolError } from "./toolHelpers";
import { toolAgentNames } from "../agentConfig";

export const createNodeToolConfig: ToolConfig = {
  name: "create_node",
  authorized_agents: [toolAgentNames.nole],
};

export const memoryTool = createTool({
  description:
    "Convert any public URL into clean, LLM-optimized markdown. It converts any public URL into clean markdown, including JavaScript-heavy pages and PDFs. It returns focused excerpts aligned to the objective, or full page content if requested.",
  args: z.object({
    explanation: z
      .string()
      .describe("3-5 words explaining the research intent."),
    urls: z
      .array(z.string())
      .describe(
        "List of URLs to extract content from. Maximum 10 URLs per request. \nExample: ['https://example.com/article1', 'https://example.com/article2']",
      ),
    objective: z
      .string()
      .describe(
        "THIS MUST BE IN ENGLISH. Natural-language description of what information you're looking for, including broader task context. When provided, focuses extracted content on relevant information. Maximum 3000 characters. \nExample: I'm researching React performance optimization. Find best practices for preventing unnecessary re-renders.",
      ),
    search_queries: z
      .array(z.string())
      .describe(
        "THIS MUST BE IN ENGLISH. Optional keyword queries to focus extraction. Use with or without objective to emphasize specific terms. \nExample: ['React.memo', 'useMemo', 'useCallback']",
      )
      .optional(),
  }),
  handler: async (ctx, { urls, objective, search_queries = [] }) => {
    console.log(`🔍 Web extract: ${objective}, ${urls.join(", ")}`);

    try {
      //   TODO
    } catch (error: any) {
      console.error("❌ Extract error:", error);
      return toolError(
        `Extraction failed: ${error.message}. Please try rephrasing your query.`,
      );
    }
  },
});

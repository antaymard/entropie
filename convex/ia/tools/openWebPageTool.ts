import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import Parallel from "parallel-web";
import { reportToolProgress } from "../../automation/progressReporter";

const client = new Parallel({
  apiKey: process.env.PARALLEL_API_KEY!,
});

export const openWebPageTool = createTool({
  description:
    "Convert any public URL into clean, LLM-optimized markdown. It converts any public URL into clean markdown, including JavaScript-heavy pages and PDFs. It returns focused excerpts aligned to the objective, or full page content if requested.",
  args: z.object({
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

    await reportToolProgress(ctx, {
      stepType: "tool_launched=web_extract",
      data: {
        urls,
        objective,
        search_queries,
      },
    });

    try {
      const search = await client.beta.extract({
        urls,
        search_queries,
        excerpts: true,
        full_content: true,
      });

      if (!search.results || search.results.length === 0) {
        return `No results found for: "${objective}"`;
      }

      await reportToolProgress(ctx, {
        stepType: "tool_completed=web_extract",
        data: {},
      });

      return search.results;
    } catch (error: any) {
      console.error("❌ Extract error:", error);
      return `Extraction failed: ${error.message}. Please try rephrasing your query.`;
    }
  },
});

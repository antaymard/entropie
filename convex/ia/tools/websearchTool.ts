import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import Parallel from "parallel-web";

const client = new Parallel({
  apiKey: process.env.PARALLEL_API_KEY!,
});

export const websearchTool = createTool({
  description: "Search the web for relevant information.",
  args: z.object({
    objective: z
      .string()
      .describe(
        "Natural-language description of the web research goal, including source or freshness guidance and broader context from the task. Maximum 5000 characters. Choose the right language, depending on the user's language, and the type of info needed. For example, if local or country specific, use the user language. \nExample:  I want to know when the UN was founded. Prefer UN's websites."
      ),
    search_queries: z
      .array(z.string())
      .describe(
        "Optional search queries to supplement the objective. Maximum 200 characters per query. Choose the right language, depending on the user's language, and the type of info needed. For example, if local or country specific, use the user language. \nExample: ['Founding year UN', 'Year of founding United Nations']"
      )
      .optional(),
  }),
  handler: async (ctx, { objective, search_queries = [] }) => {
    console.log(`🔍 Web search: ${objective}`);

    try {
      const search = await client.beta.search({
        objective,
        search_queries,
        excerpts: {
          max_chars_per_result: 800,
        },
      });

      if (!search.results || search.results.length === 0) {
        return `No results found for: "${objective}"`;
      }

      return search.results;
    } catch (error: any) {
      console.error("❌ Search error:", error);
      return `Search failed: ${error.message}. Please try rephrasing your query.`;
    }
  },
});

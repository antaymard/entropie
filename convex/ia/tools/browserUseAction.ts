"use node";

import { v } from "convex/values";
import { internalAction } from "../../_generated/server";
import { BrowserUseClient } from "browser-use-sdk";

const client = new BrowserUseClient({
  apiKey: process.env.BROWSER_USE_API_KEY,
});

export const run = internalAction({
  args: {
    task: v.string(),
    startUrl: v.optional(v.string()),
    structuredOutput: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (_ctx, { task, startUrl, structuredOutput }) => {
    const result = await client.tasks.createTask({
      task,
      startUrl,
      structuredOutput,
    });
    return JSON.stringify(result);
  },
});

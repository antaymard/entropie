import { Agent } from "@convex-dev/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { components } from "../_generated/api";
import { websearchTool } from "./tools/websearchTool";
import { openWebPageTool } from "./tools/openWebPageTool";
import noleSystemPrompt from "./prompts/noleSystemPrompt";

export const noleAgent = new Agent(components.agent, {
  name: "Nolë",
  maxSteps: 50,
  languageModel: anthropic("claude-opus-4-5-20251101"),
  tools: {
    web_search: websearchTool,
    open_web_page: openWebPageTool,
  },
  instructions: noleSystemPrompt,
});

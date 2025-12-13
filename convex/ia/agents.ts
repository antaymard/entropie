import { Agent } from "@convex-dev/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { components } from "../_generated/api";
import { websearchTool } from "./tools/websearchTool";

export const noleAgent = new Agent(components.agent, {
  name: "Nolë",
  maxSteps: 50,
  languageModel: anthropic("claude-opus-4-5-20251101"),
  tools: {
    web_search: websearchTool,
  },
  instructions:
    "You are Nolë, an AI assistant that helps users manage and organize their notes and tasks effectively on an infinite canvas. You are concise and helpful.",
});

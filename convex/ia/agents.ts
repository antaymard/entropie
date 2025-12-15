import { Agent } from "@convex-dev/agent";
import { anthropic } from "@ai-sdk/anthropic";
import { components } from "../_generated/api";
import noleSystemPrompt from "./prompts/noleSystemPrompt";
import { websearchTool } from "./tools/websearchTool";
import { openWebPageTool } from "./tools/openWebPageTool";
import { readCanvasTool } from "./tools/readCanvasTool";
import { viewImageTool } from "./tools/viewImageTool";
import { readNodeTemplatesTool } from "./tools/readNodeTemplatesTool";
import { createCanvasElementsTool } from "./tools/createCanvasElementsTool";

export const noleAgent = new Agent(components.agent, {
  name: "Nolë",
  maxSteps: 50,
  languageModel: anthropic("claude-sonnet-4-5"),
  tools: {
    web_search: websearchTool,
    open_web_page: openWebPageTool,
    // read_canvas: readCanvasTool,
    view_image: viewImageTool,
    read_node_templates: readNodeTemplatesTool,
    create_canvas_elements: createCanvasElementsTool,
  },
  instructions: noleSystemPrompt,
  contextOptions: {
    searchOtherThreads: true,
    searchOptions: {
      limit: 10,
      textSearch: true,
      // vectorSearch: true,
    },
  },
});

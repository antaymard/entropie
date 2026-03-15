import { Agent } from "@convex-dev/agent";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { components } from "../_generated/api";
import noleSystemPrompt from "./prompts/noleSystemPrompt";
import { websearchTool } from "./tools/websearchTool";
import { openWebPageTool } from "./tools/openWebPageTool";
import { readCanvasTool } from "./tools/readCanvasTool";
import { viewImageTool } from "./tools/viewImageTool";
import { readPdfTool } from "./tools/readPdfTool";
import { editCanvasNodesAndEdgesTool } from "./tools/editCanvasNodesAndEdgesTool";
import { readNodeConfigsTool } from "./tools/readNodeConfigsTool";
import { type LanguageModel } from "ai";
import { ActionCtx } from "../_generated/server";

export function createNoleAgent({
  ctx,
  model = openrouter("mistralai/mistral-large-2512"),
}: {
  ctx?: ActionCtx | null;
  model?: LanguageModel;
} = {}) {
  return new Agent(components.agent, {
    name: "Nolë",
    maxSteps: 15,
    languageModel: model,
    tools: {
      // read_node_templates: readNodeTemplatesTool,
      web_search: websearchTool,
      open_web_page: openWebPageTool,
      read_canvas: readCanvasTool,
      view_image: viewImageTool,
      read_pdf: readPdfTool,
      edit_canvas_nodes_and_edges: editCanvasNodesAndEdgesTool,
      read_node_configs: readNodeConfigsTool,
    },
    instructions: noleSystemPrompt,
    // contextOptions: {
    //   searchOtherThreads: true,
    //   searchOptions: {
    //     limit: 10,
    //     textSearch: true,
    //     // vectorSearch: true,
    //   },
    // },
  });
}

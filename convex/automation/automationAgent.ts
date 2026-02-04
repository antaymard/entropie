import { Agent } from "@convex-dev/agent";
import { mistral } from "@ai-sdk/mistral";
import { components } from "../_generated/api";
import { openWebPageTool } from "../ia/tools/openWebPageTool";
import { viewImageTool } from "../ia/tools/viewImageTool";
import { readPdfTool } from "../ia/tools/readPdfTool";
import { type LanguageModel } from "ai";
import { ActionCtx } from "../_generated/server";
import { websearchTool } from "../ia/tools/websearchTool";

export function createAutomationAgent({
  ctx,
  model = mistral("mistral-large-latest"),
}: {
  ctx?: ActionCtx | null;
  model?: LanguageModel;
} = {}) {
  return new Agent(components.agent, {
    name: "automation-agent",
    maxSteps: 5,
    languageModel: model,
    tools: {
      open_web_page: openWebPageTool,
      view_image: viewImageTool,
      read_pdf: readPdfTool,
      web_search: websearchTool,
    },
    instructions:
      "Tu es un agent d'automatisation, lié à un node sur une app canvas-base type miro. Tu peux utiliser les outils à ta disposition pour accomplir les tâches demandées. Le noeud auquel tu es lié peut contenir des données d'entrée d'autres noeuds (input) que tu devras le plus souvent utiliser pour accomplir ta tâche. Utilise les outils à ta disposition. ",
  });
}

import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { openWebPageTool } from "../ia/tools/openWebPageTool";
import { viewImageTool } from "../ia/tools/viewImageTool";
import { readPdfTool } from "../ia/tools/readPdfTool";
import { type LanguageModel } from "ai";
import { websearchTool } from "../ia/tools/websearchTool";
import { anthropic } from "@ai-sdk/anthropic";

export function createAutomationAgent({
  model = anthropic("claude-haiku-4-5"),
  updateNodeDataValuesTool,
}: {
  model?: LanguageModel;
  updateNodeDataValuesTool?: any;
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
      update_node_data_values: updateNodeDataValuesTool,
    },
    instructions: `Tu es un agent d'automatisation, lié à un node sur une app canvas-base type miro. Tu peux utiliser les outils à ta disposition pour accomplir les tâches demandées. Le noeud auquel tu es lié peut contenir des données d'entrée d'autres noeuds (input) que tu devras le plus souvent utiliser pour accomplir ta tâche. Utilise les outils à ta disposition pour trouver l'information.
      
    Ne réponds pas à l'utilisateur directement comme un chat. Utilise l'outil update_node_data_values pour mettre à jour les données du noeud auquel tu es lié en guise de réponse et de livraison de ton travail. 
    
    Sois le plus concis possible, exact et factuel. Ne fabrique pas d'informations. Ne sois pas verbeux.`,
  });
}

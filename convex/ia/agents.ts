import { components } from "../_generated/api";
import { Agent } from "@convex-dev/agent";
import { openrouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel, ToolSet } from "ai";
import type { NoleToolRuntimeContext } from "./noleToolRuntimeContext";
import nodeAgentTool from "./tools/nodeAgentTool";
import readNodesTool from "./tools/readNodesTool";
import { openWebPageTool } from "./tools/openWebPageTool";
import { websearchTool } from "./tools/websearchTool";
import stringReplaceDocumentContentTool from "./tools/stringReplaceDocumentContentTool";
import insertDocumentContentTool from "./tools/insertDocumentContentTool";

export function createBaseAgent({ model }: { model?: LanguageModel } = {}) {
  return new Agent(components.agent, {
    name: "base",
    languageModel: model ?? openrouter("mistralai/mistral-small-2603"),
  });
}

// Minimal agent used for utility operations (e.g. saveMessage) that don't require a specific model.
export const baseAgent = createBaseAgent();

export function createAutomationAgent({
  model,
  updateNodeDataValuesTool,
}: {
  model?: LanguageModel;
  updateNodeDataValuesTool?: unknown;
}) {
  void updateNodeDataValuesTool;
  return new Agent(components.agent, {
    name: "automation-agent",
    languageModel: model ?? openrouter("minimax/minimax-m2.7"),
    maxSteps: 5,
    instructions: `Tu es un agent d'automatisation, lié à un node sur une app canvas-base type miro. Tu peux utiliser les outils à ta disposition pour accomplir les tâches demandées. Le noeud auquel tu es lié peut contenir des données d'entrée d'autres noeuds (input) que tu devras le plus souvent utiliser pour accomplir ta tâche. Utilise les outils à ta disposition pour trouver l'information.
      
    Ne réponds pas à l'utilisateur directement comme un chat. Utilise l'outil update_node_data_values pour mettre à jour les données du noeud auquel tu es lié en guise de réponse et de livraison de ton travail. 
    
    Sois le plus concis possible, exact et factuel. Ne fabrique pas d'informations. Ne sois pas verbeux.`,
  });
}

// Not used for now
// export function createBrainAgent({ instructions }: { instructions: string }) {
//   return new Agent(components.agent, {
//     name: "Brain",
//     maxSteps: 15,
//     languageModel: openrouter("stepfun/step-3.5-flash:free"),
//     tools: {},
//     instructions,
//   });
// }

export function createNoleAgent({
  runtimeContext,
  tools = {},
}: {
  runtimeContext: NoleToolRuntimeContext;
  tools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: "Nolë",
    maxSteps: 8,
    languageModel: openrouter("minimax/minimax-m2.7"),
    tools: {
      read_nodes: readNodesTool(runtimeContext),
      node_and_edge_manipulation: nodeAgentTool(runtimeContext),
      open_webpage: openWebPageTool,
      websearch: websearchTool,
      string_replace_document_content: stringReplaceDocumentContentTool({
        canvasId: runtimeContext.canvasId,
      }),
      insert_document_content: insertDocumentContentTool({
        canvasId: runtimeContext.canvasId,
      }),
      ...tools,
    },
  });
}

export function createToolAgent({
  modelName = "mistralai/mistral-small-2603",
  tools = {},
  instructions,
}: {
  modelName?: string;
  tools?: ToolSet;
  instructions?: string;
} = {}) {
  const model = openrouter(modelName);
  return new Agent(components.agent, {
    name: "tool-agent",
    languageModel: model,
    tools,
    instructions,
    maxSteps: 5,
  });
}

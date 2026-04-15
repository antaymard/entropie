import { components } from "../_generated/api";
import { Agent } from "@convex-dev/agent";
import { openrouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel, ToolSet } from "ai";
import { toolAgentNames, type ThreadCtx } from "./agentConfig";
import { getToolsForAgent } from "./tools";

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
  threadCtx,
  tools = {},
}: {
  model?: LanguageModel;
  threadCtx: ThreadCtx;
  tools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: toolAgentNames.automation,
    languageModel: model ?? openrouter("minimax/minimax-m2.7"),
    maxSteps: 5,
    tools: getToolsForAgent({
      agentName: toolAgentNames.automation,
      threadCtx,
      extraTools: tools,
    }),
    instructions: `Tu es un agent d'automatisation, lié à un node sur une app canvas-base type miro. Tu peux utiliser les outils à ta disposition pour accomplir les tâches demandées. Le noeud auquel tu es lié peut contenir des données d'entrée d'autres noeuds (input) que tu devras le plus souvent utiliser pour accomplir ta tâche. Utilise les outils à ta disposition pour trouver l'information.
      
    Ne réponds pas à l'utilisateur comme un chat généraliste. Utilise directement les tools standards disponibles si une action sur le canvas ou sur les contenus est nécessaire.
    
    Sois le plus concis possible, exact et factuel. Ne fabrique pas d'informations. Ne sois pas verbeux.`,
  });
}

export function createNoleAgent({
  threadCtx,
  tools = {},
}: {
  threadCtx: ThreadCtx;
  tools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: "Nolë",
    maxSteps: 20,
    languageModel: openrouter("z-ai/glm-5.1"),
    tools: getToolsForAgent({
      agentName: toolAgentNames.nole,
      threadCtx,
      extraTools: tools,
    }),
  });
}

export function createCloneAgent({
  threadCtx,
  tools = {},
}: {
  threadCtx: ThreadCtx;
  tools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: "Clone",
    maxSteps: 20,
    languageModel: openrouter("z-ai/glm-5.1"),
    tools: getToolsForAgent({
      agentName: toolAgentNames.clone,
      threadCtx,
      extraTools: tools,
    }),
  });
}

export function createSupervisorAgent({
  threadCtx,
  tools = {},
}: {
  threadCtx: ThreadCtx;
  tools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: "Supervisor",
    maxSteps: 20,
    languageModel: openrouter("z-ai/glm-5.1"),
    tools: getToolsForAgent({
      agentName: toolAgentNames.supervisor,
      threadCtx,
      extraTools: tools,
    }),
  });
}

export function createWorkerAgent({
  threadCtx,
  tools = {},
}: {
  threadCtx: ThreadCtx;
  tools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: "Worker",
    maxSteps: 20,
    languageModel: openrouter("z-ai/glm-5.1"),
    tools: getToolsForAgent({
      agentName: toolAgentNames.worker,
      threadCtx,
      extraTools: tools,
    }),
  });
}

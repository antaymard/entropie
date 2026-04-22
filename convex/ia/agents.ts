import { components } from "../_generated/api";
import { Agent } from "@convex-dev/agent";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { v } from "convex/values";
import type { LanguageModel, ToolSet } from "ai";
import { toolAgentNames, type ThreadCtx } from "./agentConfig";
import { getToolsForAgent } from "./tools";

export const chatModelOptions = [
  {
    label: "Nemotron 3 Super 120B A12B",
    value: "nvidia/nemotron-3-super-120b-a12b:free",
    price: "Free",
  },
  {
    label: "Kimi K.2.6",
    value: "moonshotai/kimi-k2.6",
    price: "0.60_2.80",
  },
  {
    label: "GML 5.1",
    value: "z-ai/glm-5.1",
    price: "1.05_3.50",
  },
  {
    label: "Mistral Large 3",
    value: "mistralai/mistral-large-2512",
    price: "0.50_1.50",
  },
] as const;

export const chatModelValues = chatModelOptions.map((model) => model.value);

const defaultChatModelValue = chatModelValues[0];

export const vChatModelValues = v.union(
  ...chatModelValues.map((model) => v.literal(model)),
);

export type ChatModelValues = typeof vChatModelValues.type;

export type ChatModelOption = (typeof chatModelOptions)[number];

export function getChatModel(modelPreference: ChatModelValues): LanguageModel {
  return openrouter(modelPreference);
}

const defaultModels = {
  nole: getChatModel(defaultChatModelValue),
  fast: openrouter("mistralai/mistral-small-2603"),
};

export function createBaseAgent({ model }: { model?: LanguageModel } = {}) {
  return new Agent(components.agent, {
    name: "base",
    languageModel: model ?? defaultModels.fast,
  });
}

// Minimal agent used for utility operations (e.g. saveMessage) that don't require a specific model.
export const baseAgent = createBaseAgent();

export function createNoleAgent({
  model,
  threadCtx,
  extraTools = {},
}: {
  model?: LanguageModel;
  threadCtx: ThreadCtx;
  extraTools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: "Nolë",
    maxSteps: 20,
    languageModel: model ?? defaultModels.nole,
    tools: getToolsForAgent({
      agentName: toolAgentNames.nole,
      threadCtx,
      extraTools,
    }),
  });
}

export function createCloneAgent({
  threadCtx,
  extraTools = {},
  model,
}: {
  threadCtx: ThreadCtx;
  extraTools?: ToolSet;
  model?: LanguageModel;
}) {
  return new Agent(components.agent, {
    name: "Clone",
    maxSteps: 20,
    languageModel: model ?? defaultModels.nole,
    tools: getToolsForAgent({
      agentName: toolAgentNames.clone,
      threadCtx,
      extraTools,
    }),
  });
}

export function createSupervisorAgent({
  threadCtx,
  extraTools = {},
  model,
}: {
  threadCtx: ThreadCtx;
  extraTools?: ToolSet;
  model?: LanguageModel;
}) {
  return new Agent(components.agent, {
    name: "Supervisor",
    maxSteps: 20,
    languageModel: model ?? defaultModels.nole,
    tools: getToolsForAgent({
      agentName: toolAgentNames.supervisor,
      threadCtx,
      extraTools,
    }),
  });
}

export function createWorkerAgent({
  threadCtx,
  extraTools = {},
  model,
}: {
  threadCtx: ThreadCtx;
  extraTools?: ToolSet;
  model?: LanguageModel;
}) {
  return new Agent(components.agent, {
    name: "Worker",
    maxSteps: 20,
    languageModel: model ?? defaultModels.fast,
    tools: getToolsForAgent({
      agentName: toolAgentNames.worker,
      threadCtx,
      extraTools,
    }),
  });
}

export function createAutomationAgent({
  model,
  threadCtx,
  extraTools = {},
}: {
  model?: LanguageModel;
  threadCtx: ThreadCtx;
  extraTools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: toolAgentNames.automation,
    languageModel: model ?? defaultModels.fast,
    maxSteps: 5,
    tools: getToolsForAgent({
      agentName: toolAgentNames.automation,
      threadCtx,
      extraTools,
    }),
    instructions: `You are an automation agent linked to a node in a canvas-based app similar to Miro. You can use the tools at your disposal to accomplish the requested tasks. The node you are linked to may contain input data from other nodes that you will most often need to use to complete your task. Use the tools available to you to find information.
      
    Do not respond to the user as a general chat assistant. Use the standard tools available directly if an action on the canvas or content is necessary.
    
    Be as concise, exact, and factual as possible. Do not fabricate information. Do not be verbose.`,
  });
}

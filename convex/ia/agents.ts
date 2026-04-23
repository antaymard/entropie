import { components } from "../_generated/api";
import { Agent } from "@convex-dev/agent";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { v } from "convex/values";
import type { LanguageModelV3 } from "@ai-sdk/provider";
import type { ToolSet } from "ai";
import { stepCountIs } from "ai";
import { toolAgentNames, type ThreadCtx } from "./agentConfig";
import { getToolsForAgent } from "./tools";
import {
  createActionTool,
  defineAgentApi,
  streamHandlerAction,
} from "convex-durable-agents";
import { generateSupervisorSystemPrompt } from "./systemPrompts/supervisorSystemPrompt";

export const chatModelOptions = [
  {
    label: "Tencent Hy3 Free",
    value: "tencent/hy3-preview:free",
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
    label: "Qwen 3.5 Flash",
    value: "qwen/qwen3.5-flash-02-23",
    price: "0.065_0.26",
  },
] as const;

export const chatModelValues = chatModelOptions.map((model) => model.value);

const defaultChatModelValue = chatModelValues[0];

export const vChatModelValues = v.union(
  ...chatModelValues.map((model) => v.literal(model)),
);

export type ChatModelValues = typeof vChatModelValues.type;

export type ChatModelOption = (typeof chatModelOptions)[number];

export function getChatModel(
  modelPreference: ChatModelValues,
): LanguageModelV3 {
  return openrouter(modelPreference);
}

const defaultModels = {
  nole: getChatModel(defaultChatModelValue),
  fast: openrouter("mistralai/mistral-small-2603"),
};

export function createBaseAgent({ model }: { model?: LanguageModelV3 } = {}) {
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
  model?: LanguageModelV3;
  threadCtx: ThreadCtx;
  extraTools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: "Nolë",
    stopWhen: stepCountIs(20),
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
  model?: LanguageModelV3;
}) {
  return new Agent(components.agent, {
    name: "Clone",
    stopWhen: stepCountIs(20),
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
  model?: LanguageModelV3;
}) {
  return new Agent(components.agent, {
    name: "Supervisor",
    stopWhen: stepCountIs(20),
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
  model?: LanguageModelV3;
}) {
  return new Agent(components.agent, {
    name: "Worker",
    stopWhen: stepCountIs(20),
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
  model?: LanguageModelV3;
  threadCtx: ThreadCtx;
  extraTools?: ToolSet;
}) {
  return new Agent(components.agent, {
    name: toolAgentNames.automation,
    languageModel: model ?? defaultModels.fast,
    stopWhen: stepCountIs(5),
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

export const supervisorAgent = streamHandlerAction(components.durable_agents, {
  model: openrouter("tencent/hy3-preview:free"),
  system: generateSupervisorSystemPrompt(),
  tools: {},
});

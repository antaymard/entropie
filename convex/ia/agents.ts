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
    instructions: `You are an automation agent linked to a node in a canvas-based app similar to Miro. You can use the tools at your disposal to accomplish the requested tasks. The node you are linked to may contain input data from other nodes that you will most often need to use to complete your task. Use the tools available to you to find information.
      
    Do not respond to the user as a general chat assistant. Use the standard tools available directly if an action on the canvas or content is necessary.
    
    Be as concise, exact, and factual as possible. Do not fabricate information. Do not be verbose.`,
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
    languageModel: openrouter("openrouter/elephant-alpha"),
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

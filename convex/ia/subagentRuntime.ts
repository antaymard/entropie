import { v } from "convex/values";
import { internalAction } from "../_generated/server";
import {
  createCloneAgent,
  createSupervisorAgent,
  createWorkerAgent,
} from "./agents";
import { toolAgentNames } from "./agentConfig";

const delegationsByAgent = {
  [toolAgentNames.nole]: [
    toolAgentNames.clone,
    toolAgentNames.supervisor,
    toolAgentNames.worker,
  ],
  [toolAgentNames.clone]: [toolAgentNames.supervisor, toolAgentNames.worker],
  [toolAgentNames.supervisor]: [toolAgentNames.worker],
} as const;

type SupportedCurrentAgent = keyof typeof delegationsByAgent;
type SupportedSubagentType =
  (typeof delegationsByAgent)[SupportedCurrentAgent][number];

function assertDelegationAllowed({
  currentAgent,
  agentType,
}: {
  currentAgent: SupportedCurrentAgent;
  agentType: SupportedSubagentType;
}) {
  const allowed = delegationsByAgent[currentAgent] ?? [];
  if (!allowed.some((candidate) => candidate === agentType)) {
    throw new Error(
      `Delegation from ${currentAgent} to ${agentType} is not allowed.`,
    );
  }
}

export const run = internalAction({
  args: {
    currentAgent: v.union(
      v.literal(toolAgentNames.nole),
      v.literal(toolAgentNames.clone),
      v.literal(toolAgentNames.supervisor),
    ),
    agentType: v.union(
      v.literal(toolAgentNames.clone),
      v.literal(toolAgentNames.supervisor),
      v.literal(toolAgentNames.worker),
    ),
    explanation: v.string(),
    instructions: v.string(),
    authUserId: v.id("users"),
    canvasId: v.id("canvases"),
  },
  returns: v.object({
    agentId: v.string(),
    agentType: v.union(
      v.literal(toolAgentNames.clone),
      v.literal(toolAgentNames.supervisor),
      v.literal(toolAgentNames.worker),
    ),
    result: v.string(),
  }),
  handler: async (ctx, args) => {
    const currentAgent = args.currentAgent as SupportedCurrentAgent;
    const agentType = args.agentType as SupportedSubagentType;

    assertDelegationAllowed({ currentAgent, agentType });

    const threadCtx = {
      authUserId: args.authUserId,
      canvasId: args.canvasId,
    };

    const subagent =
      agentType === toolAgentNames.clone
        ? createCloneAgent({ threadCtx })
        : agentType === toolAgentNames.supervisor
          ? createSupervisorAgent({ threadCtx })
          : createWorkerAgent({ threadCtx });

    const { threadId, thread } = await subagent.createThread(ctx, {
      userId: args.authUserId,
      title: `__subagent__:${args.currentAgent}->${agentType}`,
    });

    const prompt = [
      `Delegation intent: ${args.explanation}`,
      "",
      "Follow these instructions precisely:",
      args.instructions,
    ].join("\n");

    const response = await thread.generateText({
      prompt,
    });

    return {
      agentId: threadId,
      agentType,
      result: response.text,
    };
  },
});

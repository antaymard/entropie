import { createTool } from "@convex-dev/agent";
import { type Id } from "../../_generated/dataModel";
import z from "zod";
import { toolError } from "./toolHelpers";

type SubagentType = "clone" | "supervisor" | "worker";
type CurrentAgent = "nolë" | SubagentType;

const availableSubagentTypesByAgent = {
  nolë: ["clone", "supervisor", "worker"],
  clone: ["supervisor", "worker"],
  supervisor: ["worker"],
  worker: [],
} as const satisfies Record<CurrentAgent, readonly SubagentType[]>;

const subagentTypeDescriptions: Record<SubagentType, string> = {
  clone:
    "Clone is a clone of yourself with full capacities and access to the canvas.",
  supervisor:
    "Supervisor has limited access to the canvas but is optimized for agent swarm coordination and delegation, based on your instructions.",
  worker:
    "Worker is a minimalist agent with no access to the canvas, optimized for executing specific tasks. You can spawn multiple workers for parallelization.",
};

function formatSubagentTypes(agentTypes: readonly SubagentType[]) {
  if (agentTypes.length === 1) {
    return agentTypes[0];
  }

  if (agentTypes.length === 2) {
    return `${agentTypes[0]} and ${agentTypes[1]}`;
  }

  return `${agentTypes.slice(0, -1).join(", ")}, and ${agentTypes[agentTypes.length - 1]}`;
}

function buildToolDescription(currentAgent: CurrentAgent) {
  const availableSubagentTypes = availableSubagentTypesByAgent[currentAgent];

  if (availableSubagentTypes.length === 0) {
    return "Run a sub-agent to execute a complex task or a part of the task. Use it for exploration or deep searches, token-heavy or horizontal tasks, or independant tasks that can be achieved by a separate agent. The more capable the agent, the more detailed the instructions you should provide. Think and plan with the user, but explore or execute with subagents. Never delegate understanding. Subagents have no context of the conversation with the user, so you need to provide all necessary information and instructions in the prompt. The current agent cannot delegate to any sub-agent.";
  }

  return `Run a sub-agent to execute a complex task or a part of the task. Use it for exploration or deep searches, token-heavy or horizontal tasks, or independant tasks that can be achieved by a separate agent. The more capable the agent, the more detailed the instructions you should provide. Think and plan with the user, but explore or execute with subagents. Never delegate understanding. Subagents have no context of the conversation with the user, so you need to provide all necessary information and instructions in the prompt. The current agent can delegate to ${formatSubagentTypes(availableSubagentTypes)}.`;
}

function buildAgentTypeDescription(
  availableSubagentTypes: readonly SubagentType[],
) {
  const supportedSubagentDescriptions = availableSubagentTypes.map(
    (subagentType) => subagentTypeDescriptions[subagentType],
  );

  return `The type and capabilities of the agent to delegate to. Available for the current agent: ${formatSubagentTypes(availableSubagentTypes)}. ${supportedSubagentDescriptions.join(" ")}`;
}

function buildArgsSchema(currentAgent: CurrentAgent) {
  const baseArgs = {
    explanation: z
      .string()
      .describe("3-5 words explaining the delegation intent."),
    instructions: z
      .string()
      .describe("The prompt or instructions for the sub-agent to follow."),
    agentId: z
      .string()
      .optional()
      .describe(
        "Provide if you want to continue a conversation with an already spawned agent.",
      ),
  };

  const availableSubagentTypes = availableSubagentTypesByAgent[currentAgent];

  if (availableSubagentTypes.length === 0) {
    return z.object(baseArgs);
  }

  return z.object({
    ...baseArgs,
    agentType: z
      .enum(
        availableSubagentTypes as unknown as [SubagentType, ...SubagentType[]],
      )
      .describe(buildAgentTypeDescription(availableSubagentTypes)),
  });
}

export default function runSubagent({
  currentAgent,
}: {
  canvasId: Id<"canvases">;
  currentAgent: CurrentAgent;
}) {
  if (currentAgent === "worker") {
    return null;
  }

  return createTool({
    description: buildToolDescription(currentAgent),
    args: buildArgsSchema(currentAgent),
    handler: async (): Promise<string> => {
      try {
        return `Node data updated for nodeId`;
      } catch {
        return toolError(`Error while setting node data for nodeId `);
      }
    },
  });
}

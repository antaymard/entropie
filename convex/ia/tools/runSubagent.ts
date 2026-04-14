import { createTool } from "@convex-dev/agent";
import {
  toolAgentNames,
  type ThreadCtx,
  type ToolAgentName,
} from "../agentConfig";
import z from "zod";
import { type ToolConfig, toolError } from "./toolHelpers";

export const runSubagentToolConfig: ToolConfig = {
  name: "run_subagent",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
  ],
};

// Single source of truth: fill/update this object and the rest stays in sync.
const runSubagentConfig = {
  availableSubagentTypesByAgent: {
    [toolAgentNames.nole]: [
      toolAgentNames.clone,
      toolAgentNames.supervisor,
      toolAgentNames.worker,
    ],
    [toolAgentNames.clone]: [toolAgentNames.supervisor, toolAgentNames.worker],
    [toolAgentNames.supervisor]: [toolAgentNames.worker],
  },
  subagentTypeDescriptions: {
    [toolAgentNames.clone]:
      "A full capable agent, similar to Nolë but with no memory of past interactions.",
    [toolAgentNames.supervisor]:
      "An agent specialized in overseeing and coordinating agent workers, and follow detailed instructions from higher-level agents. This agent makes sure a given plan is achieved, by delegating to workers and checking their results. It will not plan by itself, but it will execute a plan provided to it.",
    [toolAgentNames.worker]:
      "An agent focused on executing specific tasks with efficiency and precision, following instructions closely. Best for well-defined, narrow tasks. ",
  },
} as const;

type SubagentType =
  (typeof runSubagentConfig.availableSubagentTypesByAgent)[keyof typeof runSubagentConfig.availableSubagentTypesByAgent][number];

export default function runSubagent({
  currentAgent,
  threadCtx,
}: {
  currentAgent: ToolAgentName;
  threadCtx: ThreadCtx;
}) {
  void threadCtx;

  const available =
    (
      runSubagentConfig.availableSubagentTypesByAgent as Record<
        string,
        readonly SubagentType[]
      >
    )[currentAgent] ?? [];
  const descriptions = available
    .map((t) => `${t}: ${runSubagentConfig.subagentTypeDescriptions[t]}`)
    .join(". ");

  return createTool({
    description: `Run a sub-agent to execute a complex task or a part of the task. Use it for exploration or deep searches, token-heavy or horizontal tasks, or independent tasks that can be achieved by a separate agent. The more capable the agent, the more detailed the instructions you should provide. Think and plan with the user, but explore or execute with subagents. Never delegate understanding. Subagents have no context of the conversation with the user, so you need to provide all necessary information and instructions in the prompt. The current agent can delegate to: ${available.join(", ")}.`,
    args: z.object({
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
      agentType: z
        // `available` is guaranteed non-empty: only agents with an entry in
        // availableSubagentTypesByAgent are in authorized_agents.
        .enum(available as unknown as [SubagentType, ...SubagentType[]])
        .describe(`The type of agent to delegate to. ${descriptions}`),
    }),
    handler: async (): Promise<string> => {
      try {
        return `Node data updated for nodeId`;
      } catch {
        return toolError(`Error while setting node data for nodeId `);
      }
    },
  });
}

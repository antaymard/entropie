import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { generateLlmId } from "../../lib/llmId";

import { ToolConfig } from "./toolHelpers";
import { ThreadCtx, toolAgentNames } from "../agentConfig";

export const runTaskToolConfig: ToolConfig = {
  name: "run_task",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
  ],
};

const runTaskInputSchema = z.object({
  nodeId: z
    .string()
    .optional()
    .describe("Target deliverable node ID (optional)."),
  instructions: z.string().describe(
    `Detailed instructions for the task. Follow this structure : 
        ## Objective
        Final objective of the task, what needs to be achieved. Be precise and clear. Outcome oriented.
        ## Informations & Constraints
        Any relevant information to achieve the task, such as context, resources, constraints, etc.
        The task supervisor will take care of planning and delegating subtasks to achieve the final objective, no need to specify subtasks here. But if some specific steps are required, you can specify them here as well. 
        ## Output
        The expected output of the task. If a nodeId is provided, describe how the output should be delivered in the node : as content ? as children nodes ? Describe the expected structure and content of the output in detail.
        `,
  ),
});

type RunTaskInput = z.infer<typeof runTaskInputSchema>;

type RunTaskResult = {
  success: boolean;
  taskId?: string;
  status?: "ready" | "queued" | "running" | "success" | "error" | "stopped";
  message?: string;
  startedAt?: number;
  startedAgo?: number;
  nodeId?: string;
  error?: string;
};

function buildTaskName(instructions: string): string {
  const trimmed = instructions.trim();
  if (!trimmed) {
    return "Task";
  }

  const firstLine = trimmed.split("\n")[0].trim();
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
}

export function runTaskTool({ threadCtx }: { threadCtx: ThreadCtx }) {
  const { canvasId } = threadCtx;

  return createTool({
    description:
      "Create and run a new task. Use this to delegate heavy work to a sub-agent, or to create and start long-term tasks.",
    inputSchema: runTaskInputSchema,
    execute: async (ctx, input: RunTaskInput): Promise<string> => {
      console.log(
        `Executing run_task tool with input: ${JSON.stringify(input)}`,
      );
      try {
        const now = Date.now();
        const threadId = ctx.threadId;

        if (!threadId) {
          return JSON.stringify({
            success: false,
            error: "Missing threadId in tool context.",
          } satisfies RunTaskResult);
        }

        const taskId = generateLlmId();
        await ctx.runMutation(internal.wrappers.taskWrappers.create, {
          id: taskId,
          canvasId,
          instructions: input.instructions,
          status: "ready",
          name: buildTaskName(input.instructions),
          nodeId: input.nodeId,
        });

        const didRun = await ctx.runMutation(
          internal.wrappers.taskWrappers.run,
          {
            id: taskId,
            startTime: now,
          },
        );

        if (!didRun) {
          return JSON.stringify({
            success: false,
            taskId: taskId,
            error: `Task ${taskId} could not be started.`,
          } satisfies RunTaskResult);
        }

        return JSON.stringify({
          success: true,
          taskId: taskId,
          status: "running",
          startedAt: now,
          startedAgo: 0,
          message: "Task created and started.",
          nodeId: input.nodeId,
        } satisfies RunTaskResult);
      } catch (error) {
        console.error("Run_task tool error:", error);
        return JSON.stringify({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to execute run_task operation.",
        } satisfies RunTaskResult);
      }
    },
  });
}

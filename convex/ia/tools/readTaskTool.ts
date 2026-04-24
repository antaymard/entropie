import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import type { Doc } from "../../_generated/dataModel";

import { ToolConfig } from "./toolHelpers";
import { ThreadCtx, toolAgentNames } from "../agentConfig";

export const readTaskToolConfig: ToolConfig = {
  name: "read_task",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
  ],
};

const readTaskInputSchema = z.object({
  taskId: z.string().describe("Task ID to read."),
});

type ReadTaskInput = z.infer<typeof readTaskInputSchema>;

type TaskResult = {
  success: boolean;
  taskId?: string;
  status?: "ready" | "queued" | "running" | "success" | "error" | "stopped";
  message?: string;
  currentStep?: string;
  startedAt?: number;
  startedAgo?: number;
  executionDuration?: number;
  completedAgo?: number;
  resultMessage?: string;
  learnings?: string;
  nodeId?: string;
  error?: string;
};

type TaskDoc = Doc<"tasks">;

function toResultStatus(status: TaskDoc["status"]): TaskResult["status"] {
  return status === "pending" ? "queued" : status;
}

function mapTaskToResult(task: TaskDoc, now: number): TaskResult {
  const startedAt = task.startTime;
  const completedAt = task.endTime;

  return {
    success: true,
    taskId: task.id,
    status: toResultStatus(task.status),
    startedAt,
    startedAgo: startedAt ? Math.floor((now - startedAt) / 1000) : undefined,
    executionDuration:
      startedAt && completedAt
        ? Math.max(0, Math.floor((completedAt - startedAt) / 1000))
        : undefined,
    completedAgo: completedAt
      ? Math.floor((now - completedAt) / 1000)
      : undefined,
    resultMessage: task.resultMessage,
    nodeId: task.nodeId,
  };
}

export function readTaskTool({ threadCtx }: { threadCtx: ThreadCtx }) {
  return createTool({
    description: "Read the status, result or errors of an existing task.",
    inputSchema: readTaskInputSchema,
    execute: async (ctx, input: ReadTaskInput): Promise<string> => {
      console.log(
        `Executing read_task tool with input: ${JSON.stringify(input)}`,
      );
      try {
        const now = Date.now();

        const task = await ctx.runQuery(internal.wrappers.taskWrappers.read, {
          id: input.taskId,
        });

        if (!task) {
          return JSON.stringify({
            success: false,
            taskId: input.taskId,
            error: `Task ${input.taskId} not found.`,
          } satisfies TaskResult);
        }

        return JSON.stringify(mapTaskToResult(task, now));
      } catch (error) {
        console.error("Read_task tool error:", error);
        return JSON.stringify({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to execute read_task operation.",
        } satisfies TaskResult);
      }
    },
  });
}

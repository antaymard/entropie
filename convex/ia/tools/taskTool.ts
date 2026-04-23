import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { generateLlmId } from "../../lib/llmId";
import type { GenericId } from "convex/values";

import { ToolConfig } from "./toolHelpers";
import { ThreadCtx, toolAgentNames } from "../agentConfig";
import type { Doc } from "../../_generated/dataModel";

export const taskToolConfig: ToolConfig = {
  name: "task",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
  ],
};

const taskInputSchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("create"),
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
  }),
  z.object({
    operation: z.literal("run"),
    taskId: z.string().describe("Task ID to start."),
  }),
  z.object({
    operation: z.literal("read"),
    taskId: z.string().describe("Task ID to read."),
  }),
  z.object({
    operation: z.literal("stop"),
    taskId: z.string().describe("Task ID to stop."),
  }),
]);

type TaskInput = z.infer<typeof taskInputSchema>;

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

function buildTaskName(instructions: string): string {
  const trimmed = instructions.trim();
  if (!trimmed) {
    return "Task";
  }

  const firstLine = trimmed.split("\n")[0].trim();
  return firstLine.length > 80 ? `${firstLine.slice(0, 77)}...` : firstLine;
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

export function taskTool({ threadCtx }: { threadCtx: ThreadCtx }) {
  const { canvasId } = threadCtx;

  return createTool({
    description:
      "Manage tasks (create, run, read, stop). Use this to delegate heavy work to a sub-agent, or to create long-term tasks you can check later.",
    inputSchema: taskInputSchema,
    execute: async (ctx, input: TaskInput): Promise<string> => {
      try {
        const now = Date.now();
        const threadId = ctx.threadId;

        if (!threadId) {
          return JSON.stringify({
            success: false,
            error: "Missing threadId in tool context.",
          } satisfies TaskResult);
        }

        const typedThreadId = threadId as GenericId<"threads">;

        switch (input.operation) {
          case "create": {
            const taskId = generateLlmId();
            await ctx.runMutation(internal.wrappers.taskWrappers.create, {
              id: taskId,
              canvasId,
              threadId: typedThreadId,
              instructions: input.instructions,
              status: "ready",
              name: buildTaskName(input.instructions),
              nodeId: input.nodeId,
            });

            return JSON.stringify({
              success: true,
              taskId,
              status: "ready",
              message: "Task created and ready.",
              nodeId: input.nodeId,
            } satisfies TaskResult);
          }

          case "run": {
            const didRun = await ctx.runMutation(
              internal.wrappers.taskWrappers.run,
              {
                id: input.taskId,
                startTime: now,
              },
            );

            if (!didRun) {
              return JSON.stringify({
                success: false,
                taskId: input.taskId,
                error: `Task ${input.taskId} not found.`,
              } satisfies TaskResult);
            }

            return JSON.stringify({
              success: true,
              taskId: input.taskId,
              status: "running",
              startedAt: now,
              startedAgo: 0,
              message: "Task started.",
            } satisfies TaskResult);
          }

          case "read": {
            const task = await ctx.runQuery(
              internal.wrappers.taskWrappers.read,
              {
                id: input.taskId,
              },
            );

            if (!task) {
              return JSON.stringify({
                success: false,
                taskId: input.taskId,
                error: `Task ${input.taskId} not found.`,
              } satisfies TaskResult);
            }

            return JSON.stringify(mapTaskToResult(task, now));
          }

          case "stop": {
            const didStop = await ctx.runMutation(
              internal.wrappers.taskWrappers.stop,
              {
                id: input.taskId,
                endTime: now,
              },
            );

            if (!didStop) {
              return JSON.stringify({
                success: false,
                taskId: input.taskId,
                error: `Task ${input.taskId} not found.`,
              } satisfies TaskResult);
            }

            const task = await ctx.runQuery(
              internal.wrappers.taskWrappers.read,
              {
                id: input.taskId,
              },
            );

            if (!task) {
              return JSON.stringify({
                success: true,
                taskId: input.taskId,
                status: "stopped",
                message: "Task stopped.",
              } satisfies TaskResult);
            }

            return JSON.stringify({
              ...mapTaskToResult(task, now),
              status: "stopped",
              message: "Task stopped.",
            } satisfies TaskResult);
          }
        }
      } catch (error) {
        console.error("Task tool error:", error);
        return JSON.stringify({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to execute task operation.",
        } satisfies TaskResult);
      }
    },
  });
}

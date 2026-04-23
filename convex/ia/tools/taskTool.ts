import { createTool } from "@convex-dev/agent";
import { z } from "zod";

import { ToolConfig } from "./toolHelpers";
import { ThreadCtx, toolAgentNames } from "../agentConfig";

export const taskToolConfig: ToolConfig = {
  name: "task",
  authorized_agents: [
    toolAgentNames.nole,
    toolAgentNames.clone,
    toolAgentNames.supervisor,
  ],
};

export function taskTool({ threadCtx }: { threadCtx: ThreadCtx }) {
  const { canvasId } = threadCtx;

  return createTool({
    description:
      "Manipulate task (create, update, delete, read result or status). Use this to delegate heavy work to a sub-agent, or to create long-term tasks that can be checked on later. ",
    inputSchema: z.object({
      operation: z.enum(["create", "update", "delete", "read"]),
    }),
    execute: async (ctx, input): Promise<string> => {
      try {
        console.log(input);
        return "ok";
      } catch (error) {
        console.error("Task tool error:", error);
        throw new Error(
          `Failed to execute task operation: ${error instanceof Error ? error.message : "Unknown error"}. Please verify the input and try again.`,
        );
      }
    },
  });
}

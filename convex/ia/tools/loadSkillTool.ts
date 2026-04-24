import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import type { Doc } from "../../_generated/dataModel";
import { toolAgentNames, type ThreadCtx } from "../agentConfig";
import { ToolConfig, toolError } from "./toolHelpers";

export const loadSkillToolConfig: ToolConfig = {
  name: "load_skill",
  authorized_agents: [toolAgentNames.nole],
};

export default function loadSkillTool({
  threadCtx,
}: {
  threadCtx: ThreadCtx;
}) {
  return createTool({
    description:
      "Load a skill's full content by its exact name. Use this when the user's request matches one of the skills listed in <available_skills>. Returns the skill body and the list of its attachments (name + type). To read an attachment's content, use read_skill_attachment.",
    args: z.object({
      name: z
        .string()
        .describe("The exact name of the skill, as listed in <available_skills>."),
    }),
    handler: async (ctx, args): Promise<string> => {
      try {
        const skill = await ctx.runQuery(
          internal.wrappers.skillWrappers.findByNameForUser,
          {
            userId: threadCtx.authUserId,
            name: args.name,
          },
        );

        if (!skill) {
          return toolError(`No skill named '${args.name}' is available.`);
        }

        const attachments = await ctx.runQuery(
          internal.wrappers.skillWrappers.listAttachments,
          { skillId: skill._id },
        );

        return JSON.stringify({
          success: true,
          name: skill.name,
          description: skill.description,
          body: skill.content,
          attachments: attachments.map(
            (attachment: Doc<"skillAttachments">) => ({
              name: attachment.name,
              type: attachment.type,
            }),
          ),
        });
      } catch (error) {
        return toolError(
          `Error while loading skill: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  });
}

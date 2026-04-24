import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { internal } from "../../_generated/api";
import { toolAgentNames, type ThreadCtx } from "../agentConfig";
import { ToolConfig, toolError } from "./toolHelpers";

export const readSkillAttachmentToolConfig: ToolConfig = {
  name: "read_skill_attachment",
  authorized_agents: [toolAgentNames.nole],
};

export default function readSkillAttachmentTool({
  threadCtx,
}: {
  threadCtx: ThreadCtx;
}) {
  return createTool({
    description:
      "Read the full content of an attachment belonging to a skill. Use this after load_skill when the skill's body references an attachment you need to consult (reference doc, script, template, etc.).",
    args: z.object({
      skill_name: z.string().describe("Exact name of the skill."),
      attachment_name: z
        .string()
        .describe("Exact name of the attachment, as returned by load_skill."),
    }),
    handler: async (ctx, args): Promise<string> => {
      try {
        const skill = await ctx.runQuery(
          internal.wrappers.skillWrappers.findByNameForUser,
          {
            userId: threadCtx.authUserId,
            name: args.skill_name,
          },
        );

        if (!skill) {
          return toolError(`No skill named '${args.skill_name}' is available.`);
        }

        const attachment = await ctx.runQuery(
          internal.wrappers.skillWrappers.findAttachmentByName,
          {
            skillId: skill._id,
            name: args.attachment_name,
          },
        );

        if (!attachment) {
          return toolError(
            `No attachment named '${args.attachment_name}' on skill '${args.skill_name}'.`,
          );
        }

        return JSON.stringify({
          success: true,
          skill_name: skill.name,
          attachment_name: attachment.name,
          type: attachment.type,
          content: attachment.content,
        });
      } catch (error) {
        return toolError(
          `Error while reading skill attachment: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  });
}

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
      "Load a resource by its exact name. First tries to match a skill listed in <available_skills> (returns the skill body and the list of its attachments). If no skill matches, tries to match an attachment that belongs to one of your accessible skills (returns the attachment content). Use this tool when the user's request matches a skill, then again with an attachment name as referenced in the skill body.",
    args: z.object({
      name: z
        .string()
        .describe(
          "The exact name of a skill (as listed in <available_skills>) or of an attachment (as referenced in a previously loaded skill's body).",
        ),
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

        if (skill) {
          const attachments = await ctx.runQuery(
            internal.wrappers.skillWrappers.listAttachments,
            { skillId: skill._id },
          );

          return JSON.stringify({
            success: true,
            kind: "skill",
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
        }

        const attachmentMatch = await ctx.runQuery(
          internal.wrappers.skillWrappers.findAttachmentByNameForUser,
          {
            userId: threadCtx.authUserId,
            name: args.name,
          },
        );

        if (attachmentMatch) {
          return JSON.stringify({
            success: true,
            kind: "attachment",
            name: attachmentMatch.attachment.name,
            type: attachmentMatch.attachment.type,
            content: attachmentMatch.attachment.content,
            parent_skill: attachmentMatch.skill.name,
          });
        }

        return toolError(
          `No skill or attachment named '${args.name}' is available.`,
        );
      } catch (error) {
        return toolError(
          `Error while loading skill: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    },
  });
}

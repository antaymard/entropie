import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Skill = Doc<"skills">;
type SkillAttachment = Doc<"skillAttachments">;

export async function listAvailableForUser(
  ctx: QueryCtx,
  { userId }: { userId: Id<"users"> },
): Promise<Skill[]> {
  const [userSkills, systemSkills] = await Promise.all([
    ctx.db
      .query("skills")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect(),
    ctx.db
      .query("skills")
      .withIndex("by_isSystem", (q) => q.eq("isSystem", true))
      .collect(),
  ]);

  const seen = new Set<Id<"skills">>();
  const merged: Skill[] = [];
  for (const skill of [...userSkills, ...systemSkills]) {
    if (seen.has(skill._id)) continue;
    seen.add(skill._id);
    merged.push(skill);
  }
  return merged;
}

export async function findByNameForUser(
  ctx: QueryCtx,
  { userId, name }: { userId: Id<"users">; name: string },
): Promise<Skill | null> {
  const userMatch = await ctx.db
    .query("skills")
    .withIndex("by_user_and_name", (q) =>
      q.eq("userId", userId).eq("name", name),
    )
    .unique();
  if (userMatch) return userMatch;

  const systemMatches = await ctx.db
    .query("skills")
    .withIndex("by_isSystem", (q) => q.eq("isSystem", true))
    .collect();
  return systemMatches.find((skill) => skill.name === name) ?? null;
}

export async function listAttachments(
  ctx: QueryCtx,
  { skillId }: { skillId: Id<"skills"> },
): Promise<SkillAttachment[]> {
  return await ctx.db
    .query("skillAttachments")
    .withIndex("by_skill", (q) => q.eq("skillId", skillId))
    .collect();
}

export async function findAttachmentByName(
  ctx: QueryCtx,
  { skillId, name }: { skillId: Id<"skills">; name: string },
): Promise<SkillAttachment | null> {
  return await ctx.db
    .query("skillAttachments")
    .withIndex("by_skill_and_name", (q) =>
      q.eq("skillId", skillId).eq("name", name),
    )
    .unique();
}

export async function insertSkill(
  ctx: MutationCtx,
  args: {
    name: string;
    description: string;
    content: string;
    userId?: Id<"users">;
    isSystem: boolean;
  },
): Promise<Id<"skills">> {
  return await ctx.db.insert("skills", args);
}

export async function patchSkill(
  ctx: MutationCtx,
  {
    skillId,
    ...patch
  }: {
    skillId: Id<"skills">;
    name?: string;
    description?: string;
    content?: string;
  },
): Promise<void> {
  await ctx.db.patch(skillId, patch);
}

export async function deleteSkillCascade(
  ctx: MutationCtx,
  { skillId }: { skillId: Id<"skills"> },
): Promise<void> {
  const attachments = await listAttachments(ctx, { skillId });
  for (const attachment of attachments) {
    await ctx.db.delete(attachment._id);
  }
  await ctx.db.delete(skillId);
}

export async function insertAttachment(
  ctx: MutationCtx,
  args: {
    skillId: Id<"skills">;
    name: string;
    content: string;
    type: SkillAttachment["type"];
  },
): Promise<Id<"skillAttachments">> {
  return await ctx.db.insert("skillAttachments", args);
}

export async function deleteAttachment(
  ctx: MutationCtx,
  { attachmentId }: { attachmentId: Id<"skillAttachments"> },
): Promise<void> {
  await ctx.db.delete(attachmentId);
}

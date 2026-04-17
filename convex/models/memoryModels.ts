import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Memory = Doc<"memories">;

/**
 * Upsert: si une memory avec le même subjectId + type existe, on patch.
 * Sinon, on insère.
 */
export async function upsert(
  ctx: MutationCtx,
  {
    subjectType,
    subjectId,
    type,
    content,
  }: Pick<Memory, "subjectType" | "subjectId" | "type" | "content">,
): Promise<boolean> {
  const existingMemory = await ctx.db
    .query("memories")
    .withIndex("by_subject_and_type", (q) =>
      q.eq("subjectId", subjectId).eq("type", type),
    )
    .unique();

  const now = Date.now();

  if (existingMemory) {
    await ctx.db.patch(existingMemory._id, {
      content,
      subjectType,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("memories", {
      subjectType,
      subjectId,
      type,
      content,
      updatedAt: now,
    });
  }

  return true;
}

export async function read(
  ctx: QueryCtx,
  { subjectId, type }: Pick<Memory, "subjectId" | "type">,
) {
  return await ctx.db
    .query("memories")
    .withIndex("by_subject_and_type", (q) =>
      q.eq("subjectId", subjectId).eq("type", type),
    )
    .unique();
}

export async function list(
  ctx: QueryCtx,
  { subjectId }: Pick<Memory, "subjectId">,
) {
  return await ctx.db
    .query("memories")
    .withIndex("by_subject_and_type", (q) => q.eq("subjectId", subjectId))
    .collect();
}

import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type AiMemory = Doc<"aiMemory">;

/**
 * Upsert: si une aiMemory avec le même subjectId + memoryType existe, on patch.
 * Sinon, on insère.
 */
export async function upsert(
  ctx: MutationCtx,
  {
    subjectType,
    subjectId,
    memoryType,
    content,
  }: Pick<AiMemory, "subjectType" | "subjectId" | "memoryType" | "content">,
): Promise<boolean> {
  const existing = await ctx.db
    .query("aiMemory")
    .withIndex("by_subject_and_type", (q) =>
      q.eq("subjectId", subjectId).eq("memoryType", memoryType),
    )
    .unique();

  const now = Date.now();

  if (existing) {
    await ctx.db.patch(existing._id, {
      content,
      subjectType,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("aiMemory", {
      subjectType,
      subjectId,
      memoryType,
      content,
      updatedAt: now,
    });
  }

  return true;
}

export async function read(
  ctx: QueryCtx,
  { subjectId, memoryType }: Pick<AiMemory, "subjectId" | "memoryType">,
) {
  return await ctx.db
    .query("aiMemory")
    .withIndex("by_subject_and_type", (q) =>
      q.eq("subjectId", subjectId).eq("memoryType", memoryType),
    )
    .unique();
}

export async function list(
  ctx: QueryCtx,
  { subjectId }: Pick<AiMemory, "subjectId">,
) {
  return await ctx.db
    .query("aiMemory")
    .withIndex("by_subject_and_type", (q) => q.eq("subjectId", subjectId))
    .collect();
}

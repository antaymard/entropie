import type { Doc } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Metadata = Doc<"metadata">;

/**
 * Upsert: si une metadata avec le même subjectId + memoryType existe, on patch.
 * Sinon, on insère.
 */
export async function upsert(
  ctx: MutationCtx,
  {
    subjectType,
    subjectId,
    memoryType,
    content,
  }: Pick<Metadata, "subjectType" | "subjectId" | "memoryType" | "content">,
): Promise<boolean> {
  const existing = await ctx.db
    .query("metadata")
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
    await ctx.db.insert("metadata", {
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
  { subjectId, memoryType }: Pick<Metadata, "subjectId" | "memoryType">,
) {
  return await ctx.db
    .query("metadata")
    .withIndex("by_subject_and_type", (q) =>
      q.eq("subjectId", subjectId).eq("memoryType", memoryType),
    )
    .unique();
}

export async function list(
  ctx: QueryCtx,
  { subjectId }: Pick<Metadata, "subjectId">,
) {
  return await ctx.db
    .query("metadata")
    .withIndex("by_subject_and_type", (q) => q.eq("subjectId", subjectId))
    .collect();
}

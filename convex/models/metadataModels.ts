import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Metadata = Doc<"metadatas">;

/**
 * Upsert: si une metadata avec le même subjectId + type existe, on patch.
 * Sinon, on insère.
 */
export async function upsert(
  ctx: MutationCtx,
  {
    subjectType,
    subjectId,
    type,
    content,
    canvasId,
  }: Pick<Metadata, "subjectType" | "subjectId" | "type" | "content"> & {
    canvasId: Id<"canvases">;
  },
): Promise<boolean> {
  const existing = await ctx.db
    .query("metadatas")
    .withIndex("by_subject_and_type", (q) =>
      q.eq("subjectId", subjectId).eq("type", type),
    )
    .unique();

  const now = Date.now();

  if (existing) {
    await ctx.db.patch(existing._id, {
      content,
      subjectType,
      canvasId,
      updatedAt: now,
    });
  } else {
    await ctx.db.insert("metadatas", {
      subjectType,
      subjectId,
      type,
      content,
      canvasId,
      updatedAt: now,
    });
  }

  return true;
}

export async function read(
  ctx: QueryCtx,
  { subjectId, type }: Pick<Metadata, "subjectId" | "type">,
) {
  return await ctx.db
    .query("metadatas")
    .withIndex("by_subject_and_type", (q) =>
      q.eq("subjectId", subjectId).eq("type", type),
    )
    .unique();
}

export async function list(
  ctx: QueryCtx,
  { subjectId }: Pick<Metadata, "subjectId">,
) {
  return await ctx.db
    .query("metadatas")
    .withIndex("by_subject_and_type", (q) => q.eq("subjectId", subjectId))
    .collect();
}

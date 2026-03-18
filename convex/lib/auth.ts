import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { ConvexError } from "convex/values";
import errors from "../config/errorsConfig";

// Pour les mutations - throw si non authentifié (catch côté front)
export async function requireAuth(ctx: QueryCtx | MutationCtx | ActionCtx) {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new ConvexError(errors.UNAUTHORIZED_USER);
  } else return userId;
}

export type CanvasPermission = "viewer" | "editor" | "owner";

type CanvasAccessResult = {
  canvas: Doc<"canvases">;
  permission: CanvasPermission;
};

/**
 * Vérifie l'accès d'un user à un canvas.
 * Retourne { canvas, permission } ou null si aucun accès.
 */
export async function getCanvasAccess(
  ctx: QueryCtx | MutationCtx,
  canvasId: Id<"canvases">,
  userId: Id<"users">,
): Promise<CanvasAccessResult | null> {
  const canvas = await ctx.db.get(canvasId);
  if (!canvas) return null;

  // Owner = full access
  if (canvas.creatorId === userId) return { canvas, permission: "owner" };

  // Check shares
  const share = await ctx.db
    .query("shares")
    .withIndex("by_canvas_and_user", (q) =>
      q.eq("canvasId", canvasId).eq("userId", userId),
    )
    .unique();

  if (!share) return null;
  return { canvas, permission: share.permission };
}

/**
 * Vérifie que l'user a au moins le niveau de permission requis sur le canvas.
 * Throw si canvas introuvable ou non autorisé. Retourne le canvas + permission.
 */
export async function requireCanvasAccess(
  ctx: QueryCtx | MutationCtx,
  canvasId: Id<"canvases">,
  userId: Id<"users">,
  minPermission: CanvasPermission = "viewer",
): Promise<CanvasAccessResult> {
  const canvas = await ctx.db.get(canvasId);
  if (!canvas) {
    throw new ConvexError(errors.CANVAS_NOT_FOUND);
  }

  // Owner = full access
  if (canvas.creatorId === userId) return { canvas, permission: "owner" };

  // Check shares
  const share = await ctx.db
    .query("shares")
    .withIndex("by_canvas_and_user", (q) =>
      q.eq("canvasId", canvasId).eq("userId", userId),
    )
    .unique();

  if (!share) {
    throw new ConvexError(errors.CANVAS_NOT_FOUND);
  }

  const levels: Record<CanvasPermission, number> = {
    viewer: 0,
    editor: 1,
    owner: 2,
  };

  if (levels[share.permission] < levels[minPermission]) {
    throw new ConvexError(errors.INSUFFICIENT_PERMISSIONS);
  }

  return { canvas, permission: share.permission };
}

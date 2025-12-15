import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { ToolCtx } from "@convex-dev/agent";
import { Id } from "../_generated/dataModel";

// Pour les queries - retourne null si non authentifié
export async function getAuth(
  ctx: QueryCtx | MutationCtx | ActionCtx | ToolCtx
) {
  // Si c'est un ToolCtx, on a directement accès à userId
  if ("userId" in ctx && ctx.userId !== undefined) {
    console.log("ctx.userId", ctx.userId);
    return ctx.userId as Id<"users">;
  }
  return await getAuthUserId(ctx);
}

// Pour les mutations - throw si non authentifié (catch côté front)
export async function requireAuth(ctx: MutationCtx | ActionCtx | ToolCtx) {
  // Si c'est un ToolCtx, on a directement accès à userId
  if ("userId" in ctx && ctx.userId !== undefined) {
    console.log("ctx.userId", ctx.userId);
    console.log("typeof ctx.userId", typeof ctx.userId);
    return ctx.userId as Id<"users">;
  }

  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new Error("Utilisateur non authentifié");
  }

  return userId;
}

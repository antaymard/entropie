import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";

// Pour les queries - retourne null si non authentifié
export async function getAuth(ctx: QueryCtx | MutationCtx | ActionCtx) {
  return await getAuthUserId(ctx);
}

// Pour les mutations - throw si non authentifié (catch côté front)
export async function requireAuth(ctx: MutationCtx | ActionCtx) {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    throw new Error("Utilisateur non authentifié");
  }

  return userId;
}

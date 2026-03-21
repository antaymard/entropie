import { ActionCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { introduction } from "./introductionPrompt";
import { internal } from "../../../_generated/api";

export async function generateBrainSystemPrompt({
  canvasId,
  userId,
  ctx,
}: {
  canvasId: Id<"canvases">;
  userId: Id<"users">;
  ctx: ActionCtx;
}) {
  let systemPrompt = "";

  systemPrompt += introduction;

  const [canvasContext, userContext] = await Promise.all([
    ctx.runAction(internal.ia.nole.brain.canvasContextPrompt.create, {
      canvasId,
    }),
    ctx.runQuery(internal.ia.nole.brain.userContextPrompt.create, {
      userId,
    }),
  ]);

  systemPrompt += "\n\n" + canvasContext;
  systemPrompt += "\n\n" + userContext;

  return systemPrompt;
}

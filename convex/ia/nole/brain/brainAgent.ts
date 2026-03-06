import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { anyApi } from "convex/server";
import { ActionCtx, MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { introduction } from "./introductionPrompt";

export function createBrainAgent({
  instructions,
}: {
  canvasId: Id<"canvases">;
  userId: Id<"users">;
  instructions: string;
}) {
  return new Agent(components.agent, {
    name: "Brain",
    maxSteps: 15,
    languageModel: openrouter("stepfun/step-3.5-flash:free"),
    tools: {},
    instructions,
  });
}

export async function generateBrainSystemPrompt({
  canvasId,
  userId,
  ctx,
}: {
  canvasId: Id<"canvases">;
  userId: Id<"users">;
  ctx: ActionCtx | MutationCtx;
}) {
  let systemPrompt = "";

  systemPrompt += introduction;

  const canvasContext = await ctx.runQuery(
    anyApi.ia.nole.brain.canvasContextPrompt.canvasContextPrompt,
    { canvasId },
  );

  systemPrompt += "\n\n" + canvasContext;

  const userContext = await ctx.runQuery(
    anyApi.ia.nole.brain.userContextPrompt.userContextPrompt,
    { userId },
  );
  systemPrompt += "\n\n" + userContext;

  return systemPrompt;
}

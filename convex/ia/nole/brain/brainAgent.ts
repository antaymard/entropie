import { Agent } from "@convex-dev/agent";
import { components } from "../../../_generated/api";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { ActionCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";

export function createBrainAgent({
  canvasId,
  userId,
}: {
  canvasId: Id<"canvases">;
  userId: Id<"users">;
}) {
  return new Agent(components.agent, {
    name: "Brain",
    maxSteps: 15,
    languageModel: openrouter("stepfun/step-3.5-flash:free"),
    tools: {},
    instructions: generateBrainSystemPrompt(),
  });
}

function generateBrainSystemPrompt() {
  return "omg";
}

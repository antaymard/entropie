import { type ActionCtx } from "../_generated/server";
import { internal } from "../_generated/api";
import { type Id } from "../_generated/dataModel";
import { type ToolCtx } from "@convex-dev/agent";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ProgressReport = {
  stepType: string;
  data?: Record<string, unknown>;
};

/**
 * Callback that persists a progress checkpoint to the nodeData document.
 */
export type ReportProgressFn = (progress: ProgressReport) => Promise<void>;

/**
 * Extended ToolCtx used inside automation‑triggered tool calls.
 * When the same tool is called from the chat agent (Nolë), `reportProgress`
 * will simply be absent — helpers handle that gracefully.
 */
export type AutomationToolCtx = ToolCtx & {
  reportProgress?: ReportProgressFn;
};

// ---------------------------------------------------------------------------
// Factory — creates a reportProgress closure bound to a specific nodeDataId
// ---------------------------------------------------------------------------

/**
 * Build a `reportProgress` callback that writes progress to the
 * `automationProgress` field of the given `nodeDataId`.
 *
 * `workStartedAt` is captured once so every subsequent call preserves
 * the same start timestamp.
 */
export function createProgressReporter(
  ctx: ActionCtx,
  nodeDataId: Id<"nodeDatas">,
  workStartedAt: number = Date.now(),
): ReportProgressFn {
  return async (progress: ProgressReport) => {
    // console.log(`Reporting progress for nodeData ${nodeDataId}:`, progress);
    await ctx.runMutation(
      internal.automation.helpers.updateAutomationProgress,
      {
        _id: nodeDataId,
        automationProgress: {
          currentStepType: progress.stepType,
          currentStepData: progress.data ?? {},
          currentStepStartedAt: Date.now(),
          workStartedAt,
        },
      },
    );
  };
}

// ---------------------------------------------------------------------------
// Helper for use inside tool handlers
// ---------------------------------------------------------------------------

/**
 * Safely report progress from within a tool handler.
 * No‑op when `reportProgress` is absent (e.g. when called from the chat agent).
 *
 * Usage inside a `createTool` handler:
 * ```ts
 * handler: async (ctx, args) => {
 *   await reportToolProgress(ctx, {
 *     stepType: "web_extract",
 *     data: { urlCount: args.urls.length },
 *   });
 *   // …
 * }
 * ```
 */
export async function reportToolProgress(
  ctx: AutomationToolCtx,
  progress: ProgressReport,
): Promise<void> {
  if (typeof (ctx as AutomationToolCtx).reportProgress === "function") {
    await (ctx as AutomationToolCtx).reportProgress!(progress);
  }
}

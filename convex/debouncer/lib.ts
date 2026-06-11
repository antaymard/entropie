/**
 * Vendored from @ikhrustalev/convex-debouncer v0.1.2 (Apache-2.0)
 * https://github.com/ikhrustalev/convex-debouncer
 *
 * Local modifications:
 * - `combine` strategies for retrigger args: overwrite | merge | accumulate
 * - `maxWait` cap in sliding mode (guarantees execution under continuous retriggers)
 * - first-call-wins: mode/delay/combine/maxWait are frozen at session creation
 * - `flush` mutation to execute a pending call immediately
 * - explicit error logging when the target function can't be scheduled
 *
 * Caveat: if a deploy invalidates the stored function handle between schedule
 * and execution, the target run fails at execution time and can't be caught here.
 */
import { v } from "convex/values";
import type { FunctionHandle } from "convex/server";
import { internalMutation, mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { combineValidator, modeValidator } from "./schema";

/**
 * Combine a retrigger's args with the pending call's args, according to the
 * session's combine strategy.
 */
function combineArgs(call: Doc<"debouncedCalls">, newArgs: unknown): unknown {
  switch (call.combine) {
    case "merge":
      return {
        ...(call.functionArgs as Record<string, unknown>),
        ...(newArgs as Record<string, unknown>),
      };
    case "accumulate": {
      const previous = (call.functionArgs as { calls?: unknown[] })?.calls ?? [];
      return { calls: [...previous, newArgs] };
    }
    default:
      return newArgs;
  }
}

/**
 * Schedule the target function and clean up the session record.
 * On a synchronous scheduling failure, logs explicitly and drops the session
 * so the key doesn't jam.
 */
async function runTarget(
  ctx: MutationCtx,
  call: Doc<"debouncedCalls">,
): Promise<{ executed: boolean }> {
  const handle = call.functionHandle as FunctionHandle<"mutation" | "action">;
  try {
    await ctx.scheduler.runAfter(0, handle, call.functionArgs);
  } catch (error) {
    console.error(
      `[debouncer] ${call.namespace}/${call.key}: failed to schedule target ${call.functionPath}`,
      error,
    );
    await ctx.db.delete(call._id);
    return { executed: false };
  }
  await ctx.db.delete(call._id);
  return { executed: true };
}

/**
 * Schedule a debounced function call.
 * Depending on the mode:
 * - eager: Execute immediately on first call, queue trailing call if subsequent calls come in
 * - fixed: Schedule after delay, absorb subsequent calls and combine args
 * - sliding: Schedule after delay, reset timer on each call (capped by maxWait if set)
 */
export const schedule = mutation({
  args: {
    namespace: v.string(),
    key: v.string(),
    mode: modeValidator,
    delay: v.number(),
    combine: combineValidator,
    maxWait: v.optional(v.number()),
    functionPath: v.string(),
    functionHandle: v.string(),
    functionArgs: v.any(),
  },
  returns: v.object({
    executed: v.boolean(),
    scheduledFor: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();

    // Check for existing debounced call
    const existing = await ctx.db
      .query("debouncedCalls")
      .withIndex("by_namespace_and_key", (q) =>
        q.eq("namespace", args.namespace).eq("key", args.key),
      )
      .unique();

    if (existing) {
      // First call wins: mode/delay/combine/maxWait were frozen at session
      // creation; overrides passed on retriggers are ignored.
      const retriggerCount = existing.retriggerCount + 1;
      const functionArgs = combineArgs(existing, args.functionArgs);

      if (existing.mode === "eager") {
        // Eager mode: leading execution already happened, mark trailing call
        await ctx.db.patch(existing._id, {
          functionArgs,
          retriggerCount,
          hasTrailingCall: true,
        });
        return {
          executed: false,
          scheduledFor: existing.scheduledFor,
        };
      } else if (existing.mode === "fixed") {
        // Fixed mode: keep original timer, combine args
        await ctx.db.patch(existing._id, {
          functionArgs,
          retriggerCount,
        });
        return {
          executed: false,
          scheduledFor: existing.scheduledFor,
        };
      } else {
        // Sliding mode: cancel old timer, schedule new one, capped by maxWait
        if (existing.scheduledFunctionId) {
          await ctx.scheduler.cancel(existing.scheduledFunctionId);
        }
        let scheduledFor = now + existing.delay;
        if (existing.maxWait !== undefined) {
          scheduledFor = Math.min(
            scheduledFor,
            existing.firstScheduledAt + existing.maxWait,
          );
        }
        const scheduledFunctionId = await ctx.scheduler.runAfter(
          Math.max(0, scheduledFor - now),
          internal.lib.execute,
          { callId: existing._id },
        );
        await ctx.db.patch(existing._id, {
          functionArgs,
          scheduledFor,
          scheduledFunctionId,
          retriggerCount,
        });
        return {
          executed: false,
          scheduledFor,
        };
      }
    }

    // No existing call — create a new debounce session.
    const delay =
      args.maxWait !== undefined ? Math.min(args.delay, args.maxWait) : args.delay;
    const scheduledFor = now + delay;

    // With accumulate, the target always receives { calls: [...] }. In eager
    // mode the first event is handled by the leading execution (client side),
    // so the trailing accumulation starts empty.
    const functionArgs =
      args.combine === "accumulate"
        ? { calls: args.mode === "eager" ? [] : [args.functionArgs] }
        : args.functionArgs;

    const callId = await ctx.db.insert("debouncedCalls", {
      namespace: args.namespace,
      key: args.key,
      mode: args.mode,
      delay: args.delay,
      combine: args.combine,
      maxWait: args.maxWait,
      firstScheduledAt: now,
      functionPath: args.functionPath,
      functionHandle: args.functionHandle,
      functionArgs,
      scheduledFor,
      retriggerCount: 1,
      leadingExecutedAt: args.mode === "eager" ? now : undefined,
      hasTrailingCall: false,
    });

    const scheduledFunctionId = await ctx.scheduler.runAfter(
      delay,
      internal.lib.execute,
      { callId },
    );
    await ctx.db.patch(callId, { scheduledFunctionId });

    return {
      // executed=true signals the client to run the leading execution (eager mode)
      executed: args.mode === "eager",
      scheduledFor,
    };
  },
});

/**
 * Get the status of a debounced call.
 */
export const status = query({
  args: {
    namespace: v.string(),
    key: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      pending: v.boolean(),
      scheduledFor: v.number(),
      retriggerCount: v.number(),
      mode: modeValidator,
      combine: combineValidator,
      hasTrailingCall: v.boolean(),
    }),
  ),
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("debouncedCalls")
      .withIndex("by_namespace_and_key", (q) =>
        q.eq("namespace", args.namespace).eq("key", args.key),
      )
      .unique();

    if (!call) {
      return null;
    }

    return {
      pending: true,
      scheduledFor: call.scheduledFor,
      retriggerCount: call.retriggerCount,
      mode: call.mode,
      combine: call.combine,
      hasTrailingCall: call.hasTrailingCall,
    };
  },
});

/**
 * Cancel a pending debounced call.
 */
export const cancel = mutation({
  args: {
    namespace: v.string(),
    key: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("debouncedCalls")
      .withIndex("by_namespace_and_key", (q) =>
        q.eq("namespace", args.namespace).eq("key", args.key),
      )
      .unique();

    if (!call) {
      return false;
    }

    if (call.scheduledFunctionId) {
      await ctx.scheduler.cancel(call.scheduledFunctionId);
    }

    await ctx.db.delete(call._id);
    return true;
  },
});

/**
 * Execute a pending debounced call immediately and cancel its timer.
 * Returns true if a call was executed, false if nothing was pending
 * (or an eager session had no trailing call to run).
 */
export const flush = mutation({
  args: {
    namespace: v.string(),
    key: v.string(),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("debouncedCalls")
      .withIndex("by_namespace_and_key", (q) =>
        q.eq("namespace", args.namespace).eq("key", args.key),
      )
      .unique();

    if (!call) {
      return false;
    }

    if (call.scheduledFunctionId) {
      await ctx.scheduler.cancel(call.scheduledFunctionId);
    }

    // Eager session with no retrigger: the leading execution already covered
    // the latest args, nothing to run.
    if (call.mode === "eager" && !call.hasTrailingCall) {
      await ctx.db.delete(call._id);
      return false;
    }

    const result = await runTarget(ctx, call);
    return result.executed;
  },
});

/**
 * Internal mutation called by the scheduler to execute the debounced function.
 * Uses the stored function handle to invoke the target function across
 * component boundaries via ctx.scheduler.runAfter.
 */
export const execute = internalMutation({
  args: {
    callId: v.id("debouncedCalls"),
  },
  returns: v.object({
    executed: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);

    if (!call) {
      // Call was cancelled
      return { executed: false };
    }

    // For eager mode, only execute if there's a trailing call
    if (call.mode === "eager" && !call.hasTrailingCall) {
      // No trailing call needed, just clean up
      await ctx.db.delete(call._id);
      return { executed: false };
    }

    return await runTarget(ctx, call);
  },
});

/**
 * Get the function details for a pending call (used by client to execute).
 */
export const getCallDetails = query({
  args: {
    namespace: v.string(),
    key: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      functionPath: v.string(),
      functionArgs: v.any(),
    }),
  ),
  handler: async (ctx, args) => {
    const call = await ctx.db
      .query("debouncedCalls")
      .withIndex("by_namespace_and_key", (q) =>
        q.eq("namespace", args.namespace).eq("key", args.key),
      )
      .unique();

    if (!call) {
      return null;
    }

    return {
      functionPath: call.functionPath,
      functionArgs: call.functionArgs,
    };
  },
});

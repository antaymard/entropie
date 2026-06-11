/**
 * Vendored from @ikhrustalev/convex-debouncer v0.1.2 (Apache-2.0)
 * https://github.com/ikhrustalev/convex-debouncer
 *
 * Local modifications:
 * - `combine`: strategy for merging retrigger args (overwrite | merge | accumulate)
 * - `maxWait` + `firstScheduledAt`: cap on total wait in sliding mode
 */
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const modeValidator = v.union(
  v.literal("eager"),
  v.literal("fixed"),
  v.literal("sliding"),
);

export const combineValidator = v.union(
  v.literal("overwrite"),
  v.literal("merge"),
  v.literal("accumulate"),
);

export default defineSchema({
  debouncedCalls: defineTable({
    // Identification
    namespace: v.string(),
    key: v.string(),

    // Configuration — frozen at session creation (first call wins),
    // retrigger overrides are ignored
    mode: modeValidator,
    delay: v.number(), // milliseconds
    combine: combineValidator,
    maxWait: v.optional(v.number()), // sliding only: max ms after first call

    // Scheduling state
    firstScheduledAt: v.number(), // when the debounce session was created
    scheduledFor: v.number(), // Unix timestamp when execution is scheduled
    scheduledFunctionId: v.optional(v.id("_scheduled_functions")),

    // Target function
    functionPath: v.string(),
    functionHandle: v.string(),
    functionArgs: v.any(),

    // Tracking
    retriggerCount: v.number(), // how many times schedule was called

    // Eager mode specific
    leadingExecutedAt: v.optional(v.number()), // when immediate execution happened
    hasTrailingCall: v.boolean(), // whether a trailing call is pending
  }).index("by_namespace_and_key", ["namespace", "key"]),
});

/**
 * Vendored from @ikhrustalev/convex-debouncer v0.1.2 (Apache-2.0)
 * https://github.com/ikhrustalev/convex-debouncer
 *
 * Local modifications:
 * - `combine` strategies (overwrite | merge | accumulate), typed end-to-end
 * - `maxWait` option (sliding mode anti-starvation cap)
 * - `flush()` method
 * - typed function handle for the eager leading execution (no untyped call)
 */
import {
  createFunctionHandle,
  type FunctionReference,
  type GenericDataModel,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";

/**
 * Debouncing modes:
 * - "eager": Execute immediately on first call, then schedule trailing call with latest args if subsequent calls come in
 * - "fixed": Schedule after delay, absorb subsequent calls and combine args (timer stays fixed)
 * - "sliding": Schedule after delay, reset timer on each subsequent call (capped by maxWait if set)
 */
export type DebouncerMode = "eager" | "fixed" | "sliding";

/**
 * How retrigger args combine with the pending call's args:
 * - "overwrite": last call wins (default)
 * - "merge": shallow merge — keys not re-specified keep their previous value
 * - "accumulate": all calls are collected; the target receives `{ calls: Args[] }`
 */
export type CombineMode = "overwrite" | "merge" | "accumulate";

/**
 * Args the target function receives, depending on the combine strategy.
 */
export type TargetArgs<
  Args extends Record<string, unknown>,
  C extends CombineMode,
> = C extends "accumulate" ? { calls: Args[] } : Args;

/**
 * Options for creating a Debouncer instance.
 */
export interface DebouncerOptions<C extends CombineMode = CombineMode> {
  /**
   * Delay in milliseconds before executing the debounced function.
   * For eager mode, this is the cooldown period after immediate execution.
   */
  delay: number;

  /**
   * Debouncing mode.
   * @default "sliding"
   */
  mode?: DebouncerMode;

  /**
   * How retrigger args combine with the pending call's args.
   * @default "overwrite"
   */
  combine?: C;

  /**
   * Sliding mode only: maximum milliseconds after the FIRST call of a session
   * before execution is forced, even if retriggers keep resetting the timer.
   */
  maxWait?: number;
}

/**
 * Status of a pending debounced call.
 */
export interface DebouncerStatus {
  pending: boolean;
  scheduledFor: number;
  retriggerCount: number;
  mode: DebouncerMode;
  combine: CombineMode;
  hasTrailingCall: boolean;
}

/**
 * Result of scheduling a debounced call.
 */
export interface ScheduleResult {
  /**
   * Whether the function was executed immediately (eager mode first call).
   */
  executed: boolean;

  /**
   * Unix timestamp when the (trailing) execution is scheduled.
   */
  scheduledFor: number;
}

/**
 * Identifies a single debounce session.
 */
export interface SessionRef {
  /** Logical grouping for debounced calls (e.g., "ai-response"). */
  namespace: string;
  /** Unique identifier within the namespace (e.g., threadId). */
  key: string;
}

/**
 * Parameters for {@link Debouncer.schedule}.
 *
 * The override fields (`delay`, `mode`, `combine`, `maxWait`) apply only when
 * this call creates the session — first-call-wins, ignored on retriggers.
 */
export interface ScheduleArgs<
  Args extends Record<string, unknown>,
  C extends CombineMode,
> extends SessionRef {
  /** The mutation or action to call (e.g., `internal.ia.runAgent`). */
  fn: FunctionReference<"mutation" | "action", "internal", TargetArgs<Args, C>>;
  /** Arguments passed to the target function. */
  args: Args;
  /** Override the instance default delay (ms). */
  delay?: number;
  /** Override the instance default mode. */
  mode?: DebouncerMode;
  /** Override the instance default combine strategy. */
  combine?: C;
  /** Override the instance default maxWait (ms, sliding mode only). */
  maxWait?: number;
}

/**
 * The component API type for the debouncer.
 * This is a minimal structural type matching what `components.debouncer` exposes.
 */
export interface DebouncerComponentApi {
  lib: {
    schedule: FunctionReference<
      "mutation",
      "internal",
      {
        namespace: string;
        key: string;
        mode: DebouncerMode;
        delay: number;
        combine: CombineMode;
        maxWait?: number;
        functionPath: string;
        functionHandle: string;
        functionArgs: unknown;
      },
      { executed: boolean; scheduledFor: number }
    >;
    status: FunctionReference<
      "query",
      "internal",
      { namespace: string; key: string },
      DebouncerStatus | null
    >;
    cancel: FunctionReference<
      "mutation",
      "internal",
      { namespace: string; key: string },
      boolean
    >;
    flush: FunctionReference<
      "mutation",
      "internal",
      { namespace: string; key: string },
      boolean
    >;
  };
}

type MutationCtx = GenericMutationCtx<GenericDataModel>;
type QueryCtx = GenericQueryCtx<GenericDataModel>;

/**
 * A server-side debouncer for Convex functions.
 *
 * Configuration is frozen per debounce session (first call wins): the
 * mode/delay/combine/maxWait of the call that CREATES a session apply until
 * it executes or is cancelled; overrides passed on retriggers are ignored.
 *
 * @example
 * ```ts
 * import { Debouncer } from "../lib/debouncer";
 * import { components } from "../_generated/api";
 *
 * const debouncer = new Debouncer(components.debouncer, {
 *   delay: 5000,
 *   mode: "sliding",
 *   maxWait: 30000,
 * });
 *
 * // In your mutation
 * await debouncer.schedule(ctx, {
 *   namespace: "ai-response",
 *   key: threadId,
 *   fn: internal.ia.run,
 *   args: { threadId },
 * });
 * ```
 */
export class Debouncer<DefaultCombine extends CombineMode = "overwrite"> {
  private component: DebouncerComponentApi;
  private defaultDelay: number;
  private defaultMode: DebouncerMode;
  private defaultCombine: CombineMode;
  private defaultMaxWait: number | undefined;

  /**
   * Create a new Debouncer instance.
   *
   * @param component - The debouncer component API (e.g., `components.debouncer`)
   * @param options - Default options for debouncing
   */
  constructor(
    component: DebouncerComponentApi,
    options: DebouncerOptions<DefaultCombine>,
  ) {
    this.component = component;
    this.defaultDelay = options.delay;
    this.defaultMode = options.mode ?? "sliding";
    this.defaultCombine = options.combine ?? "overwrite";
    this.defaultMaxWait = options.maxWait;
  }

  /**
   * Schedule a debounced function call.
   *
   * With `combine: "accumulate"`, the target function must accept
   * `{ calls: Args[] }` — it receives every call's args since the session
   * started. In eager mode, the leading execution receives the first event
   * alone (`{ calls: [args] }`) and the trailing execution receives the rest.
   *
   * @param ctx - The mutation context
   * @param params - Session ref, target function, args, and optional overrides
   * @returns Result indicating if immediate execution happened and when scheduled execution will occur
   *
   * @example
   * ```ts
   * await debouncer.schedule(ctx, {
   *   namespace: "ai-response",
   *   key: threadId,
   *   fn: internal.ia.runAgent,
   *   args: { threadId },
   * });
   * ```
   */
  async schedule<
    Args extends Record<string, unknown>,
    C extends CombineMode = DefaultCombine,
  >(
    ctx: MutationCtx,
    params: ScheduleArgs<Args, C>,
  ): Promise<ScheduleResult> {
    const { namespace, key, fn, args } = params;
    const delay = params.delay ?? this.defaultDelay;
    const mode = params.mode ?? this.defaultMode;
    const combine = params.combine ?? this.defaultCombine;
    const maxWait = params.maxWait ?? this.defaultMaxWait;

    // Get the function path from the function reference (for debugging)
    const functionPath = getFunctionPath(fn);

    // Create a function handle that can be used across component boundaries.
    // This allows the component's scheduled execute mutation to invoke
    // the target function in the parent app's context.
    const functionHandle = await createFunctionHandle(
      // widened: TargetArgs<Args, C> stays conditional until the call site
      fn as FunctionReference<"mutation" | "action", "internal">,
    );

    const result = await ctx.runMutation(this.component.lib.schedule, {
      namespace,
      key,
      mode,
      delay,
      combine,
      maxWait,
      functionPath,
      functionHandle,
      functionArgs: args,
    });

    // For eager mode, if this is the first call, execute immediately
    // via scheduler to support both mutations and actions uniformly.
    if (result.executed && mode === "eager") {
      const leadingArgs = combine === "accumulate" ? { calls: [args] } : args;
      await ctx.scheduler.runAfter(0, functionHandle, leadingArgs);
    }

    return result;
  }

  /**
   * Get the status of a pending debounced call.
   *
   * @param ctx - The query or mutation context
   * @param session - The namespace + key identifying the session
   * @returns Status object or null if no pending call exists
   */
  async status(
    ctx: QueryCtx | MutationCtx,
    session: SessionRef,
  ): Promise<DebouncerStatus | null> {
    return await ctx.runQuery(this.component.lib.status, {
      namespace: session.namespace,
      key: session.key,
    });
  }

  /**
   * Cancel a pending debounced call.
   *
   * @param ctx - The mutation context
   * @param session - The namespace + key identifying the session
   * @returns True if a call was cancelled, false if no pending call existed
   */
  async cancel(ctx: MutationCtx, session: SessionRef): Promise<boolean> {
    return await ctx.runMutation(this.component.lib.cancel, {
      namespace: session.namespace,
      key: session.key,
    });
  }

  /**
   * Execute a pending debounced call immediately and cancel its timer.
   *
   * @param ctx - The mutation context
   * @param session - The namespace + key identifying the session
   * @returns True if a call was executed, false if nothing was pending
   */
  async flush(ctx: MutationCtx, session: SessionRef): Promise<boolean> {
    return await ctx.runMutation(this.component.lib.flush, {
      namespace: session.namespace,
      key: session.key,
    });
  }
}

// Symbol used by Convex to store function name on FunctionReference
const functionNameSymbol = Symbol.for("functionName");

/**
 * Extract the function path from a FunctionReference.
 * Uses the internal functionName symbol that Convex uses.
 */
function getFunctionPath(
  functionRef: FunctionReference<"mutation" | "action", "internal">,
): string {
  // Legacy path: function reference is already a string
  if (typeof functionRef === "string") {
    return functionRef;
  }

  // Access the function name via the Convex symbol
  const ref = functionRef as unknown as Record<symbol, string>;
  const name = ref[functionNameSymbol];
  if (name) {
    return name;
  }

  // Fallback: try to extract from string representation
  const str = String(functionRef);
  if (str && str !== "[object Object]") {
    return str;
  }

  throw new Error(
    "Could not extract function path from function reference. " +
      "Make sure you're passing a function reference from `internal` or `api`.",
  );
}

// Re-export types for convenience
export type { FunctionReference } from "convex/server";

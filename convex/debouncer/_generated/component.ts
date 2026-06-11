/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { key: string; namespace: string },
        boolean,
        Name
      >;
      flush: FunctionReference<
        "mutation",
        "internal",
        { key: string; namespace: string },
        boolean,
        Name
      >;
      getCallDetails: FunctionReference<
        "query",
        "internal",
        { key: string; namespace: string },
        null | { functionArgs: any; functionPath: string },
        Name
      >;
      schedule: FunctionReference<
        "mutation",
        "internal",
        {
          combine: "overwrite" | "merge" | "accumulate";
          delay: number;
          functionArgs: any;
          functionHandle: string;
          functionPath: string;
          key: string;
          maxWait?: number;
          mode: "eager" | "fixed" | "sliding";
          namespace: string;
        },
        { executed: boolean; scheduledFor: number },
        Name
      >;
      status: FunctionReference<
        "query",
        "internal",
        { key: string; namespace: string },
        null | {
          combine: "overwrite" | "merge" | "accumulate";
          hasTrailingCall: boolean;
          mode: "eager" | "fixed" | "sliding";
          pending: boolean;
          retriggerCount: number;
          scheduledFor: number;
        },
        Name
      >;
    };
  };

/**
 * NodeData types derived from Convex Doc<"nodeDatas">
 */

export type { AutomationStepType } from "@/../convex/automation/progressReporter";

import type { Doc } from "@/../convex/_generated/dataModel";

export type NodeData = Doc<"nodeDatas">;
export type AgentConfig = NonNullable<Doc<"nodeDatas">["agent"]>;
export type DataProcessing = NonNullable<
  Doc<"nodeDatas">["dataProcessing"]
>[number];
export type Dependency = NonNullable<Doc<"nodeDatas">["dependencies"]>[number];

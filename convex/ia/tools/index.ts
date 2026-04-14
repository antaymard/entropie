import type { ToolSet } from "ai";
import type { Id } from "../../_generated/dataModel";
import createConnectionTool from "./createConnectionTool";
import createNodeTool from "./createNodeTool";
import documentInsertContentTool, {
  documentInsertContentToolConfig,
} from "./documentInsertContentTool";
import documentStringReplaceContentTool, {
  documentStringReplaceContentToolConfig,
} from "./documentStringReplaceContentTool";
import fullTextSearchTool from "./fullTextSearchTool";
import listNodesTool from "./listNodesTool";
import { openWebPageTool } from "./openWebPageTool";
import readNodesTool from "./readNodesTool";
import setNodeDataTool from "./setNodeDataTool";
import tableDeleteRowsTool from "./tableDeleteRowsTools";
import tableInsertRowsTool from "./tableInsertRowsTool";
import tableUpdateRowsTool, {
  tableUpdateRowsToolConfig,
} from "./tableUpdateRowsTool";
import tableUpdateSchemaTool from "./tableUpdateSchemaTool";
import {
  type CompactionConfig,
  type ToolAgentName,
  type ToolConfig,
} from "./toolHelpers";
import { websearchTool } from "./websearchTool";

type AgentTool = ToolSet[string];

type AgentToolContext = {
  canvasId?: Id<"canvases">;
  extraTools?: ToolSet;
};

type ToolRegistration = {
  config: ToolConfig;
  create: (context: AgentToolContext) => AgentTool | null;
};

const defaultCompactionConfig: CompactionConfig = {
  compactAfterMessages: 0,
  compactAfterIterations: -1,
};

function makeToolConfig(name: string, agents: ToolAgentName[]): ToolConfig {
  return {
    name,
    agents,
    compactionForSuccessResult: defaultCompactionConfig,
    compactionForFailureResult: defaultCompactionConfig,
  };
}

function createCanvasScopedTool(
  factory: (args: { canvasId: Id<"canvases"> }) => AgentTool,
): (context: AgentToolContext) => AgentTool | null {
  return ({ canvasId }) => {
    if (!canvasId) {
      return null;
    }

    return factory({ canvasId });
  };
}

const toolRegistry: ToolRegistration[] = [
  {
    config: makeToolConfig("list_nodes", ["nolë", "automation-agent"]),
    create: createCanvasScopedTool(listNodesTool),
  },
  {
    config: makeToolConfig("full_text_search", ["nolë", "automation-agent"]),
    create: createCanvasScopedTool(fullTextSearchTool),
  },
  {
    config: makeToolConfig("read_nodes", ["nolë", "automation-agent"]),
    create: createCanvasScopedTool(readNodesTool),
  },
  {
    config: makeToolConfig("open_webpage", ["nolë", "automation-agent"]),
    create: () => openWebPageTool,
  },
  {
    config: makeToolConfig("websearch", ["nolë", "automation-agent"]),
    create: () => websearchTool,
  },
  {
    config: documentStringReplaceContentToolConfig,
    create: createCanvasScopedTool(documentStringReplaceContentTool),
  },
  {
    config: documentInsertContentToolConfig,
    create: createCanvasScopedTool(documentInsertContentTool),
  },
  {
    config: tableUpdateRowsToolConfig,
    create: createCanvasScopedTool(tableUpdateRowsTool),
  },
  {
    config: makeToolConfig("table_insert_rows", ["nolë", "automation-agent"]),
    create: createCanvasScopedTool(tableInsertRowsTool),
  },
  {
    config: makeToolConfig("table_delete_rows", ["nolë", "automation-agent"]),
    create: createCanvasScopedTool(tableDeleteRowsTool),
  },
  {
    config: makeToolConfig("table_update_schema", ["nolë", "automation-agent"]),
    create: createCanvasScopedTool(tableUpdateSchemaTool),
  },
  {
    config: makeToolConfig("create_node", ["nolë", "automation-agent"]),
    create: createCanvasScopedTool(createNodeTool),
  },
  {
    config: makeToolConfig("create_connection", ["nolë", "automation-agent"]),
    create: createCanvasScopedTool(createConnectionTool),
  },
  {
    config: makeToolConfig("set_node_data", ["nolë", "automation-agent"]),
    create: createCanvasScopedTool(setNodeDataTool),
  },
];

export function getToolsForAgent({
  agentName,
  canvasId,
  extraTools = {},
}: {
  agentName: ToolAgentName;
  canvasId?: Id<"canvases">;
  extraTools?: ToolSet;
}): ToolSet {
  const resolvedTools = toolRegistry.reduce<ToolSet>(
    (accumulator, registration) => {
      if (!registration.config.agents.includes(agentName)) {
        return accumulator;
      }

      const tool = registration.create({
        canvasId,
      });
      if (!tool) {
        return accumulator;
      }

      accumulator[registration.config.name] = tool;
      return accumulator;
    },
    {},
  );

  return {
    ...resolvedTools,
    ...extraTools,
  };
}

export const agentToolRegistry = toolRegistry;

import type { ToolSet } from "ai";
import { type ThreadCtx, type ToolAgentName } from "../agentConfig";
import createConnectionTool, {
  createConnectionToolConfig,
} from "./createConnectionTool";
import createNodeTool, { createNodeToolConfig } from "./createNodeTool";
import patchAppNodeCodeTool, {
  patchAppNodeCodeToolConfig,
} from "./patchAppNodeCodeTool";
import patchDocumentContentTool, {
  patchDocumentContentToolConfig,
} from "./patchDocumentContentTool";
import fullTextSearchTool, {
  fullTextSearchToolConfig,
} from "./fullTextSearchTool";
import listNodesTool, { listNodesToolConfig } from "./listNodesTool";
import loadSkillTool, { loadSkillToolConfig } from "./loadSkillTool";
import memoryToolFactory, { memoryToolConfig } from "./memoryTool";
import { openWebPageTool, openWebPageToolConfig } from "./openWebPageTool";
import { viewImageTool, viewImageToolConfig } from "./viewImageTool";
import readNodesTool, { readNodesToolConfig } from "./readNodesTool";
import runSubagent, { runSubagentToolConfig } from "./runSubagent";
import setNodeDataTool, { setNodeDataToolConfig } from "./setNodeDataTool";
import tableDeleteRowsTool, {
  tableDeleteRowsToolConfig,
} from "./tableDeleteRowsTools";
import tableInsertRowsTool, {
  tableInsertRowsToolConfig,
} from "./tableInsertRowsTool";
import tableUpdateRowsTool, {
  tableUpdateRowsToolConfig,
} from "./tableUpdateRowsTool";
import tableUpdateSchemaTool, {
  tableUpdateSchemaToolConfig,
} from "./tableUpdateSchemaTool";
import { type ToolConfig } from "./toolHelpers";
import { websearchTool, websearchToolConfig } from "./websearchTool";
import { runTaskTool, runTaskToolConfig } from "./runTaskTool";
import { readTaskTool, readTaskToolConfig } from "./readTaskTool";

type AgentTool = ToolSet[string];

type ToolFactoryContext = {
  agentName: ToolAgentName;
  threadCtx: ThreadCtx;
};

type ToolRegistration = {
  config: ToolConfig;
  factory: (context: ToolFactoryContext) => AgentTool | null;
};

const toolRegistry: ToolRegistration[] = [
  {
    config: listNodesToolConfig,
    factory: ({ threadCtx }) => listNodesTool({ threadCtx }),
  },
  {
    config: patchAppNodeCodeToolConfig,
    factory: ({ threadCtx }) => patchAppNodeCodeTool({ threadCtx }),
  },
  {
    config: fullTextSearchToolConfig,
    factory: ({ threadCtx }) => fullTextSearchTool({ threadCtx }),
  },
  {
    config: memoryToolConfig,
    factory: ({ threadCtx }) => memoryToolFactory({ threadCtx }),
  },
  {
    config: readNodesToolConfig,
    factory: ({ threadCtx }) => readNodesTool({ threadCtx }),
  },
  {
    config: viewImageToolConfig,
    factory: () => viewImageTool,
  },
  {
    config: openWebPageToolConfig,
    factory: () => openWebPageTool,
  },
  {
    config: websearchToolConfig,
    factory: () => websearchTool,
  },
  {
    config: runSubagentToolConfig,
    factory: ({ agentName, threadCtx }) =>
      runSubagent({ currentAgent: agentName, threadCtx }),
  },
  {
    config: patchDocumentContentToolConfig,
    factory: ({ threadCtx }) => patchDocumentContentTool({ threadCtx }),
  },
  {
    config: tableUpdateRowsToolConfig,
    factory: ({ threadCtx }) => tableUpdateRowsTool({ threadCtx }),
  },
  {
    config: tableInsertRowsToolConfig,
    factory: ({ threadCtx }) => tableInsertRowsTool({ threadCtx }),
  },
  {
    config: tableDeleteRowsToolConfig,
    factory: ({ threadCtx }) => tableDeleteRowsTool({ threadCtx }),
  },
  {
    config: tableUpdateSchemaToolConfig,
    factory: ({ threadCtx }) => tableUpdateSchemaTool({ threadCtx }),
  },
  {
    config: createNodeToolConfig,
    factory: ({ threadCtx }) => createNodeTool({ threadCtx }),
  },
  {
    config: createConnectionToolConfig,
    factory: ({ threadCtx }) => createConnectionTool({ threadCtx }),
  },
  {
    config: setNodeDataToolConfig,
    factory: ({ threadCtx }) => setNodeDataTool({ threadCtx }),
  },
  {
    config: runTaskToolConfig,
    factory: ({ threadCtx }) => runTaskTool({ threadCtx }),
  },
  {
    config: readTaskToolConfig,
    factory: ({ threadCtx }) => readTaskTool({ threadCtx }),
  },
  {
    config: loadSkillToolConfig,
    factory: ({ threadCtx }) => loadSkillTool({ threadCtx }),
  },
];

export function getToolsForAgent({
  agentName,
  threadCtx,
  extraTools = {},
  isMultimodal = false,
}: {
  agentName: ToolAgentName;
  threadCtx: ThreadCtx;
  extraTools?: ToolSet;
  isMultimodal?: boolean;
}): ToolSet {
  const resolvedTools: ToolSet = {};

  for (const registration of toolRegistry) {
    if (!registration.config.authorized_agents.includes(agentName)) {
      continue;
    }

    if (registration.config.requireMultiModal && !isMultimodal) {
      continue;
    }

    const tool = registration.factory({ agentName, threadCtx });
    if (!tool) {
      continue;
    }

    resolvedTools[registration.config.name] = tool;
  }

  return {
    ...resolvedTools,
    ...extraTools,
  };
}

export const agentToolRegistry = toolRegistry;

import CustomNode from "./CustomNode";
import prebuiltNodesConfig from "./prebuilt-nodes/prebuiltNodesConfig";

const nodeTypes = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...prebuiltNodesConfig.reduce<Record<string, React.ComponentType<any>>>(
    (acc, node) => {
      acc[node.type] = node.nodeComponent;
      return acc;
    },
    {},
  ),
  custom: CustomNode,
};

const nodeList = [...prebuiltNodesConfig];

export { nodeTypes, nodeList };

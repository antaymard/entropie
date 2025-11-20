import CustomNode from "./CustomNode";
import prebuiltNodesConfig from "./prebuilt-nodes/prebuiltNodesConfig";

const nodeTypes = {
  ...prebuiltNodesConfig.reduce<Record<string, React.ComponentType<any>>>(
    (acc, node) => {
      acc[node.type] = node.component;
      return acc;
    },
    {}
  ),
  custom: CustomNode,
};

const nodeList = [
  ...prebuiltNodesConfig.map((node) => {
    const { initialValues, ...rest } = node;
    return { ...rest };
  }),
];

export { nodeTypes, nodeList };

import prebuiltNodesList from "./prebuilt-nodes/prebuiltNodesList";

const nodeTypes = {
  ...prebuiltNodesList.reduce<Record<string, React.ComponentType<any>>>(
    (acc, node) => {
      acc[node.type] = node.component;
      return acc;
    },
    {}
  ),
};

const nodeList = [
  ...prebuiltNodesList.map((node) => {
    const { initialValues, ...rest } = node;
    return { ...rest };
  }),
];

export { nodeTypes, nodeList };

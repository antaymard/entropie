import prebuiltNodesList from "./prebuilt-nodes/prebuiltNodesList";

const nodeTypes = {
  ...prebuiltNodesList.reduce<Record<string, React.ComponentType<any>>>((acc, node) => {
    acc[node.type] = node.component;
    return acc;
  }, {})
};

export default nodeTypes;

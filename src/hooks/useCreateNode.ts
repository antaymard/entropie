import { useReactFlow } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Node } from "@xyflow/react";
import type { nodeTypes } from "@/types/nodeData.types";

type CreateNodeOptions = {
  node: Node;
  position: { x: number; y: number };
  skipNodeDataCreation?: boolean | undefined;
};

export function useCreateNode() {
  const { addNodes } = useReactFlow();
  const createNodeData = useMutation(api.nodeDatas.create);

  const createNode = async ({
    node,
    position,
    skipNodeDataCreation = false,
  }: CreateNodeOptions) => {
    const newNodeId = crypto.randomUUID();

    let nodeDataId: string | undefined;

    if (!skipNodeDataCreation) {
      nodeDataId = await createNodeData({
        type: node.type as nodeTypes,
        values: {},
        updatedAt: Date.now(),
      });
    }

    addNodes({
      ...node,
      id: newNodeId,
      position,
      selected: true,
      // Add measured dimensions if width/height are known to prevent
      // React Flow from triggering a dimension change event after adding
      ...(node.width &&
        node.height && {
          measured: { width: node.width, height: node.height },
        }),
      data: {
        ...node.data,
        ...(nodeDataId ? { nodeDataId } : {}),
      },
    });

    return newNodeId;
  };

  return { createNode };
}

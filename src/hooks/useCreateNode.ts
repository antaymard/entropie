import { useReactFlow } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Node } from "@xyflow/react";
import type { Id } from "@/../convex/_generated/dataModel";
import type { nodeTypes } from "@/types/domain";

type CreateNodeOptions = {
  node: Node;
  position: { x: number; y: number };
  skipNodeDataCreation?: boolean;
  initialValues?: Record<string, unknown>;
};

type CreateNodeResult = {
  nodeId: string;
  nodeDataId: Id<"nodeDatas"> | undefined;
};

export function useCreateNode() {
  const { addNodes, setNodes } = useReactFlow();
  const createNodeData = useMutation(api.nodeDatas.create);

  const createNode = async ({
    node,
    position,
    skipNodeDataCreation = false,
    initialValues = {},
  }: CreateNodeOptions): Promise<CreateNodeResult> => {
    const nodeId = crypto.randomUUID();

    let nodeDataId: Id<"nodeDatas"> | undefined;

    if (!skipNodeDataCreation) {
      nodeDataId = await createNodeData({
        type: node.type as nodeTypes,
        values: initialValues,
        updatedAt: Date.now(),
      });
    }

    // Déselectionner tous les nodes
    setNodes((nodes) => nodes.map((n) => ({ ...n, selected: false })));

    // Au format de React Flow, on ajoute le node avec addNodes
    addNodes({
      ...node,
      id: nodeId,
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
        variant: node.data?.variant ?? "default",
        ...(nodeDataId ? { nodeDataId } : {}),
      },
    });

    return { nodeId, nodeDataId };
  };

  return { createNode };
}

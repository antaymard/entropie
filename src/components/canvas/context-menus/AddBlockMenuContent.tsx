import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/shadcn/dropdown-menu";
import { useCreateNode } from "@/hooks/useCreateNode";
import prebuiltNodesConfig from "../../nodes/prebuilt-nodes/prebuiltNodesConfig";

export default function AddBlockMenuContent({
  getCreatePosition,
  onCreated,
}: {
  getCreatePosition: () => { x: number; y: number };
  onCreated?: () => void;
}) {
  const { createNode } = useCreateNode();

  return (
    <>
      <DropdownMenuLabel className="whitespace-nowrap">
        Add a block
      </DropdownMenuLabel>
      <DropdownMenuSeparator />
      {prebuiltNodesConfig.map((nodeConfig, i) => {
        const Icon = nodeConfig.nodeIcon;
        return (
          <DropdownMenuItem
            key={i}
            className="w-48"
            onClick={async () => {
              const nodeToCreate = { ...nodeConfig.node };
              if (nodeConfig.variants?.default) {
                nodeToCreate.height = nodeConfig.variants.default.defaultHeight;
                nodeToCreate.width = nodeConfig.variants.default.defaultWidth;
              }

              await createNode({
                node: nodeToCreate,
                position: getCreatePosition(),
              });
              onCreated?.();
            }}
          >
            <Icon /> {nodeConfig.label}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

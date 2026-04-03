import { useState } from "react";
import RichTextArea from "./RichTextArea";
import { Button } from "@/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import { TbBrain, TbCheck, TbPlus, TbSend, TbX } from "react-icons/tb";
import { useNodes } from "@xyflow/react";
import type { CanvasNode } from "@/types";
import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { getNodeDataTitle } from "@/components/utils/nodeDataDisplayUtils";
import type { Id } from "@/../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

const INPUT_MAX_HEIGHT_PX = 182;

type Models = "default" | "best" | "fast";

const MODEL_OPTIONS: Models[] = ["default", "best", "fast"];
const formatModelLabel = (model: Models) =>
  model.charAt(0).toUpperCase() + model.slice(1);

export default function ChatContainer() {
  const [userInput, setUserInput] = useState("");
  const [model, setModel] = useState<Models>("default");

  const [attachedNodes, setAttachedNodes] = useState<CanvasNode[]>([]);

  const nodes = useNodes();
  const selectedNodesOnCanvas = nodes.filter((n) => n.selected) as CanvasNode[];
  const attachedNodeIds = new Set(attachedNodes.map((node) => node.id));
  const selectableNodes = selectedNodesOnCanvas.filter(
    (node) => !attachedNodeIds.has(node.id),
  );

  return (
    <div className="w-full h-full flex flex-col p-2 shadow-2xl/10">
      <div className="w-full flex-1"></div>

      {/* Input */}
      <div className="max-h-48 bg-slate-200 border border-slate-400 shadow-lg rounded-lg flex flex-col gap-2">
        {(selectableNodes.length > 0 || attachedNodes.length > 0) && (
          <div className="p-2 pb-0 flex flex-wrap gap-1">
            {selectableNodes.map((node) => (
              <NodeAttachment
                key={node.id}
                node={node}
                isAttached={false}
                onRemove={(nodeId) =>
                  setAttachedNodes((prev) =>
                    prev.filter((n) => n.id !== nodeId),
                  )
                }
                onAttach={(node) => setAttachedNodes((prev) => [node, ...prev])}
              />
            ))}
            {attachedNodes.map((node) => (
              <NodeAttachment
                key={node.id}
                node={node}
                isAttached={true}
                onRemove={(nodeId) =>
                  setAttachedNodes((prev) =>
                    prev.filter((n) => n.id !== nodeId),
                  )
                }
                onAttach={(node) => setAttachedNodes((prev) => [node, ...prev])}
              />
            ))}
          </div>
        )}
        <div className="p-2">
          <RichTextArea
            value={userInput}
            onChange={setUserInput}
            maxHeightPx={INPUT_MAX_HEIGHT_PX}
          />
        </div>
        <div className="flex items-center justify-between gap-2 pr-2 pb-2">
          <div className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <TbBrain />
                  {formatModelLabel(model)}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {MODEL_OPTIONS.map((modelOption) => (
                  <DropdownMenuItem
                    key={modelOption}
                    className="flex items-center justify-between gap-2 cursor-pointer"
                    onSelect={() => setModel(modelOption)}
                  >
                    <span>{formatModelLabel(modelOption)}</span>
                    {model === modelOption ? <TbCheck size={14} /> : null}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button disabled={!userInput.trim()} onClick={() => alert(userInput)}>
            Envoyer
            <TbSend />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NodeAttachment({
  node,
  isAttached,
  onRemove,
  onAttach,
}: {
  node: CanvasNode;
  isAttached: boolean;
  onRemove: (nodeId: string) => void;
  onAttach: (node: CanvasNode) => void;
}) {
  const nodeConfig = prebuiltNodesConfig.find(
    (config) => config.type === node.type,
  );
  const nodeDatas = useNodeDataStore((state) => state.nodeDatas);
  const nodeDataId = node.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const nodeData = nodeDataId ? nodeDatas.get(nodeDataId) : undefined;
  const NodeIcon = nodeConfig?.nodeIcon;
  const nodeTitle = nodeData
    ? getNodeDataTitle(nodeData)
    : nodeConfig?.label || node.type;

  return (
    <div
      className={cn(
        "group relative flex items-center gap-1 rounded-sm border  px-2 py-1 text-sm text-slate-700 max-w-55",
        {
          "border-slate-300 bg-white": isAttached,
          "italic opacity-70": !isAttached,
        },
      )}
    >
      <button
        type="button"
        className={cn(
          "text-slate-500 ",
          isAttached ? "hover:text-red-500" : "hover:text-green-500",
        )}
        onClick={() => (isAttached ? onRemove(node.id) : onAttach(node))}
        aria-label={isAttached ? "Retirer la piece jointe" : "Attacher le node"}
      >
        {isAttached ? <TbX size={14} /> : <TbPlus size={14} />}
      </button>
      {NodeIcon ? <NodeIcon size={12} className="min-w-3" /> : null}
      <span className="truncate">{nodeTitle}</span>
    </div>
  );
}

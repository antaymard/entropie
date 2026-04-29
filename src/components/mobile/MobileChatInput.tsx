import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/shadcn/button";
import {
  TbCheck,
  TbCloudExclamation,
  TbExclamationCircle,
  TbLoader,
  TbMicrophone,
  TbPlus,
  TbSend,
  TbX,
  TbBrain,
} from "react-icons/tb";
import { HiMiniXMark } from "react-icons/hi2";
import { LuMousePointerClick } from "react-icons/lu";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import toast from "react-hot-toast";
import RichTextArea from "@/components/canvas/nole-panel/RichTextArea";
import SoundWaveAnimation from "@/components/canvas/nole-panel/SoundWaveAnimation";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import type { CanvasNode } from "@/types";
import { getCanvasNodeTitle } from "@/components/canvas/nole-panel/messageContextGenerator";
import { useMobileNoleChat } from "./mobileNoleContextValue";

const INPUT_MAX_HEIGHT_PX = 140;
const MOBILE_INPUT_HEIGHT_VAR = "--mobile-chat-input-h";

export default function MobileChatInput() {
  const {
    userInput,
    setUserInput,
    sendCurrentMessage,
    isSending,
    isAssistantResponding,
    isCancelling,
    stopAssistantResponse,
    modelOptions,
    selectedModel,
    setSelectedModel,
    attachedNodes,
    attachedPosition,
    selectableNodes,
    addAttachments,
    removeAttachments,
    isRecording,
    isTranscribing,
    sttBusy,
    startSTT,
    stopSTT,
    dirtyNodeIds,
    hasDirtyWindows,
  } = useMobileNoleChat();

  const containerRef = useRef<HTMLDivElement>(null);

  // Publish own height as a CSS var so chat content / node overlay can pad
  // for it while the input stays visible above everything.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const root = document.documentElement;
    const setVar = () => {
      root.style.setProperty(
        MOBILE_INPUT_HEIGHT_VAR,
        `${node.getBoundingClientRect().height}px`,
      );
    };
    setVar();
    const observer = new ResizeObserver(setVar);
    observer.observe(node);
    return () => {
      observer.disconnect();
      root.style.removeProperty(MOBILE_INPUT_HEIGHT_VAR);
    };
  }, []);

  const handleSend = useCallback(() => {
    if (hasDirtyWindows) {
      toast.error(
        "Veuillez enregistrer ou fermer les fenêtres modifiées avant d'envoyer votre message.",
        { position: "bottom-left", duration: 5000 },
      );
      return;
    }
    void sendCurrentMessage();
  }, [hasDirtyWindows, sendCurrentMessage]);

  const sttActiveRef = useRef(false);
  const handleMicDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (sttActiveRef.current) return;
      sttActiveRef.current = true;
      void startSTT();
    },
    [startSTT],
  );
  const handleMicUp = useCallback(() => {
    if (!sttActiveRef.current) return;
    sttActiveRef.current = false;
    stopSTT();
  }, [stopSTT]);

  useEffect(() => {
    return () => {
      if (sttActiveRef.current) {
        sttActiveRef.current = false;
        stopSTT();
      }
    };
  }, [stopSTT]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 z-50 p-2 pt-0"
    >
      <div
        className={cn(
          "bg-slate-100 border shadow-md rounded-lg flex flex-col gap-2",
          hasDirtyWindows ? "border-red-300" : "border-slate-300",
        )}
      >
        {(selectableNodes.length > 0 ||
          attachedNodes.length > 0 ||
          attachedPosition) && (
          <div className="p-2 pb-0 flex flex-wrap gap-1">
            {attachedPosition ? (
              <PositionAttachment
                position={attachedPosition}
                onRemove={() => removeAttachments([{ type: "position" }])}
              />
            ) : null}
            {selectableNodes.map((node) => (
              <NodeAttachment
                key={node.id}
                node={node}
                isAttached={false}
                onRemove={(nodeId) =>
                  removeAttachments([{ type: "node", ids: [nodeId] }])
                }
                onAttach={(selectedNode) =>
                  addAttachments({ nodes: [selectedNode] })
                }
              />
            ))}
            {attachedNodes.map((node) => (
              <NodeAttachment
                key={node.id}
                node={node}
                isAttached={true}
                onRemove={(nodeId) =>
                  removeAttachments([{ type: "node", ids: [nodeId] }])
                }
                onAttach={(selectedNode) =>
                  addAttachments({ nodes: [selectedNode] })
                }
              />
            ))}
          </div>
        )}
        <div className="px-2 pt-2">
          <RichTextArea
            value={userInput}
            onChange={setUserInput}
            onSubmit={handleSend}
            maxHeightPx={INPUT_MAX_HEIGHT_PX}
          />
        </div>
        <div className="flex items-center justify-between gap-2 pr-2 pb-2">
          <div className="flex items-center gap-2 pl-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  disabled={
                    isSending ||
                    isAssistantResponding ||
                    (modelOptions?.length ?? 0) === 0
                  }
                  className="h-9 w-9 px-0 text-slate-500"
                >
                  <TbBrain size={16} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                {(modelOptions ?? []).map((model) => (
                  <DropdownMenuItem
                    key={model.value}
                    onSelect={() => setSelectedModel(model.value)}
                    className={cn(
                      selectedModel === model.value && "font-medium",
                      "capitalize flex items-center justify-between",
                    )}
                  >
                    <p>{model.label}</p>
                    <span className="text-xs text-slate-400">
                      {model.price.replace("_", " - ")}
                    </span>
                    {selectedModel === model.value && <TbCheck />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant={isRecording ? "default" : "ghost"}
              size="icon"
              disabled={isTranscribing || isSending}
              className={cn(
                "h-9 w-9 select-none touch-none",
                isRecording && "bg-red-500 text-white hover:bg-red-500/90",
              )}
              onPointerDown={handleMicDown}
              onPointerUp={handleMicUp}
              onPointerCancel={handleMicUp}
              onPointerLeave={handleMicUp}
              aria-label="Hold to record"
            >
              {isTranscribing ? (
                <TbLoader className="animate-spin" size={16} />
              ) : isRecording ? (
                <SoundWaveAnimation />
              ) : (
                <TbMicrophone size={16} />
              )}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {hasDirtyWindows && (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <span className="rounded flex gap-1 bg-white/50 px-2 py-1 text-red-400">
                    <TbCloudExclamation size={16} className="stroke-2" />
                    {dirtyNodeIds.length}
                  </span>
                </TooltipTrigger>
                <TooltipContent className="text-sm">
                  Veuillez enregistrer ou fermer les fenêtres modifiées avant
                  d'envoyer votre message.
                </TooltipContent>
              </Tooltip>
            )}
            {isAssistantResponding && (
              <Button
                disabled={isCancelling || isSending}
                onClick={() => void stopAssistantResponse()}
                variant="outline"
                size="sm"
              >
                Stop
                {isCancelling ? <TbLoader className="animate-spin" /> : <TbX />}
              </Button>
            )}
            <Button
              disabled={
                !userInput.trim() ||
                isAssistantResponding ||
                isSending ||
                sttBusy
              }
              onClick={handleSend}
              size="sm"
            >
              Send
              {isSending ? (
                <TbLoader className="animate-spin" />
              ) : hasDirtyWindows ? (
                <TbExclamationCircle />
              ) : (
                <TbSend />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PositionAttachment({
  position,
  onRemove,
}: {
  position: { x: number; y: number };
  onRemove: () => void;
}) {
  return (
    <div className="group relative flex items-center gap-1 rounded-sm border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 max-w-55">
      <button
        type="button"
        onClick={onRemove}
        aria-label="Retirer la position jointe"
        className="text-slate-500 hover:text-red-500"
      >
        <HiMiniXMark size={14} />
      </button>
      <LuMousePointerClick size={12} className="min-w-3" />
      <span className="truncate">
        Position ({Math.round(position.x)}, {Math.round(position.y)})
      </span>
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
  const NodeIcon = nodeConfig?.nodeIcon;
  const nodeTitle = getCanvasNodeTitle(node, nodeDatas);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-1 rounded-sm border px-2 py-1 text-sm text-slate-700 max-w-55",
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

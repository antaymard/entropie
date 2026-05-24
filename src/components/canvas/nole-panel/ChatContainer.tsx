import { useCallback, useEffect, useRef } from "react";
import RichTextArea from "./RichTextArea";
import { Button } from "@/components/shadcn/button";
import {
  TbCheck,
  TbCloudExclamation,
  TbDatabase,
  TbExclamationCircle,
  TbLoader,
  TbMicrophone,
  TbPhoto,
  TbPlus,
  TbSend,
  TbX,
  TbBrain,
} from "react-icons/tb";
import { HiMiniXMark } from "react-icons/hi2";
import { LuMousePointerClick } from "react-icons/lu";
import type { CanvasNode } from "@/types";
import prebuiltNodesConfig from "@/components/nodes/prebuilt-nodes/prebuiltNodesConfig";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { cn } from "@/lib/utils";
import ChatInterface from "./ChatInterface";
import ThreadSelector from "./ThreadSelector";
import SoundWaveAnimation from "./SoundWaveAnimation";
import { Kbd } from "@/components/shadcn/kbd";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/shadcn/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/dropdown-menu";
import toast from "react-hot-toast";
import { getCanvasNodeTitle } from "@/lib/getCanvasNodeTitle";
import { useNoleChat } from "@/hooks/useNoleChat";
import { useThreadStats } from "@/hooks/useThreadStats";
import { getModelLabel } from "@/lib/getModelLabel";
import type { ChatModelOption } from "@/types/convex";

const INPUT_MAX_HEIGHT_PX = 182;

type ChatContainerProps = {
  onClose?: () => void;
};

export default function ChatContainer({ onClose }: ChatContainerProps) {
  const {
    threadId,
    isLoading,
    userInput,
    setUserInput,
    sendCurrentMessage,
    isSending,
    isAssistantResponding,
    setIsAssistantResponding,
    isCancelling,
    stopAssistantResponse,
    selectThread,
    startNewThread,
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
    threadInfo,
  } = useNoleChat();

  // Desktop push-to-talk: hold Ctrl+Alt
  const keysHeldRef = useRef<Set<string>>(new Set());
  const sttActiveRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysHeldRef.current.add(e.key);
      if (
        keysHeldRef.current.has("Control") &&
        keysHeldRef.current.has("Alt") &&
        !sttActiveRef.current
      ) {
        sttActiveRef.current = true;
        void startSTT();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysHeldRef.current.delete(e.key);
      if (
        sttActiveRef.current &&
        (!keysHeldRef.current.has("Control") || !keysHeldRef.current.has("Alt"))
      ) {
        sttActiveRef.current = false;
        stopSTT();
      }
    };
    const handleBlur = () => {
      keysHeldRef.current.clear();
      if (sttActiveRef.current) {
        sttActiveRef.current = false;
        stopSTT();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [startSTT, stopSTT]);

  const handleRetry = useCallback(
    (userMessage: string) => setUserInput(userMessage),
    [setUserInput],
  );

  const handleSend = () => {
    if (hasDirtyWindows) {
      toast.error(
        "Veuillez enregistrer ou fermer les fenêtres modifiées avant d'envoyer votre message.",
        { position: "bottom-left", duration: 5000 },
      );
      return;
    }
    void sendCurrentMessage();
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        <TbLoader className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!threadId) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-500">
        Error loading chat
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col shadow-2xl/10">
      {/* Header */}
      <div className="pl-2 rounded-t-lg border-b flex items-center justify-between gap-2">
        <p className="text-sm font-medium truncate flex-1">
          {threadInfo?.title || "Untitled"}
        </p>
        <ThreadStatsBadge
          threadId={threadId}
          selectedModel={selectedModel}
          modelOptions={modelOptions}
        />
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => void startNewThread()}
          >
            <TbPlus size={14} />
          </Button>
          {threadId ? (
            <ThreadSelector
              currentThreadId={threadId}
              onSelectThread={selectThread}
            />
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => onClose?.()}
            aria-label="Close panel"
          >
            <TbX size={15} />
          </Button>
        </div>
      </div>

      {/* Chat */}
      <div className="w-full flex-1 min-h-0">
        <ChatInterface
          threadId={threadId}
          onRetry={handleRetry}
          onAssistantRespondingChange={setIsAssistantResponding}
        />
      </div>

      {/* Input */}
      <div className="p-2 pt-0">
        <div
          className={cn(
            "bg-slate-200 border shadow-lg rounded-lg flex flex-col gap-2 mt-2",
            hasDirtyWindows ? "border-red-300" : "border-slate-400",
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
          <div className="p-2">
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
                    className="h-8 px-2 text-xs text-slate-500 gap-1"
                  >
                    <TbBrain size={10} />
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
                      <span className="flex items-center gap-1.5">
                        <p>{model.label}</p>
                        {model.isMultimodal && (
                          <TbPhoto size={8} className="text-slate-400" />
                        )}
                      </span>
                      <span className="text-xs text-slate-400">
                        {model.price.replace("_", " - ")}
                      </span>
                      {selectedModel === model.value && <TbCheck />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {!isRecording && !isTranscribing && (
                <span className="text-slate-500 text-xs">
                  <TbMicrophone size={14} className="inline-block mr-1" />
                  <Kbd>Alt + Ctrl</Kbd>
                </span>
              )}
              {isRecording && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs">
                  <SoundWaveAnimation />
                  <span>Écoute...</span>
                </div>
              )}
              {isTranscribing && (
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <TbLoader className="animate-spin" size={14} />
                  <span>Transcription...</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasDirtyWindows && (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <span className="rounded flex gap-1 bg-white/50 h-full px-2 py-1 text-red-400">
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
                  className={cn(hasDirtyWindows && "")}
                  variant="outline"
                >
                  Stop
                  {isCancelling ? (
                    <TbLoader className="animate-spin" />
                  ) : (
                    <TbX />
                  )}
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
                className={cn(hasDirtyWindows && "")}
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

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function formatCost(n: number): string {
  if (n === 0) return "$0";
  if (n < 0.01) return `$${n.toFixed(4)}`;
  return `$${n.toFixed(3)}`;
}

function ThreadStatsBadge({
  threadId,
  selectedModel,
  modelOptions,
}: {
  threadId: string | null | undefined;
  selectedModel: string | undefined;
  modelOptions: readonly ChatModelOption[] | undefined;
}) {
  const stats = useThreadStats({ threadId, selectedModel, modelOptions });

  if (stats.isLoading || stats.totalTokens === 0) return null;

  const percentLabel =
    stats.contextPercent !== undefined
      ? `${stats.contextPercent < 1 ? stats.contextPercent.toFixed(1) : Math.round(stats.contextPercent)}%`
      : null;
  const maxLabel = stats.maxContext ? formatTokens(stats.maxContext) : null;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 px-1.5 py-0.5 rounded-sm hover:bg-slate-100 cursor-default">
          <TbDatabase size={10} />
          {percentLabel ? <span>{percentLabel}</span> : null}
          <span>
            {percentLabel ? "— " : ""}
            {formatTokens(stats.totalTokens)}
            {maxLabel ? ` / ${maxLabel}` : ""}
          </span>
          {stats.totalCostUsd > 0 ? (
            <span>· {formatCost(stats.totalCostUsd)}</span>
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent className="text-xs max-w-xs">
        <div className="flex flex-col gap-1">
          <p className="font-medium">Thread usage</p>
          {stats.perModel.length > 0 ? (
            <div className="flex flex-col gap-0.5">
              {stats.perModel.map((m) => (
                <div key={m.model} className="flex justify-between gap-2">
                  <span>{getModelLabel(m.model, modelOptions)}</span>
                  <span className="text-slate-300">
                    {formatTokens(m.totalTokens)} tk
                    {m.costUsd > 0 ? ` · ${formatCost(m.costUsd)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ) : null}
          {stats.maxContext ? (
            <p className="text-slate-300 mt-1">
              Max context du modèle actuel: {formatTokens(stats.maxContext)} tk
            </p>
          ) : null}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

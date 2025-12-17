import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  optimisticallySendMessage,
  useSmoothText,
  useUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useMemo,
  memo,
} from "react";
import { cn } from "@/lib/utils";
import { useNoleThread } from "@/hooks/useNoleThread";
import { RotateCcw, Loader2 } from "lucide-react";
import { PiPaperPlaneRightBold } from "react-icons/pi";
import { Textarea } from "../shadcn/textarea";
import type { TextPart } from "@/types/message.types";
import { MarkdownText } from "./MarkdownText";
import toolCardsConfig from "./tool-cards/toolCardsConfig";
import ToolCardFrame from "./tool-cards/ToolCardFrame";
import { TbTool } from "react-icons/tb";
import { RiLoaderLine } from "react-icons/ri";
import { toConvexNodes } from "../utils/nodeUtils";
import { useNoleStore } from "@/stores/noleStore";
import prebuiltNodesConfig from "../nodes/prebuilt-nodes/prebuiltNodesConfig";
import { HiMiniXMark } from "react-icons/hi2";
import { LuMousePointer } from "react-icons/lu";

export default function Chat() {
  const { threadId, isLoading, resetThread } = useNoleThread();

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!threadId) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500">
        Erreur lors du chargement du chat
      </div>
    );
  }

  return (
    <div className="bg-primary h-screen">
      <ChatInterface threadId={threadId} resetThread={resetThread} />
    </div>
  );
}

const ChatInterface = memo(function ChatInterface({
  threadId,
  resetThread,
}: {
  threadId: string;
  resetThread: () => Promise<void>;
}) {
  const {
    results: messages,
    status,
    loadMore,
  } = useUIMessages(
    api.ia.nole.listMessages,
    { threadId },
    { initialNumItems: 20, stream: true }
  );

  console.log(messages);

  const sendMessage = useMutation(api.ia.nole.sendMessage).withOptimisticUpdate(
    optimisticallySendMessage(api.ia.nole.listMessages)
  );

  const [prompt, setPrompt] = useState("");
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastScrollTop = useRef<number>(0);
  const scrollingToBottomRef = useRef(false);
  const previousMessagesLengthRef = useRef(0);
  const previousLastMessageRef = useRef<UIMessage | null>(null);

  // Vérifier si l'assistant est en train de répondre
  const isAssistantResponding =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].status !== "success" &&
    messages[messages.length - 1].status !== "failed";

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const div = scrollViewportRef.current;
    if (!div) return;
    scrollingToBottomRef.current = true;
    div.scrollTo({ top: div.scrollHeight, behavior });
  }, []);

  const checkIsAtBottom = useCallback(() => {
    const div = scrollViewportRef.current;
    if (!div) return true;
    return (
      Math.abs(div.scrollHeight - div.scrollTop - div.clientHeight) < 1 ||
      div.scrollHeight <= div.clientHeight
    );
  }, []);

  const handleScroll = useCallback(() => {
    const div = scrollViewportRef.current;
    if (!div) return;

    const newIsAtBottom = checkIsAtBottom();

    // Ne pas mettre à jour isAtBottom si on scrolle vers le bas
    if (!newIsAtBottom && lastScrollTop.current < div.scrollTop) {
      // ignore scroll down
    } else {
      if (newIsAtBottom) {
        scrollingToBottomRef.current = false;
      }
      setIsAtBottom(newIsAtBottom);
    }

    lastScrollTop.current = div.scrollTop;
  }, [checkIsAtBottom]);

  // Auto-scroll quand les messages changent ou que le contenu change
  useLayoutEffect(() => {
    const div = scrollViewportRef.current;
    if (!div) return;

    // Vérifier si les messages ont vraiment changé
    const currentLength = messages.length;
    const lastMessage = messages[messages.length - 1];
    const hasNewMessage = currentLength !== previousMessagesLengthRef.current;
    const lastMessageChanged = lastMessage !== previousLastMessageRef.current;

    // Mettre à jour les refs
    previousMessagesLengthRef.current = currentLength;
    previousLastMessageRef.current = lastMessage;

    // Ne scroller que si les messages ont changé
    if (!hasNewMessage && !lastMessageChanged) return;

    if (scrollingToBottomRef.current) {
      scrollToBottom("auto");
    } else if (isAtBottom) {
      scrollToBottom("instant");
    }
  }, [messages, isAtBottom, scrollToBottom]);

  // Scroll instantané lors du premier chargement
  useEffect(() => {
    scrollToBottom("instant");
  }, [scrollToBottom]);

  const onSendClicked = async () => {
    if (prompt.trim() === "") return;
    const currentPrompt = prompt;
    setPrompt("");
    // Forcer le scroll en bas lors de l'envoi
    setIsAtBottom(true);
    scrollingToBottomRef.current = true;
    scrollToBottom("auto");
    try {
      await sendMessage({
        threadId,
        prompt: currentPrompt,
        canvasContext: {
          attachedNodes: toConvexNodes(useNoleStore.getState().attachedNodes),
          attachedPosition: useNoleStore.getState().attachedPosition,
          canvas: useNoleStore.getState().canvas ?? null,
        },
      });
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      setPrompt(currentPrompt);
    }
  };

  return (
    <div className="h-full flex flex-col w-full ">
      <div className="flex">
        {messages.length > 0 && (
          <button
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium flex items-center gap-2 mx-2"
            onClick={() => void resetThread()}
            type="button"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        )}
        <button
          className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium flex items-center gap-2 mx-2"
          onClick={() => console.log({})}
          type="button"
        >
          <RotateCcw className="w-4 h-4" />
          Canvas
        </button>
      </div>
      {/* Messages area - scrollable */}
      <div
        ref={scrollViewportRef}
        className="flex-1 overflow-y-auto p-3"
        onScroll={handleScroll}
      >
        {messages.length > 0 ? (
          <div className="flex flex-col gap-8">
            {status === "CanLoadMore" && (
              <button
                onClick={() => loadMore(10)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition font-medium mx-auto"
              >
                Charger plus de messages
              </button>
            )}
            {messages.map((m) => (
              <Message key={m.key} message={m} />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Commencez une conversation...
          </div>
        )}
      </div>

      {/* Fixed input area at bottom */}
      <div className="p-2">
        <form
          className="w-full flex flex-col gap-2 p-3 rounded-md bg-white/10 hover:bg-white/20 focus:bg-white/20"
          onSubmit={(e) => {
            e.preventDefault();
            void onSendClicked();
          }}
        >
          <AttachmentRenderer />
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
                e.preventDefault();
                void onSendClicked();
              }
            }}
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 flex field-sizing-content min-h-16 w-full rounded-md bg-transparent text-base! shadow-xs transition-[color,box-shadow] outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm placeholder:text-white/60 flex-1 text-white resize-none "
            placeholder="Posez votre question..."
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="bottom-4 right-4 text-white p-1 rounded-xs hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!prompt.trim() || isAssistantResponding}
            >
              <PiPaperPlaneRightBold size={12} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

function AttachmentRenderer() {
  const attachedNodes = useNoleStore((state) => state.attachedNodes);
  const attachedPosition = useNoleStore((state) => state.attachedPosition);
  if (attachedNodes.length === 0 && !attachedPosition) {
    return null;
  }
  return (
    <div className="text-white flex my-1 flex-wrap gap-2">
      {/* Render attachments here */}
      {attachedPosition && (
        <AttachmentCard type="position" data={attachedPosition} />
      )}
      {attachedNodes.map((node) => (
        <AttachmentCard key={node.id} type="node" data={node} />
      ))}
    </div>
  );
}

function AttachmentCard({
  type,
  data,
}: {
  type: "position" | "node";
  data: any;
}) {
  const removeAttachments = useNoleStore((state) => state.removeAttachments);
  let Icon;
  let label;
  if (type === "node") {
    Icon =
      prebuiltNodesConfig.find((n) => n.type === data.type)?.nodeIcon || null;
    label = data?.data?.name || data.type;
  }
  if (type === "position") {
    Icon = LuMousePointer;
    label = `Position (${data.x.toFixed(0)}, ${data.y.toFixed(0)})`;
  }

  return (
    <div className="group relative flex items-center gap-1 border border-white/20 bg-white/10 rounded-sm text-sm text-white max-w-[200px] truncate p-1">
      {Icon && <Icon size={12} className="min-w-3" />}
      {label}
      <button
        onClick={() =>
          removeAttachments([
            { type, ids: type === "node" ? [data?.id] : undefined },
          ])
        }
        type="button"
        className="absolute top-1 right-1 hidden group-hover:block bg-white text-red-300 rounded-sm "
      >
        <HiMiniXMark size={15} />
      </button>
    </div>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  // Pour les messages utilisateur, afficher simplement le texte
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="rounded whitespace-pre-wrap shadow-sm p-3 bg-primary text-white max-w-4/5 border border-white/20">
          <MarkdownText>{message.text ?? ""}</MarkdownText>
        </div>
      </div>
    );
  }

  // Pour les messages assistant, itérer sur les parts
  const parts = message.parts ?? [];
  const isProcessing =
    message.status !== "success" && message.status !== "failed";

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "rounded whitespace-pre-wrap shadow-sm nole-chat-message flex flex-col gap-5 text-white",
          "p-2 py-3 bg-white/10 rounded-sm border border-white/20 w-full",
          {
            "bg-red-100": message.status === "failed",
          }
        )}
      >
        {parts.map((part, index) => {
          // Ignorer les step-start (marqueurs de début d'étape)
          if (part.type === "step-start") {
            return null;
          }

          // Afficher les parts texte avec Markdown
          if (part.type === "text") {
            return <TextPartRenderer key={index} part={part as TextPart} />;
          }

          // Afficher les tool calls en utilisant la config
          if (part.type.startsWith("tool-")) {
            const toolConfig = toolCardsConfig.find(
              (tool) => tool.name === part.type
            );

            if (toolConfig && "state" in part) {
              const ToolComponent = toolConfig.component;
              const partState = part.state as
                | "input-streaming"
                | "output-available";
              return (
                <ToolComponent
                  key={index}
                  state={partState}
                  input={
                    partState === "output-available" && "input" in part
                      ? part.input
                      : undefined
                  }
                  output={
                    partState === "output-available" && "output" in part
                      ? part.output
                      : undefined
                  }
                />
              );
            }

            // Fallback pour les outils non configurés
            const toolName = part.type.replace("tool-", "");
            const partState = (
              "state" in part ? part.state : "input-streaming"
            ) as "input-streaming" | "output-available";
            return (
              <ToolCardFrame
                key={index}
                icon={TbTool}
                name={toolName}
                state={partState}
              />
            );
          }

          return null;
        })}

        {isProcessing && (
          <div className="flex items-center py-1 px-1">
            <RiLoaderLine size={15} className="animate-spin text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

function TextPartRenderer({ part }: { part: TextPart }) {
  const [visibleText] = useSmoothText(part.text ?? "", {
    startStreaming: part.state === "streaming",
  });

  if (!visibleText) {
    return null;
  }

  return (
    <div className="whitespace-pre-wrap px-1 overflow-x-auto">
      <MarkdownText>{visibleText}</MarkdownText>
    </div>
  );
}

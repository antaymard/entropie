import { toConvexNodes } from "@/components/utils/nodeUtils";
import { useNoleStore } from "@/stores/noleStore";
import {
  optimisticallySendMessage,
  useUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { api } from "@/../convex/_generated/api";
import { useMutation, useAction } from "convex/react";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PiPaperPlaneRightBold } from "react-icons/pi";
import { AttachmentRenderer } from "./AttachmentRenderer";
import { Message } from "./Message";
import { useCanvasStore } from "@/stores/canvasStore";
import type { Canvas } from "@/types";

const ChatInterface = memo(function ChatInterface({
  threadId,
  useAttachments = false,
  autoUpdateThreadTitleAndSummary = false,
}: {
  threadId: string;
  useAttachments?: boolean;
  autoUpdateThreadTitleAndSummary?: boolean;
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

  const sendMessage = useMutation(api.ia.nole.sendMessage).withOptimisticUpdate(
    optimisticallySendMessage(api.ia.nole.listMessages)
  );

  const updateThreadTitle = useAction(api.ia.nole.updateThreadTitle);

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

  useEffect(() => {
    if (
      messages.length === 2 &&
      autoUpdateThreadTitleAndSummary &&
      !isAssistantResponding
    ) {
      // Mettre à jour le titre et le résumé du thread après l'envoi du message
      updateThreadTitle({
        threadId,
        onlyIfUntitled: true,
      });
    }
  }, [
    autoUpdateThreadTitleAndSummary,
    messages.length,
    threadId,
    updateThreadTitle,
    isAssistantResponding,
  ]);

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
    const canvas: Partial<Canvas> = useCanvasStore.getState().canvas;
    const attachementsContext = useAttachments
      ? {
          attachedNodes: toConvexNodes(useNoleStore.getState().attachedNodes),
          attachedPosition: useNoleStore.getState().attachedPosition,
          canvas: {
            _id: canvas?._id || "",
            name: canvas?.name || "",
            description: canvas?.description || "",
            nodes:
              canvas?.nodes?.map((n) => ({
                id: n.id,
                name: n.name,
                position: n.position,
                width: n.width,
                height: n.height,
              })) || [],
            edges: canvas?.edges || [],
          },
        }
      : undefined;
    try {
      console.log(attachementsContext);
      await sendMessage({
        threadId,
        prompt: currentPrompt,
        context: attachementsContext,
      });
      useNoleStore.getState().resetAttachments();
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      setPrompt(currentPrompt);
    }
  };

  return (
    <div className="h-full flex flex-col w-full ">
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
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
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
          {useAttachments && <AttachmentRenderer />}
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

export default ChatInterface;

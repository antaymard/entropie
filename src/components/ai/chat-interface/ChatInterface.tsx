import { useUIMessages, type UIMessage } from "@convex-dev/agent/react";
import { api } from "@/../convex/_generated/api";
import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { RiLoaderLine } from "react-icons/ri";
import { Message } from "./Message";

const ChatInterface = memo(function ChatInterface({
  threadId,
}: {
  threadId: string;
}) {
  const {
    results: messages,
    status,
    loadMore,
  } = useUIMessages(
    api.threads.listMessages,
    { threadId },
    { initialNumItems: 20, stream: true },
  );

  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const lastScrollTop = useRef<number>(0);
  const scrollingToBottomRef = useRef(false);
  const previousMessagesLengthRef = useRef(0);
  const previousLastMessageRef = useRef<UIMessage | null>(null);
  const lastMessage = messages[messages.length - 1];
  const isAssistantThinking =
    !!lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.status !== "success" &&
    lastMessage.status !== "failed";
  const isWaitingForAssistant =
    !!lastMessage && lastMessage.role === "user" && !isAssistantThinking;

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
                Load more messages
              </button>
            )}
            {messages.map((m) => (
              <Message key={m.key} message={m} />
            ))}
            {(isAssistantThinking || isWaitingForAssistant) && (
              <ThinkingIndicator
                label={
                  isAssistantThinking
                    ? "Nole reflechit..."
                    : "En attente de la reponse..."
                }
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            Start a conversation...
          </div>
        )}
      </div>
    </div>
  );
});

function ThinkingIndicator({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 px-2 py-1">
      <RiLoaderLine size={14} className="animate-spin" />
      <span>{label}</span>
    </div>
  );
}

export default ChatInterface;

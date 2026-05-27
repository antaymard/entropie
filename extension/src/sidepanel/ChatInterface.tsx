import { useUIMessages, type UIMessage } from "@convex-dev/agent/react";
import { api } from "@convex/_generated/api";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { RiLoaderLine } from "react-icons/ri";
import {
  TbAlertCircle,
  TbBrain,
  TbCheck,
  TbChevronDown,
  TbTool,
} from "react-icons/tb";
import { cn } from "./utils";

export const ChatInterface = memo(function ChatInterface({
  threadId,
  onRetry,
  onAssistantRespondingChange,
}: {
  threadId: string;
  onRetry?: (userMessage: string) => void;
  onAssistantRespondingChange?: (responding: boolean) => void;
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
    lastMessage.status === "streaming";
  const isWaitingForAssistant =
    !!lastMessage && lastMessage.role === "user" && !isAssistantThinking;
  const showThinkingIndicator = isAssistantThinking || isWaitingForAssistant;

  useEffect(() => {
    onAssistantRespondingChange?.(showThinkingIndicator);
  }, [showThinkingIndicator, onAssistantRespondingChange]);

  const isLastMessageFailed =
    !!lastMessage &&
    lastMessage.role === "assistant" &&
    lastMessage.status === "failed";

  const lastUserMessage = [...messages]
    .reverse()
    .find((message) => message.role === "user");
  const lastUserText = lastUserMessage?.text ?? undefined;

  const prevThinkingRef = useRef(false);
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    if (prevThinkingRef.current && !isAssistantThinking) {
      if (lastMessage?.status === "done") {
        setShowDone(true);
        const t = setTimeout(() => setShowDone(false), 2000);
        return () => clearTimeout(t);
      }
    }
    prevThinkingRef.current = isAssistantThinking;
  }, [isAssistantThinking, lastMessage?.status]);

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
    if (!newIsAtBottom && lastScrollTop.current < div.scrollTop) {
      return;
    }
    if (newIsAtBottom) {
      scrollingToBottomRef.current = false;
    }
    setIsAtBottom(newIsAtBottom);
    lastScrollTop.current = div.scrollTop;
  }, [checkIsAtBottom]);

  const scrollRafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!scrollViewportRef.current) return;

    const currentLength = messages.length;
    const current = messages[messages.length - 1];
    const hasNewMessage = currentLength !== previousMessagesLengthRef.current;
    const lastMessageChanged = current !== previousLastMessageRef.current;

    previousMessagesLengthRef.current = currentLength;
    previousLastMessageRef.current = current;

    if (!hasNewMessage && !lastMessageChanged) return;

    if (scrollRafRef.current != null) {
      cancelAnimationFrame(scrollRafRef.current);
    }
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      if (scrollingToBottomRef.current) {
        scrollToBottom("auto");
      } else if (isAtBottom) {
        scrollToBottom("instant");
      }
    });

    return () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
    };
  }, [messages, isAtBottom, scrollToBottom]);

  useEffect(() => {
    scrollToBottom("instant");
  }, [scrollToBottom]);

  return (
    <div className="h-full flex flex-col w-full relative">
      <div
        ref={scrollViewportRef}
        className="flex-1 overflow-y-auto p-3"
        onScroll={handleScroll}
      >
        {messages.length > 0 ? (
          <div
            className={cn(
              "flex flex-col gap-8",
              (showThinkingIndicator || isLastMessageFailed) && "pb-12",
            )}
          >
            {status === "CanLoadMore" && (
              <button
                onClick={() => loadMore(10)}
                className="mx-auto rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-200"
              >
                Load more messages
              </button>
            )}
            {messages.map((m) => (
              <ChatMessage key={m.key} message={m} />
            ))}
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-sm text-slate-500">
            Start a conversation...
          </div>
        )}
      </div>

      {(showThinkingIndicator || showDone || isLastMessageFailed) && (
        <div className="absolute left-0 right-0 bottom-0 flex justify-center z-20 pb-2">
          {showThinkingIndicator && (
            <div className="pointer-events-none flex items-center gap-2 px-2 py-1 text-xs text-slate-500">
              <RiLoaderLine size={14} className="animate-spin" />
              <span>
                {isAssistantThinking
                  ? "Nole is thinking..."
                  : "Waiting for response..."}
              </span>
            </div>
          )}
          {showDone && !showThinkingIndicator && (
            <div className="pointer-events-none flex items-center gap-2 px-2 py-1 text-xs text-green-600">
              <TbCheck size={14} />
              <span>Done</span>
            </div>
          )}
          {isLastMessageFailed && !showThinkingIndicator && (
            <div className="mx-3 flex items-center gap-2 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-600">
              <TbAlertCircle size={14} className="shrink-0" />
              <span className="flex-1">Response failed.</span>
              {lastUserText && onRetry && (
                <button
                  type="button"
                  onClick={() => onRetry(lastUserText)}
                  className="underline text-red-700 hover:text-red-900 font-medium"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

function ChatMessage({ message }: { message: UIMessage }) {
  const userText = extractUserMessageForDisplay(message.text ?? "");

  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-4/5 whitespace-pre-wrap rounded border border-slate-400 bg-slate-200 p-3 text-sm text-slate-900 break-words">
          {userText}
        </div>
      </div>
    );
  }

  if (message.role === "assistant") {
    const parts = message.parts ?? [];
    const isProcessing = message.status === "streaming";
    const messageError = getMessageErrorText(message);

    if (parts.length === 0) {
      return (
        <div className="flex justify-start">
          <div className="flex w-full flex-col gap-2 px-2 py-3 text-sm text-slate-800 break-words whitespace-pre-wrap">
            {message.text || ""}
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-start">
        <div
          className={cn(
            "flex w-full flex-col gap-2 px-2 py-3 whitespace-pre-wrap text-sm text-slate-800",
            message.status === "failed" && "rounded bg-red-100",
          )}
        >
          {parts.map((part: Record<string, unknown>, idx: number) => {
            const partType = part.type as string;

            if (partType === "step-start") {
              return null;
            }

            if (partType === "text") {
              const text = (part.text as string) || "";
              if (!text.trim()) return null;
              return (
                <div
                  key={idx}
                  className="overflow-x-auto whitespace-pre-wrap px-1"
                >
                  {text}
                </div>
              );
            }

            if (partType === "reasoning") {
              return (
                <ReasoningPart
                  key={idx}
                  text={((part.text as string) || "").trim()}
                  isStreaming={part.state === "streaming"}
                />
              );
            }

            if (partType?.startsWith("tool-")) {
              return (
                <ToolPart
                  key={idx}
                  name={partType.replace("tool-", "")}
                  state={resolveToolState(part.state)}
                  input={part.input ?? part.args}
                  output={part.output ?? part.result}
                  error={getToolPartErrorText(part)}
                />
              );
            }

            return null;
          })}

          {isProcessing && (
            <div className="flex items-center px-1 py-1">
              <RiLoaderLine size={15} className="animate-spin text-slate-400" />
            </div>
          )}

          {message.status === "failed" && (
            <ErrorInline message={messageError || "An error occurred."} />
          )}
        </div>
      </div>
    );
  }

  return null;
}

function ReasoningPart({
  text,
  isStreaming,
}: {
  text: string;
  isStreaming: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(isStreaming);

  if (!text && !isStreaming) {
    return null;
  }

  return (
    <div className="rounded border border-slate-300 bg-slate-50 text-xs text-slate-700">
      <button
        type="button"
        className="flex w-full items-center gap-1 px-2 py-1.5 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <TbBrain
          size={12}
          className={cn(isStreaming ? "animate-spin" : "opacity-70")}
        />
        <span>{isStreaming ? "Nole is thinking..." : "Thinking"}</span>
        <TbChevronDown
          size={12}
          className={cn(
            "ml-auto transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded ? (
        <div className="border-t border-slate-200 px-2 py-2 whitespace-pre-wrap break-words">
          {text || "..."}
        </div>
      ) : null}
    </div>
  );
}

function ToolPart({
  name,
  state,
  input,
  output,
  error,
}: {
  name: string;
  state: "running" | "done" | "error";
  input?: unknown;
  output?: unknown;
  error?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const label =
    state === "running"
      ? `Running tool: ${name}`
      : state === "error"
        ? `Tool failed: ${name}`
        : `Tool used: ${name}`;
  const hasDebugData = input !== undefined || output !== undefined || !!error;

  return (
    <div className="rounded border border-slate-300 bg-slate-50 p-2 text-xs text-slate-700">
      <button
        type="button"
        className="flex w-full items-center gap-1 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <TbTool
          size={12}
          className={cn(state === "running" && "animate-pulse")}
        />
        <span>{label}</span>
        {state === "running" && (
          <RiLoaderLine size={12} className="animate-spin" />
        )}
        {state === "done" && <TbCheck size={12} className="text-green-600" />}
        {state === "error" && (
          <TbAlertCircle size={12} className="text-red-500" />
        )}
        <TbChevronDown
          size={12}
          className={cn(
            "ml-auto transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>

      {isExpanded && hasDebugData ? (
        <div className="mt-2 space-y-2">
          <DebugBlock label="Input" value={input} />
          <DebugBlock label="Output" value={output} />
          <DebugBlock label="Error" value={error} />
        </div>
      ) : null}
    </div>
  );
}

function DebugBlock({ label, value }: { label: string; value: unknown }) {
  if (value === undefined) {
    return null;
  }

  return (
    <div>
      <p className="mb-1 font-medium text-slate-800">{label}</p>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded border border-slate-200 bg-white p-2 text-[11px] text-slate-700">
        {stringifyForDebug(value)}
      </pre>
    </div>
  );
}

function ErrorInline({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
      <TbAlertCircle size={14} className="mt-0.5 shrink-0 text-red-500" />
      <span>{message}</span>
    </div>
  );
}

function resolveToolState(value: unknown): "running" | "done" | "error" {
  if (value === "done" || value === "output-available") {
    return "done";
  }

  if (value === "error" || value === "output-error") {
    return "error";
  }

  return "running";
}

function getMessageErrorText(message: UIMessage): string | undefined {
  const candidate = message as unknown as Record<string, unknown>;
  return readErrorLike(candidate.error);
}

function getToolPartErrorText(
  part: Record<string, unknown>,
): string | undefined {
  return (
    readErrorLike(part.error) ??
    readErrorLike(part.output) ??
    readErrorLike(part.result)
  );
}

function readErrorLike(value: unknown): string | undefined {
  if (!value) {
    return undefined;
  }

  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = readErrorLike(item);
      if (nested) {
        return nested;
      }
    }

    return undefined;
  }

  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of [
    "error",
    "message",
    "detail",
    "details",
    "cause",
    "reason",
    "statusText",
  ]) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      const text = candidate.trim();
      return text.length > 200 ? `${text.slice(0, 200)}...` : text;
    }
  }

  return undefined;
}

function extractUserMessageForDisplay(text: string): string {
  const match = /<user_message>\s*([\s\S]*?)\s*<\/user_message>/i.exec(text);
  if (!match) {
    return text;
  }

  return match[1] ?? text;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringifyForDebug(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default ChatInterface;

import { useSmoothText, type UIMessage } from "@convex-dev/agent/react";
import { MarkdownText } from "@/components/ai/MarkdownText";
import type { TextPart } from "@/types/domain/message.types";

interface ChatResponseBubbleProps {
  message: UIMessage;
  onDismiss?: () => void;
}

export default function ChatResponseBubble({
  message,
  onDismiss,
}: ChatResponseBubbleProps) {
  // Extract the latest text part from the message
  const parts = message.parts ?? [];
  const textPart = [...parts].reverse().find((p) => p.type === "text") as
    | TextPart
    | undefined;

  const isStreaming = textPart?.state === "streaming";
  const rawText = textPart?.text ?? message.text ?? "";

  const [visibleText] = useSmoothText(rawText, {
    startStreaming: isStreaming,
  });

  if (!visibleText) return null;

  return (
    <div className="relative mt-2 max-w-lg">
      {/* Speech bubble triangle */}
      <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-l border-t rotate-45 z-10" />
      {/* Bubble body */}
      <div className="relative z-20 bg-white border rounded-lg px-4 py-3 shadow-md text-text max-h-72 overflow-y-auto">
        {onDismiss && !isStreaming && (
          <button
            onClick={onDismiss}
            className="absolute top-2 right-2 text-slate-300 hover:text-slate-500 transition-colors"
          >
            <span className="sr-only">Fermer</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="2" y1="2" x2="12" y2="12" />
              <line x1="12" y1="2" x2="2" y2="12" />
            </svg>
          </button>
        )}
        <div className="whitespace-pre-wrap overflow-x-auto prose prose-slate max-w-none">
          <MarkdownText>{visibleText}</MarkdownText>
        </div>
      </div>
    </div>
  );
}

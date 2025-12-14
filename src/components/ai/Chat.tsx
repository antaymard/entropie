import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  optimisticallySendMessage,
  useSmoothText,
  useUIMessages,
  type UIMessage,
} from "@convex-dev/agent/react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useNoleThread } from "@/hooks/useNoleThread";
import { RotateCcw, Loader2 } from "lucide-react";
import { PiPaperPlaneRightBold } from "react-icons/pi";
import { Textarea } from "../shadcn/textarea";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TextPart } from "@/types/message.types";
import toolCardsConfig from "./tool-cards/toolCardsConfig";

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

function ChatInterface({
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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vérifier si l'assistant est en train de répondre
  const isAssistantResponding =
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].status !== "success" &&
    messages[messages.length - 1].status !== "failed";

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const onSendClicked = async () => {
    if (prompt.trim() === "") return;
    const currentPrompt = prompt;
    setPrompt("");
    try {
      await sendMessage({ threadId, prompt: currentPrompt });
    } catch (error) {
      console.error("Erreur lors de l'envoi:", error);
      setPrompt(currentPrompt);
    }
  };

  return (
    <div className="h-full flex flex-col w-full ">
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
      {/* Messages area - scrollable */}
      <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">
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
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Commencez une conversation...
          </div>
        )}
      </div>

      {/* Fixed input area at bottom */}
      <form
        className="w-full flex flex-col p-2 relative"
        onSubmit={(e) => {
          e.preventDefault();
          void onSendClicked();
        }}
      >
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
              e.preventDefault();
              void onSendClicked();
            }
          }}
          className="placeholder:text-white/60 flex-1 rounded-md pt-8 pb-2 bg-white/10 hover:bg-white/20 focus:bg-white/20 text-white resize-none border-0"
          placeholder="Posez votre question..."
          disabled={isAssistantResponding}
        />
        <button
          type="submit"
          className="absolute bottom-4 right-4 text-white p-1 rounded-xs hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!prompt.trim() || isAssistantResponding}
        >
          <PiPaperPlaneRightBold size={12} />
        </button>
      </form>
    </div>
  );
}

function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  // Pour les messages utilisateur, afficher simplement le texte
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="rounded whitespace-pre-wrap shadow-sm p-3 bg-primary text-white max-w-4/5 border border-white/20 text-[0.85em]">
          <Markdown remarkPlugins={[remarkGfm]}>{message.text ?? ""}</Markdown>
        </div>
      </div>
    );
  }

  // Pour les messages assistant, itérer sur les parts
  const parts = message.parts ?? [];

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "rounded whitespace-pre-wrap shadow-sm nole-chat-message flex flex-col gap-5 text-white",
          "p-2 bg-white/10 rounded-sm border border-white/20 w-full",
          {
            "bg-red-100": message.status === "failed",
          }
        )}
      >
        {parts.length === 0 && (
          <span className="text-white italic">En cours...</span>
        )}

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
              return (
                <ToolComponent
                  key={index}
                  state={part.state}
                  input={
                    part.state === "output-available" ? part.input : undefined
                  }
                  output={
                    part.state === "output-available" ? part.output : undefined
                  }
                />
              );
            }

            // Fallback pour les outils non configurés
            const toolName = part.type.replace("tool-", "");
            return (
              <div key={index} className="text-gray-400 italic text-sm">
                Outil : {toolName} (non configuré)
              </div>
            );
          }

          return null;
        })}
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
    <div className="whitespace-pre-wrap px-1 flex flex-col gap-5">
      <Markdown remarkPlugins={[remarkGfm]}>{visibleText}</Markdown>
    </div>
  );
}

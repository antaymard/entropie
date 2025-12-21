import { useSmoothText, type UIMessage } from "@convex-dev/agent/react";
import { MarkdownText } from "../MarkdownText";
import type { TextPart } from "@/types/message.types";
import toolCardsConfig from "../tool-cards/toolCardsConfig";
import ToolCardFrame from "../tool-cards/ToolCardFrame";
import { RiLoaderLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { TbTool } from "react-icons/tb";

export function Message({ message }: { message: UIMessage }) {
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

export function TextPartRenderer({ part }: { part: TextPart }) {
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

import { useSmoothText, type UIMessage } from "@convex-dev/agent/react";
import { useState } from "react";
import { MarkdownText } from "../MarkdownText";
import type { TextPart } from "@/types/domain/message.types";
import { RiLoaderLine } from "react-icons/ri";
import { cn } from "@/lib/utils";
import { TbChevronDown, TbTool } from "react-icons/tb";

type ToolPartState = "input-streaming" | "output-available" | "output-error";

export function Message({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  // Pour les messages utilisateur, afficher simplement le texte
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="rounded whitespace-pre-wrap p-3 bg-slate-200 border border-slate-400 text-text max-w-4/5">
          <MarkdownText>{message.text ?? ""}</MarkdownText>
        </div>
      </div>
    );
  }

  // Pour les messages assistant, itérer sur les parts
  const parts = message.parts ?? [];
  const isProcessing =
    message.status !== "success" && message.status !== "failed";
  const messageError = getMessageErrorText(message);

  return (
    <div className="flex justify-start">
      <div
        className={cn(
          "whitespace-pre-wrap flex flex-col gap-2",
          "p-2 py-3 w-full",
          {
            "bg-red-100": message.status === "failed",
          },
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

          // Afficher un placeholder unique pour tous les tool calls
          if (part.type.startsWith("tool-")) {
            const partState = (
              "state" in part ? part.state : "input-streaming"
            ) as ToolPartState;
            const toolName = part.type.replace("tool-", "");
            const toolError = getToolPartErrorText(part);
            const debugInput =
              isRecord(part) && "input" in part
                ? (part.input as unknown)
                : undefined;
            const debugOutput =
              isRecord(part) && "output" in part
                ? (part.output as unknown)
                : undefined;
            return (
              <ToolPlaceholder
                key={index}
                state={partState}
                name={toolName}
                error={toolError}
                input={debugInput}
                output={debugOutput}
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

        {message.status === "failed" && (
          <ErrorInline message={messageError || "Une erreur est survenue."} />
        )}
      </div>
    </div>
  );
}

function ToolPlaceholder({
  state,
  name,
  error,
  input,
  output,
}: {
  state: ToolPartState;
  name: string;
  error?: string;
  input?: unknown;
  output?: unknown;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const label =
    state === "input-streaming"
      ? "Tool en cours d'execution"
      : state === "output-error"
        ? `Tool en erreur: ${name}`
        : `Tool execute: ${name}`;

  const hasDebugData = input !== undefined || output !== undefined || !!error;

  return (
    <div className="py-2 text-sm text-text opacity-40 hover:opacity-100">
      <button
        type="button"
        className="w-full flex items-center gap-1 text-left"
        onClick={() => setIsExpanded((prev) => !prev)}
      >
        <TbTool
          size={12}
          className={cn(state === "input-streaming" && "animate-pulse")}
        />
        <span>{label}</span>
        <TbChevronDown
          size={12}
          className={cn(
            "ml-auto transition-transform",
            isExpanded && "rotate-180",
          )}
        />
      </button>
      {isExpanded && hasDebugData ? (
        <div className="mt-2 space-y-2 rounded border border-slate-300 bg-slate-50 p-2 text-xs text-slate-700">
          <DebugBlock label="Args" value={input} />
          <DebugBlock label="Result" value={output} />
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
      <pre className="overflow-x-auto whitespace-pre-wrap rounded bg-white p-2 text-[11px] text-slate-700 border border-slate-200">
        {stringifyForDebug(value)}
      </pre>
    </div>
  );
}

function ErrorInline({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn("bg-red-100/90 px-2 py-1 text-xs text-red-800", className)}
    >
      {message}
    </div>
  );
}

function getMessageErrorText(message: UIMessage): string | undefined {
  const candidate = message as unknown as Record<string, unknown>;
  return readErrorLike(candidate.error);
}

function getToolPartErrorText(part: unknown): string | undefined {
  if (!isRecord(part)) {
    return undefined;
  }

  const directError = readErrorLike(part.error);
  if (directError) {
    return directError;
  }

  return readErrorLike(part.output);
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

  const keys = ["error", "message", "detail", "details"];
  for (const key of keys) {
    const candidate = value[key];
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate;
    }
  }

  return undefined;
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

// Ici, textarea qui peut faire du @ et avoir un dropdown de suggestions de nodeData du canvas (utiliser le store) et afficher les ref sous forme de pill, qu'on peut X pour les supprimer. En gros, un textarea enrichi pour faire du rich text avec des références à d'autres nodes du canvas.

import { useNodeDataStore } from "@/stores/nodeDataStore";
import { useCallback, useRef } from "react";
import { MentionsInput, Mention } from "react-mentions";
import { useNodes } from "@xyflow/react";
import {
  getNodeDataTitle,
  getNodeIcon,
} from "@/components/utils/nodeDataDisplayUtils";
import type { Id } from "@/../convex/_generated/dataModel";
import { cn } from "@/lib/utils";

interface RichTextAreaProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
}

export default function RichTextArea({
  value,
  onChange,
  onSubmit,
}: RichTextAreaProps) {
  const nodeDatas = useNodeDataStore((state) => state.nodeDatas);
  const canvasNodes = useNodes();

  const nodesToMention = canvasNodes
    .filter((node) => node.data?.nodeDataId)
    .map((node) => {
      const nodeDataId = node.data.nodeDataId as Id<"nodeDatas">;
      const nodeData = nodeDatas.get(nodeDataId);
      return {
        id: node.id,
        display: nodeData ? getNodeDataTitle(nodeData) : node.id,
      };
    });

  const wrapperRef = useRef<HTMLDivElement>(null);

  const autoResize = useCallback(() => {
    const textarea = wrapperRef.current?.querySelector("textarea");
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, []);

  return (
    <div ref={wrapperRef}>
      <MentionsInput
        autoFocus
        style={{
          input: {
            resize: "none",
            overflow: "hidden",
            outline: "none",
            padding: "3px",
            minHeight: "2.5rem",
          },
          highlighter: { outline: "none" },
        }}
        value={value}
        placeholder="Mention nodes using '@'"
        onKeyDown={(e: React.KeyboardEvent) => {
          if (e.key === "Enter") {
            if (e.shiftKey || e.ctrlKey || e.metaKey) {
              // Shift/Ctrl/Cmd+Enter → new line (default behavior)
              return;
            }
            // Enter alone → send
            e.preventDefault();
            onSubmit?.();
          }
        }}
        onChange={(_, newValue) => {
          onChange(newValue);
          requestAnimationFrame(autoResize);
        }}
        customSuggestionsContainer={(children) => (
          <div className="rounded shadow-lg border flex overflow-hidden">
            {children}
          </div>
        )}
      >
        <Mention
          trigger="@"
          data={nodesToMention}
          markup="@{{__id__||__display__}}"
          displayTransform={(_id, display) => `@${display}`}
          renderSuggestion={(
            entry,
            _search,
            _highlightedDisplay,
            _index,
            focused,
          ) => {
            const node = canvasNodes.find(
              (candidate) => candidate.id === entry.id,
            );
            const nodeDataId = node?.data?.nodeDataId as
              | Id<"nodeDatas">
              | undefined;
            const nodeData = nodeDataId ? nodeDatas.get(nodeDataId) : undefined;
            const Icon = getNodeIcon(nodeData?.type);
            return (
              <div
                className={cn(
                  focused && "bg-slate-100",
                  "p-2 flex items-center gap-2",
                )}
              >
                {Icon && <Icon />}
                {entry.display}
              </div>
            );
          }}
        />
      </MentionsInput>
    </div>
  );
}

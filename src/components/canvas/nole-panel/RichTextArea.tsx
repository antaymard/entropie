// Ici, textarea qui peut faire du @ et avoir un dropdown de suggestions de nodeData du canvas (utiliser le store) et afficher les ref sous forme de pill, qu'on peut X pour les supprimer. En gros, un textarea enrichi pour faire du rich text avec des références à d'autres nodes du canvas.

import { useNodeDataStore } from "@/stores/nodeDataStore";
import { useCallback, useRef } from "react";
import { MentionsInput, Mention } from "react-mentions";
import { getDocumentTitle } from "@/components/nodes/prebuilt-nodes/DocumentNode";
import type { Doc, Id } from "@/../convex/_generated/dataModel";
import type { Value } from "platejs";
import { cn } from "@/lib/utils";
import {
  TbFileTypePdf,
  TbAbc,
  TbPhoto,
  TbLink,
  TbTag,
  TbApi,
  TbNews,
} from "react-icons/tb";

const IconMap: Record<string, React.ComponentType> = {
  floatingText: TbAbc,
  document: TbNews,
  image: TbPhoto,
  link: TbLink,
  file: TbFileTypePdf,
  value: TbTag,
  fetch: TbApi,
};

function getNodeTitle(nodeData: Doc<"nodeDatas">): string {
  switch (nodeData.type) {
    case "document":
      return getDocumentTitle(nodeData.values.doc as Value);
    case "image":
      return nodeData.values?.images?.[0]?.filename || "Image";
    case "link":
      return (
        nodeData.values?.link?.pageTitle ||
        nodeData.values?.link?.href ||
        "Link"
      );
    case "file":
      return nodeData.values?.files?.[0]?.filename || "File";
    case "value":
      return nodeData.values?.value?.label || "Value";
    case "fetch":
      return nodeData.values?.fetch?.params?.url || "Fetch";
    default:
      return nodeData.type ?? "Node";
  }
}

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

  const nodeDatasToMention = Array.from(nodeDatas.entries()).map(
    ([id, nd]) => ({
      id,
      display: getNodeTitle(nd),
    }),
  );

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
          data={nodeDatasToMention}
          markup="@{{__id__||__display__}}"
          displayTransform={(_id, display) => `@${display}`}
          renderSuggestion={(
            entry,
            _search,
            _highlightedDisplay,
            _index,
            focused,
          ) => {
            const nd = nodeDatas.get(entry.id as Id<"nodeDatas">);
            const Icon = nd ? IconMap[nd.type] : undefined;
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

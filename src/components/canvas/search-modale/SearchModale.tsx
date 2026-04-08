import { Button } from "@/components/shadcn/button";
import useRichQuery from "@/components/utils/useRichQuery";
import { useDebounce } from "@/hooks/use-debounce";
import type { Id } from "@/types";
import { useParams } from "@tanstack/react-router";
import { api } from "@/../convex/_generated/api";
import { useState } from "react";
import { TbSearch, TbX } from "react-icons/tb";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useNodeData } from "@/hooks/useNodeData";
import { useNodeDataTitle } from "@/hooks/useNodeTitle";

export default function SearchModale() {
  const [isOpen, setIsOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 300);
  const { canvasId }: { canvasId: Id<"canvases"> } = useParams({
    from: "/canvas/$canvasId",
  });
  useHotkey("Mod+K", () => setIsOpen((open) => !open));
  useHotkey("Escape", () => setIsOpen(false), { enabled: isOpen });

  const {
    data: searchResults,
    isPending,
    error,
  } = useRichQuery(
    api.searchableChunks.search,
    debouncedSearchQuery ? { query: debouncedSearchQuery, canvasId } : "skip",
  );

  if (!isOpen) return null;
  return (
    <div
      className="inset-0 animate-in flex items-center justify-center fixed z-50"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="canvas-ui-container shadow-lg min-w-2xl max-w-screen flex-col h-3/4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex gap-2 items-center justify-between w-full border-b py-1">
          <div className="flex gap-2 items-center px-2 w-full ">
            <TbSearch />
            <input
              autoFocus
              type="text"
              placeholder="Search for nodes, templates, etc..."
              className="bg-transparent outline-none border-none flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
            <TbX />
          </Button>
        </div>

        {/* Body */}
        {isPending ? (
          <div>Loading...</div>
        ) : error ? (
          <div>Error: {error.message}</div>
        ) : (
          <div className="flex flex-col gap-2 w-full h-full overflow-auto p-1">
            {searchResults.length === 0 ? (
              <div>No results found</div>
            ) : (
              <ul>
                {searchResults.map((result) => (
                  <ResultCard key={result.nodeId} result={result} />
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ResultCard({
  result,
}: {
  result: {
    type: string;
    nodeId: string;
    nodeDataId: Id<"nodeDatas">;
    chunks: unknown[];
  };
}) {
  const nodeTitle = useNodeDataTitle(result.nodeDataId);

  return (
    <div className="flex flex-col rounded hover:bg-slate-100 p-3">
      <div className="flex items-center justify-between">
        <p className="font-bold">{nodeTitle}</p>
        <span className="text-sm text-muted-foreground bg-slate-200 px-1 rounded-sm">
          {result.type}
        </span>
      </div>

      {result.chunks.map((chunk, index) => (
        <ChunkDisplay key={index} chunk={chunk} />
      ))}
    </div>
  );
}

function ChunkDisplay({ chunk }: { chunk: any }) {
  function renderTextChunk() {
    switch (chunk.type) {
      case "text":
        return <p>{chunk.text}</p>;
      default:
    }
  }

  return (
    <div className="mt-2 p-2 bg-slate-50 rounded text-sm">
      {renderTextChunk()}
    </div>
  );
}

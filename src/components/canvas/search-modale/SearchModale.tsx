import { Button } from "@/components/shadcn/button";
import useRichQuery from "@/components/utils/useRichQuery";
import { useDebounce } from "@/hooks/use-debounce";
import type { Id } from "@/types";
import { useParams } from "@tanstack/react-router";
import { api } from "@/../convex/_generated/api";
import { Fragment, useMemo } from "react";
import { TbSearch, TbX } from "react-icons/tb";
import { useHotkey } from "@tanstack/react-hotkeys";
import { useNodeDataTitle } from "@/hooks/useNodeTitle";
import { useCanvasStore } from "@/stores/canvasStore";

export default function SearchModale() {
  const isOpen = useCanvasStore((state) => state.isSearchModalOpen);
  const searchQuery = useCanvasStore((state) => state.searchQuery);
  const toggleSearchModal = useCanvasStore((state) => state.toggleSearchModal);
  const closeSearchModal = useCanvasStore((state) => state.closeSearchModal);
  const setSearchQuery = useCanvasStore((state) => state.setSearchQuery);
  const debouncedSearchQuery = useDebounce(searchQuery.trim(), 300);
  const { canvasId }: { canvasId: Id<"canvases"> } = useParams({
    from: "/canvas/$canvasId",
  });
  useHotkey("Mod+K", () => toggleSearchModal());
  useHotkey("Escape", () => closeSearchModal(), { enabled: isOpen });

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
      onClick={() => closeSearchModal()}
    >
      <div
        className="canvas-ui-container shadow-lg w-full max-w-none sm:max-w-3xl md:max-w-4xl flex-col h-[85vh] sm:h-3/4 rounded-none sm:rounded-lg"
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

          <Button variant="ghost" size="sm" onClick={() => closeSearchModal()}>
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
                  <ResultCard
                    key={result.nodeId}
                    result={result}
                    query={debouncedSearchQuery}
                  />
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
  query,
}: {
  result: {
    type: string;
    nodeId: string;
    nodeDataId: Id<"nodeDatas">;
    images: Array<{
      imageUrl: string;
      page?: number;
    }>;
    snippets: Array<{
      snippet: string;
      chunkType: "node" | "page" | "annotation";
      order: number;
      page?: number;
      imageUrl?: string;
      matchStart: number;
      matchEnd: number;
    }>;
  };
  query: string;
}) {
  const nodeTitle = useNodeDataTitle(result.nodeDataId);
  const previewImages = useMemo(() => result.images, [result.images]);
  const sortedSnippets = useMemo(
    () =>
      [...result.snippets].sort((a, b) => {
        const pageA = a.page ?? Number.MAX_SAFE_INTEGER;
        const pageB = b.page ?? Number.MAX_SAFE_INTEGER;
        if (pageA !== pageB) return pageA - pageB;
        if (a.order !== b.order) return a.order - b.order;
        return a.matchStart - b.matchStart;
      }),
    [result.snippets],
  );

  return (
    <div className="flex flex-col rounded hover:bg-slate-100 p-3">
      <div className="flex items-center justify-between">
        <p className="font-bold text-lg">{nodeTitle}</p>
        <span className="text-sm text-muted-foreground bg-slate-200 px-1 rounded-sm">
          {result.type}
        </span>
      </div>

      <div className="flex flex-col gap-2 mt-2">
        {sortedSnippets.length === 0 ? (
          <span className="text-muted-foreground">Aucun extrait</span>
        ) : (
          sortedSnippets.map((snippet, index) => (
            <SnippetRow
              key={`${result.nodeId}-${snippet.order}-${index}`}
              snippet={snippet}
              query={query}
            />
          ))
        )}
      </div>

      {previewImages.length > 0 ? (
        <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {previewImages.map((image) => (
            <div key={image.imageUrl} className="relative shrink-0">
              <img
                src={image.imageUrl}
                alt="Apercu"
                className="h-48 w-48 rounded-md object-cover border"
              />
              {typeof image.page === "number" ? (
                <span className="absolute right-1 bottom-1 text-xs text-white bg-black/70 px-1.5 py-0.5 rounded-full">
                  Page {image.page}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SnippetRow({
  snippet,
  query,
}: {
  snippet: {
    snippet: string;
    chunkType: "node" | "page" | "annotation";
    order: number;
    page?: number;
    imageUrl?: string;
    matchStart: number;
    matchEnd: number;
  };
  query: string;
}) {
  const pageLabel =
    typeof snippet.page === "number"
      ? `Page ${snippet.page}`
      : snippet.chunkType;

  const highlightedParts = useMemo(() => {
    const terms = Array.from(
      new Set(
        query
          .trim()
          .split(/\s+/)
          .map((term) => term.trim())
          .filter((term) => term.length >= 2),
      ),
    );

    if (terms.length === 0) return [snippet.snippet];

    const escapedTerms = terms.map((term) =>
      term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );
    const regex = new RegExp(`(${escapedTerms.join("|")})`, "ig");
    return snippet.snippet.split(regex);
  }, [query, snippet.snippet]);

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="min-w-0 flex-1 overflow-hidden line-clamp-2 text-muted-foreground leading-snug">
        {highlightedParts.map((part, index) => {
          const isMatch = index % 2 === 1;
          return isMatch ? (
            <mark key={index} className="bg-yellow-200 rounded-sm px-0.5">
              {part}
            </mark>
          ) : (
            <Fragment key={index}>{part}</Fragment>
          );
        })}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground bg-slate-100 px-1.5 py-0.5 rounded-sm">
        {pageLabel}
      </span>
    </div>
  );
}

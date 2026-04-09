import { memo, useCallback, useEffect, useState, useTransition } from "react";
import { type Node } from "@xyflow/react";
import { areNodePropsEqual } from "../areNodePropsEqual";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { useNodeDataTitle } from "@/hooks/useNodeTitle";
import type { Id } from "@/../convex/_generated/dataModel";
import { normalizeNodeId, type Value } from "platejs";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import DocumentStaticField from "@/components/fields/document-fields/DocumentStaticField";
import { Button } from "@/components/shadcn/button";
import { Spinner } from "@/components/shadcn/spinner";
import { TbMaximize, TbNews } from "react-icons/tb";
import { useWindowsStore } from "@/stores/windowsStore";
import { parseStoredPlateDocument } from "@/../convex/lib/plateDocumentStorage";
import { enqueuePreviewRender } from "@/lib/previewRenderQueue";

/** Max root-level blocks rendered in the canvas preview. */
const MAX_PREVIEW_BLOCKS = 60;

function hasTextContent(nodes: unknown[]): boolean {
  for (const node of nodes) {
    if (node && typeof node === "object") {
      if (
        "text" in node &&
        typeof (node as { text: unknown }).text === "string" &&
        (node as { text: string }).text.trim() !== ""
      ) {
        return true;
      }
      if (
        "children" in node &&
        Array.isArray((node as { children: unknown }).children) &&
        hasTextContent((node as { children: unknown[] }).children)
      ) {
        return true;
      }
    }
  }
  return false;
}

function DocumentNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const [, startTransition] = useTransition();
  const [previewValue, setPreviewValue] = useState<Value | null>(null);
  const [isDocEmpty, setIsDocEmpty] = useState(true);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [totalBlocks, setTotalBlocks] = useState(0);

  const openWindow = useWindowsStore((s) => s.openWindow);

  const handleOpenWindow = useCallback(() => {
    if (!nodeDataId) return;
    openWindow({ xyNodeId: xyNode.id, nodeDataId, nodeType: "document" });
  }, [nodeDataId, openWindow, xyNode.id]);

  // Defer preview computation so canvas shell renders first.
  // Renders are serialized across all document nodes via the queue.
  useEffect(() => {
    const parsedDoc = parseStoredPlateDocument(values?.doc);
    if (!parsedDoc || !Array.isArray(parsedDoc) || parsedDoc.length === 0) {
      setPreviewValue(null);
      setIsDocEmpty(true);
      setIsPreviewLoading(false);
      setIsTruncated(false);
      return;
    }
    const normalized = normalizeNodeId(parsedDoc as Value);
    const empty = !hasTextContent(normalized);
    setIsDocEmpty(empty);
    if (empty) {
      setPreviewValue(null);
      setIsPreviewLoading(false);
      setIsTruncated(false);
      return;
    }
    const truncated = normalized.length > MAX_PREVIEW_BLOCKS;
    const preview = truncated
      ? (normalized.slice(0, MAX_PREVIEW_BLOCKS) as Value)
      : normalized;
    setPreviewValue(null);
    setIsPreviewLoading(true);
    setTotalBlocks(normalized.length);
    setIsTruncated(truncated);

    // Enqueue so nodes render one at a time with idle gaps between them
    const cancel = enqueuePreviewRender(() => {
      startTransition(() => {
        setPreviewValue(preview);
        setIsPreviewLoading(false);
      });
    });

    return cancel;
  }, [values?.doc]);

  const documentTitle = useNodeDataTitle(nodeDataId) ?? "Document";

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Button
          size="icon"
          variant="outline"
          disabled={!nodeDataId}
          onClick={handleOpenWindow}
        >
          <TbMaximize />
        </Button>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode}>
        {xyNode.data.variant !== "title" && (
          <div className="h-full overflow-auto [content-visibility:auto] [contain-intrinsic-size:auto_300px]">
            {isDocEmpty ? (
              <div className="h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40 select-none pointer-events-none">
                <TbNews size={22} />
                <span className="text-xs">Double-clic pour éditer</span>
              </div>
            ) : isPreviewLoading ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground/50 select-none pointer-events-none">
                <Spinner className="size-4" />
                <span className="text-xs">Chargement de l&apos;aperçu...</span>
              </div>
            ) : previewValue ? (
              <div className="relative">
                <DocumentStaticField
                  value={{ doc: previewValue }}
                  allowDrag={!xyNode.selected}
                  preview
                />
                {isTruncated && (
                  <div className="sticky bottom-0 flex items-center justify-center bg-white/30 pointer-events-none py-1.5">
                    <span className="text-[10px] text-muted-foreground/60">
                      {Math.round(
                        ((totalBlocks - MAX_PREVIEW_BLOCKS) / totalBlocks) *
                          100,
                      )}
                      % restant — double-clic pour ouvrir
                    </span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
        {xyNode.data.variant === "title" && (
          <div className="flex items-center gap-2 px-2 min-w-0 h-full group/linknode relative">
            <TbNews size={18} className="shrink-0" />
            <p className="truncate flex-1 min-w-0" title={documentTitle}>
              {documentTitle}
            </p>
          </div>
        )}
      </NodeFrame>
    </>
  );
}

export default memo(DocumentNode, areNodePropsEqual);

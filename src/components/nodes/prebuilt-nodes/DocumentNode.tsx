import { memo, useCallback, useDeferredValue, useMemo } from "react";
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
import { TbMaximize, TbNews } from "react-icons/tb";
import { useWindowsStore } from "@/stores/windowsStore";
import { parseStoredPlateDocument } from "@/../convex/lib/plateDocumentStorage";

const defaultValue: Value = normalizeNodeId([
  {
    children: [{ text: "" }],
    type: "p",
  },
]);

function DocumentNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);

  const openWindow = useWindowsStore((s) => s.openWindow);

  const handleOpenWindow = useCallback(() => {
    if (!nodeDataId) return;
    openWindow({ xyNodeId: xyNode.id, nodeDataId, nodeType: "document" });
  }, [nodeDataId, openWindow, xyNode.id]);

  // useDeferredValue permet au parse+normalize+createSlateEditor de s'exécuter
  // en mode non-bloquant, évitant les freezes sur les documents complexes.
  const deferredDoc = useDeferredValue(values?.doc);

  // Memoize parsing + normalisation – deferredDoc est un string stable,
  // ne recompute que quand le document change réellement.
  const currentValue: Value = useMemo(() => {
    const parsedDoc = parseStoredPlateDocument(deferredDoc);
    return parsedDoc ? normalizeNodeId(parsedDoc as Value) : defaultValue;
  }, [deferredDoc]);

  const isDocEmpty = useMemo(() => {
    return currentValue.every((node) => {
      const getText = (n: unknown): string => {
        if (n && typeof n === "object") {
          if ("text" in n && typeof (n as { text: unknown }).text === "string")
            return (n as { text: string }).text;
          if (
            "children" in n &&
            Array.isArray((n as { children: unknown }).children)
          )
            return (n as { children: unknown[] }).children
              .map(getText)
              .join("");
        }
        return "";
      };
      return getText(node) === "";
    });
  }, [currentValue]);

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
        {!xyNode.data.variant ||
          (xyNode.data.variant === "default" && (
            <div className="h-full overflow-auto">
              {isDocEmpty ? (
                <div className="h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40 select-none pointer-events-none">
                  <TbNews size={22} />
                  <span className="text-xs">Double-clic pour éditer</span>
                </div>
              ) : (
                <DocumentStaticField
                  value={{ doc: currentValue }}
                  allowDrag={!xyNode.selected}
                />
              )}
            </div>
          ))}
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

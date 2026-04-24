import { memo, useCallback, useMemo, useRef, useState } from "react";
import { type Node, useStoreApi } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { areNodePropsEqual } from "../areNodePropsEqual";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { useNodeDataStore } from "@/stores/nodeDataStore";
import { useAppNodeBridge } from "@/hooks/useAppNodeBridge";
import { buildSrcdoc } from "@/lib/buildSrcdoc";
import { plateJsonToMarkdown } from "@/lib/plateMarkdownConverter";
import { parseStoredPlateDocument } from "@/../convex/lib/plateDocumentStorage";
import NodeFrame from "../NodeFrame";
import { getNodeDataTitle } from "@/components/utils/nodeDataDisplayUtils";
import { useNodeDataTitle } from "@/hooks/useNodeTitle";
import { cn } from "@/lib/utils";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/shadcn/popover";
import { Button } from "@/components/shadcn/button";
import { Input } from "@/components/shadcn/input";
import { TbPencil } from "react-icons/tb";

type SourceNode = {
  id: string;
  type: string;
  name: string;
  // table
  columns?: { id: string; name: string; type: string }[];
  rows?: Record<string, unknown>[];
  // document
  markdown?: string;
  // value
  value?: string | number;
  label?: string;
  unit?: string;
  // image
  url?: string;
  images?: { url: string }[];
  // link
  title?: string;
  // title node (heading)
  text?: string;
  level?: string;
  // pdf
  files?: { url: string; filename: string; mimeType?: string }[];
};

function resolveSourceNode(
  nodeData: Record<string, unknown> & { type: string; values?: Record<string, unknown> },
  nodeId: string,
): SourceNode {
  const type = nodeData.type;
  const name = getNodeDataTitle(nodeData as any);
  const base: SourceNode = { id: nodeId, type, name };

  switch (type) {
    case "table": {
      const table = nodeData.values?.table as
        | { columns?: SourceNode["columns"]; rows?: SourceNode["rows"] }
        | undefined;
      const flatRows = table?.rows?.map((row) => {
        const { cells, ...rest } = row;
        return { ...rest, ...((cells as Record<string, unknown>) ?? {}) };
      });
      return { ...base, columns: table?.columns, rows: flatRows };
    }
    case "value": {
      const val = nodeData.values?.value as
        | { value?: string | number; label?: string; unit?: string }
        | undefined;
      return { ...base, value: val?.value, label: val?.label, unit: val?.unit };
    }
    case "document": {
      const docSource = nodeData.values?.doc;
      const parsedDoc = parseStoredPlateDocument(docSource);
      const markdown = parsedDoc ? plateJsonToMarkdown(parsedDoc) : undefined;
      return { ...base, markdown };
    }
    case "image": {
      const images = nodeData.values?.images as Array<{ url?: string }> | undefined;
      const validImages = images?.filter((img) => typeof img.url === "string") as { url: string }[] | undefined;
      return { ...base, images: validImages ?? [], url: validImages?.[0]?.url };
    }
    case "link": {
      const link = nodeData.values?.link as
        | { href?: string; pageTitle?: string }
        | undefined;
      return { ...base, url: link?.href, title: link?.pageTitle };
    }
    case "title": {
      const text = nodeData.values?.text as string | undefined;
      const level = nodeData.values?.level as string | undefined;
      return { ...base, text, level };
    }
    case "pdf": {
      const files = nodeData.values?.files as
        | Array<{ url: string; filename: string; mimeType?: string }>
        | undefined;
      return { ...base, files };
    }
    default:
      return base;
  }
}

function AppNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const rfStore = useStoreApi();
  const updateValuesMutation = useMutation(api.nodeDatas.updateValues);
  const appTitle = useNodeDataTitle(nodeDataId) ?? "App";
  const [inputTitle, setInputTitle] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleSaveTitle = useCallback(() => {
    if (!nodeDataId || !inputTitle.trim()) return;
    updateValuesMutation({ _id: nodeDataId, values: { title: inputTitle.trim() } });
    setIsPopoverOpen(false);
    setInputTitle("");
  }, [nodeDataId, inputTitle, updateValuesMutation]);

  const handlePopoverOpenChange = useCallback((open: boolean) => {
    setIsPopoverOpen(open);
    if (open) {
      setInputTitle(values?.title ?? "");
    }
  }, [values?.title]);

  const resolveConnected = useCallback(async () => {
    const { edges, nodes } = rfStore.getState();
    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const result: Record<string, SourceNode> = {};
    for (const edge of edges) {
      if (edge.target !== xyNode.id) continue;
      const sourceNode = nodeMap.get(edge.source);
      if (!sourceNode) continue;
      const sourceNodeDataId = sourceNode.data?.nodeDataId as
        | Id<"nodeDatas">
        | undefined;
      if (!sourceNodeDataId) continue;
      const nodeData = useNodeDataStore.getState().getNodeData(sourceNodeDataId);
      if (!nodeData) continue;
      result[sourceNode.id] = resolveSourceNode(nodeData as any, sourceNode.id);
    }
    return result;
  }, [rfStore, xyNode.id]);

  const updateState = useCallback(
    async (state: unknown) => {
      if (!nodeDataId) return;
      await updateValuesMutation({ _id: nodeDataId, values: { state } });
    },
    [nodeDataId, updateValuesMutation],
  );

  useAppNodeBridge(iframeRef, xyNode.id, resolveConnected, updateState);

  const srcdoc = useMemo(() => {
    const code = (values?.code as string) ?? "";
    const state = values?.state ?? null;
    return buildSrcdoc(code, state);
  }, [values?.code, values?.state]);

  return (
    <>
      <CanvasNodeToolbar xyNode={xyNode}>
        <Popover open={isPopoverOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" title="Edit app title">
              <TbPencil />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <div className="flex flex-col gap-2">
              <Input
                onDoubleClick={(e) => e.stopPropagation()}
                type="text"
                placeholder="Title (optional)"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                }}
              />
              <Button
                onClick={handleSaveTitle}
                size="sm"
                disabled={!inputTitle.trim()}
              >
                Save
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </CanvasNodeToolbar>
      <NodeFrame xyNode={xyNode}>
        <div className="w-full h-full flex flex-col overflow-hidden rounded-[4px]">
          <div
            className={cn(
              "h-8 shrink-0 px-2 py-1.5 truncate line-clamp-1 font-medium rounded-t-[4px] border-b bg-white/60",
            )}
          >
            {appTitle}
          </div>
          <iframe
            ref={iframeRef}
            srcDoc={srcdoc}
            sandbox="allow-scripts"
            className="w-full flex-1 min-h-0 border-0"
            title="App Node"
          />
        </div>
      </NodeFrame>
    </>
  );
}

export default memo(AppNode, areNodePropsEqual);

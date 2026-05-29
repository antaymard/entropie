import { memo, useCallback, useState } from "react";
import { type Node } from "@xyflow/react";
import { useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { areNodePropsEqual } from "../areNodePropsEqual";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { useWindowsStore } from "@/stores/windowsStore";
import NodeFrame from "../NodeFrame";
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
import { TbPencil, TbMaximize, TbRefresh, TbAlertTriangle } from "react-icons/tb";
import { colors } from "@/components/ui/styles";
import type { colorsEnum } from "@/types/domain";
import { useAppNodeRunner } from "@/hooks/useAppNodeRunner";
import { useIframeCtrlOverlay } from "@/hooks/useIframeCtrlOverlay";
import { NODE_TYPE_ICON_MAP } from "./nodeIconMap";

function AppNode(xyNode: Node) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const openWindow = useWindowsStore((s) => s.openWindow);

  const updateValuesMutation = useMutation(api.nodeDatas.updateValues);
  const appTitle = useNodeDataTitle(nodeDataId) ?? "App";
  const [inputTitle, setInputTitle] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const isTitleVariant = xyNode.data.variant === "title";
  const nodeColor = colors[(xyNode.data?.color as colorsEnum) || "default"];

  // Runtime errors reported by the iframe (stored on values.errors). Surfaced
  // here so a partially-working app still shows feedback at the node level.
  const appErrors = (
    Array.isArray(values?.errors) ? values?.errors : []
  ) as Array<{ type?: string; message?: string }>;

  const Icon = NODE_TYPE_ICON_MAP.app;

  const { iframeRef, srcdoc } = useAppNodeRunner(xyNode.id, nodeDataId, values, refreshKey);
  const { showOverlay, onMouseEnter, onMouseLeave } = useIframeCtrlOverlay();

  const handleOpenWindow = useCallback(() => {
    if (!nodeDataId) return;
    openWindow({ xyNodeId: xyNode.id, nodeDataId, nodeType: "app" });
  }, [nodeDataId, openWindow, xyNode.id]);

  const handleSaveTitle = useCallback(() => {
    if (!nodeDataId || !inputTitle.trim()) return;
    updateValuesMutation({
      _id: nodeDataId,
      values: { title: inputTitle.trim() },
    });
    setIsPopoverOpen(false);
    setInputTitle("");
  }, [nodeDataId, inputTitle, updateValuesMutation]);

  const handlePopoverOpenChange = useCallback(
    (open: boolean) => {
      setIsPopoverOpen(open);
      if (open) {
        setInputTitle((values?.title as string) ?? "");
      }
    },
    [values?.title],
  );

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
      <NodeFrame xyNode={xyNode} resizable={!isTitleVariant}>
        {isTitleVariant ? (
          <div
            className={cn(
              "flex items-center gap-2 px-2 min-w-0 h-full relative",
              nodeColor.textColor,
            )}
          >
            <Icon size={18} className="shrink-0" />
            <p className="truncate flex-1 min-w-0" title={appTitle}>
              {appTitle}
            </p>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col overflow-hidden rounded-[4px]">
            <div
              className={cn(
                "flex items-center gap-2 h-8 shrink-0 px-2 py-1.5 font-medium rounded-t-[4px]",
              )}
            >
              <Icon size={18} className="shrink-0" />
              <p className="truncate flex-1 min-w-0" title={appTitle}>
                {appTitle}
              </p>
              {appErrors.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className="shrink-0 text-red-500 hover:text-red-700 transition-colors p-1 rounded hover:bg-red-50"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      title={`${appErrors.length} runtime error(s)`}
                    >
                      <TbAlertTriangle size={14} />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-96 max-h-72 overflow-auto p-0"
                    onDoubleClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 border-b font-medium text-sm flex items-center gap-2 text-red-600">
                      <TbAlertTriangle size={16} />
                      {appErrors.length} runtime error
                      {appErrors.length > 1 ? "s" : ""}
                    </div>
                    <ul className="divide-y">
                      {appErrors.map((err, i) => (
                        <li key={i} className="p-3 text-xs">
                          <div className="font-semibold text-red-600">
                            {err.type ?? "error"}
                          </div>
                          <div className="font-mono whitespace-pre-wrap break-words text-slate-700">
                            {err.message ?? ""}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>
              )}
              <button
                className="shrink-0 text-slate-500 hover:text-slate-900 transition-colors p-1 rounded hover:bg-slate-100"
                onClick={(e) => {
                  e.stopPropagation();
                  setRefreshKey((k) => k + 1);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                title="Refresh app"
              >
                <TbRefresh size={14} />
              </button>
            </div>
            <div
              className="relative flex-1 min-h-0"
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
            >
              <iframe
                key={refreshKey}
                ref={iframeRef}
                srcDoc={srcdoc}
                sandbox="allow-scripts"
                className="w-full h-full border-0"
                title={appTitle ?? "App Node"}
              />
              {showOverlay && <div className="absolute inset-0" />}
            </div>
          </div>
        )}
      </NodeFrame>
    </>
  );
}

export default memo(AppNode, areNodePropsEqual);

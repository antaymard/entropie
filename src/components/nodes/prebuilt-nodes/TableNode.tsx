import { memo, useCallback, useRef } from "react";
import type { Node } from "@xyflow/react";
import { areNodePropsEqual } from "../areNodePropsEqual";
import { useNodeDataValues } from "@/hooks/useNodeData";
import { useNodeDataTitle } from "@/hooks/useNodeTitle";
import type { Id } from "@/../convex/_generated/dataModel";
import CanvasNodeToolbar from "../toolbar/CanvasNodeToolbar";
import NodeFrame from "../NodeFrame";
import { Button } from "@/components/shadcn/button";
import { TbMaximize, TbTable } from "react-icons/tb";
import { useWindowsStore } from "@/stores/windowsStore";
import { useNoWheelUnlessZoom } from "@/hooks/useNoWheelUnlessZoom";
import { TablePreview } from "@/components/table";
import type { TableData } from "@/components/table";
import { useTranslation } from "react-i18next";

function TableNode(xyNode: Node) {
  const { t } = useTranslation();
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas"> | undefined;
  const values = useNodeDataValues(nodeDataId);
  const tableTitle = useNodeDataTitle(nodeDataId) ?? t("nodes.table");
  const openWindow = useWindowsStore((s) => s.openWindow);

  const handleOpenWindow = useCallback(() => {
    if (!nodeDataId) return;
    openWindow({ xyNodeId: xyNode.id, nodeDataId, nodeType: "table" });
  }, [nodeDataId, openWindow, xyNode.id]);

  const scrollRef = useRef<HTMLDivElement>(null);
  useNoWheelUnlessZoom(scrollRef);

  const tableData = (values?.table as TableData | undefined) ?? {
    columns: [],
    rows: [],
  };
  const title = (values?.title as string | undefined) ?? "";
  const isTitleVariant = xyNode.data.variant === "title";
  const isTableEmpty =
    tableData.columns.length === 0 && tableData.rows.length === 0;

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
      <NodeFrame xyNode={xyNode} resizable={!isTitleVariant}>
        {isTitleVariant ? (
          <div className="flex items-center gap-2 px-2 min-w-0 h-full relative">
            <TbTable size={18} className="shrink-0" />
            <p className="truncate flex-1 min-w-0" title={tableTitle}>
              {tableTitle}
            </p>
          </div>
        ) : (
          <div ref={scrollRef} className="h-full overflow-auto">
            {title && (
              <p className="px-2 pt-1.5 pb-0.5 font-semibold truncate text-lg">
                {title}
              </p>
            )}
            {isTableEmpty ? (
              <div className="h-full flex flex-col items-center justify-center gap-1.5 text-muted-foreground/40 select-none pointer-events-none">
                <TbTable size={22} />
                <span className="text-xs">Double-clic pour éditer</span>
              </div>
            ) : (
              <TablePreview
                columns={tableData.columns}
                rows={tableData.rows}
              />
            )}
          </div>
        )}
      </NodeFrame>
    </>
  );
}

export default memo(TableNode, areNodePropsEqual);

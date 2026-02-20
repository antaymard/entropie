import { memo, useRef, useState, useEffect, useCallback } from "react";
import type { Node } from "@xyflow/react";
import WindowPanelFrame from "../WindowPanelFrame";
import { useNodeDataValues } from "@/hooks/useNodeData";
import type { Id } from "@/../convex/_generated/dataModel";
import type { FileFieldType } from "@/components/fields/file-fields/FileNameField";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { useDebounce } from "@/hooks/use-debounce";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

function PdfWindow({ xyNode }: { xyNode: Node }) {
  const nodeDataId = xyNode.data?.nodeDataId as Id<"nodeDatas">;
  const nodeDataValues = useNodeDataValues(nodeDataId);
  const files = (nodeDataValues?.files as FileFieldType[] | undefined) ?? [];
  const pdfUrl = files.length > 0 ? files[0].url : "";

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined,
  );
  const [numPages, setNumPages] = useState<number>(0);
  const debouncedWidth = useDebounce(containerWidth, 150);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    [],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    resizeObserver.observe(container);
    setContainerWidth(container.clientWidth);

    return () => resizeObserver.disconnect();
  }, []);

  if (!nodeDataValues) return null;

  return (
    <WindowPanelFrame xyNode={xyNode} title="PDF">
      <div ref={containerRef} className="w-full h-full overflow-y-auto">
        {pdfUrl ? (
          <Document
            file={pdfUrl}
            className="flex flex-col gap-2"
            onLoadSuccess={onDocumentLoadSuccess}
          >
            {Array.from({ length: numPages }, (_, index) => (
              <Page
                key={`page_${index + 1}`}
                pageNumber={index + 1}
                width={debouncedWidth}
              />
            ))}
          </Document>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
            No PDF available
          </div>
        )}
      </div>
    </WindowPanelFrame>
  );
}

export default memo(PdfWindow);

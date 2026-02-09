import { memo, useRef, useState, useEffect, useCallback } from "react";
import type { BaseFieldProps } from "@/types/ui";
import { type FileFieldType } from "./FileNameField";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { useDebounce } from "@/hooks/use-debounce";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

function PdfViewerField({ value }: BaseFieldProps<FileFieldType[]>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | undefined>(
    undefined
  );
  const [numPages, setNumPages] = useState<number>(0);
  const debouncedWidth = useDebounce(containerWidth, 150);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
    },
    []
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

  return (
    <div ref={containerRef} className="w-full h-full overflow-y-auto">
      <Document
        file={value && value.length > 0 ? value[0].url : ""}
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
    </div>
  );
}

export default memo(PdfViewerField);

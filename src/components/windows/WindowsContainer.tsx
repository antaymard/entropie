import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useWindowsStore, type SnapSide } from "@/stores/windowsStore";
import { useStore } from "@xyflow/react";
import WindowFrame from "./WindowFrame";

export default function WindowsContainer() {
  const openedWindows = useWindowsStore((s) => s.openedWindows);
  const existingNodeIds = useStore((state) =>
    state.nodes.map((node) => node.id),
  );
  const [snapPreview, setSnapPreview] = useState<SnapSide | null>(null);

  const handleSnapPreviewChange = useCallback(
    (side: SnapSide | null) => setSnapPreview(side),
    [],
  );

  return (
    <div
      data-slot="windows-container"
      className="pointer-events-none fixed inset-0 z-10 h-full w-full"
    >
      {/* Snap preview overlay */}
      {snapPreview && (
        <div
          className="pointer-events-none absolute z-50 rounded-lg border-2 border-blue-400/60 bg-blue-400/15 transition-all duration-150"
          style={{
            width: `calc(40% - 40px)`,
            top: 10,
            bottom: 10,
            left: snapPreview === "left" ? 10 : undefined,
            right: snapPreview === "right" ? 10 : undefined,
          }}
        />
      )}

      {openedWindows
        .filter((openedWindow) =>
          existingNodeIds.includes(openedWindow.xyNodeId),
        )
        .map((openedWindow) => (
          <div
            key={openedWindow.xyNodeId}
            className={cn(
              "pointer-events-auto absolute",
              openedWindow.windowState === "minimized" && "hidden",
            )}
            style={{
              left: openedWindow.position.x,
              top: openedWindow.position.y,
              width: openedWindow.width,
              height: openedWindow.height,
            }}
          >
            <WindowFrame
              openedWindow={openedWindow}
              onSnapPreviewChange={handleSnapPreviewChange}
            />
          </div>
        ))}
    </div>
  );
}

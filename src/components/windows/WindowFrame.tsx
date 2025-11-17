import { useWindowsStore } from "@/stores/windowsStore";
import { memo } from "react";
import { useWindowDrag } from "@/hooks/useWindowDrag";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

interface WindowFrameProps {
  windowId: string;
  children?: React.ReactNode;
}

function WindowFrame({ windowId, children }: WindowFrameProps) {
  const { handleMouseDown } = useWindowDrag(windowId);

  // Sélecteur optimisé avec shallow comparison
  const window = useWindowsStore(
    useShallow((state) => state.openWindows.find((w) => w.id === windowId))
  );

  const closeWindow = useWindowsStore((state) => state.closeWindow);
  const expandWindow = useWindowsStore((state) => state.expandWindow);

  if (!window) return null;

  const { position, width, height, isMinimized, isExpanded } = window;

  if (isMinimized) return null;

  return (
    <div
      className="absolute pointer-events-auto rounded-[10px] grid grid-cols-[7px_1fr_7px] grid-rows-[7px_1fr_7px] @container/window"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {/* Top-left corner */}
      <div
        className="cursor-nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, "resize", "tl")}
      />
      {/* Top center */}
      <div
        className="cursor-ns-resize"
        onMouseDown={(e) => handleMouseDown(e, "resize", "tc")}
      />
      {/* Top-right corner */}
      <div
        className="cursor-nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, "resize", "tr")}
      />

      {/* Middle-left */}
      <div
        className="cursor-ew-resize"
        onMouseDown={(e) => handleMouseDown(e, "resize", "ml")}
      />

      {/* WINDOW CONTENT */}
      <div
        className="cursor-grab p-2 border rounded border-gray-200 bg-gray-100 inline-flex flex-col gap-2 h-full w-full shadow-xl"
        onMouseDown={(e) => {
          e.stopPropagation();
          handleMouseDown(e, "move");
        }}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => expandWindow(windowId, isExpanded)}
              className="text-gray-500 p-1 rounded hover:bg-gray-200"
            >
              {isExpanded ? (
                <Minimize2 className="h-5" />
              ) : (
                <Maximize2 className="h-5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => closeWindow(windowId)}
              className="text-gray-500 p-1 rounded hover:bg-gray-200"
            >
              <X className="h-5" />
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div
          className="bg-white h-full rounded-sm p-3 border border-gray-200 cursor-auto overflow-auto"
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            width: width - 16,
            height: height - 16 - 28 - 8,
          }}
        >
          {children}
        </div>
      </div>

      {/* Middle-right */}
      <div
        className="cursor-ew-resize"
        onMouseDown={(e) => handleMouseDown(e, "resize", "mr")}
      />

      {/* Bottom-left corner */}
      <div
        className="cursor-nesw-resize"
        onMouseDown={(e) => handleMouseDown(e, "resize", "bl")}
      />
      {/* Bottom center */}
      <div
        className="cursor-ns-resize"
        onMouseDown={(e) => handleMouseDown(e, "resize", "bc")}
      />
      {/* Bottom-right corner */}
      <div
        className="cursor-nwse-resize"
        onMouseDown={(e) => handleMouseDown(e, "resize", "br")}
      />
    </div>
  );
}

export default memo(WindowFrame);
